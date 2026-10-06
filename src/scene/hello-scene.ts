import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config';

export class HelloScene extends Scene {
  constructor() {
    super('hello');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Hello tavern', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#f5c542',
      })
      .setOrigin(0.5);
  }
}
