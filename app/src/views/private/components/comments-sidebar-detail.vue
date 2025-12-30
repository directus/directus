<script setup lang="ts">
import CommentInput from './comment-input.vue';
import CommentItem from './comment-item.vue';
import SidebarDetail from './sidebar-detail.vue';
import api from '@/api';
import VDivider from '@/components/v-divider.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import { localizedFormat } from '@/utils/localized-format';
import { userName } from '@/utils/user-name';
import { useGroupable } from '@directus/composables';
import type { Comment, PrimaryKey, User } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { isThisYear, isToday, isYesterday } from 'date-fns';
import dompurify from 'dompurify';
import { flatten, groupBy, orderBy } from 'lodash';
import { computed, onMounted, ref, Ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type CommentsByDateDisplay = {
	date: Date;
	dateFormatted: string;
	comments: (Comment & {
		display: string;
		user_created: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
	})[];
};

const props = defineProps<{
	collection: string;
	primaryKey: PrimaryKey;
}>();

const { t } = useI18n();

const title = computed(() => t('comments'));

const { active: open } = useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});

const { collection, primaryKey } = toRefs(props);

const { comments, getComments, loading, refresh, commentsCount, getCommentsCount, loadingCount, userPreviews } =
	useComments(collection, primaryKey);

onMounted(() => {
	getCommentsCount();
	if (open.value) getComments();
});

function onToggle(open: boolean) {
	if (open && comments.value === null) getComments();
}

function useComments(collection: Ref<string>, primaryKey: Ref<PrimaryKey>) {
	const regex = /\s@[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}/gm;
	const comments = ref<CommentsByDateDisplay[] | null>(null);
	const commentsCount = ref(0);
	const error = ref(null);
	const loading = ref(false);
	const loadingCount = ref(false);
	const userPreviews = ref<Record<string, any>>({});

	watch([collection, primaryKey], () => refresh());

	return {
		comments,
		getComments,
		error,
		loading,
		refresh,
		commentsCount,
		getCommentsCount,
		loadingCount,
		userPreviews,
	};

	async function getComments() {
		error.value = null;
		loading.value = true;

		try {
			const response = (
				await api.get(`/comments`, {
					params: {
						'filter[collection][_eq]': collection.value,
						'filter[item][_eq]': primaryKey.value,
						sort: '-date_created',
						fields: [
							'id',
							'comment',
							'date_created',
							'user_created.id',
							'user_created.email',
							'user_created.first_name',
							'user_created.last_name',
							'user_created.avatar.id',
							'user_created.avatar.modified_on',
						],
					},
				})
			).data.data as Comment[];

			userPreviews.value = await loadUserPreviews(response, regex);

			const commentsWithTaggedUsers = (response as Comment[]).map((comment) => {
				const display = dompurify
					.sanitize(comment.comment as string, { ALLOWED_TAGS: [] })
					.replace(regex, (match) => `<mark>${userPreviews.value[match.substring(2)]}</mark>`);

				return {
					...comment,
					display,
				} as Comment & {
					display: string;
					user_created: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
				};
			});

			const commentsByDate = groupBy(commentsWithTaggedUsers, (activity) => {
				// activity's timestamp date is in iso-8601
				const date = new Date(new Date(activity.date_created).toDateString());
				return date;
			});

			const commentsGrouped: CommentsByDateDisplay[] = [];

			for (const [key, value] of Object.entries(commentsByDate)) {
				const date = new Date(key);
				const today = isToday(date);
				const yesterday = isYesterday(date);
				const thisYear = isThisYear(date);

				let dateFormatted: string;

				if (today) dateFormatted = t('today');
				else if (yesterday) dateFormatted = t('yesterday');
				else if (thisYear) dateFormatted = localizedFormat(date, String(t('date-fns_date_short_no_year')));
				else dateFormatted = localizedFormat(date, String(t('date-fns_date_short')));

				commentsGrouped.push({
					date: date,
					dateFormatted: String(dateFormatted),
					comments: value,
				});
			}

			comments.value = orderBy(commentsGrouped, ['date'], ['desc']);
		} catch (error: any) {
			error.value = error;
		} finally {
			loading.value = false;
		}
	}

	async function getCommentsCount() {
		error.value = null;
		loadingCount.value = true;

		try {
			const response = await api.get(`/comments`, {
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
						],
					},
					aggregate: {
						count: 'id',
					},
				},
			});

			commentsCount.value = Number(response.data.data[0].count.id);
		} catch (error: any) {
			error.value = error;
		} finally {
			loadingCount.value = false;
		}
	}

	async function refresh() {
		await getCommentsCount();
		await getComments();
	}
}

async function loadUserPreviews(comments: Comment[], regex: RegExp) {
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
	<SidebarDetail
		id="comments"
		:title
		icon="chat_bubble_outline"
		:badge="!loadingCount && commentsCount > 0 ? abbreviateNumber(commentsCount) : null"
		@toggle="onToggle"
	>
		<CommentInput :refresh="refresh" :collection="collection" :primary-key="primaryKey" />

		<VProgressLinear v-if="loading" indeterminate />

		<div v-else-if="!comments || comments.length === 0" class="empty">
			<div class="content">{{ $t('no_comments') }}</div>
		</div>

		<template v-for="group in comments" v-else :key="group.date.toString()">
			<VDivider>{{ group.dateFormatted }}</VDivider>

			<template v-for="item in group.comments" :key="item.id">
				<CommentItem
					:refresh="refresh"
					:comment="item"
					:user-previews="userPreviews"
					:primary-key="primaryKey"
					:collection="collection"
				/>
			</template>
		</template>
	</SidebarDetail>
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	position: sticky;
	inset-block-start: 0;
	z-index: 2;
	margin-block: 12px 2px;
	padding-block: 4px;
	background-color: var(--theme--background-normal);
	box-shadow: 0 0 4px 2px var(--theme--background-normal);

	--v-divider-label-color: var(--theme--foreground-subdued);
}

.empty {
	margin-block: 16px 8px;
	margin-inline-start: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}
</style>
