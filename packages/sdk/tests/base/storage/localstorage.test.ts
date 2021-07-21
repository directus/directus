/**
 * @jest-environment jest-environment-jsdom-global
 */

import { LocalStorage } from '../../../src/base/storage';
import { createStorageTests } from './tests';

describe(
	'localstorage storage',
	createStorageTests(() => new LocalStorage())
);
