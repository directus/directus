<script setup lang="ts">
import { pluralize } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { extensionTypeIconMap } from '../constants';
import { ExtensionType } from '../types';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	type: ExtensionType;
}>();

const { t } = useI18n();

const label = computed(() => t(`extension_${props.type !== 'missing' ? pluralize(props.type) : props.type}`));

const icon = computed(() => extensionTypeIconMap[props.type]);
</script>

<template>
	<VDivider class="divider" large :inline-title="false">
		<template #icon><VIcon :name="icon" /></template>
		{{ label }}
	</VDivider>
</template>

<style scoped lang="scss">
.divider {
	--v-divider-color: var(--theme--border-color-subdued);
}
</style>
