import { MemoryStore } from '../src/utils/';
import { expect } from 'chai';

describe('Utils', () => {
	describe('MemoryStore', () => {
		it('Gets values based on key', async () => {
			const store = new MemoryStore();
			store['values'].test = 'test';
			const result = await store.getItem('test');
			expect(result).to.equal('test');
		});

		it('Sets value based on key', async () => {
			const store = new MemoryStore();
			await store.setItem('test', 'test');
			expect(store['values'].test).to.equal('test');
		});
	});
});
