import { LocalStorage } from '../../../src/base/storage';
import { createStorageTests } from './tests';
import { describe } from 'vitest';

describe(
	'localstorage storage',
	createStorageTests(() => new LocalStorage())
);
