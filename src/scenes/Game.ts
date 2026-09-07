import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';

/** Scène réservée à la boucle de jeu, à implémenter aux étapes 3 et 4. */
export class Game extends Phaser.Scene {
  constructor() { super(SceneKeys.Game); }
}
