/**
 * @jest-environment jsdom
 */

import { LocalStorage } from '../../../src/base/storage';
import { createStorageTests } from './tests';

describe(
	'localstorage storage',
	createStorageTests(() => new LocalStorage())
);
