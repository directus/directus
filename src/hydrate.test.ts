import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { useAppStore } from '@/stores/app';
import { useStores, hydrate, dehydrate } from './hydrate';

jest.mock('@/api');

describe('Stores / App', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	describe('useStores', () => {
		it('Calls all functions', () => {
			const mockStores: any = [jest.fn(), jest.fn()];
			useStores(mockStores);
			expect(mockStores[0]).toHaveBeenCalled();
			expect(mockStores[1]).toHaveBeenCalled();
		});

		it('Defaults to a global set of stores', () => {
			expect(useStores).not.toThrow();
		});
	});

	describe('Hydrate', () => {
		it('Sets hydrating state during hydration', async () => {
			const appStore = useAppStore({});

			expect(appStore.state.hydrating).toBe(false);

			const promise = hydrate([
				{
					id: 'test1',
					hydrate() {
						return new Promise((resolve) => {
							setTimeout(() => resolve(), 15);
						});
					},
				},
			]);

			expect(appStore.state.hydrating).toBe(true);

			promise.then(() => {
				expect(appStore.state.hydrating).toBe(false);
			});
		});

		it('Calls the hydrate function for all stores', async () => {
			const mockStores: any = [
				{
					hydrate: jest.fn(() => Promise.resolve()),
				},
				{
					dehydrate: jest.fn(() => Promise.resolve()),
				},
				{
					hydrate: jest.fn(() => Promise.resolve()),
					dehydrate: jest.fn(() => Promise.resolve()),
				},
			];

			useAppStore({});

			await hydrate(mockStores);

			expect(mockStores[0].hydrate).toHaveBeenCalled();
			expect(mockStores[2].hydrate).toHaveBeenCalled();
		});

		it('Sets the hydrated state to true when done', async () => {
			const appStore = useAppStore({});

			await hydrate([]);

			expect(appStore.state.hydrated).toBe(true);
		});

		it('Does not hydrate when hydrated is true', async () => {
			const appStore = useAppStore({});
			appStore.state.hydrated = true;

			const mockStores: any = [
				{
					hydrate: jest.fn(() => Promise.resolve()),
				},
			];

			await hydrate([]);

			expect(mockStores[0].hydrate).not.toHaveBeenCalled();
		});

		it('Does not hydrate when hydrating is true', async () => {
			const appStore = useAppStore({});
			appStore.state.hydrating = true;

			const mockStores: any = [
				{
					hydrate: jest.fn(() => Promise.resolve()),
				},
			];

			await hydrate(mockStores);

			expect(mockStores[0].hydrate).not.toHaveBeenCalled();
		});

		it('Sets the error state when one of the hydration functions fails', async () => {
			const mockStores: any = [
				{
					hydrate: jest.fn(() => {
						throw 'test';
					}),
				},
			];

			const appStore = useAppStore({});

			await hydrate(mockStores);

			expect(appStore.state.error).toBe('test');
		});
	});

	describe('Dehydrate', () => {
		it('Calls the dehydrate function for all stores', async () => {
			const mockStores: any = [
				{
					dehydrate: jest.fn(() => Promise.resolve()),
				},
				{},
				{
					dehydrate: jest.fn(() => Promise.resolve()),
				},
			];

			const appStore = useAppStore({});
			appStore.state.hydrated = true;

			await dehydrate(mockStores);

			expect(mockStores[0].dehydrate).toHaveBeenCalled();
			expect(mockStores[2].dehydrate).toHaveBeenCalled();
		});

		it('Sets the hydrated state to false when done', async () => {
			const mockStores: any = [{}];

			const appStore = useAppStore({});
			appStore.state.hydrated = true;

			await dehydrate(mockStores);

			expect(appStore.state.hydrated).toBe(false);
		});

		it('Does not dehydrate when store is already dehydrated', async () => {
			const mockStores: any = [
				{
					dehydrate: jest.fn(() => Promise.resolve()),
				},
			];

			const appStore = useAppStore({});
			appStore.state.hydrated = false;

			await dehydrate(mockStores);

			expect(mockStores[0].dehydrate).not.toHaveBeenCalled();
		});
	});
});
