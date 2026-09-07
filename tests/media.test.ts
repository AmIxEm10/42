import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { HiggsfieldProvider } from '../server/HiggsfieldProvider';
import { MediaService } from '../server/MediaService';
import { createMediaHandler } from '../server/mediaHandler';
import { HiggsfieldAPI } from '../src/services/HiggsfieldAPI';
import { isMediaRequest } from '../src/services/MediaTypes';

const queued = { request_id: 'test-42', status: 'queued', status_url: 'https://api.higgsfield.ai/requests/test-42/status' };
const completed = { request_id: 'test-42', status: 'completed', images: [{ url: 'https://cdn.example.org/tarot.png' }], video: { url: 'https://cdn.example.org/circle.mp4' } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const fast = { apiKey: 'test-key', apiSecret: 'test-secret', wait: async () => {}, pollIntervalMs: 1 };

test('soumission unique, authentification serveur, polling puis récupération image et vidéo', async () => {
  for (const kind of ['image', 'video'] as const) {
    const calls: { method: string; url: string }[] = [];
    const provider = new HiggsfieldProvider({ ...fast, fetcher: async (url, init) => {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Key test-key:test-secret');
      assert.equal(init?.redirect, 'error');
      calls.push({ method: init!.method!, url: String(url) });
      return json(calls.length === 1 ? queued : completed);
    } });
    assert.equal(await provider.generate('/test', { prompt: 'test' }, kind), kind === 'image' ? completed.images[0]!.url : completed.video.url);
    assert.deepEqual(calls.map(c => c.method), ['POST', 'GET']);
    assert.equal(calls[1]!.url, queued.status_url);
  }
});

test('ne transmet pas les secrets à une URL de polling extérieure', async () => {
  let calls = 0;
  const provider = new HiggsfieldProvider({ ...fast, fetcher: async () => {
    calls++;
    return json({ ...queued, status_url: 'https://untrusted.example/collect' });
  } });
  await assert.rejects(provider.generate('/test', {}, 'image'), { code: 'UNTRUSTED_STATUS_URL' });
  assert.equal(calls, 1);
});

test('pas de relance automatique du POST en cas de réponse réseau perdue', async () => {
  let calls = 0;
  const provider = new HiggsfieldProvider({ ...fast, fetcher: async () => { calls++; throw new Error('network'); } });
  await assert.rejects(provider.generate('/test', {}, 'image'), { code: 'UPSTREAM_NETWORK' });
  assert.equal(calls, 1);
});

test('reprend le GET après une panne temporaire sans nouvelle soumission', async () => {
  const methods: string[] = [];
  const provider = new HiggsfieldProvider({ ...fast, fetcher: async (_, init) => {
    methods.push(init!.method!);
    return methods.length === 1 ? json(queued) : methods.length === 2 ? json({}, 503) : json(completed);
  } });
  await provider.generate('/test', {}, 'image');
  assert.deepEqual(methods, ['POST', 'GET', 'GET']);
});

test('respecte Retry-After avant le GET suivant', async () => {
  const waits: number[] = [];
  let calls = 0;
  const provider = new HiggsfieldProvider({ ...fast, wait: async ms => { waits.push(ms); }, fetcher: async () => {
    calls++;
    if (calls === 1) return json(queued);
    if (calls === 2) return new Response('{}', { status: 429, headers: { 'Retry-After': '15' } });
    return json(completed);
  } });
  await provider.generate('/test', {}, 'image');
  assert.ok(waits[1]! >= 15000);
});

test('gère toutes les terminaisons négatives et le délai maximal', async () => {
  for (const status of ['failed', 'nsfw', 'canceled']) {
    const provider = new HiggsfieldProvider({ ...fast, fetcher: async () => json({ ...queued, status }) });
    await assert.rejects(provider.generate('/test', {}, 'image'), { code: `GENERATION_${status.toUpperCase()}` });
  }
  const provider = new HiggsfieldProvider({ ...fast, timeoutMs: 1, pollIntervalMs: 100, fetcher: async () => json(queued) });
  await assert.rejects(provider.generate('/test', {}, 'image'), { code: 'GENERATION_TIMEOUT' });
});

test('sans clé, aucun appel réseau ; validation des réponses incomplètes', async () => {
  const provider = new HiggsfieldProvider({ apiKey: '', apiSecret: '', fetcher: async () => { throw new Error('ne doit pas être appelé'); } });
  await assert.rejects(provider.generate('/test', {}, 'image'), { code: 'NOT_CONFIGURED' });
  const malformed = new HiggsfieldProvider({ ...fast, fetcher: async () => json({ ...completed, images: [] }) });
  await assert.rejects(malformed.generate('/test', {}, 'image'), { code: 'INVALID_PROVIDER_RESPONSE' });
});

test('déduplique les générations simultanées, met en cache, impose le budget', async () => {
  let calls = 0;
  const service = new MediaService({ generate: async () => { calls++; return completed.video.url; } }, 1);
  const results = await Promise.all([service.get({ kind: 'circle', id: 'colere' }), service.get({ kind: 'circle', id: 'colere' })]);
  assert.deepEqual(results[0], results[1]);
  await service.get({ kind: 'circle', id: 'colere' });
  assert.equal(calls, 1);
  await assert.rejects(service.get({ kind: 'circle', id: 'orgueil' }), { code: 'SESSION_BUDGET_REACHED' });
});

test('limite les appels distincts concurrents à deux', async () => {
  const releases: (() => void)[] = [];
  const service = new MediaService({ generate: () => new Promise<string>(resolve => releases.push(() => resolve(completed.video.url))) });
  const a = service.get({ kind: 'circle', id: 'colere' });
  const b = service.get({ kind: 'circle', id: 'orgueil' });
  await assert.rejects(service.get({ kind: 'circle', id: 'envie' }), { code: 'BUSY' });
  releases.forEach(release => release());
  await Promise.all([a, b]);
});

test('catalogue fermé : bloque prototypes, prompts et identifiants inconnus', () => {
  assert.ok(isMediaRequest({ kind: 'tarot', id: 'la-mort' }));
  for (const input of [{ kind: 'circle', id: '__proto__' }, { kind: 'tarot', id: 'inconnu' }, { kind: 'tarot', id: 'la-mort', prompt: 'arbitrary' }]) {
    assert.equal(isMediaRequest(input), false);
  }
});

test('intégration client → relais HTTP : auth, entrée, cache et réponse nettoyée', async t => {
  let calls = 0;
  const service = new MediaService({ generate: async () => { calls++; return completed.images[0]!.url; } });
  const token = 'test-token-abcdefghijklmnopqrstuvwxyz';
  const server = createServer(createMediaHandler(service, token));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); }));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/media`;
  assert.equal((await fetch(baseUrl, { method: 'POST' })).status, 401);
  const malformed = await fetch(baseUrl, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const client = new HiggsfieldAPI({ baseUrl, getAccessToken: () => token });
  const result = await client.getTarotArtwork('la-mort');
  assert.equal(result.kind, 'image');
  assert.equal(result.url, completed.images[0]!.url);
  await client.getTarotArtwork('la-mort');
  assert.equal(calls, 1);
});

test('client : repli explicite et annulation conservée', async () => {
  const client = new HiggsfieldAPI({ fetcher: async () => json({ code: 'NOT_CONFIGURED' }, 503) });
  assert.deepEqual(await client.getOrFallback({ kind: 'tarot', id: 'la-tour' }), { source: 'fallback', asset: null, reason: 'NOT_CONFIGURED' });
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(client.getOrFallback({ kind: 'tarot', id: 'la-tour' }, abort.signal), { name: 'AbortError' });
});
