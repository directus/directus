<template>
	<div class="timeline">
		<div class="events">
			Hello!!
			<!-- <div v-for="day in days" :key="day.date">
				Day: {{day.date}}
				<div v-for="event in day.events" :key="event.id">
					{{event.time}}
					<render-template :collection="collection" :fields="fieldsInCollection" :item="event.item" :template="event.title"></render-template>
				</div>
			</div> -->
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, watch, PropType, ref } from 'vue';
import DayComponent from './day.vue'

import { Field, Item } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';
import { Day } from './types';

export default defineComponent({
	components: { day: DayComponent },
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		readonly: {
			type: Boolean,
			required: true,
		},
		items: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		days: {
			type: Array as PropType<Day[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			required: true,
		},
		error: {
			type: Object as PropType<any>,
			default: null,
		},
		fieldsInCollection: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		totalPages: {
			type: Number,
			required: true,
		},
		page: {
			type: Number,
			required: true,
		},
		toPage: {
			type: Function as PropType<(newPage: number) => void>,
			required: true,
		},
		limit: {
			type: Number,
			required: true,
		},
	},
	emits: ['update:limit'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const limitWritable = useSync(props, 'limit', emit);

		return { t, limitWritable };
	},
});
</script>

<style lang="scss" scoped>

</style>
