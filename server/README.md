# Relais média Higgsfield — étape 2

Le navigateur utilise `src/services/HiggsfieldAPI.ts`. Il envoie uniquement un identifiant de cercle ou de Tarot à `POST /api/media`. Le relais valide cet identifiant, choisit un prompt JSON et appelle l'API officielle. Les paramètres du modèle et les prompts ne sont pas acceptés depuis le navigateur.

## Lancement local

```sh
npm ci
npm run setup:env
```

Renseigner **localement** `HIGGSFIELD_API_KEY` (identifiant de clé) et `HIGGSFIELD_API_SECRET` dans `.env`. Le script génère automatiquement `MEDIA_ACCESS_TOKEN`, un jeton interne aléatoire distinct des identifiants Higgsfield. Ne pas publier ce fichier.

Dans deux terminaux :

```sh
npm run media:serve
```

```sh
npm run dev
```

Vite et le relais écoutent sur la boucle locale. Le proxy de développement ajoute le jeton interne côté serveur ; il n'est pas injecté dans le JavaScript du jeu. `MEDIA_PORT` vaut 8787 par défaut. Redémarrer Vite et le relais après modification de `.env`.

Le menu n'appelle pas encore ce service : les branchements vers les changements de niveau et l'interface Tarot seront ajoutés avec les prochaines étapes. Les clés manquantes déclenchent `NOT_CONFIGURED` sans requête sortante ; la méthode de repli permet à la future UI de conserver un visuel local.

## Utilisation depuis une scène ou l'UI

```ts
import { HiggsfieldAPI } from '../services/HiggsfieldAPI';

const media = new HiggsfieldAPI();
const controller = new AbortController();
const result = await media.getOrFallback(
  { kind: 'circle', id: 'gourmandise' },
  controller.signal,
);
if (result.source === 'higgsfield') {
  // Affecter result.asset.url à la vidéo d'arrière-plan.
} else {
  // Conserver le fond local ; result.reason explique l'indisponibilité.
}
// À la fermeture de la scène : controller.abort().
```

`getLevelBackground` et `getTarotArtwork` renvoient directement un `MediaAsset` et lèvent une `MediaError` en cas d'échec. `getOrFallback` renvoie un résultat discriminé : il ne prétend pas avoir généré une image de remplacement. L'annulation interrompt l'attente du navigateur, pas une génération déjà acceptée chez Higgsfield ; le relais poursuit celle-ci pour alimenter le cache.

## Contrats et limites

| Élément | Comportement |
| --- | --- |
| Vidéos | Seedance v1 Lite text-to-video via Higgsfield, 5 secondes, 720p, 16:9, caméra fixe |
| Tarots | FLUX Kontext Max text-to-image via Higgsfield, 2:3, seed fixe pour cohérence |
| Authentification fournisseur | `Authorization: Key KEY_ID:KEY_SECRET`, serveur uniquement |
| Suivi | URL de statut fournie par Higgsfield, limitée à son origine et au request_id reçu ; redirections refusées |
| Polling | Intervalle progressif de 2 à 10 secondes ; `Retry-After` respecté ; erreurs réseau, 429 et 5xx retentées seulement sur les GET |
| Soumission | Un seul POST, jamais retenté automatiquement pour éviter une double facturation |
| États terminaux | `completed`, `failed`, `nsfw`, `canceled` |
| Temps maximal | 30 secondes par requête fournisseur, 10 minutes par génération, 11 minutes côté client/proxy |
| Cache | URLs en mémoire pendant 6 heures, au plus dix entrées ; doublons simultanés partagés côté relais |
| Budget | Deux générations simultanées ; dix soumissions par démarrage par défaut, réglable avec `MEDIA_MAX_GENERATIONS` (0–100) |
| Échecs | Blocage des relances du même asset pendant 10 minutes ; une tentative échouée consomme le budget local |
| Accès relais | Bearer interne obligatoire, corps JSON limité à 1 Kio, identifiants en liste fermée |

Les modèles proviennent du schéma OpenAPI officiel consulté le 7 septembre 2026. Leur disponibilité et le solde du compte doivent permettre leur utilisation. La connexion du plugin ChatGPT ne fournit pas automatiquement des clés au serveur du jeu.

Ce relais est un socle **local à processus unique**. Le cache, le budget et les requêtes en cours sont perdus au redémarrage. Aucun fichier vidéo/image n'est encore archivé sur disque ; les URLs du fournisseur peuvent expirer. Pour un hébergement public, ajouter un stockage durable, un quota persistant et une authentification des joueurs au proxy applicatif avant d'ouvrir les routes. Ne pas exposer le proxy de développement sur Internet. Le build Vite et `npm run preview` ne fournissent pas de backend média ; le relais doit être exécuté séparément derrière ce proxy authentifié. Aucun secret partagé ne doit être compilé dans `VITE_*`.

## Vérifications

`npm test` couvre le contrat REST avec un fournisseur simulé, les terminaisons, les erreurs, le budget, le cache, l'annulation et une intégration HTTP réelle entre client et relais local. Aucune génération payante n'est lancée par les tests. L'intégration fournisseur en conditions réelles reste à valider une fois les clés renseignées.

## Références officielles

- [Quickstart](https://docs.higgsfield.ai/docs/quickstart)
- [Cycle des requêtes](https://docs.higgsfield.ai/docs/concepts/requests)
- [Polling](https://docs.higgsfield.ai/docs/concepts/polling)
- [Spécification OpenAPI](https://docs.higgsfield.ai/docs/openapi.json)
