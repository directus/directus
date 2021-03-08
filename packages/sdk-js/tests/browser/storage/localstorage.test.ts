/**
 * @jest-environment jest-environment-jsdom-global
 */

import { LocalStorage } from '../../../src/browser/storage';
import { createStorageTests } from '../../core/storage/tests';

describe(
	'localstorage storage',
	createStorageTests(() => new LocalStorage())
);
