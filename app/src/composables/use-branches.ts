import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { Branch, Filter, Query } from '@directus/types';
import { computed, ref, Ref, unref, watch } from 'vue';

export function useBranches(collection: Ref<string>, primaryKey: Ref<string | null>) {
	const currentBranch = ref<Branch | null>(null);
	const branches = ref<Branch[] | null>(null);
	const loading = ref(false);
	const commitLoading = ref(false);

	const query = computed<Query>(() => {
		if (!unref(currentBranch)) return {};

		return {
			branch: unref(currentBranch)!.name,
		};
	});

	watch([collection, primaryKey], () => getBranches(), { immediate: true });

	return {
		currentBranch,
		branches,
		loading,
		query,
		getBranches,
		commitLoading,
		commit,
	};

	async function getBranches() {
		if (!unref(primaryKey) || unref(primaryKey) === '+') return;

		loading.value = true;

		try {
			const filter: Filter = {
				_and: [
					{
						collection: {
							_eq: unref(collection),
						},
					},
					{
						item: {
							_eq: unref(primaryKey)!,
						},
					},
				],
			};

			const response = await api.get(`/branches`, {
				params: {
					filter,
					sort: '-date_created',
					fields: ['*'],
				},
			});

			branches.value = response.data.data;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}

	async function commit(edits: Ref<Record<string, any>>) {
		if (!unref(currentBranch)) return;

		commitLoading.value = true;

		try {
			await api.post(`/branches/${unref(currentBranch)!.id}/commit`, unref(edits));
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			commitLoading.value = false;
		}
	}
}
