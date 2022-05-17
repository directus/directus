import api from '@/api';
import formatLocalized from '@/utils/localized-format';
import { unexpectedError } from '@/utils/unexpected-error';
import { isThisYear, isToday, isYesterday } from 'date-fns';
import { groupBy, orderBy } from 'lodash';
import { ref, Ref, unref } from 'vue';
import { Revision, RevisionsByDate } from '../views/private/components/revisions-drawer-detail/types';
import { useI18n } from 'vue-i18n';

export function useRevisions(collection: Ref<string>, primaryKey: Ref<number | string>) {
	const { t } = useI18n();

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
							_eq: unref(collection),
						},
						item: {
							_eq: unref(primaryKey),
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
							_eq: unref(collection),
						},
						item: {
							_eq: unref(primaryKey),
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
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}

	async function refresh(page = 0) {
		await getRevisions(page);
	}
}
