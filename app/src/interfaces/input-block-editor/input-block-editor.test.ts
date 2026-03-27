import EditorJS from '@editorjs/editorjs';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vite-plus/test';
import InputBlockEditor from './input-block-editor.vue';

vi.mock('@editorjs/editorjs', () => ({ default: vi.fn() }));
vi.mock('./tools', () => ({ default: vi.fn(() => ({})) }));
vi.mock('@/api', () => ({ default: { defaults: { baseURL: '' } } }));
vi.mock('@/stores/collections', () => ({ useCollectionsStore: () => ({ getCollection: () => null }) }));
vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { files: { mimeTypeAllowList: null } } }) }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/utils/unexpected-error', () => ({ unexpectedError: vi.fn() }));

describe('InputBlockEditor', () => {
	it('should render content before toggling readOnly on concurrent prop change', async () => {
		const callOrder: string[] = [];
		let resolveReady!: () => void;
		let resolveRender!: () => void;

		vi.mocked(EditorJS).mockImplementation(
			() =>
				({
					isReady: new Promise<void>((r) => (resolveReady = r)),
					render: vi.fn(() => {
						callOrder.push('render');
						return new Promise<void>((r) => (resolveRender = r));
					}),
					clear: vi.fn(),
					destroy: vi.fn(),
					focus: vi.fn(),
					on: vi.fn(),
					saver: { save: vi.fn().mockResolvedValue({ blocks: [] }) },
					readOnly: {
						toggle: vi.fn((val: boolean) => callOrder.push(`toggle:${val}`)),
					},
				}) as any,
		);

		const wrapper = mount(InputBlockEditor, {
			props: {
				disabled: false,
				value: { blocks: [{ type: 'paragraph', data: { text: 'initial' } }] },
			},
			global: {
				directives: { 'prevent-focusout': {} },
				stubs: { VDrawer: true, VUpload: true },
			},
		});

		// Complete initial mount
		resolveReady();
		await flushPromises();
		resolveRender();
		await flushPromises();
		callOrder.length = 0;

		// Both props change in the same tick — triggers disabled + value watchers
		await wrapper.setProps({
			disabled: true,
			value: { blocks: [{ type: 'paragraph', data: { text: 'updated' } }] },
		});

		await flushPromises();

		// Without the fix, the sync disabled watcher fires toggle before the value watcher calls render
		expect(callOrder.indexOf('render')).toBeLessThan(callOrder.indexOf('toggle:true'));

		resolveRender();
		await flushPromises();
		wrapper.unmount();
	});

	it('should not clear content when value becomes null while disabled', async () => {
		// This test should prevent a regression that results in data loss when the value is temporarily null and the field is disabled
		const clear = vi.fn();

		vi.mocked(EditorJS).mockImplementation(
			() =>
				({
					isReady: Promise.resolve(),
					render: vi.fn().mockResolvedValue(undefined),
					clear,
					destroy: vi.fn(),
					focus: vi.fn(),
					on: vi.fn(),
					saver: { save: vi.fn().mockResolvedValue({ blocks: [] }) },
					readOnly: {
						toggle: vi.fn(),
					},
				}) as any,
		);

		const wrapper = mount(InputBlockEditor, {
			props: {
				disabled: false,
				value: { blocks: [{ type: 'paragraph', data: { text: 'initial' } }] },
			},
			global: {
				directives: { 'prevent-focusout': {} },
				stubs: { VDrawer: true, VUpload: true },
			},
		});

		await flushPromises();

		await wrapper.setProps({ disabled: true });
		await flushPromises();

		await wrapper.setProps({ value: null });
		await flushPromises();

		expect(clear).not.toHaveBeenCalled();

		wrapper.unmount();
	});
});
