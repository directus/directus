/**
 * @jest-environment jest-environment-jsdom-global
 */

import { LocalStorage } from '../../../src/browser/storage';
import { createStorageTests } from '../../base/storage/tests';

describe(
	'localstorage storage',
	createStorageTests(() => new LocalStorage())
);
