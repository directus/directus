<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { useSync } from '@directus/composables';
import { Field } from '@directus/types';

export interface Props {
	fields: string[];
	activeFields: Field[];
	tableSpacing: 'compact' | 'cozy' | 'comfortable';
}

const props = defineProps<Props>();

const emit = defineEmits(['update:tableSpacing', 'update:activeFields', 'update:fields']);


const tableSpacingWritable = useSync(props, 'tableSpacing', emit);
</script>

<template>
	<div class="field">
		<div class="type-label">{{ $$t('layouts.tabular.spacing') }}</div>
		<v-select
			v-model="tableSpacingWritable"
			:items="[
				{
					text: t('layouts.tabular.compact'),
					value: 'compact',
				},
				{
					text: t('layouts.tabular.cozy'),
					value: 'cozy',
				},
				{
					text: t('layouts.tabular.comfortable'),
					value: 'comfortable',
				},
			]"
		/>
	</div>
</template>

<style lang="scss" scoped>
.v-checkbox {
	inline-size: 100%;

	.spacer {
		flex-grow: 1;
	}
}

.drag-handle {
	--v-icon-color: var(--theme--foreground-subdued);

	cursor: ns-resize;

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}
</style>
