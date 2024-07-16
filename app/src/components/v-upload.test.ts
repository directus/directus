import type { GlobalMountOptions } from '@/__utils__/types';
import { Focus } from '@/__utils__/focus';
import { mount } from '@vue/test-utils';
import { expect, test, beforeEach, vi, describe } from 'vitest';
import { createI18n } from 'vue-i18n';
import { Tooltip } from '../__utils__/tooltip';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import VButton from './v-button.vue';
import VUpload from './v-upload.vue';

vi.mock('vue-router', () => ({
	useRoute: vi.fn(),
	useLink: vi.fn().mockImplementation(() => ({
		route: vi.fn().mockReturnValue(''),
		isActive: vi.fn().mockReturnValue(false),
		isExactActive: vi.fn().mockReturnValue(false),
	})),
}));

const i18n = createI18n({
	legacy: false,
	messages: {
		'en-US': {
			click_to_browse: 'Click to Browse',
			drag_file_here: 'Drag & Drop a File Here',
			import_from_url: 'Import File from URL',
			folders: 'Folders',
		},
	},
});

const global: GlobalMountOptions = {
	stubs: [
		'v-icon',
		'v-progress-linear',
		'v-card-title',
		'v-input',
		'v-card-text',
		'v-card-actions',
		'v-card',
		'v-dialog',
		'v-progress-circular',
	],
	plugins: [i18n],
	directives: {
		Tooltip,
		Focus,
	},
	components: {
		'v-button': VButton,
	},
};

Object.defineProperty(window, 'FormData', {
	writable: true,
	value: FormData,
});

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/api', () => {
	return {
		default: {
			post: vi.fn(),
			patch: vi.fn(),
		},
	};
});

describe('V-Upload', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
			}),
		);
	});

	const props = {
		multiple: false,
		preset: undefined,
		fileId: undefined,
		fromUser: true,
		fromUrl: false,
		fromLibrary: false,
	};

	test('Mount component', () => {
		expect(VUpload).toBeTruthy();

		const wrapper = mount(VUpload, {
			props,
			global,
		});

		expect(wrapper.html()).toMatchSnapshot();
	});

	test('Should upload new file', async () => {
		const wrapper = mount(VUpload, {
			props,
			global,
		});

		const file = new File(['image'], 'image.png', { type: 'image/png' });

		const fileUpload = wrapper.get<HTMLInputElement>('input[type="file"]');

		expect(fileUpload).toBeTruthy();

		Object.defineProperty(fileUpload.element, 'files', {
			value: [file],
			writable: false,
		});

		await fileUpload.trigger('change');
		await wrapper.vm.$nextTick();

		expect(fileUpload.element.files).toEqual([file]);
	});
});
