<script setup lang="ts">
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useExtensionsStore } from '@/stores/extensions';
import { unexpectedError } from '@/utils/unexpected-error';
import { APP_OR_HYBRID_EXTENSION_TYPES } from '@directus/constants';
import { ApiOutput, ExtensionType } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { extensionTypeIconMap } from '../constants';
import { ExtensionState } from '../types';
import ExtensionItemOptions from './extension-item-options.vue';

const props = withDefaults(
	defineProps<{
		extension: ApiOutput;
		children?: ApiOutput[];
	}>(),
	{
		children: () => [],
	},
);

const { t } = useI18n();
const extensionsStore = useExtensionsStore();

const loading = ref(false);

const name = computed(() => props.extension.schema?.name ?? props.extension.meta.folder);
const type = computed(() => props.extension.schema?.type ?? 'missing');
const icon = computed(() => extensionTypeIconMap[type.value]);

const version = computed(() => {
	if (!props.extension.schema || !('version' in props.extension.schema) || !props.extension.schema.version) return null;

	return props.extension.schema.version;
});

const stateLocked = computed(() => {
	if (!import.meta.env.DEV) return false;

	if (props.extension.schema?.type === 'bundle')
		return props.children.some((extension) => isAppExtension(extension.schema?.type));

	return isAppExtension(props.extension.schema?.type);
});

const disabled = computed(() => {
	if (type.value === 'missing') return true;
	if (stateLocked.value) return false;

	return !props.extension.meta.enabled;
});

const isPartialAllowed = computed(() => {
	if (props.extension.schema?.type !== 'bundle') return false;

	return props.extension.schema.partial !== false;
});

const isPartiallyEnabled = computed(() => {
	if (props.extension.schema?.type !== 'bundle') return false;

	const enabledExtensionCount = props.children.filter((extension) => extension.meta.enabled);
	return enabledExtensionCount.length !== 0 && enabledExtensionCount.length !== props.children.length;
});

const state = computed<{ text: string; value: ExtensionState }>(() => {
	if (type.value === 'bundle' && isPartiallyEnabled.value) return { text: t('partially_enabled'), value: 'partial' };

	if (props.extension.meta.enabled) return { text: t('enabled'), value: 'enabled' };

	return { text: t('disabled'), value: 'disabled' };
});

const requestHandler = (requestCallback: () => Promise<any>) => async () => {
	loading.value = true;

	try {
		await requestCallback();
	} catch (err) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
};

const toggleState = requestHandler(() => extensionsStore.toggleState(props.extension.id));
const uninstall = requestHandler(() => extensionsStore.uninstall(props.extension.id));
const reinstall = requestHandler(() => extensionsStore.reinstall(props.extension.id));
const remove = requestHandler(() => extensionsStore.remove(props.extension.id));

function isAppExtension(type?: ExtensionType) {
	if (!type) return false;
	return (APP_OR_HYBRID_EXTENSION_TYPES as readonly string[]).includes(type);
}
</script>

<template>
	<v-list-item block>
		<v-list-item-icon v-tooltip="$t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content>
			<span class="meta" :class="{ disabled }">
				<router-link
					v-if="extension.meta.source === 'registry' && !extension.bundle"
					v-tooltip="$t('open_in_marketplace')"
					class="marketplace-link"
					:to="`/settings/marketplace/extension/${extension.id}`"
				>
					{{ name }}
				</router-link>
				<span v-else>{{ name }}</span>
				{{ ' ' }}
				<v-chip v-if="version" class="version" small>
					{{ version }}
				</v-chip>
			</span>
		</v-list-item-content>

		<span v-if="loading" class="spinner">
			<v-progress-circular indeterminate small />
		</span>

		<v-chip v-if="type !== 'missing'" class="state" :class="state.value" small>
			{{ state.text }}
		</v-chip>

		<extension-item-options
			class="options"
			:extension
			:type
			:state="state.value"
			:state-locked
			@toggle-state="toggleState"
			@uninstall="uninstall"
			@reinstall="reinstall"
			@remove="remove"
		/>
	</v-list-item>

	<v-list v-if="children.length > 0" class="nested" :class="{ partial: isPartialAllowed }">
		<extension-item v-for="item in children" :key="item.id" :extension="item" />
	</v-list>
</template>

<style lang="scss" scoped>
.meta {
	font-family: var(--theme--fonts--monospace--font-family);

	.marketplace-link {
		&:hover {
			text-decoration: underline;
		}
	}

	.version {
		margin-inline-end: 8px;
	}

	&.disabled {
		color: var(--theme--foreground-subdued);

		--v-chip-color: var(--theme--foreground-subdued);
	}
}

.spinner {
	margin-inline-end: 8px;
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

.options {
	margin-inline-start: 12px;
}

.nested {
	margin-inline-start: 20px;

	&:not(.partial) .options {
		display: none;
	}
}
</style>
