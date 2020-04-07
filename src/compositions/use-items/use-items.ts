import { computed, ref, Ref, watch } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import useCollection from '@/compositions/use-collection';
import Vue from 'vue';
import { isEqual } from 'lodash';

type Options = {
	limit: Ref<number>;
	fields: Ref<readonly string[]>;
	sort: Ref<string>;
	page: Ref<number>;
};

export function useItems(collection: Ref<string>, options: Options) {
	const projectsStore = useProjectsStore();
	const { primaryKeyField } = useCollection(collection);

	const { limit, fields, sort, page } = options;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const items = ref<any>([]);
	const loading = ref(false);
	const error = ref(null);

	const itemCount = ref<number>(null);

	const totalPages = computed(() => {
		if (itemCount.value === null) return 1;
		if (itemCount.value < limit.value) return 1;
		return Math.ceil(itemCount.value / limit.value);
	});

	getItems();

	watch(collection, async (after, before) => {
		if (!before || isEqual(after, before)) {
			return;
		}

		// Waiting for the tick here makes sure the options have been adjusted for the new
		// collection
		await Vue.nextTick();
		reset();
		getItems();
	});

	watch([page, limit, fields], async (after, before) => {
		if (!before || isEqual(after, before)) {
			return;
		}

		await Vue.nextTick();
		if (loading.value === false) {
			getItems();
		}
	});

	watch(sort, async (after, before) => {
		if (!before || isEqual(after, before)) {
			return;
		}

		if (limit.value > (itemCount.value || 0)) return;
		await Vue.nextTick();
		if (loading.value === false) {
			getItems();
		}
	});

	return { itemCount, items, totalPages, loading, error };

	async function getItems() {
		const { currentProjectKey } = projectsStore.state;
		loading.value = true;

		const fieldsToFetch = [...fields.value];

		if (
			fields.value !== ['*'] &&
			primaryKeyField.value &&
			fieldsToFetch.includes(primaryKeyField.value.field) === false
		) {
			fieldsToFetch.push(primaryKeyField.value.field);
		}

		try {
			const response = await api.get(`/${currentProjectKey}/items/${collection.value}`, {
				params: {
					limit: limit.value,
					fields: fieldsToFetch,
					sort: sort.value,
					page: page.value,
				},
			});

			items.value = response.data.data;

			if (itemCount.value === null) {
				if (response.data.data.length === +limit.value) {
					// Requesting the page filter count in the actual request every time slows
					// the request down by like 600ms-1s. This makes sure we only fetch the count
					// once if needed.
					getTotalCount();
				} else {
					// If the response includes less items than the limit, it's safe to assume
					// it's all the data in the DB
					itemCount.value = response.data.data.length;
				}
			}
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function getTotalCount() {
		if (!primaryKeyField.value) return;

		const { currentProjectKey } = projectsStore.state;

		const response = await api.get(`/${currentProjectKey}/items/${collection.value}`, {
			params: {
				limit: 0,
				fields: primaryKeyField.value.field,
				meta: 'filter_count',
			},
		});

		itemCount.value = response.data.meta.filter_count;
	}

	function reset() {
		items.value = [];
		itemCount.value = null;
	}
}
