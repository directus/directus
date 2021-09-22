<template>
	<div class="timeline">
		<div class="header">
			<v-icon name="chevron_left" @click="pageSync -= 1" />
			<span class="timespan">{{ format(startDate, 'd MMM') }} - {{ format(endDate, 'd MMM') }}</span>
			<v-icon name="chevron_right" @click="pageSync += 1" />
		</div>
		<div class="events">
			<day
				v-for="day in days"
				:key="`${day.year}-${day.month}-${day.day}`"
				:day="day"
				:collection="collection"
				:use-events="useEvents"
				:fields-in-collection="fieldsInCollection"
				:user-field="userField"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import DayComponent from './day.vue';
import { format } from 'date-fns';

import { Item } from '@directus/shared/types';
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
		useEvents: {
			type: Function,
			required: true,
		},
		userField: {
			type: String,
			default: null,
		},
		page: {
			type: Number,
			default: 1,
		},
	},
	emits: ['update:page'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const pageSync = useSync(props, 'page', emit);

		const endDate = computed(() => new Date(props.days[0].year, props.days[0].month, props.days[0].day));

		const startDate = computed(() => {
			const endDay = props.days[props.days.length - 1];
			return new Date(endDay.year, endDay.month, endDay.day);
		});

		return { t, pageSync, format, startDate, endDate };
	},
});
</script>

<style lang="scss" scoped>
.timeline {
	padding: 0 32px;

	.header {
		display: flex;
		align-items: center;
		margin-bottom: 20px;
		font-weight: 600;
		font-size: 18px;

		.timespan {
			margin: 0 6px;
		}

		.v-icon {
			color: var(--foreground-subdued);
			cursor: pointer;

			&:hover {
				color: var(--foreground-normal);
			}
		}
	}
}
</style>
