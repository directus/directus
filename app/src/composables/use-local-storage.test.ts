import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from '@/composables/use-local-storage';

describe('useLocalStorage', () => {
	const key = 'test';
	const keyWithPrefix = `directus-${key}`;

	beforeEach(() => {
		localStorage.removeItem(keyWithPrefix);
	});

	describe('getting value', () => {
		describe('when value exists in local storage', () => {
			it('returns value from local storage', () => {
				const value = 'Hello there!';
				localStorage.setItem(keyWithPrefix, JSON.stringify(value));
				const { data } = useLocalStorage(key);

				expect(data.value).toBe(value);
			});
		});

		describe('when value does not exist in local storage', () => {
			it('returns default value', () => {
				const defaultValue = 'Hello default!';
				const { data } = useLocalStorage(key, defaultValue);

				expect(data.value).toBe(defaultValue);
			});
		});

		describe('when there is an error while parsing', () => {
			it('returns default value', () => {
				localStorage.setItem(keyWithPrefix, 'wrong value');
				const { data } = useLocalStorage(key);

				expect(data.value).toBe(null);
			});
		});
	});

	describe('setting value', () => {
		describe('if value is not null', () => {
			it('sets stringified value in local storage', async () => {
				const value = 'Hello there!';
				const { data } = useLocalStorage(key);
				data.value = value;

				await new Promise((resolve) => setTimeout(resolve));
				expect(localStorage.getItem(keyWithPrefix)).toBe(JSON.stringify(value));
			});

			describe('when there is an error while stringifying', () => {
				it('does not set new value', () => {
					const currentValue = 'Hello!';
					const stringifiedValue = JSON.stringify(currentValue);
					localStorage.setItem(keyWithPrefix, stringifiedValue);

					const newValue: Record<string, any> = {};
					newValue.a = { b: newValue };

					const { data } = useLocalStorage(key);
					data.value = newValue;

					expect(localStorage.getItem(keyWithPrefix)).toBe(stringifiedValue);
				});
			});
		});

		describe('if value is null', () => {
			it('clears the current key but not the other existing keys', () => {
				const anotherKey = `anotherLocalStorageKey`;
				const anotherValue = '123';
				localStorage.setItem(anotherKey, anotherValue);

				const { data } = useLocalStorage(key);
				data.value = null;

				expect(localStorage.getItem(anotherKey)).toBe(anotherValue);
				expect(localStorage.getItem(keyWithPrefix)).toBe(null);
			});
		});
	});
});
