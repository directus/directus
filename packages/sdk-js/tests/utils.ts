import { MemoryStore, BrowserStore } from '../src/utils/';
import { expect } from 'chai';
import sinon from 'sinon';

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

	describe('BrowserStore', () => {
		beforeEach(() => {
			globalThis.window = {
				localStorage: { getItem: sinon.spy(), setItem: sinon.spy() },
			} as any;
		});

		it('Gets values based on key', async () => {
			const store = new BrowserStore();
			await store.getItem('test');
			expect(globalThis.window.localStorage.getItem).to.be.calledWith('test');
		});

		it('Sets value based on key', async () => {
			const store = new BrowserStore();
			await store.setItem('key', 'value');
			expect(globalThis.window.localStorage.setItem).to.be.calledWith('key', 'value');
		});
	});
});
