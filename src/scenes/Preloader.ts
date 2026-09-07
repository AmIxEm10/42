import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';

export class Preloader extends Phaser.Scene {
  constructor() { super(SceneKeys.Preloader); }
  // Le chargement des médias sera branché après validation de l'étape 2.
  create(): void { this.scene.start(SceneKeys.MainMenu); }
}
