import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { MenuView } from '../ui/MenuView';

export class MainMenu extends Phaser.Scene {
  constructor() { super(SceneKeys.MainMenu); }

  create(): void {
    const view = new MenuView();
    view.mount(() => this.scene.start(SceneKeys.Game), () => this.scene.start(SceneKeys.MetaProgression));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => view.destroy());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => view.destroy());
  }
}
