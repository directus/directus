import { VERSION_KEY_DRAFT } from '@directus/constants';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useVersionGate } from './use-version-gate';
import { useCollectionsStore } from '@/stores/collections';
import { notify } from '@/utils/notify';

vi.mock('vue-i18n', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-i18n')>();

	return {
		...actual,
		useI18n: () => ({
			t: (key: string) => {
				return key;
			},
		}),
	};
});

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

describe('useVersionGate', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
			}),
		);

		vi.spyOn(window, 'confirm').mockReturnValue(true);
		vi.clearAllMocks();
	});

	test('allows edits when a version is already active', () => {
		const collectionsStore = useCollectionsStore();
		collectionsStore.collections = [collection('articles', true)];

		const gate = createGate({ currentVersion: { key: 'draft', name: 'Draft' } });

		expect(gate.check('articles')).toStrictEqual({ allowed: true });
	});

	test('redirects versioned collection edits to draft from published', () => {
		const collectionsStore = useCollectionsStore();
		collectionsStore.collections = [collection('articles', true)];

		const gate = createGate();

		expect(gate.check('articles')).toStrictEqual({
			allowed: false,
			redirect: { versionKey: VERSION_KEY_DRAFT, reason: 'collection-versioned' },
		});
	});

	test('redirects child edits when the parent collection is versioned', () => {
		const collectionsStore = useCollectionsStore();
		collectionsStore.collections = [collection('articles', true), collection('blocks', false)];

		const gate = createGate({
			parentScope: { collection: 'articles', key: 1 },
		});

		expect(gate.check('blocks')).toStrictEqual({
			allowed: false,
			redirect: { versionKey: VERSION_KEY_DRAFT, reason: 'parent-versioned' },
		});
	});

	test('switches to the requested version and notifies', async () => {
		const switchTo = vi.fn();
		const gate = createGate({ switchTo });
		const decision = {
			allowed: false,
			redirect: { versionKey: VERSION_KEY_DRAFT, reason: 'collection-versioned' },
		} as const;

		await expect(gate.requestSwitch(decision)).resolves.toBe('switched');
		expect(switchTo).toHaveBeenCalledWith(VERSION_KEY_DRAFT);
		expect(notify).toHaveBeenCalledWith({
			title: 'version_switch_required_title',
			text: 'version_switch_required_text',
			alwaysShowText: true,
		});
	});

	test('cancels when unsaved edits are not discarded', async () => {
		vi.mocked(window.confirm).mockReturnValue(false);

		const switchTo = vi.fn();
		const gate = createGate({ hasUnsavedEdits: true, switchTo });
		const decision = {
			allowed: false,
			redirect: { versionKey: VERSION_KEY_DRAFT, reason: 'collection-versioned' },
		} as const;

		await expect(gate.requestSwitch(decision)).resolves.toBe('cancelled');
		expect(switchTo).not.toHaveBeenCalled();
		expect(notify).not.toHaveBeenCalled();
	});
});

function createGate(
	options: {
		currentVersion?: { key: string; name: string } | null;
		parentScope?: { collection: string; key: string | number } | null;
		hasUnsavedEdits?: boolean;
		switchTo?: (versionKey: string) => Promise<void> | void;
	} = {},
) {
	return useVersionGate({
		currentVersion: ref(options.currentVersion ?? null),
		parentScope: ref(options.parentScope ?? null),
		hasUnsavedEdits: ref(options.hasUnsavedEdits ?? false),
		switchTo: async (versionKey) => {
			await options.switchTo?.(versionKey);
		},
	});
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
