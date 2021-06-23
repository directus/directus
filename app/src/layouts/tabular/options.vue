<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.tabular.spacing') }}</div>
		<v-select
			v-model="tableSpacing"
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
			v-model="activeFields"
			item-key="field"
			handle=".drag-handle"
			:set-data="hideDragImage"
			:force-fallback="true"
		>
			<template #item="{ element }">
				<v-checkbox v-model="fields" :value="element.field" :label="element.name">
					<template #append>
						<div class="spacer" />
						<v-icon @click.stop name="drag_handle" class="drag-handle" />
					</template>
				</v-checkbox>
			</template>
		</draggable>

		<v-checkbox
			v-for="field in availableFields.filter((field) => fields.includes(field.field) === false)"
			v-model="fields"
			:key="field.field"
			:value="field.field"
			:label="field.name"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import Draggable from 'vuedraggable';
import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	components: { Draggable },
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { tableSpacing, activeFields, hideDragImage, fields, availableFields } = toRefs(layoutState.value);

		return { t, tableSpacing, activeFields, hideDragImage, fields, availableFields };
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
