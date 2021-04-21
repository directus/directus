<template>
	<sidebar-detail :title="$t('comments')" icon="chat_bubble_outline" :badge="count || null">
		<comment-input :refresh="refresh" :collection="collection" :primary-key="primaryKey" />

		<v-progress-linear indeterminate v-if="loading" />

		<div v-else-if="!activity || activity.length === 0" class="empty">
			<div class="content">{{ $t('no_comments') }}</div>
		</div>

		<template v-else v-for="group in activity">
			<v-divider :key="group.date.toString()">{{ group.dateFormatted }}</v-divider>

			<template v-for="item in group.activity">
				<comment-item :refresh="refresh" :activity="item" :key="item.id" />
			</template>
		</template>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

import api from '@/api';
import { Activity, ActivityByDate } from './types';
import CommentInput from './comment-input.vue';
import { groupBy } from 'lodash';
import i18n from '@/lang';
import formatLocalized from '@/utils/localized-format';
import { isToday, isYesterday, isThisYear } from 'date-fns';
import { TranslateResult } from 'vue-i18n';
import CommentItem from './comment-item.vue';
import { orderBy } from 'lodash';

export default defineComponent({
	components: { CommentInput, CommentItem },
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			required: true,
		},
	},
	setup(props) {
		const { activity, loading, error, refresh, count } = useActivity(props.collection, props.primaryKey);

		return {
			activity,
			loading,
			error,
			refresh,
			count,
		};

		function useActivity(collection: string, primaryKey: string | number) {
			const activity = ref<ActivityByDate[] | null>(null);
			const count = ref(0);
			const error = ref(null);
			const loading = ref(false);

			getActivity();

			return { activity, error, loading, refresh, count };

			async function getActivity() {
				error.value = null;
				loading.value = true;

				try {
					const response = await api.get(`/activity`, {
						params: {
							'filter[collection][_eq]': collection,
							'filter[item][_eq]': primaryKey,
							'filter[action][_in]': 'comment',
							sort: '-id', // directus_activity has auto increment and is therefore in chronological order
							fields: [
								'id',
								'action',
								'timestamp',
								'user.id',
								'user.email',
								'user.first_name',
								'user.last_name',
								'user.avatar.id',
								'revisions.id',
								'comment',
							],
						},
					});

					count.value = response.data.data.length;

					const activityByDate = groupBy(response.data.data, (activity: Activity) => {
						// activity's timestamp date is in iso-8601
						const date = new Date(new Date(activity.timestamp).toDateString());
						return date;
					});

					const activityGrouped: ActivityByDate[] = [];

					for (const [key, value] of Object.entries(activityByDate)) {
						const date = new Date(key);
						const today = isToday(date);
						const yesterday = isYesterday(date);
						const thisYear = isThisYear(date);

						let dateFormatted: TranslateResult;

						if (today) dateFormatted = i18n.t('today');
						else if (yesterday) dateFormatted = i18n.t('yesterday');
						else if (thisYear)
							dateFormatted = await formatLocalized(date, String(i18n.t('date-fns_date_short_no_year')));
						else dateFormatted = await formatLocalized(date, String(i18n.t('date-fns_date_short')));

						activityGrouped.push({
							date: date,
							dateFormatted: String(dateFormatted),
							activity: value,
						});
					}

					activity.value = orderBy(activityGrouped, ['date'], ['desc']);
				} catch (error) {
					error.value = error;
				} finally {
					loading.value = false;
				}
			}

			async function refresh() {
				await getActivity();
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.sidebar-detail {
	--v-badge-background-color: var(--primary);
}

.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	position: sticky;
	top: 0;
	z-index: 2;
	margin-top: 8px;
	margin-bottom: 8px;
	padding-top: 8px;
	padding-bottom: 8px;
	background-color: var(--background-normal);
	box-shadow: 0 0 4px 2px var(--background-normal);
}

.empty {
	margin-top: 16px;
	margin-bottom: 8px;
	margin-left: 2px;
	color: var(--foreground-subdued);
	font-style: italic;
}
</style>
