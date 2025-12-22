<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import VCollectionFieldTemplate from '@/components/v-collection-field-template.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { localizedFormat } from '@/utils/localized-format';
import { useSync } from '@directus/composables';
import { Field } from '@directus/types';
import { add, startOfWeek } from 'date-fns';

const props = withDefaults(
	defineProps<{
		collection: string;
		dateFields: Field[];
		template?: string;
		startDateField?: string;
		endDateField?: string;
		firstDay?: number;
	}>(),
	{
		firstDay: 0,
	},
);

const emit = defineEmits(['update:template', 'update:startDateField', 'update:endDateField', 'update:firstDay']);

const templateWritable = useSync(props, 'template', emit);
const startDateFieldWritable = useSync(props, 'startDateField', emit);
const endDateFieldWritable = useSync(props, 'endDateField', emit);
const firstDayWritable = useSync(props, 'firstDay', emit);

const firstDayOfWeekForDate = startOfWeek(new Date());

const firstDayOptions: { text: string; value: number }[] = [...Array(7).keys()].map((_, i) => ({
	text: localizedFormat(add(firstDayOfWeekForDate, { days: i }), 'EEEE'),
	value: i,
}));
</script>

<template>
	<div class="field">
		<div class="type-label">{{ $t('display_template') }}</div>
		<VCollectionFieldTemplate v-model="templateWritable" :collection="collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.calendar.start_date_field') }}</div>
		<VSelect v-model="startDateFieldWritable" show-deselect :items="dateFields" item-text="name" item-value="field" />
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.calendar.end_date_field') }}</div>
		<VSelect
			v-model="endDateFieldWritable"
			show-deselect
			:placeholder="$t('layouts.calendar.optional')"
			:items="dateFields"
			item-text="name"
			item-value="field"
		/>
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.calendar.first_day') }}</div>
		<VSelect v-model="firstDayWritable" :items="firstDayOptions" />
	</div>
</template>
