import { sizeProps, useSizeClass } from './use-size-class.js';
import { describe, expect, it } from 'vitest';
import { reactive, ref } from 'vue';

describe('sizeProps', () => {
	it('should have correct prop definitions', () => {
		expect(sizeProps).toEqual({
			xSmall: {
				type: Boolean,
				default: false,
			},
			small: {
				type: Boolean,
				default: false,
			},
			large: {
				type: Boolean,
				default: false,
			},
			xLarge: {
				type: Boolean,
				default: false,
			},
		});
	});

	it('should have all size props with Boolean type', () => {
		Object.values(sizeProps).forEach((prop) => {
			expect(prop.type).toBe(Boolean);
			expect(prop.default).toBe(false);
		});
	});

	it('should contain exactly four size properties', () => {
		expect(Object.keys(sizeProps)).toHaveLength(4);
		expect(Object.keys(sizeProps)).toEqual(['xSmall', 'small', 'large', 'xLarge']);
	});
});

describe('useSizeClass', () => {
	describe('Single size prop scenarios', () => {
		it('should return "x-small" when xSmall is true', () => {
			const props = { xSmall: true };

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('x-small');
		});

		it('should return "small" when small is true', () => {
			const props = { small: true };

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('small');
		});

		it('should return "large" when large is true', () => {
			const props = { large: true };

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('large');
		});

		it('should return "x-large" when xLarge is true', () => {
			const props = { xLarge: true };

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('x-large');
		});

		it('should return null when no size props are true', () => {
			const props = {};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBeNull();
		});

		it('should return null when all size props are false', () => {
			const props = {
				xSmall: false,
				small: false,
				large: false,
				xLarge: false,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBeNull();
		});
	});

	describe('Priority order scenarios', () => {
		it('should prioritize xSmall over other sizes', () => {
			const props = {
				xSmall: true,
				small: true,
				large: true,
				xLarge: true,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('x-small');
		});

		it('should prioritize small over large and xLarge when xSmall is false', () => {
			const props = {
				xSmall: false,
				small: true,
				large: true,
				xLarge: true,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('small');
		});

		it('should prioritize large over xLarge when xSmall and small are false', () => {
			const props = {
				xSmall: false,
				small: false,
				large: true,
				xLarge: true,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('large');
		});

		it('should return xLarge only when it is the only true size prop', () => {
			const props = {
				xSmall: false,
				small: false,
				large: false,
				xLarge: true,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('x-large');
		});
	});

	describe('Reactivity scenarios', () => {
		it('should be reactive when props change', () => {
			const reactiveProps = reactive({
				xSmall: false,
				small: false,
				large: false,
				xLarge: false,
			});

			const sizeClass = useSizeClass(reactiveProps);

			expect(sizeClass.value).toBeNull();

			reactiveProps.small = true;
			expect(sizeClass.value).toBe('small');

			reactiveProps.xSmall = true;
			expect(sizeClass.value).toBe('x-small');

			reactiveProps.xSmall = false;
			expect(sizeClass.value).toBe('small');

			reactiveProps.small = false;
			expect(sizeClass.value).toBeNull();
		});

		it('should handle reactive size transitions correctly', () => {
			const reactiveProps = reactive({
				xSmall: false,
				small: true,
				large: false,
				xLarge: false,
			});

			const sizeClass = useSizeClass(reactiveProps);

			expect(sizeClass.value).toBe('small');

			// Switch from small to large
			reactiveProps.small = false;
			reactiveProps.large = true;
			expect(sizeClass.value).toBe('large');

			// Switch from large to xLarge
			reactiveProps.large = false;
			reactiveProps.xLarge = true;
			expect(sizeClass.value).toBe('x-large');

			// Switch from xLarge to xSmall
			reactiveProps.xLarge = false;
			reactiveProps.xSmall = true;
			expect(sizeClass.value).toBe('x-small');
		});
	});

	describe('Generic type support', () => {
		it('should work with additional props', () => {
			interface MyProps {
				color: string;
				disabled: boolean;
				variant: 'primary' | 'secondary';
			}

			const props: MyProps & { small?: boolean; large?: boolean } = {
				color: 'blue',
				disabled: false,
				variant: 'primary',
				small: true,
				large: false,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('small');
		});

		it('should handle complex object props', () => {
			const complexProps = {
				config: { theme: 'dark', mode: 'production' },
				metadata: { version: '1.0.0', author: 'test' },
				xLarge: true,
				small: false,
			};

			const sizeClass = useSizeClass(complexProps);

			expect(sizeClass.value).toBe('x-large');
		});

		it('should work with computed props', () => {
			const isLarge = ref(true);

			const props = reactive({
				xSmall: false,
				small: false,
				get large() {
					return isLarge.value;
				},
				xLarge: false,
			});

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('large');

			isLarge.value = false;
			expect(sizeClass.value).toBeNull();
		});
	});

	describe('Edge cases', () => {
		it('should handle undefined size props gracefully', () => {
			const props = {
				xSmall: undefined as any,
				small: undefined as any,
				large: true,
				xLarge: undefined as any,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('large');
		});

		it('should handle null size props gracefully', () => {
			const props = {
				xSmall: null as any,
				small: null as any,
				large: null as any,
				xLarge: true,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('x-large');
		});

		it('should handle truthy non-boolean values', () => {
			const props = {
				xSmall: 'true' as any,
				small: 1 as any,
				large: false,
				xLarge: false,
			};

			const sizeClass = useSizeClass(props);

			// xSmall should be prioritized even with truthy string
			expect(sizeClass.value).toBe('x-small');
		});

		it('should handle falsy non-boolean values', () => {
			const props = {
				xSmall: '' as any,
				small: 0 as any,
				large: true,
				xLarge: false,
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBe('large');
		});

		it('should handle empty props object', () => {
			const props = {};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBeNull();
		});

		it('should handle props with only additional non-size properties', () => {
			const props = {
				color: 'red',
				disabled: true,
				variant: 'outline',
			};

			const sizeClass = useSizeClass(props);

			expect(sizeClass.value).toBeNull();
		});
	});

	describe('Integration scenarios', () => {
		it('should work in a typical Vue component scenario', () => {
			// Simulate Vue component props with actual boolean values
			const componentProps = {
				label: 'Click me',
				variant: 'primary',
				disabled: false,
				xSmall: false,
				small: true,
				large: false,
				xLarge: false,
			};

			const sizeClass = useSizeClass(componentProps);

			expect(sizeClass.value).toBe('small');
		});

		it('should maintain consistent behavior across multiple instances', () => {
			const props1 = { xSmall: true };
			const props2 = { xSmall: true };
			const props3 = { large: true };

			const sizeClass1 = useSizeClass(props1);
			const sizeClass2 = useSizeClass(props2);
			const sizeClass3 = useSizeClass(props3);

			expect(sizeClass1.value).toBe('x-small');
			expect(sizeClass2.value).toBe('x-small');
			expect(sizeClass3.value).toBe('large');
		});

		it('should handle rapid prop changes efficiently', () => {
			const reactiveProps = reactive({
				xSmall: false,
				small: false,
				large: false,
				xLarge: false,
			});

			const sizeClass = useSizeClass(reactiveProps);
			const results: (string | null)[] = [];

			// Rapid changes
			reactiveProps.small = true;
			results.push(sizeClass.value);

			reactiveProps.large = true;
			results.push(sizeClass.value);

			reactiveProps.small = false;
			results.push(sizeClass.value);

			reactiveProps.xSmall = true;
			results.push(sizeClass.value);

			reactiveProps.large = false;
			reactiveProps.xSmall = false;
			results.push(sizeClass.value);

			expect(results).toEqual(['small', 'small', 'large', 'x-small', null]);
		});
	});
});
