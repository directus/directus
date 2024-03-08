<script setup lang="ts">
import VChip from '@/components/v-chip.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { extensionTypeIconMap } from '@/constants/extension-type-icon-map';
import { useExtensionsStore } from '@/stores/extensions';
import { unexpectedError } from '@/utils/unexpected-error';
import { APP_OR_HYBRID_EXTENSION_TYPES, type ApiOutput, type ExtensionType } from '@directus/extensions';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionStatus } from '../types';
import ExtensionItemOptions from './extension-item-options.vue';

const props = withDefaults(
	defineProps<{
		extension: ApiOutput;
		children?: ApiOutput[];
		bundleEntry?: boolean;
	}>(),
	{
		children: () => [],
	},
);

const { t } = useI18n();

const extensionsStore = useExtensionsStore();

const devMode = import.meta.env.DEV;

const saving = ref(false);

const type = computed(() => props.extension.schema?.type ?? 'missing');
const icon = computed(() => extensionTypeIconMap[type.value]);

const disabled = computed(() => {
	if (type.value === 'missing') return true;
	if (devMode) return false;

	return !props.extension.meta.enabled;
});

const disableLocked = computed(() => devMode && isOrHasAppExtension.value);
const uninstallLocked = computed(() => props.extension.meta.source !== 'registry');

const isPartialEnabled = computed(() => {
	if (props.extension.schema?.type !== 'bundle') {
		return false;
	}

	return props.extension.schema.partial !== false;
});

const isPartiallyEnabled = computed(() => {
	if (props.extension.schema?.type !== 'bundle') {
		return false;
	}

	const enabledExtensionCount = props.children.filter((e) => e.meta.enabled);
	return enabledExtensionCount.length !== 0 && enabledExtensionCount.length !== props.children.length;
});

const isOrHasAppExtension = computed(() => {
	const type = props.extension.schema?.type;

	if (type === 'bundle') {
		return props.children.some((e) => isAppExtension(e.schema?.type));
	}

	return isAppExtension(type);
});

const state = computed<{ text: string; status: ExtensionStatus }>(() => {
	if (type.value === 'bundle' && isPartiallyEnabled.value) {
		return { text: t('partially_enabled'), status: 'partial' };
	}

	if (props.extension.meta.enabled) {
		return { text: t('enabled'), status: 'enabled' };
	}

	return { text: t('disabled'), status: 'disabled' };
});

function isAppExtension(type?: ExtensionType) {
	if (!type) return false;
	return (APP_OR_HYBRID_EXTENSION_TYPES as readonly string[]).includes(type);
}

const toggleState = async () => {
	saving.value = true;

	try {
		await extensionsStore.toggleState(props.extension.id);
	} catch (err) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
};

const uninstall = async () => {
	saving.value = true;

	try {
		await extensionsStore.uninstall(props.extension.id);
	} catch (err) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<v-list-item block :class="{ disabled }">
		<v-list-item-icon v-tooltip="t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content>
			<span class="monospace">
				<router-link
					v-if="extension.schema?.name && extension.meta.source === 'registry'"
					v-tooltip="t('open_in_marketplace')"
					class="link"
					:to="`/settings/marketplace/extension/${extension.id}`"
				>
					{{ extension.schema?.name }}
				</router-link>
				<span v-else>{{ extension.schema?.name ?? extension.meta.folder }}</span>
				{{ ' ' }}
				<v-chip v-if="extension.schema?.version" class="version" small>{{ extension.schema.version }}</v-chip>
			</span>
		</v-list-item-content>

		<template v-if="type !== 'missing'">
			<span v-if="saving" class="spinner">
				<v-progress-circular indeterminate small />
			</span>

			<v-chip class="state" :class="state.status" small>
				{{ state.text }}
			</v-chip>

			<extension-item-options
				class="options"
				:type="type"
				:status="state.status"
				:disable-locked="disableLocked"
				:uninstall-locked="uninstallLocked"
				:bundle-entry="bundleEntry"
				@toggle-status="toggleState"
				@uninstall="uninstall"
			/>
		</template>
	</v-list-item>

	<v-list v-if="children.length > 0" class="nested" :class="{ partial: isPartialEnabled }">
		<extension-item v-for="item in children" :key="item.id" :extension="item" bundle-entry />
	</v-list>
</template>

<style lang="scss" scoped>
.monospace {
	font-family: var(--theme--fonts--monospace--font-family);
}

.nested {
	margin-left: 20px;

	&:not(.partial) .options {
		display: none;
	}
}

.disabled {
	--v-list-item-color: var(--theme--foreground-subdued);
}

.options {
	margin-left: 12px;
}

.link {
	&:hover {
		text-decoration: underline;
	}
}

.version {
	margin-right: 8px;
}

.state {
	--v-chip-color: var(--theme--danger);
	--v-chip-background-color: var(--theme--danger-background);

	&.enabled {
		--v-chip-color: var(--theme--success);
		--v-chip-background-color: var(--theme--success-background);
	}

	&.partial {
		--v-chip-color: var(--theme--warning);
		--v-chip-background-color: var(--theme--warning-background);
	}
}

.spinner {
	margin-right: 8px;
}
</style>
