import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { isVueComponent } from './is-vue-component.js';

describe('isVueComponent', () => {
	it('returns true if input is a Vue component', () => {
		const Component = defineComponent(() => {
			return () => {
				//
			};
		});

		const result = isVueComponent(Component);

		expect(result).toEqual(true);
	});

	it('returns false if input is not a Vue component', () => {
		const result = isVueComponent({});

		expect(result).toEqual(false);
	});
});
