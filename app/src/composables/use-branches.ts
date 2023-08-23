import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { Branch, Filter, Query } from '@directus/types';
import { computed, ref, Ref, unref, watch } from 'vue';

const currentBranch = ref<Branch | null>(null);

export const query = computed<Query>(() => {
	if (!currentBranch.value) return {};

	return {
		branch: currentBranch.value.name,
	};
});

export function useBranches(collection: Ref<string>, primaryKey: Ref<string | null>) {
	const branches = ref<Branch[] | null>(null);
	const loading = ref(false);
	const commitLoading = ref(false);

	watch([collection, primaryKey], () => getBranches(), { immediate: true });

	return {
		currentBranch,
		branches,
		loading,
		getBranches,
		addBranch,
		renameBranch,
		deleteBranch,
		commitLoading,
		commit,
	};

	async function getBranches() {
		if (!primaryKey.value || primaryKey.value === '+') return;

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
							_eq: primaryKey.value,
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

	async function addBranch(branch: Branch, switchToBranch: boolean) {
		branches.value = [...(branches.value ? branches.value : []), branch];

		if (switchToBranch) {
			currentBranch.value = branch;
		}
	}

	async function renameBranch(name: string) {
		if (!currentBranch.value || !branches.value) return;

		const currentBranchId = currentBranch.value.id;

		const branchToRename = branches.value.find((branch) => branch.id === currentBranchId);

		if (branchToRename) {
			branchToRename.name = name;
			currentBranch.value = branchToRename;
		}
	}

	async function deleteBranch() {
		if (!currentBranch.value || !branches.value) return;

		const currentBranchId = currentBranch.value.id;

		const index = branches.value.findIndex((branch) => branch.id === currentBranchId);

		if (index !== undefined) {
			currentBranch.value = null;
			branches.value.splice(index, 1);
		}
	}

	async function commit(edits: Ref<Record<string, any>>) {
		if (!currentBranch.value) return;

		commitLoading.value = true;

		try {
			await api.post(`/branches/${currentBranch.value.id}/commit`, unref(edits));
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			commitLoading.value = false;
		}
	}
}
