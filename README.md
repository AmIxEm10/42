# HellGate-TD

Tower Defense web-natif en TypeScript, Phaser 3, Vite et Tailwind CSS. Défendez la Porte des Enfers au fil de **7 cercles et 21 vagues**, choisissez vos Tarots et investissez vos Âmes Noires dans des améliorations permanentes.

Projet publié dans [AmIxEm10/42](https://github.com/AmIxEm10/42), selon le choix du propriétaire.

## Démarrage

Node.js 22.12+ et npm sont nécessaires.

```sh
git clone https://github.com/AmIxEm10/42.git hell-gate-td
cd hell-gate-td
npm ci
npm run setup:env
npm run dev
```

Le jeu fonctionne sans clé API : les ennemis et tours sont représentés par des formes Phaser, les cartes par des cadres avec leur numéro et leur texte. Les médias IA remplacent les fonds et illustrations lorsqu'ils sont disponibles ; ils ne bloquent jamais la partie.

Pour les médias générés, renseigner **localement** `HIGGSFIELD_API_KEY` et `HIGGSFIELD_API_SECRET` dans `.env`, puis lancer `npm run media:serve` dans un deuxième terminal. Voir [le guide du relais](server/README.md). La connexion Higgsfield dans ChatGPT ne fournit pas automatiquement ces clés au jeu.

## Jouer

1. **Tirage** : choisissez une carte parmi trois, avant chaque vague.
2. **Préparation** : choisissez Brasier ou Givre, puis cliquez sur une case libre. Aucun placement ne peut fermer le passage vers la Porte. Cliquez sur une tour pour l'améliorer (5 niveaux).
3. **Expiation** : lancez la vague avec le bouton ou la barre Espace. Les défenses peuvent aussi être construites et améliorées pendant le combat.
4. **Récolte** : cliquez sur les cendres au sol ou utilisez **R / Récolter**. En Avarice, elles disparaissent au bout de trois secondes de jeu. Ailleurs, les cendres restantes sont récoltées en fin de vague.
5. **Héritage** : chaque cercle terminé rapporte 3 Âmes Noires ; une victoire complète ajoute 10. Elles restent acquises même si la Porte tombe plus tard. Renforcez la Porte (+20 PV par niveau) ou débloquez Le Jugement au menu Héritage.

Le bouton Pause suspend la simulation. Quitter abandonne la partie en cours ; seuls les gains et achats permanents sont conservés. La sauvegarde utilise le stockage local du navigateur, avec repli en mémoire s'il est indisponible. Aucune partie en cours n'est sauvegardée.

## Cercles

| Cercle | Comportement |
| --- | --- |
| Gourmandise | Ennemis lents, PV élevés et rayon de collision élargi |
| Colère | Accélération à chaque impact ; explosion à la mort, étourdissement des tours voisines et dégâts à la Porte proche |
| Avarice | Cendres au sol expirant après 3 secondes |
| Paresse | Zones violettes divisant par deux la cadence des tours |
| Luxure | Aura de soin pour les alliés proches |
| Envie | Copie les dégâts, la portée et la cadence de la tour la plus proche ; attaque la Porte à distance. PV et vitesse adaptés aux statistiques copiées |
| Orgueil | Boss de la dernière vague déplaçant un obstacle toutes les 5 secondes ; recalcul du chemin avec maintien d'une route accessible |

## Tarots et défenses

| Arcane | Effet |
| --- | --- |
| La Tour | Une défense inflige ses dégâts dans une zone de rayon 70. Si aucune tour n'est sélectionnée, cliquez sur une tour ou construisez-en une pour lui attribuer le pouvoir |
| Le Diable | Dégâts globaux ×2 ; PV maximum de la Porte ×0,9 |
| La Mort | Les attaques exécutent les ennemis passant sous 10 % de leurs PV |
| Le Pendu | Débloque Givre : tirs ralentissant les ennemis pendant 1,5 seconde |
| La Roue | +150 cendres |
| Le Jugement | Après déblocage permanent : +25 % de dégâts globaux |

La Mort et Le Pendu quittent le tirage une fois acquis. Chaque tirage propose trois cartes différentes. Les pouvoirs de dégâts sont cumulables.

## Architecture

| Dossier | Responsabilité |
| --- | --- |
| `src/game` | Configuration du moteur |
| `src/scenes` | Boot, Preloader, MainMenu, Game, MetaProgression |
| `src/entities` | Tower, Enemy, Projectile, Gate, AshDrop |
| `src/systems` | WaveManager, Spawner, Pathfinder, CombatSystem, EconomyManager, TarotDeck, TarotManager, DamageTracker |
| `src/state` | Singleton MetaStore et sauvegarde permanente |
| `src/config` | Paramètres JSON des cercles et prompts média |
| `src/services` | HiggsfieldAPI, contrats typés et repli explicite |
| `src/ui` | HUD DOM, StatsDashboard, TarotOverlay, commandes, plateau et arrière-plan vidéo |
| `src/assets` | Emplacement réservé aux futurs assets archivés ; placeholders actuels rendus en Phaser/DOM |
| `server` | Relais Higgsfield authentifié, cache mémoire, limitation des générations |
| `tests` | Contrats média, pathfinding, vagues, Tarot, économie et DPS |

Le HUD affiche le solde de cendres, les Âmes Noires, la vie de la Porte et le DPS sur les trois dernières secondes de simulation. Le DPS compte les PV effectivement retirés, y compris les exécutions, et exclut les dégâts excédant les PV de la cible. Le tableau de bord suit les ennemis repoussés, les cendres acquises (récompenses comprises), les dégâts cumulés et les ennemis restants dans la vague.

## Validation

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

18 tests automatisés couvrent les contrats et les règles métier, dont un échange HTTP client/relais avec fournisseur simulé. La compilation de production et TypeScript sont vérifiés. Aucun test visuel ou parcours complet dans un navigateur n'a été exécuté ; l'équilibrage des 21 vagues reste à affiner par playtest.

L'intégration Higgsfield réelle reste à valider avec des clés et un solde utilisables. Les tests ne lancent pas de génération payante. Le cache média et les budgets sont en mémoire, pas persistants ; le relais local doit être adapté avant une exposition publique. Un build statique ne fournit pas le relais : le jeu fonctionne alors avec ses placeholders.

## Commits fonctionnels

1. `feat: setup Vite+Phaser`
2. `feat: Higgsfield media connector and secure relay`
3. `feat: configurable waves and enemy pathfinding`
4. `feat: tower placement projectiles and seven-circle combat`
5. `feat: tarot draws effects and dynamic Higgsfield media`
6. `feat: live HUD statistics and gameplay polish`

## Références

- [Installation Phaser](https://docs.phaser.io/phaser/getting-started/installation)
- [Tailwind avec Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Variables d'environnement Vite](https://vite.dev/guide/env-and-mode)
- [API Higgsfield](https://docs.higgsfield.ai/docs/quickstart)
