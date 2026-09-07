# HellGate-TD

Tower Defense web-natif en TypeScript / Phaser 3. Le joueur défendra la Porte des Enfers à travers les sept péchés, avec des tours et des cartes de Tarot.

## État actuel — étape 2

Socle Vite + TypeScript strict + Phaser 3 + Tailwind CSS. Les scènes Boot → Preloader → MainMenu démarrent le moteur et affichent un menu DOM superposé au canvas. Game et MetaProgression sont enregistrées comme squelettes. Le bouton de jeu est volontairement désactivé : aucune boucle de combat n'est encore implémentée.

Le projet est hébergé dans le dépôt public [AmIxEm10/42](https://github.com/AmIxEm10/42), conformément au choix du propriétaire. Le connecteur Higgsfield et son relais serveur sont implémentés ; leur branchement au gameplay viendra aux prochaines étapes.

## Démarrage

Node.js 22.12+ et npm sont nécessaires (voir `.nvmrc`).

```sh
npm ci
npm run setup:env
npm run dev
```

`npm run setup:env` crée `.env` sans écraser un fichier existant.

```sh
npm run typecheck
npm run build
npm run preview
```

## Architecture

| Dossier | Responsabilité |
| --- | --- |
| `src/game` | Configuration et cycle de vie du moteur |
| `src/scenes` | Boot, Preloader, MainMenu, Game, MetaProgression |
| `src/entities` | Futures classes Tower, Enemy, Projectile, Gate |
| `src/systems` | Futurs WaveManager, TarotManager, TarotDeck, EconomyManager, Spawner |
| `src/services` | HiggsfieldAPI.ts, types média et repli explicite |
| `src/config` | Prompts JSON des sept cercles et des trois Tarots |
| `server` | Relais authentifié, fournisseur Higgsfield, cache et budget |
| `tests` | Tests du connecteur et du relais |
| `src/ui` | Menu DOM ; futurs HUD, TarotOverlay et StatsDashboard |
| `src/assets` | Futurs placeholders et médias mis en cache |

## Configuration Higgsfield

`.env` est ignoré par Git. `.env.example` contient uniquement des valeurs vides et l'adresse publique du futur relais média. Ne jamais mettre un secret dans une variable `VITE_*` : Vite les intègre au code livré au navigateur.

Le service utilise un relais Node.js : navigateur → proxy local Vite → relais authentifié → Higgsfield. `npm run setup:env` prépare aussi le jeton interne du relais. Voir [server/README.md](server/README.md) pour renseigner les clés, lancer les deux processus et utiliser le connecteur. Les tests ne lancent aucune génération payante.

```sh
npm test
```

## Avancement

1. **Terminé** — socle technique et commit `feat: setup Vite+Phaser`.
2. **Terminé côté code** — connecteur Higgsfield, relais et tests simulés ; validation réelle en attente de clés API.
3. WaveManager configurable en JSON, chemin et Enemy.
4. Placement Tower, Projectile et collisions.
5. Tirage de trois Tarots et effets La Tour / Le Diable / La Mort.
6. HUD des ressources et DPS réel.

Les comportements des sept cercles et la méta-progression seront ajoutés dans ces modules au fil des étapes, pas dans un fichier unique.

## Récupérer le projet

```sh
git clone https://github.com/AmIxEm10/42.git hell-gate-td
cd hell-gate-td
npm ci
npm run setup:env
npm run dev
```

## Références

- [Installation Phaser](https://docs.phaser.io/phaser/getting-started/installation)
- [Tailwind avec Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Variables d'environnement Vite](https://vite.dev/guide/env-and-mode)
