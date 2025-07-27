import { library } from '@fortawesome/fontawesome-svg-core';
import { mount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import VIcon from './v-icon.vue';

test('Mount component', () => {
	expect(VIcon).toBeTruthy();

	const wrapper = mount(VIcon, {
		props: {
			name: 'close',
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('style props', () => {
	const props = ['x-small', 'small', 'large', 'x-large', 'left', 'right'];

	for (const prop of props) {
		const wrapper = mount(VIcon, {
			props: {
				name: 'close',
				[prop]: true,
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
					}),
				],
			},
		});

		expect(wrapper.classes()).toContain(prop);
	}
});

test('custom icon', () => {
	const wrapper = mount(VIcon, {
		props: {
			name: 'signal_wifi_3_bar',
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.find('svg').exists()).toBeTruthy();
});

test('social icon', () => {
	const wrapper = mount(VIcon, {
		props: {
			name: 'docker',
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.find('svg').exists()).toBeTruthy();
});

test('should only load fontawesome brand icons when using social icon', () => {
	const libraryAddSpy = vi.spyOn(library, 'add');

	mount(VIcon, {
		props: {
			name: 'close', // non-social icon
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(libraryAddSpy).not.toHaveBeenCalled();

	mount(VIcon, {
		props: {
			name: 'vuejs', // social icon
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(libraryAddSpy).toHaveBeenCalledOnce();
});

test('RTL icon mirroring', () => {
	// Test with LTR direction - should not be mirrored
	const wrapperLtr = mount(VIcon, {
		props: {
			name: 'arrow_forward', // This is in RTL_REVERSE_ICONS
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'ltr' },
						},
					},
				}),
			],
		},
	});

	expect(wrapperLtr.classes()).not.toContain('mirrored');

	// Test with RTL direction - should be mirrored
	const wrapperRtl = mount(VIcon, {
		props: {
			name: 'arrow_forward', // This is in RTL_REVERSE_ICONS
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'rtl' },
						},
					},
				}),
			],
		},
	});

	expect(wrapperRtl.classes()).toContain('mirrored');

	// Test with RTL direction but non-RTL icon - should not be mirrored
	const wrapperRtlNonRtlIcon = mount(VIcon, {
		props: {
			name: 'close', // This is NOT in RTL_REVERSE_ICONS
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'rtl' },
						},
					},
				}),
			],
		},
	});

	expect(wrapperRtlNonRtlIcon.classes()).not.toContain('mirrored');
});

test('RTL icon mirroring with different RTL icons', () => {
	const rtlIcons = ['arrow_back', 'chevron_left', 'chevron_right', 'navigate_before', 'navigate_next'];
	const nonRtlIcons = ['close', 'add', 'delete', 'edit', 'home'];

	// Test RTL icons in RTL mode - should be mirrored
	for (const iconName of rtlIcons) {
		const wrapper = mount(VIcon, {
			props: {
				name: iconName,
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							userStore: {
								currentUser: { text_direction: 'rtl' },
							},
						},
					}),
				],
			},
		});

		expect(wrapper.classes()).toContain('mirrored');
	}

	// Test non-RTL icons in RTL mode - should not be mirrored
	for (const iconName of nonRtlIcons) {
		const wrapper = mount(VIcon, {
			props: {
				name: iconName,
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							userStore: {
								currentUser: { text_direction: 'rtl' },
							},
						},
					}),
				],
			},
		});

		expect(wrapper.classes()).not.toContain('mirrored');
	}
});
