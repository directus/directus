import { i18n } from '@/lang';
import { mount } from '@vue/test-utils';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';

const global = {
	plugins: [i18n],
};

import Datetime from './datetime.vue';

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

test.each([
	{ format: 'long', expected: 'January 1st, 2023 12:00:00 AM' },
	{ format: 'short', expected: 'Jan 1, 2023 12:00AM' },
])('should display $format formatted string of current timestamp value', ({ format, expected }) => {
	const now = getCurrentTestDate();

	const wrapper = mount(Datetime, {
		props: {
			value: now.toISOString(),
			type: 'timestamp',
			format,
		},
		global,
	});

	expect(wrapper.find('.datetime').element.textContent).toBe(expected);
});

test.each([
	{ strict: true, expected: '0 seconds ago' },
	{ strict: false, expected: 'less than a minute ago' },
])('should display "$expected" relative formatted string when strict is $strict', async ({ strict, expected }) => {
	const now = getCurrentTestDate();

	// set system time to be the same time as the tested time
	vi.setSystemTime(now.valueOf());

	const wrapper = mount(Datetime, {
		props: {
			value: now.toISOString(),
			type: 'timestamp',
			relative: true,
			strict,
		},
		global,
	});

	expect(wrapper.find('.datetime').element.textContent).toBe(expected);
});

test('should refresh the display every minute when relative is true', async () => {
	const now = getCurrentTestDate();

	// set system time to be the same time as the tested time
	vi.setSystemTime(now.valueOf());

	const wrapper = mount(Datetime, {
		props: {
			value: now.toISOString(),
			type: 'timestamp',
			relative: true,
		},
		global,
	});

	expect(wrapper.find('.datetime').element.textContent).toBe('less than a minute ago');

	// fast forward one minute
	vi.advanceTimersByTime(60000);

	// make sure the dom is updated
	await nextTick();

	expect(wrapper.find('.datetime').element.textContent).toBe('1 minute ago');

	// fast forward one minute again
	vi.advanceTimersByTime(60000);

	// make sure the dom is updated again
	await nextTick();

	expect(wrapper.find('.datetime').element.textContent).toBe('2 minutes ago');
});
