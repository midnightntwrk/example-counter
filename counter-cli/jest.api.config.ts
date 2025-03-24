import sharedConfig from './jest.config';

module.exports = {
  ...sharedConfig,
  testMatch: ['**/*.api.test.ts'],
}
