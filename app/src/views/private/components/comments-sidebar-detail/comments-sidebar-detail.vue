<template>
	<sidebar-detail :title="t('comments')" icon="chat_bubble_outline" :badge="count || null">
		<comment-input :refresh="refresh" :collection="collection" :primary-key="primaryKey" />

		<v-progress-linear v-if="loading" indeterminate />

		<div v-else-if="!activity || activity.length === 0" class="empty">
			<div class="content">{{ t('no_comments') }}</div>
		</div>

		<template v-for="group in activity" v-else :key="group.date.toString()">
			<v-divider>{{ group.dateFormatted }}</v-divider>

			<template v-for="item in group.activity" :key="item.id">
				<comment-item :refresh="refresh" :activity="item" :user-ids="userIds" />
			</template>
		</template>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';

import api from '@/api';
import { Activity, ActivityByDate } from './types';
import CommentInput from './comment-input.vue';
import { groupBy, orderBy, flatten } from 'lodash';
import formatLocalized from '@/utils/localized-format';
import { isToday, isYesterday, isThisYear } from 'date-fns';
import CommentItem from './comment-item.vue';

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
		const { t } = useI18n();

		const { activity, loading, error, refresh, count, userIds } = useActivity(props.collection, props.primaryKey);

		return { t, activity, loading, error, refresh, count, userIds };

		function useActivity(collection: string, primaryKey: string | number) {
			const regex = /(@[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/gm;
			const activity = ref<ActivityByDate[] | null>(null);
			const count = ref(0);
			const error = ref(null);
			const loading = ref(false);
			const userIds = ref({});

			getActivity();

			return { activity, error, loading, refresh, count, userIds };

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

					userIds.value = await loadUserIds(response.data.data);
					response.data.data.forEach((comment: Record<string, any>) => {
						comment.comment = comment.comment.split(regex);
					});

					const activityGrouped: ActivityByDate[] = [];
					for (const [key, value] of Object.entries(activityByDate)) {
						const date = new Date(key);
						const today = isToday(date);
						const yesterday = isYesterday(date);
						const thisYear = isThisYear(date);

						let dateFormatted: string;
						if (today) dateFormatted = t('today');
						else if (yesterday) dateFormatted = t('yesterday');
						else if (thisYear) dateFormatted = await formatLocalized(date, String(t('date-fns_date_short_no_year')));
						else dateFormatted = await formatLocalized(date, String(t('date-fns_date_short')));
						activityGrouped.push({
							date: date,
							dateFormatted: String(dateFormatted),
							activity: value,
						});
					}

					activity.value = orderBy(activityGrouped, ['date'], ['desc']);
				} catch (error: any) {
					error.value = error;
				} finally {
					loading.value = false;
				}
			}

			async function refresh() {
				await getActivity();
			}
		}

		async function loadUserIds(comments: Record<string, any>) {
			const regex = /(@[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/gm;

			let userIds: any[] = [];
			comments.forEach((comment: Record<string, any>) => {
				userIds.push(comment.comment.match(regex));
			});

			const uniqIds: string[] = [...new Set(flatten(userIds))].filter((id) => {
				if (id) return id;
			});
			const idFilters = uniqIds.map((id) => {
				return { id: { _eq: id.substr(1) } };
			});
			const response = await api.get('/users', {
				params: {
					filter: { _or: idFilters },
					fields: ['first_name', 'last_name', 'email', 'id'],
				},
			});
			const userObjects: Record<string, any> = {};

			response.data.data.map((user: Record<string, any>) => {
				userObjects[user.id] = user;
			});
			return userObjects;
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
