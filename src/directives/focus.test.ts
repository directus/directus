import { definition } from './focus';

describe('Directives / Focus', () => {
	it('Calls focus() on the element on insertion', () => {
		const el = { focus: jest.fn() };
		// I don't care about the exact types of this Vue internal function. We just want to make
		// sure `focus()` is being called on `el`.
		definition.inserted!(el as any, null as any, null as any, null as any);
		expect(el.focus).toHaveBeenCalled();
	});
});
