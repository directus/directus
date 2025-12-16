<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { pluralize } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { extensionTypeIconMap } from '../constants';
import { ExtensionType } from '../types';

const props = defineProps<{
	type: ExtensionType;
}>();

const { t } = useI18n();

const label = computed(() => t(`extension_${props.type !== 'missing' ? pluralize(props.type) : props.type}`));

const icon = computed(() => extensionTypeIconMap[props.type]);
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
