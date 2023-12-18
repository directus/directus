<script setup lang="ts">
import { ExtensionType } from '@directus/extensions';
import { pluralize } from '@directus/utils';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { iconMap } from '../constants/icons';

const props = defineProps<{
	type: ExtensionType;
}>();

const { t } = useI18n();

const label = computed(() => t(`extension_${pluralize(props.type)}`));

const icon = computed(() => iconMap[props.type]);
</script>

<template>
	<v-divider class="divider" large :inline-title="false">
		<template #icon><v-icon :name="icon" /></template>
		{{ label }}
	</v-divider>
</template>

<style scoped lang="scss">
.divider {
	--v-divider-color: var(--theme--border-color-subdued);
}
</style>
