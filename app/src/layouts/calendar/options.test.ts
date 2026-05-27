import { mount } from '@vue/test-utils';
import { beforeAll, expect, test, vi } from 'vitest';
import { createI18n, I18n } from 'vue-i18n';
import Options from './options.vue';
import { GlobalMountOptions } from '@/__utils__/types';

let i18n: I18n;
let global: GlobalMountOptions;

beforeAll(() => {
	i18n = createI18n({
		legacy: false,
	});

	// silences locale message not found warnings
	vi.spyOn(i18n.global, 't').mockImplementation((key: string) => key);

	global = {
		stubs: ['v-collection-field-template', 'v-select'],
		plugins: [i18n],
	};
});

test('should have days array in firstDayOptions variable', async () => {
	const wrapper = mount(Options, {
		props: {
			collection: 'test',
			dateFields: [
				{
					collection: 'test',
					field: 'test',
					name: 'Test',
					type: 'date',
					schema: null,
					meta: null,
				},
			],
		},
		shallow: true,
		global,
	});

	const expected = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	expect(wrapper.vm.firstDayOptions.map((option: { text: string; value: number }) => option.text)).toEqual(expected);
});
