import './styles.css';
import { HellGateGame } from './game/HellGateGame';

const game = new HellGateGame();
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
    document.querySelector('#ui-root')?.replaceChildren();
  });
}
