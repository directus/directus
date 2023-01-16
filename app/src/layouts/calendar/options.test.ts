import { mount } from '@vue/test-utils';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { beforeAll, expect, test, vi } from 'vitest';
import { createI18n, I18n } from 'vue-i18n';

import Options from './options.vue';

let i18n: I18n;
let global: GlobalMountOptions;

beforeAll(() => {
	i18n = createI18n({
		legacy: false,
	});

	// silences locale message not found warnings
	vi.spyOn(i18n.global, 't').mockImplementation((key: string) => key);

	global = {
		stubs: ['v-field-template', 'v-select'],
		plugins: [i18n],
	};
});

test('should have days array in firstDayOptions variable', async () => {
	const wrapper = mount(Options, {
		props: {
			collection: 'test',
			dateFields: ['test'],
		},
		shallow: true,
		global,
	});

	const expected = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	expect(wrapper.vm.firstDayOptions.map((option: { text: string; value: number }) => option.text)).toEqual(expected);
});
