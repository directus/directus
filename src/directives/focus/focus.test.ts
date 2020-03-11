import Focus from './focus';

describe('Directives / Focus', () => {
	it('Calls focus() on the element if binding is truthy', () => {
		const el = { focus: jest.fn() };
		Focus.inserted!(el as any, { value: true } as any, null as any, null as any);
		expect(el.focus).toHaveBeenCalled();
	});

	it('Calls blur() on the element if binding is false', () => {
		const el = { blur: jest.fn() };
		Focus.inserted!(el as any, { value: false } as any, null as any, null as any);
		expect(el.blur).toHaveBeenCalled();
	});
});
