<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.tabular.spacing') }}</div>
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

	<div class="field">
		<div class="type-label">{{ t('layouts.tabular.fields') }}</div>
		<draggable
			v-model="activeFieldsWritable"
			item-key="field"
			handle=".drag-handle"
			:set-data="hideDragImage"
			:force-fallback="true"
		>
			<template #item="{ element }">
				<v-checkbox v-model="fieldsWritable" :value="element.field" :label="element.name">
					<template #append>
						<div class="spacer" />
						<v-icon name="drag_handle" class="drag-handle" @click.stop />
					</template>
				</v-checkbox>
			</template>
		</draggable>

		<v-checkbox
			v-for="field in availableFields.filter((field) => fields.includes(field.field) === false)"
			:key="field.field"
			v-model="fieldsWritable"
			:value="field.field"
			:label="field.name"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';

import Draggable from 'vuedraggable';
import { useSync } from '@directus/shared/composables';
import { Field } from '@directus/shared/types';

export default defineComponent({
	components: { Draggable },
	inheritAttrs: false,
	props: {
		fields: {
			type: Array as PropType<string[]>,
			required: true,
		},
		activeFields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		tableSpacing: {
			type: String as PropType<'compact' | 'cozy' | 'comfortable'>,
			required: true,
		},
		hideDragImage: {
			type: Function as PropType<(dataTransfer: DataTransfer) => void>,
			required: true,
		},
		availableFields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
	},
	emits: ['update:tableSpacing', 'update:activeFields', 'update:fields'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsWritable = useSync(props, 'fields', emit);
		const activeFieldsWritable = useSync(props, 'activeFields', emit);
		const tableSpacingWritable = useSync(props, 'tableSpacing', emit);

		return { t, fieldsWritable, activeFieldsWritable, tableSpacingWritable };
	},
});
</script>

<style lang="scss" scoped>
.v-checkbox {
	width: 100%;

	.spacer {
		flex-grow: 1;
	}
}

.drag-handle {
	--v-icon-color: var(--foreground-subdued);

	cursor: ns-resize;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}
</style>
