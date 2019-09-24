import * as path from 'path';

interface Config {
  token: string;
  numberOfReviews: number;
  cacheExpirationSeconds: number;
}

const publicConfig: Config = {
  token: '',
  numberOfReviews: 4,
  cacheExpirationSeconds: 30 * 24 * 60 * 60 // 30 days
};

const privateConfigPath = path.join(__dirname, 'private-config');
let privateConfig: Partial<Config> = {};

try {
  /* tslint:disable:no-var-requires */
  privateConfig = require(privateConfigPath).privateConfig;
} catch (e) {
  // It's OK
}

export const config: Config = {
  ...publicConfig,
  ...privateConfig
};
