import { getRedis } from './redisHelper';
import cookie from 'cookie';

const { MULTI_NODE, STICKY_COOKIE } = process.env;

const isMultiNode = MULTI_NODE && (MULTI_NODE === '1' || MULTI_NODE === 'true' || MULTI_NODE === 'on');

class MultiNodeHelper {
  static async getGame(game_uuid) {
    if (!isMultiNode) {
      return;
    }
    const client = getRedis();
    return new Promise((resolve, reject) => {
      client.get(game_uuid, (err, value) => {
        client.quit();
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  }

  static async storeGame(req, game_uuid) {
    if (!isMultiNode) {
      return;
    }
    let node = MultiNodeHelper._getStikyCookie(req);
    if (!node) {
      // FIXME it works only when there is only 1 proxy
      const xForwardedHost = req.headers['x-forwarded-host'];
      const xForwardedProto = req.headers['x-forwarded-proto'];
      if (xForwardedProto && xForwardedHost) {
        node = `${xForwardedProto}://${xForwardedHost}`;
      }
    }
    if (!node) {
      return;
    }
    // Save game_uuid -> node
    const client = getRedis();
    return new Promise((resolve, reject) => {
      client.set(game_uuid, node, 'EX', 60 * 60 * 4, err => {
        client.quit();
        if (err) {
          reject(err);
        } else {
          resolve(node);
        }
      });
    });
  }

  static async clearGame(game_uuid) {
    if (!isMultiNode) {
      return;
    }
    const client = getRedis();
    return new Promise((resolve, reject) => {
      client.del(game_uuid, err => {
        client.quit();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static isMultiNode() {
    return isMultiNode;
  }

  static getCookie() {
    return STICKY_COOKIE;
  }

  static _getStikyCookie(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    return cookies[STICKY_COOKIE] || false;
  }
}

export default MultiNodeHelper;
