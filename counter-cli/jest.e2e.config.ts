import sharedConfig from './jest.config';

module.exports = {
  ...sharedConfig,
  testMatch: ['**/*.e2e.test.ts'],
}
