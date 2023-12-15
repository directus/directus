<script setup lang="ts">
import api from '@/api';
import VChip from '@/components/v-chip.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { APP_OR_HYBRID_EXTENSION_TYPES, type ApiOutput, type ExtensionType } from '@directus/extensions';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { iconMap } from '../constants/icons';
import ExtensionItemOptions from './extension-item-options.vue';

const props = defineProps<{
	extension: ApiOutput;
	children: ApiOutput[];
}>();

const emit = defineEmits<{ refresh: [extensionType?: ExtensionType] }>();

const { t } = useI18n();

const devMode = import.meta.env.DEV;

const type = computed(() => props.extension.schema?.type);
const icon = computed(() => (type.value ? iconMap[type.value] : 'warning'));
const changingEnabledState = ref(false);

const isAppExtension = computed(() => {
	if (!props.extension.schema?.type) return false;
	return (APP_OR_HYBRID_EXTENSION_TYPES as readonly string[]).includes(props.extension.schema.type);
});

const toggleEnabled = async (extensionType?: ExtensionType) => {
	if (changingEnabledState.value === true) return;

	changingEnabledState.value = true;

	try {
		const endpoint = props.extension.bundle
			? `/extensions/${props.extension.bundle}/${props.extension.name}`
			: `/extensions/${props.extension.name}`;

		await api.patch(endpoint, { meta: { enabled: !props.extension.meta.enabled } });
	} finally {
		changingEnabledState.value = false;
		emit('refresh', extensionType);
	}
};
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
		<template v-else-if="extension.schema?.type !== 'bundle'">
			<v-chip v-if="devMode && isAppExtension" v-tooltip.top="t('enabled_dev_tooltip')" class="state enabled" small>
				{{ t('enabled') }}
				<v-icon name="lock" right small />
			</v-chip>
			<v-chip v-else class="state" :class="{ enabled: extension.meta.enabled }" small>
				{{ extension.meta.enabled ? t('enabled') : t('disabled') }}
			</v-chip>
			<extension-item-options
				v-if="!devMode || !isAppExtension"
				class="options"
				:name="extension.name"
				:enabled="extension.meta.enabled"
				@toggle-enabled="toggleEnabled(extension.schema?.type)"
			/>
		</template>
	</v-list-item>

	<v-list v-if="children" class="nested">
		<extension-item
			v-for="item in children"
			:key="item.bundle + '__' + item.name"
			:extension="item"
			:children="[]"
			@refresh="$emit('refresh', item.schema?.type)"
		/>
	</v-list>
</template>

<style lang="scss" scoped>
.monospace {
	font-family: var(--theme--fonts--monospace--font-family);
}

.nested {
	margin-left: 20px;
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
}
</style>
