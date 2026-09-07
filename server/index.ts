import { createServer } from 'node:http';
import { HiggsfieldProvider } from './HiggsfieldProvider';
import { MediaService } from './MediaService';
import { createMediaHandler } from './mediaHandler';

const token = process.env.MEDIA_ACCESS_TOKEN?.trim();
if (!token || token.length < 32) throw new Error('MEDIA_ACCESS_TOKEN doit contenir au moins 32 caractères.');
const budget = Number(process.env.MEDIA_MAX_GENERATIONS ?? 10);
if (!Number.isInteger(budget) || budget < 0 || budget > 100) throw new Error('MEDIA_MAX_GENERATIONS : entier de 0 à 100.');
const port = Number(process.env.MEDIA_PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('MEDIA_PORT invalide.');
const provider = new HiggsfieldProvider({ apiKey: process.env.HIGGSFIELD_API_KEY ?? '', apiSecret: process.env.HIGGSFIELD_API_SECRET ?? '' });
const service = new MediaService(provider, budget);
const server = createServer(createMediaHandler(service, token));
server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(port, '127.0.0.1', () => console.log(`Relais média démarré sur le port ${port}.`));
