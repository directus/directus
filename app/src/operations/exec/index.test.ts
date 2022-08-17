import { test, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { useFieldsStore } from '@/stores/fields';

import config from './index';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		})
	);
});

test('Options show optional notice if server allows modules', () => {});
