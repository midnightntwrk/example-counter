// This file is part of the Anonymous Voting System
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import { createLogger } from './logger-utils.js';
import { run } from './voting-cli.js';
import { TestnetRemoteConfig } from './config.js';

const config = new TestnetRemoteConfig();
const logger = await createLogger(config.logDir);
await run(config, logger);
