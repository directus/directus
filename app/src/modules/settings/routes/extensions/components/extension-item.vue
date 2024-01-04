<script setup lang="ts">
import api from '@/api';
import VChip from '@/components/v-chip.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { APP_OR_HYBRID_EXTENSION_TYPES, type ApiOutput, type ExtensionType } from '@directus/extensions';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { iconMap } from '../constants/icons';
import ExtensionItemOptions from './extension-item-options.vue';
import { ExtensionStatus } from '../types';

const props = withDefaults(
	defineProps<{
		extension: ApiOutput;
		children?: ApiOutput[];
	}>(),
	{
		children: () => [],
	},
);

const emit = defineEmits<{ refresh: [data: { extension: ApiOutput; children: ApiOutput[] }] }>();

const { t } = useI18n();

const devMode = import.meta.env.DEV;

const changingEnabledState = ref(false);

const type = computed(() => props.extension.schema?.type);
const icon = computed(() => (type.value ? iconMap[type.value] : 'warning'));
const isLocked = computed(() => devMode && isOrHasAppExtension.value);

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
	if (type.value === 'bundle') {
		return props.children.some((e) => isAppExtension(e.schema?.type));
	}

	return isAppExtension(type.value);
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

async function toggleExtensionStatus(enabled: boolean) {
	if (changingEnabledState.value === true) return;

	changingEnabledState.value = true;

	try {
		const endpoint = props.extension.bundle
			? `/extensions/${props.extension.bundle}/${props.extension.name}`
			: `/extensions/${props.extension.name}`;

		await api.patch(endpoint, { meta: { enabled: !enabled } });
	} finally {
		changingEnabledState.value = false;
		emit('refresh', { extension: props.extension, children: props.children });
	}
}
</script>

<template>
	<v-list-item block :class="{ disabled: devMode ? false : !extension.meta.enabled }">
		<v-list-item-icon v-tooltip="t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content>
			<span class="monospace">
				{{ extension.name }}
				<v-chip v-if="extension.schema?.version" class="version" small>{{ extension.schema.version }}</v-chip>
			</span>
		</v-list-item-content>

		<v-progress-circular v-if="changingEnabledState" indeterminate />
		<v-chip v-if="isLocked" v-tooltip.top="t('enabled_dev_tooltip')" class="state" :class="state.status" small>
			{{ state.text }}
			<v-icon name="lock" right small />
		</v-chip>
		<v-chip v-else class="state" :class="state.status" small>
			{{ state.text }}
		</v-chip>
		<extension-item-options
			v-if="!isLocked"
			class="options"
			:type="type"
			:status="state.status"
			@toggle-status="toggleExtensionStatus"
		/>
	</v-list-item>

	<v-list v-if="children.length > 0" class="nested" :class="{ partial: isPartialEnabled }">
		<extension-item
			v-for="item in children"
			:key="item.bundle + '__' + item.name"
			:extension="item"
			@refresh="$emit('refresh', $event)"
		/>
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
</style>
