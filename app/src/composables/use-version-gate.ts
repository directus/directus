import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { ContentVersion, PrimaryKey } from '@directus/types';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionsStore } from '@/stores/collections';
import { notify } from '@/utils/notify';

export type VersionGateParentScope = {
	collection: string;
	key: PrimaryKey;
};

export type GateDecision =
	| { allowed: true }
	| { allowed: false; redirect: { versionKey: string; reason: 'collection-versioned' | 'parent-versioned' } };

export function useVersionGate(deps: {
	currentVersion: Ref<Pick<ContentVersion, 'key' | 'name'> | null>;
	parentScope: Ref<VersionGateParentScope | null>;
	hasUnsavedEdits: Ref<boolean>;
	switchTo: (versionKey: string) => Promise<void>;
}) {
	const { t } = useI18n();
	const collectionsStore = useCollectionsStore();

	return { check, requestSwitch };

	function check(targetCollection: string): GateDecision {
		if (deps.currentVersion.value !== null) return { allowed: true };

		const target = collectionsStore.getCollection(targetCollection);

		if (target?.meta?.versioning) {
			return {
				allowed: false,
				redirect: { versionKey: VERSION_KEY_DRAFT, reason: 'collection-versioned' },
			};
		}

		const parentScope = deps.parentScope.value;
		if (!parentScope) return { allowed: true };

		const parent = collectionsStore.getCollection(parentScope.collection);

		if (parent?.meta?.versioning) {
			return {
				allowed: false,
				redirect: { versionKey: VERSION_KEY_DRAFT, reason: 'parent-versioned' },
			};
		}

		return { allowed: true };
	}

	async function requestSwitch(decision: GateDecision & { allowed: false }): Promise<'switched' | 'cancelled'> {
		if (deps.hasUnsavedEdits.value) {
			const confirmed = window.confirm(t('switch_version_copy', { version: decision.redirect.versionKey }));
			if (!confirmed) return 'cancelled';
		}

		await deps.switchTo(decision.redirect.versionKey);
		notify({
			title: t('version_switch_required_title', { version: decision.redirect.versionKey }),
			text: t('version_switch_required_text'),
			alwaysShowText: true,
		});

		return 'switched';
	}
}
