// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/default-esm',
  verbose: true,
  testTimeout: 1000 * 60 * 45,
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
  passWithNoTests: false,
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  resolver: '<rootDir>/js-resolver.cjs',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports', outputName: 'report.xml' }],
    ['jest-html-reporters', { publicPath: 'reports', filename: 'report.html' }],
    ['jest-gh-md-reporter', { publicPath: 'reports', filename: 'test-report.md' }],
  ]
};

export default config;
