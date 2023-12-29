<script setup lang="ts">
import api from '@/api';
import { Activity, ActivityByDate } from '@/types/activity';
import { localizedFormat } from '@/utils/localized-format';
import { userName } from '@/utils/user-name';
import type { PrimaryKey, User } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { isThisYear, isToday, isYesterday } from 'date-fns';
import { flatten, groupBy, orderBy } from 'lodash';
import { Ref, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CommentInput from './comment-input.vue';
import CommentItem from './comment-item.vue';

type ActivityByDateDisplay = ActivityByDate & {
	activity: (Activity & {
		display: string;
		user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
	})[];
};

const props = defineProps<{
	collection: string;
	primaryKey: PrimaryKey;
}>();

const { t } = useI18n();

const { collection, primaryKey } = toRefs(props);

const { activity, getActivity, loading, refresh, activityCount, getActivityCount, loadingCount, userPreviews } =
	useActivity(collection, primaryKey);

onMounted(() => {
	getActivityCount();
});

function onToggle(open: boolean) {
	if (open && activity.value === null) getActivity();
}

function useActivity(collection: Ref<string>, primaryKey: Ref<PrimaryKey>) {
	const regex = /\s@[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}/gm;
	const activity = ref<ActivityByDateDisplay[] | null>(null);
	const activityCount = ref(0);
	const error = ref(null);
	const loading = ref(false);
	const loadingCount = ref(false);
	const userPreviews = ref<Record<string, any>>({});

	watch([collection, primaryKey], () => refresh());

	return {
		activity,
		getActivity,
		error,
		loading,
		refresh,
		activityCount,
		getActivityCount,
		loadingCount,
		userPreviews,
	};

	async function getActivity() {
		error.value = null;
		loading.value = true;

		try {
			const response = await api.get(`/activity`, {
				params: {
					'filter[collection][_eq]': collection.value,
					'filter[item][_eq]': primaryKey.value,
					'filter[action][_eq]': 'comment',
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

			userPreviews.value = await loadUserPreviews(response.data.data, regex);

			const activityWithUsersInComments = (response.data.data as Activity[]).map((comment) => {
				const display = (comment.comment as string).replace(
					regex,
					(match) => `<mark>${userPreviews.value[match.substring(2)]}</mark>`,
				);

				return {
					...comment,
					display,
				} as Activity & {
					display: string;
					user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
				};
			});

			const activityByDate = groupBy(activityWithUsersInComments, (activity) => {
				// activity's timestamp date is in iso-8601
				const date = new Date(new Date(activity.timestamp).toDateString());
				return date;
			});

			const activityGrouped: ActivityByDateDisplay[] = [];

			for (const [key, value] of Object.entries(activityByDate)) {
				const date = new Date(key);
				const today = isToday(date);
				const yesterday = isYesterday(date);
				const thisYear = isThisYear(date);

				let dateFormatted: string;

				if (today) dateFormatted = t('today');
				else if (yesterday) dateFormatted = t('yesterday');
				else if (thisYear) dateFormatted = localizedFormat(date, String(t('date-fns_date_short_no_year')));
				else dateFormatted = localizedFormat(date, String(t('date-fns_date_short')));

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

	async function getActivityCount() {
		error.value = null;
		loadingCount.value = true;

		try {
			const response = await api.get(`/activity`, {
				params: {
					filter: {
						_and: [
							{
								collection: {
									_eq: collection.value,
								},
							},
							{
								item: {
									_eq: primaryKey.value,
								},
							},
							{
								action: {
									_eq: 'comment',
								},
							},
						],
					},
					aggregate: {
						count: 'id',
					},
				},
			});

			activityCount.value = Number(response.data.data[0].count.id);
		} catch (error: any) {
			error.value = error;
		} finally {
			loadingCount.value = false;
		}
	}

	async function refresh() {
		await getActivityCount();
		await getActivity();
	}
}

async function loadUserPreviews(comments: Record<string, any>, regex: RegExp) {
	const userPreviews: any[] = [];

	comments.forEach((comment: Record<string, any>) => {
		userPreviews.push(comment.comment.match(regex));
	});

	const uniqIds: string[] = [...new Set(flatten(userPreviews))].filter((id) => {
		if (id) return id;
	});

	if (uniqIds.length > 0) {
		const response = await api.get('/users', {
			params: {
				filter: { id: { _in: uniqIds.map((id) => id.substring(2)) } },
				fields: ['first_name', 'last_name', 'email', 'id'],
			},
		});

		const userPreviews: Record<string, string> = {};

		response.data.data.map((user: Record<string, any>) => {
			userPreviews[user.id] = userName(user);
		});

		return userPreviews;
	}

	return {};
}
</script>

<template>
	<sidebar-detail
		:title="t('comments')"
		icon="chat_bubble_outline"
		:badge="!loadingCount && activityCount > 0 ? abbreviateNumber(activityCount) : null"
		@toggle="onToggle"
	>
		<comment-input :refresh="refresh" :collection="collection" :primary-key="primaryKey" />

		<v-progress-linear v-if="loading" indeterminate />

		<div v-else-if="!activity || activity.length === 0" class="empty">
			<div class="content">{{ t('no_comments') }}</div>
		</div>

		<template v-for="group in activity" v-else :key="group.date.toString()">
			<v-divider>{{ group.dateFormatted }}</v-divider>

			<template v-for="item in group.activity" :key="item.id">
				<comment-item
					:refresh="refresh"
					:activity="item"
					:user-previews="userPreviews"
					:primary-key="primaryKey"
					:collection="collection"
				/>
			</template>
		</template>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	position: sticky;
	top: 0;
	z-index: 2;
	margin-top: 12px;
	margin-bottom: 2px;
	padding-top: 4px;
	padding-bottom: 4px;
	background-color: var(--theme--background-normal);
	box-shadow: 0 0 4px 2px var(--theme--background-normal);
	--v-divider-label-color: var(--theme--foreground-subdued);
}

.empty {
	margin-top: 16px;
	margin-bottom: 8px;
	margin-left: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}
</style>
