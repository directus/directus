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
		<v-select
			v-model="endDateFieldWritable"
			show-deselect
			:placeholder="t('layouts.calendar.optional')"
			:items="dateFields"
			item-text="name"
			item-value="field"
		/>
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.calendar.first_day') }}</div>
		<v-select v-model="firstDayWritable" :items="firstDayOptions" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { Field } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';
import { localizedFormat } from '@/utils/localized-format';
import { add, startOfWeek } from 'date-fns';

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
		firstDay: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:template', 'update:startDateField', 'update:endDateField', 'update:firstDay'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const templateWritable = useSync(props, 'template', emit);
		const startDateFieldWritable = useSync(props, 'startDateField', emit);
		const endDateFieldWritable = useSync(props, 'endDateField', emit);
		const firstDayWritable = useSync(props, 'firstDay', emit);

		const firstDayOfWeekForDate = startOfWeek(new Date());
		const firstDayOptions: { text: string; value: number }[] = [...Array(7).keys()].map((_, i) => ({
			text: localizedFormat(add(firstDayOfWeekForDate, { days: i }), 'EEEE'),
			value: i,
		}));

		return { t, templateWritable, startDateFieldWritable, endDateFieldWritable, firstDayWritable, firstDayOptions };
	},
});
</script>
