/**
 * @jest-environment node
 */

import { MemoryStorage } from '@/src/index.js';
import { createStorageTests } from '@/tests/base/storage/tests.js';

describe(
	'memory storage',
	createStorageTests(() => new MemoryStorage())
);
