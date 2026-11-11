import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import SystemFileImage from './system-file-image.vue';
import { generateRouter } from '@/__utils__/router';
import VButton from '@/components/v-button.vue';
import VImage from '@/components/v-image.vue';
import VUpload from '@/components/v-upload.vue';
import { i18n } from '@/lang';

const { get, unexpectedError } = vi.hoisted(() => ({ get: vi.fn(), unexpectedError: vi.fn() }));
vi.mock('@/api', () => ({ default: { get } }));
vi.mock('@/utils/unexpected-error', () => ({ unexpectedError }));

const firstFile = { id: 'first', type: 'image/png', title: 'First image', filename_download: 'first.png' };
const secondFile = { ...firstFile, id: 'second', title: 'Second image' };

const global = {
	plugins: [i18n, generateRouter()],
	directives: { tooltip: {} },
	stubs: { VImage: true, VUpload: true, VIcon: true, VSkeletonLoader: true },
};

beforeEach(() => {
	vi.resetAllMocks();
});

test.each([403, 404])('allows deselecting an unavailable image (%i)', async (status) => {
	get.mockRejectedValue({ response: { status } });
	const wrapper = mount(SystemFileImage, { props: { value: 'missing' }, global });
	await flushPromises();

	expect(wrapper.text()).toContain('Image unavailable');
	expect(unexpectedError).not.toHaveBeenCalled();
	const deselect = wrapper.findComponent(VButton);
	expect(deselect.find('button').text()).toBe('Deselect');
	expect(deselect.find('[aria-hidden="false"]').text()).toBe('Deselect');
	await deselect.find('button').trigger('click');
	expect(wrapper.emitted('input')?.[0]).toEqual([null]);
	await wrapper.setProps({ value: null });
	expect(wrapper.findComponent(VUpload).exists()).toBe(true);
});

test('reports unexpected lookup errors without trapping the selected value', async () => {
	const error = new Error('Network failed');
	get.mockRejectedValue(error);
	const wrapper = mount(SystemFileImage, { props: { value: firstFile.id }, global });
	await flushPromises();

	expect(unexpectedError).toHaveBeenCalledWith(error);
	expect(wrapper.findComponent(VButton).exists()).toBe(true);
});

test('ignores an outdated lookup after selecting another image', async () => {
	let resolveFirst!: (response: { data: { data: typeof firstFile } }) => void;
	get.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)));
	get.mockResolvedValueOnce({ data: { data: secondFile } });
	const wrapper = mount(SystemFileImage, { props: { value: firstFile.id }, global });
	await wrapper.setProps({ value: secondFile.id });
	await flushPromises();
	resolveFirst({ data: { data: firstFile } });
	await flushPromises();

	expect(wrapper.findComponent(VImage).attributes('alt')).toBe(secondFile.title);
});

test.each([firstFile, [firstFile]])('accepts upload and library selections', async (selection) => {
	get.mockResolvedValue({ data: { data: firstFile } });
	const wrapper = mount(SystemFileImage, { props: { value: null }, global });
	wrapper.findComponent(VUpload).vm.$emit('input', selection);
	await flushPromises();

	expect(wrapper.emitted('input')?.[0]).toEqual([firstFile.id]);
	await wrapper.setProps({ value: firstFile.id });
	await flushPromises();
	expect(wrapper.findComponent(VImage).attributes('alt')).toBe(firstFile.title);
});

test('shows an asset error and recovers when the image changes', async () => {
	get.mockResolvedValueOnce({ data: { data: firstFile } });
	get.mockResolvedValueOnce({ data: { data: secondFile } });
	const wrapper = mount(SystemFileImage, { props: { value: firstFile.id }, global });
	await flushPromises();
	await wrapper.findComponent(VImage).trigger('error');

	expect(wrapper.text()).toContain('Image unavailable');
	expect(wrapper.findComponent(VButton).exists()).toBe(true);
	await wrapper.setProps({ value: secondFile.id });
	await flushPromises();
	expect(wrapper.findComponent(VImage).attributes('alt')).toBe(secondFile.title);
});

test('does not allow deselection when disabled', async () => {
	get.mockRejectedValue({ response: { status: 403 } });
	const wrapper = mount(SystemFileImage, { props: { value: 'missing', disabled: true }, global });
	await flushPromises();

	expect(wrapper.findComponent(VButton).exists()).toBe(false);
	expect(wrapper.emitted('input')).toBeUndefined();
});

test('does not restore an image when its lookup finishes after deselection', async () => {
	let resolveFile!: (response: { data: { data: typeof firstFile } }) => void;
	get.mockReturnValueOnce(new Promise((resolve) => (resolveFile = resolve)));
	const wrapper = mount(SystemFileImage, { props: { value: firstFile.id }, global });
	await wrapper.setProps({ value: null });
	resolveFile({ data: { data: firstFile } });
	await flushPromises();

	expect(wrapper.findComponent(VUpload).exists()).toBe(true);
	expect(wrapper.findComponent(VImage).exists()).toBe(false);
	expect(wrapper.find('v-skeleton-loader-stub').exists()).toBe(false);
});
