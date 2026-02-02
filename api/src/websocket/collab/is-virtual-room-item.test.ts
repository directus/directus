import { describe, expect, test } from 'vitest';
import { isVirtualRoomItem } from './is-virtual-room-item.js';

describe('isVirtualRoomItem', () => {
	test('returns true for valid virtual room items', () => {
		expect(isVirtualRoomItem('++')).toBe(true);
		expect(isVirtualRoomItem('+virtual+')).toBe(true);
		expect(isVirtualRoomItem('+articles-123-translations-fr-FR+')).toBe(true);
	});

	test('returns false for strings missing + wrapper', () => {
		expect(isVirtualRoomItem('regular-string')).toBe(false);
		expect(isVirtualRoomItem('+no-trailing')).toBe(false);
		expect(isVirtualRoomItem('no-leading+')).toBe(false);
		expect(isVirtualRoomItem('not+virtual+item')).toBe(false);
		expect(isVirtualRoomItem('')).toBe(false);
	});

	test('returns false for non-string types', () => {
		expect(isVirtualRoomItem(null)).toBe(false);
		expect(isVirtualRoomItem(undefined)).toBe(false);
		expect(isVirtualRoomItem(123)).toBe(false);
		expect(isVirtualRoomItem({ id: '+virtual+' })).toBe(false);
		expect(isVirtualRoomItem(['+virtual+'])).toBe(false);
	});
});
