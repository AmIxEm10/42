import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';

export class Boot extends Phaser.Scene {
  constructor() { super(SceneKeys.Boot); }
  create(): void { this.scene.start(SceneKeys.Preloader); }
}
