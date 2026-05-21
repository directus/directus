import type { CheckFieldAccessData } from '@directus/visual-editing/types';
import { createTestingPinia } from '@pinia/testing';
import type { Relation } from '@directus/types';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditingLayer from './editing-layer.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import api from '@/api';
import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { usePermissionsStore } from '@/stores/permissions';
import { useRelationsStore } from '@/stores/relations';
import { useUserStore } from '@/stores/user';
import { ensureVersionId } from '@/utils/ensure-version-id';

vi.mock('@directus/composables', () => ({
	useCollection: () => ({
		info: { value: null },
		primaryKeyField: { value: { field: 'id' } },
		fields: { value: [] },
	}),
}));

vi.mock('@/ai/composables/use-context-staging', () => ({
	useContextStaging: () => ({ stageVisualElement: vi.fn() }),
}));

vi.mock('@/ai/stores/use-ai', () => ({
	useAiStore: () => ({
		onVisualElementHighlight: vi.fn(() => ({ off: vi.fn() })),
	}),
}));

vi.mock('@/ai/stores/use-ai-context', () => ({
	useAiContextStore: () => ({
		syncVisualElementContextUrl: vi.fn(),
		clearVisualElementContext: vi.fn(),
	}),
}));

vi.mock('@/ai/stores/use-ai-tools', () => ({
	useAiToolsStore: () => ({
		onSystemToolResult: vi.fn(() => ({ off: vi.fn() })),
	}),
}));

vi.mock('@/api', () => ({
	default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock('@/utils/ensure-version-id', () => ({
	ensureVersionId: vi.fn(),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

vi.mock('@directus/utils/browser', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/utils/browser')>()),
	sameOrigin: () => true,
}));

const FRAME_SRC = 'https://example.com';

let postMessageSpy: ReturnType<typeof vi.fn>;
let mockFrameEl: HTMLIFrameElement;
let mountOptions: GlobalMountOptions;

enableAutoUnmount(afterEach);

function sendCheckFieldAccess(elements: CheckFieldAccessData[]) {
	window.dispatchEvent(
		new MessageEvent('message', {
			origin: FRAME_SRC,
			data: { action: 'checkFieldAccess', data: elements },
		}),
	);
}

function createElements(...overrides: Partial<CheckFieldAccessData>[]): CheckFieldAccessData[] {
	if (overrides.length === 0) overrides = [{}];

	return overrides.map((o, i) => ({
		key: `el-${i}`,
		collection: 'articles',
		item: '1',
		fields: ['title'],
		...o,
	}));
}

beforeEach(() => {
	vi.mocked(api.get).mockReset();
	vi.mocked(api.post).mockReset();
	vi.mocked(api.patch).mockReset();
	vi.mocked(ensureVersionId).mockReset();

	postMessageSpy = vi.fn();

	mockFrameEl = {
		contentWindow: { postMessage: postMessageSpy },
	} as unknown as HTMLIFrameElement;

	const pinia = createTestingPinia({
		createSpy: vi.fn,
		initialState: {
			settingsStore: { settings: {} },
			serverStore: { info: { ai_enabled: false } },
		},
	});

	setActivePinia(pinia);

	mountOptions = {
		plugins: [i18n, pinia],
		directives: { tooltip: Tooltip },
		stubs: {
			OverlayItem: true,
			VButton: true,
			VIcon: true,
		},
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

function mountEditingLayer(version: { key: string; name: string } | null = null, props: Record<string, unknown> = {}) {
	return mount(EditingLayer, {
		global: mountOptions,
		props: { frameSrc: FRAME_SRC, frameEl: mockFrameEl, version, ...props },
	});
}

function setupCollection(meta: Record<string, unknown> = {}) {
	vi.mocked(useCollectionsStore().getCollection).mockReturnValue({
		collection: 'articles',
		meta: { versioning: false, ...meta },
	} as any);
}

function setupCollections(versioningByCollection: Record<string, boolean>) {
	vi.mocked(useCollectionsStore().getCollection).mockImplementation(
		(collection) =>
			({
				collection,
				meta: { versioning: versioningByCollection[collection] ?? false },
			}) as any,
	);
}

function setupPermission(fields: string[] | null = null, access = 'full') {
	vi.mocked(usePermissionsStore().getPermission).mockReturnValue({ access, fields } as any);
}

function setupVersionPermissions({ read = false, create = false, update = false }) {
	vi.mocked(usePermissionsStore().hasPermission).mockImplementation((collection, action) => {
		if (collection !== 'directus_versions') return false;
		if (action === 'read') return read;
		if (action === 'create') return create;
		if (action === 'update') return update;
		return false;
	});
}

function setupNonAdmin() {
	(useUserStore() as any).isAdmin = false;
}

function setupParentVersionSaveSchema() {
	useCollectionsStore().collections = [
		collection('pages', true),
		collection('pages_blocks', false),
		collection('block_hero', false),
	];

	setupCollections({ pages: true, pages_blocks: false, block_hero: false });
	vi.mocked(useFieldsStore().getPrimaryKeyFieldForCollection).mockReturnValue({ field: 'id' } as any);

	useRelationsStore().relations = [
		relation('pages_blocks', 'pages_id', 'pages', { oneField: 'blocks', junctionField: 'item' }),
		relation('pages_blocks', 'item', null, {
			oneCollectionField: 'collection',
			oneAllowedCollections: ['block_hero'],
		}),
	];
}

function collection(collection: string, versioning: boolean) {
	return {
		collection,
		name: collection,
		type: 'table',
		meta: { versioning },
		schema: {},
	} as any;
}

function relation(
	collection: string,
	field: string,
	relatedCollection: string | null,
	options: {
		oneField?: string | null;
		junctionField?: string | null;
		oneCollectionField?: string | null;
		oneAllowedCollections?: string[] | null;
	} = {},
): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: {
			id: 1,
			many_collection: collection,
			many_field: field,
			one_collection: relatedCollection,
			one_field: options.oneField ?? null,
			one_collection_field: options.oneCollectionField ?? null,
			one_allowed_collections: options.oneAllowedCollections ?? null,
			one_deselect_action: 'nullify',
			junction_field: options.junctionField ?? null,
			sort_field: null,
		},
	};
}

function sendEdit() {
	window.dispatchEvent(
		new MessageEvent('message', {
			origin: FRAME_SRC,
			data: {
				action: 'edit',
				data: {
					key: 'visual-key',
					editConfig: {
						collection: 'block_hero',
						item: 9,
						fields: ['title'],
						mode: 'drawer',
					},
					rect: { top: 0, left: 0, width: 100, height: 40 },
				},
			},
		}),
	);
}

describe('checkFieldAccess', () => {
	it.each([null, ''])('filters out elements with item=%j', (item) => {
		mountEditingLayer();
		sendCheckFieldAccess(createElements({ item }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements with unknown collection', () => {
		mountEditingLayer();
		vi.mocked(useCollectionsStore().getCollection).mockReturnValue(null);

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when version is set but collection has no versioning', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: false });

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('allows non-versioned child elements when version is set and parent scope is versioned', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' }, { parentScope: { collection: 'pages', key: '1' } });

		setupCollections({ pages: true, blocks: false });
		setupNonAdmin();
		setupPermission(['*']);
		setupVersionPermissions({ read: true, update: true });

		sendCheckFieldAccess(createElements({ collection: 'blocks' }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when version is set and collection has versioning', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: true });
		(useUserStore() as any).isAdmin = true;

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows all elements for admin users', () => {
		mountEditingLayer();
		setupCollection();
		(useUserStore() as any).isAdmin = true;

		sendCheckFieldAccess(createElements({ key: 'a' }, { key: 'b' }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['a', 'b'] }, FRAME_SRC);
	});

	it('filters out elements when no permission exists', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when permission access is none', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(null, 'none');

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when none of the fields are permitted', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['body', 'status']);

		sendCheckFieldAccess(createElements({ fields: ['title', 'slug'] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('allows elements when at least one field is permitted', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['title', 'status']);

		sendCheckFieldAccess(createElements({ fields: ['title', 'slug'] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when permission has wildcard fields', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['*']);

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when element declares no specific fields', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['title']);

		sendCheckFieldAccess(createElements({ fields: [] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when permission has no field restrictions', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(null);

		sendCheckFieldAccess(createElements({ fields: ['title'] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when no version is set on a versioned collection', () => {
		mountEditingLayer();
		setupCollection({ versioning: true });
		(useUserStore() as any).isAdmin = true;

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('filters out elements when version is set but user has no directus_versions permissions', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: true });
		setupNonAdmin();
		setupPermission(['*']);

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when user has only read on directus_versions', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: true });
		setupNonAdmin();
		setupVersionPermissions({ read: true });

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('allows elements when user has read + create on directus_versions', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: true });
		setupNonAdmin();
		setupPermission(['*']);
		setupVersionPermissions({ read: true, create: true });

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when user has read + update on directus_versions', () => {
		mountEditingLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: true });
		setupNonAdmin();
		setupPermission(['*']);
		setupVersionPermissions({ read: true, update: true });

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('skips version permission check when no version is set', () => {
		mountEditingLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['*']);

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});
});

describe('save', () => {
	it('hydrates the overlay from the parent version before opening', async () => {
		setupParentVersionSaveSchema();
		vi.mocked(ensureVersionId).mockResolvedValue('version-id');
		vi.mocked(api.get).mockResolvedValue({
			data: {
				data: {
					blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Draft title' } }],
				},
			},
		});

		const wrapper = mountEditingLayer(
			{ key: 'draft', name: 'Draft' },
			{ parentScope: { collection: 'pages', key: 'page-id' } },
		);

		sendEdit();

		await vi.waitFor(() => {
			expect(wrapper.findComponent({ name: 'OverlayItem' }).props('initialValues')).toEqual({
				id: 9,
				title: 'Draft title',
			});
		});

		expect(wrapper.findComponent({ name: 'OverlayItem' }).props('active')).toBe(true);

		expect(api.get).toHaveBeenCalledWith('/items/pages/page-id', {
			params: {
				fields: ['blocks.id', 'blocks.collection', 'blocks.item.*'],
				version: 'draft',
			},
		});
	});

	it('ensures the parent version before reading the parent version', async () => {
		setupParentVersionSaveSchema();
		vi.mocked(ensureVersionId).mockResolvedValue('version-id');
		vi.mocked(api.get).mockResolvedValue({
			data: {
				data: {
					blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Old' } }],
				},
			},
		});
		vi.mocked(api.post).mockResolvedValue({ data: { data: {} } });

		const wrapper = mountEditingLayer(
			{ key: 'draft', name: 'Draft' },
			{ parentScope: { collection: 'pages', key: 'page-id' } },
		);

		sendEdit();

		await vi.waitFor(() => expect(wrapper.findComponent({ name: 'OverlayItem' }).props('active')).toBe(true));

		wrapper.findComponent({ name: 'OverlayItem' }).vm.$emit('input', { title: 'New' });

		await vi.waitFor(() => expect(api.post).toHaveBeenCalled());

		expect(ensureVersionId).toHaveBeenNthCalledWith(1, api, {
			collection: 'pages',
			item: 'page-id',
			versionKey: 'draft',
		});

		expect(ensureVersionId).toHaveBeenNthCalledWith(2, api, {
			collection: 'pages',
			item: 'page-id',
			versionKey: 'draft',
		});

		expect(ensureVersionId).toHaveBeenNthCalledWith(3, api, {
			collection: 'pages',
			item: 'page-id',
			versionKey: 'draft',
		});

		expect(vi.mocked(ensureVersionId).mock.invocationCallOrder[0]!).toBeLessThan(
			vi.mocked(api.get).mock.invocationCallOrder[0]!,
		);

		expect(api.get).toHaveBeenCalledWith('/items/pages/page-id', {
			params: {
				fields: ['blocks.id', 'blocks.collection', 'blocks.item.*'],
				version: 'draft',
			},
		});

		expect(api.post).toHaveBeenCalledWith('/versions/version-id/save', {
			blocks: {
				create: [],
				update: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'New' } }],
				delete: [],
			},
		});
	});

	it('does not retry a failed save when saving finishes', async () => {
		setupParentVersionSaveSchema();
		vi.mocked(ensureVersionId).mockResolvedValue('version-id');
		vi.mocked(api.get)
			.mockResolvedValueOnce({
				data: {
					data: {
						blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Old' } }],
					},
				},
			})
			.mockRejectedValueOnce(new Error('Forbidden'));

		const wrapper = mountEditingLayer(
			{ key: 'draft', name: 'Draft' },
			{ parentScope: { collection: 'pages', key: 'page-id' } },
		);

		sendEdit();

		await vi.waitFor(() => expect(wrapper.findComponent({ name: 'OverlayItem' }).props('active')).toBe(true));

		wrapper.findComponent({ name: 'OverlayItem' }).vm.$emit('input', { title: 'New' });

		await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
		await flushPromises();
		await flushPromises();

		expect(api.get).toHaveBeenCalledTimes(2);
		expect(api.post).not.toHaveBeenCalled();
	});
});
