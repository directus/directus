import { describe, expect, it } from 'vitest';
import { hasStagedJunctionValues, mergeFetchedItemInitialValues } from './overlay-item-utils';

describe('overlay-item-utils', () => {
	describe('mergeFetchedItemInitialValues', () => {
		it('preserves an already-loaded related object when fetchItem returns a scalar FK', () => {
			const current = {
				item: { id: '5702', title: 'Published title' },
			};

			const fetched = {
				id: '322b',
				collection: 'block_trust_bar',
				item: '5702',
			};

			expect(mergeFetchedItemInitialValues(current, fetched, 'item')).toEqual({
				id: '322b',
				collection: 'block_trust_bar',
				item: { id: '5702', title: 'Published title' },
			});
		});

		it('returns fetched item directly when there is no existing related object', () => {
			const fetched = { id: '322b', collection: 'block_trust_bar', item: '5702' };
			expect(mergeFetchedItemInitialValues(null, fetched, 'item')).toEqual(fetched);
		});

		it('accepts incoming expanded related object when provided', () => {
			const current = { item: { id: '5702', title: 'Old' } };
			const fetched = { id: '322b', item: { id: '5702', title: 'Expanded' } };
			expect(mergeFetchedItemInitialValues(current, fetched, 'item')).toEqual(fetched);
		});
	});

	describe('hasStagedJunctionValues', () => {
		it('detects staged delta edits under the junction field', () => {
			expect(hasStagedJunctionValues({ item: { title: 'Edited title' } }, 'item')).toBe(true);
			expect(hasStagedJunctionValues({ item: {} }, 'item')).toBe(false);
			expect(hasStagedJunctionValues({}, 'item')).toBe(false);
		});
	});
});
