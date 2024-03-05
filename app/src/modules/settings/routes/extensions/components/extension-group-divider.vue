<script setup lang="ts">
import { extensionTypeIconMap } from '@/constants/extension-type-icon-map';
import { ExtensionType } from '@directus/extensions';
import { pluralize } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	type: ExtensionType | 'missing';
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
