import EditorJS from '@editorjs/editorjs';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import InputBlockEditor from './input-block-editor.vue';

vi.mock('@editorjs/editorjs', () => ({ default: vi.fn() }));
vi.mock('./tools', () => ({ default: vi.fn(() => ({})) }));
vi.mock('@/api', () => ({ default: { defaults: { baseURL: '' } } }));
vi.mock('@/stores/collections', () => ({ useCollectionsStore: () => ({ getCollection: () => null }) }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/utils/unexpected-error', () => ({ unexpectedError: vi.fn() }));

describe('InputBlockEditor', () => {
	it('should not re-render after save-and-stay', async () => {
		const blocksA = [{ type: 'paragraph', data: { text: 'first edit' } }];
		const blocksB = [{ type: 'paragraph', data: { text: 'second edit' } }];
		let resolveReady!: () => void;
		let onChange!: (api: EditorJS.API) => Promise<void>;

		const mockSave = vi
			.fn()
			.mockResolvedValueOnce({ blocks: blocksA }) // first emitValue call
			.mockResolvedValueOnce({ blocks: blocksB }) // second emitValue call
			.mockResolvedValue({ blocks: blocksB }); // watcher's save() call — editor still has blocksB

		const mockRender = vi.fn().mockResolvedValue(undefined);

		const mockInstance = {
			isReady: new Promise<void>((r) => (resolveReady = r)),
			render: mockRender,
			clear: vi.fn(),
			destroy: vi.fn(),
			focus: vi.fn(),
			on: vi.fn(),
			saver: { save: mockSave },
			readOnly: { toggle: vi.fn(), isEnabled: false },
		};

		vi.mocked(EditorJS).mockImplementation((config) => {
			if (config && typeof config !== 'string') {
				onChange = config.onChange as unknown as typeof onChange;
			}

			return mockInstance as unknown as EditorJS;
		});

		const wrapper = mount(InputBlockEditor, {
			props: { value: null },
			global: {
				directives: { 'prevent-focusout': {} },
				stubs: { VDrawer: true, VUpload: true },
			},
		});

		resolveReady();

		// First edit: editor content becomes blocksA, haveValuesChanged = true
		await onChange(mockInstance as unknown as EditorJS.API);

		// Second edit before server responds: editor content becomes blocksB, haveValuesChanged still true
		await onChange(mockInstance as unknown as EditorJS.API);

		// Server responds to first edit with blocksA — absorbed by haveValuesChanged, resets to false
		await wrapper.setProps({ value: { blocks: blocksA } });

		// Server responds to second edit with blocksB.
		await wrapper.setProps({ value: { blocks: blocksB } });

		// render should never have been called
		expect(mockRender).not.toHaveBeenCalled();

		wrapper.unmount();
	});

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
				}) as unknown as EditorJS,
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
});
