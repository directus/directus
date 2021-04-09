/**
 * @jest-environment node
 */

import { MemoryStorage } from '../../../src/base/storage';
import { createStorageTests } from './tests';

describe(
	'memory storage',
	createStorageTests(() => new MemoryStorage())
);
