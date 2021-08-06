<template>
	<div class="field">
		<div class="type-label">{{ t('display_template') }}</div>
		<v-field-template v-model="template" :collection="props.collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.start_date_field') }}</div>
		<v-select v-model="startDateField" show-deselect :items="dateFields" item-text="name" item-value="field" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.end_date_field') }}</div>
		<v-select v-model="endDateField" show-deselect :items="dateFields" item-text="name" item-value="field" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { props, template, dateFields, startDateField, endDateField } = toRefs(layoutState.value);

		return { t, props, template, dateFields, startDateField, endDateField };
	},
});
</script>
