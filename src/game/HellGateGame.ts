import Phaser from 'phaser';
import { Boot } from '../scenes/Boot';
import { Preloader } from '../scenes/Preloader';
import { MainMenu } from '../scenes/MainMenu';
import { Game } from '../scenes/Game';
import { MetaProgression } from '../scenes/MetaProgression';

export class HellGateGame extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      parent: 'game',
      backgroundColor: '#100d12',
      transparent: true,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [Boot, Preloader, MainMenu, Game, MetaProgression],
    });
  }
}
