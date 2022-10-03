import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageObject } from '@/utils/local-storage-object';

describe('LocalStorageObject', () => {
	const key = 'test';
	const keyWithPrefix = `directus-${key}`;
	let localStorageObject;

	beforeEach(() => {
		localStorage.removeItem(keyWithPrefix);
		localStorageObject = new LocalStorageObject(key);
	});

	describe('#getValue', () => {
		describe('when value exists in local storage', () => {
			it('returns value from local storage', () => {
				const value = 'Hello there!';
				localStorage.setItem(keyWithPrefix, JSON.stringify(value));

				expect(localStorageObject.getValue()).toBe(value);
			});
		});

		describe('when value does not exist in local storage', () => {
			it('returns default value', () => {
				const defaultValue = 'Hello default!';
				localStorageObject = new LocalStorageObject(key, defaultValue);

				expect(localStorageObject.getValue()).toBe(defaultValue);
			});
		});

		describe('when there is an error while parsing', () => {
			it('returns default value', () => {
				expect(localStorageObject.getValue()).toBe(undefined);
			});
		});
	});

	describe('#setValue', () => {
		const value = 'Hello there!';

		it('sets stringified value in local storage', () => {
			localStorageObject.setValue(value);

			expect(localStorage.getItem(keyWithPrefix)).toBe(JSON.stringify(value));
		});

		it('returns value', () => {
			expect(localStorageObject.setValue(value)).toBe(value);
		});

		describe('when there is an error while stringifying', () => {
			it('returns default value', () => {
				const currentValue = 'Hello!';
				const stringifiedValue = JSON.stringify(currentValue);
				localStorage.setItem(keyWithPrefix, stringifiedValue);

				const newValue = {};
				newValue.a = { b: newValue };

				expect(localStorageObject.setValue(newValue)).toBe(currentValue);
				expect(localStorage.getItem(keyWithPrefix)).toBe(stringifiedValue);
			});
		});
	});

	describe('#clear', () => {
		it('clears local storage value', () => {
			localStorage.setItem(keyWithPrefix, 'Hello there!');
			localStorageObject.clear();

			expect(localStorage.getItem(keyWithPrefix)).toBe(null);
		});
	});
});
