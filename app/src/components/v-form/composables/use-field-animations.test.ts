import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useFieldAnimations } from './use-field-animations';

const FIELD_ANIMATION_STAGGER = 150;

describe('useFieldAnimations', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(1000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('triggerAnimations', () => {
		it('sets animation keys for provided fields', () => {
			const { triggerAnimations, getAnimationKey } = useFieldAnimations();

			triggerAnimations(['title', 'description']);

			expect(getAnimationKey('title')).toBe(1000);
			expect(getAnimationKey('description')).toBe(1001);
		});

		it('extracts top-level field from nested paths', () => {
			const { triggerAnimations, getAnimationKey } = useFieldAnimations();

			triggerAnimations(['author.name', 'author.email']);

			expect(getAnimationKey('author')).toBeDefined();
			expect(getAnimationKey('author.name')).toBeUndefined();
		});

		it('staggers delays for multiple fields', () => {
			const { triggerAnimations, getAnimationDelay } = useFieldAnimations();

			triggerAnimations(['a', 'b', 'c']);

			expect(getAnimationDelay('a')).toBe(0);
			expect(getAnimationDelay('b')).toBe(FIELD_ANIMATION_STAGGER);
			expect(getAnimationDelay('c')).toBe(FIELD_ANIMATION_STAGGER * 2);
		});

		it('updates keys when re-triggered', () => {
			const { triggerAnimations, getAnimationKey } = useFieldAnimations();

			triggerAnimations(['title']);
			const firstKey = getAnimationKey('title');

			vi.setSystemTime(2000);
			triggerAnimations(['title']);
			const secondKey = getAnimationKey('title');

			expect(secondKey).not.toBe(firstKey);
			expect(secondKey).toBe(2000);
		});
	});

	describe('clearAnimation', () => {
		it('removes field from animation state', () => {
			const { triggerAnimations, clearAnimation, getAnimationKey } = useFieldAnimations();

			triggerAnimations(['title']);
			expect(getAnimationKey('title')).toBeDefined();

			clearAnimation('title');
			expect(getAnimationKey('title')).toBeUndefined();
		});

		it('does nothing for non-animated fields', () => {
			const { clearAnimation, getAnimationKey } = useFieldAnimations();

			clearAnimation('nonexistent');
			expect(getAnimationKey('nonexistent')).toBeUndefined();
		});
	});

	describe('getAnimationKey', () => {
		it('returns undefined for non-animated fields', () => {
			const { getAnimationKey } = useFieldAnimations();

			expect(getAnimationKey('unknown')).toBeUndefined();
		});
	});

	describe('getAnimationDelay', () => {
		it('returns 0 for non-animated fields', () => {
			const { getAnimationDelay } = useFieldAnimations();

			expect(getAnimationDelay('unknown')).toBe(0);
		});
	});
});
