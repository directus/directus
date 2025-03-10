import api from '@/api';
import type { Revision } from '@/types/revisions';
import { localizedFormat } from '@/utils/localized-format';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { unexpectedError } from '@/utils/unexpected-error';
import { format, parseISO } from 'date-fns';
import { Ref, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export function useRevision(primaryKey: Ref<number | undefined>) {
	const { t } = useI18n();

	const revision = ref<(Revision & { timestampFormatted: string; timeRelative: string }) | null>(null);
	const loading = ref(false);

	watch([primaryKey], () => {
		if (unref(primaryKey) !== unref(revision)?.id) {
			revision.value = null;
		}

		if (typeof unref(primaryKey) === 'undefined') return;
		refresh();
	});

	return {
		revision,
		getRevision,
		loading,
		refresh,
	};

	async function getRevision() {
		if (typeof unref(primaryKey) === 'undefined') return;

		loading.value = true;

		try {
			type RevisionResponse = { data: Revision };

			const response = await api.get<RevisionResponse>(`/revisions/${unref(primaryKey)}`, {
				params: {
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
						'activity.origin',
					],
				},
			});

			revision.value = {
				...response.data.data,
				timestampFormatted: await getFormattedDate(response.data.data.activity?.timestamp),
				timeRelative: `${getTime(response.data.data.activity?.timestamp)} (${localizedFormatDistance(
					parseISO(response.data.data.activity?.timestamp),
					new Date(),
					{
						addSuffix: true,
					},
				)})`,
			};
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function refresh() {
		await getRevision();
	}

	function getTime(timestamp: string) {
		return format(new Date(timestamp), String(t('date-fns_time')));
	}

	async function getFormattedDate(timestamp: string) {
		const date = localizedFormat(new Date(timestamp), String(t('date-fns_date_short')));
		const time = localizedFormat(new Date(timestamp), String(t('date-fns_time')));

		return `${date} (${time})`;
	}
}
