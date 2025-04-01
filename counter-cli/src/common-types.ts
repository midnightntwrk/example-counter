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

import { type Contract, type Witnesses } from '../../contract/src/managed/counter/contract/index.cjs';
import type { CounterPrivateState } from '../../contract/src/witnesses';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

export type PrivateStates = {
  counterPrivateState: CounterPrivateState;
};

export type CounterProviders = MidnightProviders<'increment', PrivateStates>;

export type CounterContract = Contract<CounterPrivateState, Witnesses<CounterPrivateState>>;

export type DeployedCounterContract = FoundContract<CounterPrivateState, CounterContract>;
