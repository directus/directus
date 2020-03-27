import { processValue } from './click-outside';

describe('Directives / Click Outside', () => {
	describe('processValue', () => {
		it('Uses passed function as handler', () => {
			const mockFn = () => {};
			const value = processValue(mockFn);
			expect(value.handler).toBe(mockFn);
		});

		it('Uses passed options as value', () => {
			const mockHandlerFn = () => {};
			const mockMiddlewareFn = () => true;
			const mockOptions = {
				handler: mockHandlerFn,
				middleware: mockMiddlewareFn,
				events: ['test'],
				disabled: true,
			};
			const value = processValue(mockOptions);
			expect(value.handler).toBe(mockHandlerFn);
			expect(value.middleware).toBe(mockMiddlewareFn);
			expect(value.events).toEqual(['test']);
			expect(value.disabled).toBe(true);
		});

		it('Uses default values if options are missing', () => {
			const mockOptions = {};
			const value = processValue(mockOptions);
			expect(value.handler).toBeInstanceOf(Function);
			expect(value.middleware).toBeInstanceOf(Function);
			expect(value.events).toEqual(['pointerdown']);
			expect(value.disabled).toBe(false);
		});
	});
});
