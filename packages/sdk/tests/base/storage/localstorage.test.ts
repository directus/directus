/**
 * @jest-environment jsdom
 */

import { LocalStorage } from '@/src/index.js';
import { createStorageTests } from '@/tests/base/storage/tests.js';

describe(
	'localstorage storage',
	createStorageTests(() => new LocalStorage())
);
