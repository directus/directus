<script setup lang="ts">
import VChip from '@/components/v-chip.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useExtensionsStore } from '@/stores/extensions';
import { unexpectedError } from '@/utils/unexpected-error';
import { ApiOutput } from '@directus/extensions';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

const type = computed(() => props.extension.schema?.type ?? 'missing');
const icon = computed(() => extensionTypeIconMap[type.value]);

const version = computed(() => {
	if (!props.extension.schema || !('version' in props.extension.schema) || !props.extension.schema.version) return null;

	return props.extension.schema.version;
});

const disabled = computed(() => {
	if (type.value === 'missing') return true;

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
</script>

<template>
	<v-list-item block>
		<v-list-item-icon v-tooltip="t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content>
			<span class="name" :class="{ disabled }">
				<router-link
					v-if="extension.meta.source === 'registry' && !extension.bundle"
					v-tooltip="t('open_in_marketplace')"
					class="marketplace-link"
					:to="`/settings/marketplace/extension/${extension.id}`"
				>
					{{ extension.schema?.name ?? extension.meta.folder }}
				</router-link>
				<span v-else>{{ extension.schema?.name ?? extension.meta.folder }}</span>
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
			:children
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
.name {
	font-family: var(--theme--fonts--monospace--font-family);

	&.disabled {
		color: var(--theme--foreground-subdued);
	}

	.marketplace-link {
		&:hover {
			text-decoration: underline;
		}
	}
}

.version {
	margin-right: 8px;
}

.spinner {
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

.options {
	margin-left: 12px;
}

.nested {
	margin-left: 20px;

	&:not(.partial) .options {
		display: none;
	}
}
</style>
