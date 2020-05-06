import assert from 'assert';
import Game from '../src/models/Game';

describe('Game test', () => {
  describe('setCzar() test', () => {
    it('should set the next czar', () => {
      const game = new Game('test', 1);
      game.card_czar = 0;
      game.players = [
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        }
      ];
      game.setCzar();
      assert.strictEqual(game.card_czar, 1);
    });
    it('should set the next czar (back to 0)', () => {
      const game = new Game('test', 1);
      game.card_czar = 3;
      game.players = [
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        }
      ];
      game.setCzar();
      assert.strictEqual(game.card_czar, 0);
    });
    it('should set the next czar (skipping non-active)', () => {
      const game = new Game('test', 1);
      game.card_czar = 2;
      game.players = [
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return false;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        }
      ];
      game.setCzar();
      assert.strictEqual(game.card_czar, 3);
    });

    it('should set the next czar (skipping 2 non-active)', () => {
      const game = new Game('test', 1);
      game.card_czar = 0;
      game.players = [
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return false;
          }
        },
        {
          points: 10,
          isActive() {
            return false;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        }
      ];
      game.setCzar();
      assert.strictEqual(game.card_czar, 3);
    });
    it('should set the next czar (skipping first non-active)', () => {
      const game = new Game('test', 1);
      game.card_czar = 3;
      game.players = [
        {
          points: 10,
          isActive() {
            return false;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        }
      ];
      game.setCzar();
      assert.strictEqual(game.card_czar, 1);
    });
  });
  describe('needPlayOff() test', () => {
    it('should return no playoff (all players with the same points)', () => {
      const game = new Game('test', 1);
      game.players = [
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 10,
          isActive() {
            return true;
          }
        }
      ];
      const playoff = game.needPlayOff();
      assert.strictEqual(playoff, false);
    });
    it('should return no playoff (1 player with more points)', () => {
      const game = new Game('test', 1);
      game.players = [
        {
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          points: 9,
          isActive() {
            return true;
          }
        },
        {
          points: 9,
          isActive() {
            return true;
          }
        },
        {
          points: 9,
          isActive() {
            return true;
          }
        }
      ];
      const playoff = game.needPlayOff();
      assert.strictEqual(playoff, false);
    });
    it('should return no playoff (2 players with the same points but 1 inactive)', () => {
      const game = new Game('test', 1);
      game.players = [
        {
          uuid: 'p1',
          points: 10,
          isActive() {
            return false;
          }
        },
        {
          uuid: 'p2',
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p3',
          points: 9,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p4',
          points: 9,
          isActive() {
            return true;
          }
        }
      ];
      const playoff = game.needPlayOff();
      assert.strictEqual(playoff, false);
    });
    it('should return playoff (2 players with the same points)', () => {
      const game = new Game('test', 1);
      game.players = [
        {
          uuid: 'p1',
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p2',
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p3',
          points: 9,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p4',
          points: 9,
          isActive() {
            return true;
          }
        }
      ];
      const playoff = game.needPlayOff();
      assert.strictEqual(playoff.players.length, 2);
      assert.strictEqual(playoff.players[0], 'p1');
      assert.strictEqual(playoff.players[1], 'p2');
      assert.strictEqual(playoff.czar.uuid, 'p3');
    });
    it('should return playoff (3 players with the same points)', () => {
      const game = new Game('test', 1);
      game.players = [
        {
          uuid: 'p1',
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p2',
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p3',
          points: 10,
          isActive() {
            return true;
          }
        },
        {
          uuid: 'p4',
          name: 'john',
          points: 9,
          isActive() {
            return true;
          }
        }
      ];
      const playoff = game.needPlayOff();
      assert.strictEqual(playoff.players.length, 3);
      assert.strictEqual(playoff.players[0], 'p1');
      assert.strictEqual(playoff.players[1], 'p2');
      assert.strictEqual(playoff.players[2], 'p3');
      assert.strictEqual(playoff.czar.uuid, 'p4');
      assert.strictEqual(playoff.czar.name, 'john');
    });
  });
});
