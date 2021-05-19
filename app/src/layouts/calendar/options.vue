<template>
	<div class="field">
		<div class="type-label">{{ t('display_template') }}</div>
		<v-field-template :collection="props.collection" v-model="template" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.start_date_field') }}</div>
		<v-select show-deselect :items="dateFields" item-text="name" item-value="field" v-model="startDateField" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.end_date_field') }}</div>
		<v-select show-deselect :items="dateFields" item-text="name" item-value="field" v-model="endDateField" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { tableSpacing, activeFields, hideDragImage, fields, availableFields } = toRefs(layoutState.value);

		return { t, tableSpacing, activeFields, hideDragImage, fields, availableFields };
	},
});
</script>
