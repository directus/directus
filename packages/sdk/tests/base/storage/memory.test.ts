import { MemoryStorage } from '../../../src/storage';
import { createStorageTests } from './tests';
import { describe } from 'vitest';

describe(
	'memory storage',
	createStorageTests(() => new MemoryStorage())
);
