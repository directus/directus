import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckFieldAccessData } from '../types';
import EditingLayer from './editing-layer.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

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

vi.mock('../utils/same-origin', () => ({
	sameOrigin: () => true,
}));

const FRAME_SRC = 'https://example.com';

let postMessageSpy: ReturnType<typeof vi.fn>;
let mockFrameEl: HTMLIFrameElement;
let mountOptions: GlobalMountOptions;

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

function mountLayer(version: { key: string; name: string } | null = null) {
	return mount(EditingLayer, {
		global: mountOptions,
		props: { frameSrc: FRAME_SRC, frameEl: mockFrameEl, version },
	});
}

function setupCollection(meta: Record<string, unknown> = {}) {
	vi.mocked(useCollectionsStore().getCollection).mockReturnValue({
		collection: 'articles',
		meta: { versioning: false, ...meta },
	} as any);
}

function setupPermission(fields: string[] | null = null, access = 'full') {
	vi.mocked(usePermissionsStore().getPermission).mockReturnValue({ access, fields } as any);
}

function setupNonAdmin() {
	(useUserStore() as any).isAdmin = false;
}

describe('checkFieldAccess', () => {
	it.each([null, ''])('filters out elements with item=%j', (item) => {
		mountLayer();
		sendCheckFieldAccess(createElements({ item }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements with unknown collection', () => {
		mountLayer();
		vi.mocked(useCollectionsStore().getCollection).mockReturnValue(null);

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when version is set but collection has no versioning', () => {
		mountLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: false });

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('allows elements when version is set and collection has versioning', () => {
		mountLayer({ key: 'draft', name: 'Draft' });
		setupCollection({ versioning: true });
		(useUserStore() as any).isAdmin = true;

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows all elements for admin users', () => {
		mountLayer();
		setupCollection();
		(useUserStore() as any).isAdmin = true;

		sendCheckFieldAccess(createElements({ key: 'a' }, { key: 'b' }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['a', 'b'] }, FRAME_SRC);
	});

	it('filters out elements when no permission exists', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when permission access is none', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(null, 'none');

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('filters out elements when none of the fields are permitted', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['body', 'status']);

		sendCheckFieldAccess(createElements({ fields: ['title', 'slug'] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: [] }, FRAME_SRC);
	});

	it('allows elements when at least one field is permitted', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['title', 'status']);

		sendCheckFieldAccess(createElements({ fields: ['title', 'slug'] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when permission has wildcard fields', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['*']);

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when element declares no specific fields', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(['title']);

		sendCheckFieldAccess(createElements({ fields: [] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when permission has no field restrictions', () => {
		mountLayer();
		setupCollection();
		setupNonAdmin();
		setupPermission(null);

		sendCheckFieldAccess(createElements({ fields: ['title'] }));

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});

	it('allows elements when no version is set on a versioned collection', () => {
		mountLayer();
		setupCollection({ versioning: true });
		(useUserStore() as any).isAdmin = true;

		sendCheckFieldAccess(createElements());

		expect(postMessageSpy).toHaveBeenCalledWith({ action: 'activateElements', data: ['el-0'] }, FRAME_SRC);
	});
});
