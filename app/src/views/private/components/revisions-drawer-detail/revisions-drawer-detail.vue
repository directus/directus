<template>
	<sidebar-detail
		:title="t('revisions')"
		icon="change_history"
		:badge="!loading && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
	>
		<v-progress-linear v-if="loading" indeterminate />

		<div v-else-if="revisionsCount === 0" class="empty">
			<div class="content">{{ t('no_revisions') }}</div>
		</div>

		<template v-else>
			<template v-for="group in revisionsByDate" :key="group.date.toString()">
				<RevisionsDateGroup :group="group" @click="openModal" />
			</template>

			<template v-if="page == pagesCount && !created">
				<v-divider v-if="revisionsByDate.length > 0" />

				<div class="external">
					{{ t('revision_delta_created_externally') }}
				</div>
			</template>
			<v-pagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="2" />
		</template>

		<revisions-drawer
			v-if="revisions"
			v-model:current="modalCurrentRevision"
			v-model:active="modalActive"
			:revisions="revisions"
			@revert="$emit('revert', $event)"
		/>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch } from 'vue';
import { Revision, RevisionsByDate } from './types';

import api from '@/api';
import { groupBy, orderBy } from 'lodash';
import { isToday, isYesterday, isThisYear } from 'date-fns';
import formatLocalized from '@/utils/localized-format';
import RevisionsDateGroup from './revisions-date-group.vue';
import RevisionsDrawer from './revisions-drawer.vue';
import { unexpectedError } from '@/utils/unexpected-error';
import { abbreviateNumber } from '@directus/shared/utils';

export default defineComponent({
	components: { RevisionsDrawer, RevisionsDateGroup },
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
	emits: ['revert'],
	setup(props) {
		const { t } = useI18n();

		const { revisions, revisionsByDate, loading, refresh, revisionsCount, pagesCount, created } = useRevisions(
			props.collection,
			props.primaryKey
		);

		const modalActive = ref(false);
		const modalCurrentRevision = ref<number | null>(null);
		const page = ref<number>(1);

		watch(
			() => page.value,
			(newPage) => {
				refresh(newPage);
			}
		);

		return {
			t,
			revisions,
			revisionsByDate,
			loading,
			refresh,
			modalActive,
			modalCurrentRevision,
			openModal,
			revisionsCount,
			created,
			page,
			pagesCount,
			abbreviateNumber,
		};

		function openModal(id: number) {
			modalCurrentRevision.value = id;
			modalActive.value = true;
		}

		function useRevisions(collection: string, primaryKey: number | string) {
			const revisions = ref<Revision[] | null>(null);
			const revisionsByDate = ref<RevisionsByDate[] | null>(null);
			const loading = ref(false);
			const revisionsCount = ref(0);
			const created = ref<Revision>();
			const pagesCount = ref(0);

			getRevisions();

			return { created, revisions, revisionsByDate, loading, refresh, revisionsCount, pagesCount };

			async function getRevisions(page = 0) {
				loading.value = true;
				const pageSize = 100;

				try {
					const response = await api.get(`/revisions`, {
						params: {
							filter: {
								collection: {
									_eq: collection,
								},
								item: {
									_eq: primaryKey,
								},
							},
							sort: '-id',
							limit: pageSize,
							page,
							fields: [
								'id',
								'data',
								'delta',
								'collection',
								'item',
								'activity.action',
								'activity.timestamp',
								'activity.user.id',
								'activity.user.email',
								'activity.user.first_name',
								'activity.user.last_name',
								'activity.ip',
								'activity.user_agent',
							],
							meta: ['filter_count'],
						},
					});

					const createdResponse = await api.get(`/revisions`, {
						params: {
							filter: {
								collection: {
									_eq: collection,
								},
								item: {
									_eq: primaryKey,
								},
								activity: {
									action: {
										_eq: 'create',
									},
								},
							},
							sort: '-id',
							limit: 1,
							fields: [
								'id',
								'data',
								'delta',
								'collection',
								'item',
								'activity.action',
								'activity.timestamp',
								'activity.user.id',
								'activity.user.email',
								'activity.user.first_name',
								'activity.user.last_name',
								'activity.ip',
								'activity.user_agent',
							],
							meta: ['filter_count'],
						},
					});

					created.value = createdResponse.data.data?.[0];

					const revisionsGroupedByDate = groupBy(
						response.data.data.filter((revision: any) => !!revision.activity),
						(revision: Revision) => {
							// revision's timestamp date is in iso-8601
							const date = new Date(new Date(revision.activity.timestamp).toDateString());
							return date;
						}
					);

					const revisionsGrouped: RevisionsByDate[] = [];

					for (const [key, value] of Object.entries(revisionsGroupedByDate)) {
						const date = new Date(key);
						const today = isToday(date);
						const yesterday = isYesterday(date);
						const thisYear = isThisYear(date);

						let dateFormatted: string;

						if (today) dateFormatted = t('today');
						else if (yesterday) dateFormatted = t('yesterday');
						else if (thisYear) dateFormatted = await formatLocalized(date, String(t('date-fns_date_short_no_year')));
						else dateFormatted = await formatLocalized(date, String(t('date-fns_date_short')));

						revisionsGrouped.push({
							date: date,
							dateFormatted: String(dateFormatted),
							revisions: orderBy(value, ['activity.timestamp'], ['desc']),
						});
					}

					revisionsByDate.value = orderBy(revisionsGrouped, ['date'], ['desc']);
					revisions.value = orderBy(response.data.data, ['activity.timestamp'], ['desc']);
					revisionsCount.value = response.data.meta.filter_count;
					pagesCount.value = Math.ceil(revisionsCount.value / pageSize);
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}

			async function refresh(page = 0) {
				await getRevisions(page);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	--v-divider-color: var(--background-normal-alt);

	position: sticky;
	top: 0;
	z-index: 3;
	margin-top: 8px;
	margin-right: -8px;
	margin-bottom: 6px;
	margin-left: -8px;
	padding-top: 8px;
	padding-right: 8px;
	padding-left: 8px;
	background-color: var(--background-normal);
	box-shadow: 0 0 2px 2px var(--background-normal);

	&:first-of-type {
		margin-top: 0;
	}
}

.empty {
	margin-top: 16px;
	margin-bottom: 16px;
	margin-left: 2px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.external {
	margin-left: 20px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.other {
	--v-divider-label-color: var(--foreground-subdued);

	font-style: italic;
}

.v-pagination {
	justify-content: center;
}
</style>
