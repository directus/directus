<template>
	<div class="field">
		<div class="type-label">{{ t('display_template') }}</div>
		<v-field-template v-model="templateWritable" :collection="collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.start_date_field') }}</div>
		<v-select v-model="startDateFieldWritable" show-deselect :items="dateFields" item-text="name" item-value="field" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.end_date_field') }}</div>
		<v-select v-model="endDateFieldWritable" show-deselect :items="dateFields" item-text="name" item-value="field" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { Field } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			default: null,
		},
		dateFields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		startDateField: {
			type: String,
			default: null,
		},
		endDateField: {
			type: String,
			default: null,
		},
	},
	emits: ['update:template', 'update:startDateField', 'update:endDateField'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const templateWritable = useSync(props, 'template', emit);
		const startDateFieldWritable = useSync(props, 'startDateField', emit);
		const endDateFieldWritable = useSync(props, 'endDateField', emit);

		return { t, templateWritable, startDateFieldWritable, endDateFieldWritable };
	},
});
</script>
