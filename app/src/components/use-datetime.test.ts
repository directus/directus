import { mount } from '@vue/test-utils';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import UseDatetime from './use-datetime.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	plugins: [i18n],
};

beforeAll(() => {
	vi.useFakeTimers();
});

afterAll(() => {
	vi.useRealTimers();
});

function getCurrentTestDate() {
	const isoTestDate = '2023-01-01T00:00:00.000Z';

	// account for timezone difference depending on the machine where this test is ran
	const now = new Date(isoTestDate);
	const timezoneOffsetInMinutes = now.getTimezoneOffset();
	const timezoneOffsetInMilliseconds = timezoneOffsetInMinutes * 60 * 1000;
	const nowUTC = new Date(new Date(isoTestDate).valueOf() + timezoneOffsetInMilliseconds);

	return nowUTC;
}

test('should provide datetime value', () => {
	const now = getCurrentTestDate();

	const wrapper = mount(UseDatetime, {
		slots: {
			default: '<template v-slot="{ datetime }">{{ datetime }}</template>',
		},
		props: {
			value: now.toISOString(),
			type: 'timestamp',
		},
		global,
	});

	expect(wrapper.html()).toBe('January 1st, 2023 12:00 AM');
});

test('should refresh the value every minute when relative is true', async () => {
	const now = getCurrentTestDate();

	// set system time to be the same time as the tested time
	vi.setSystemTime(now.valueOf());

	const wrapper = mount(UseDatetime, {
		slots: {
			default: '<template v-slot="{ datetime }">{{ datetime }}</template>',
		},
		props: {
			value: now.toISOString(),
			type: 'timestamp',
			relative: true,
		},
		global,
	});

	expect(wrapper.html()).toBe('less than a minute ago');

	// fast forward one minute
	vi.advanceTimersByTime(60000);

	// make sure the dom is updated
	await nextTick();

	expect(wrapper.html()).toBe('1 minute ago');

	// fast forward one minute again
	vi.advanceTimersByTime(60000);

	// make sure the dom is updated again
	await nextTick();

	expect(wrapper.html()).toBe('2 minutes ago');
});
