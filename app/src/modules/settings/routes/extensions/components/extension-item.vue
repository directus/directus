<script setup lang="ts">
import api from '@/api';
import VChip from '@/components/v-chip.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import type { ApiOutput } from '@directus/extensions';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { iconMap } from '../constants/icons';
import ExtensionItemOptions from './extension-item-options.vue';

const { t } = useI18n();

defineOptions({
	name: 'ExtensionItem',
});

const emit = defineEmits(['refresh']);

interface ExtensionItem {
	extension: ApiOutput;
	children: ApiOutput[];
}

const props = defineProps<ExtensionItem>();

const type = computed(() => props.extension.schema?.type);
const icon = computed(() => (type.value ? iconMap[type.value] : 'warning'));
const changingEnabledState = ref(false);

const toggleEnabled = async () => {
	if (changingEnabledState.value === true) return;

	changingEnabledState.value = true;

	try {
		const endpoint = props.extension.bundle
			? `/extensions/${props.extension.bundle}/${props.extension.name}`
			: `/extensions/${props.extension.name}`;

		await api.patch(endpoint, { meta: { enabled: !props.extension.meta.enabled } });
	} finally {
		changingEnabledState.value = false;
		emit('refresh');
	}
};
</script>

<template>
	<v-list-item block :class="{ disabled: !extension.meta.enabled }">
		<v-list-item-icon v-tooltip="t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content class="monospace">{{ extension.name }}</v-list-item-content>

		<template v-if="extension.schema?.type !== 'bundle'">
			<v-progress-circular v-if="changingEnabledState" indeterminate />
			<v-chip v-else small>{{ extension.meta.enabled ? t('enabled') : t('disabled') }}</v-chip>
			<extension-item-options
				class="options"
				:name="extension.name"
				:enabled="extension.meta.enabled"
				@toggle-enabled="toggleEnabled"
			/>
		</template>
	</v-list-item>

	<v-list v-if="children" class="nested">
		<extension-item
			v-for="item in children"
			:key="item.bundle + '__' + item.name"
			:extension="item"
			:children="[]"
			@refresh="$emit('refresh')"
		/>
	</v-list>
</template>

<style lang="scss" scoped>
.monospace {
	--v-list-item-content-font-family: var(--theme--font-family-monospace);
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
</style>
