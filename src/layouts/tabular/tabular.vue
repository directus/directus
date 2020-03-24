<template>
	<div class="layout-tabular">
		<portal to="actions:prepend">
			Search bar here
		</portal>

		<portal to="drawer">
			<drawer-detail icon="exposure_plus_2" title="Items per page">
				Example
			</drawer-detail>
		</portal>

		<v-table
			:items="items"
			:loading="loading"
			:headers="headers"
			ref="table"
			v-model="_selection"
			fixed-header
			show-select
			@click:row="onRowClick"
			:server-sort="isBigCollection"
			@update:sort="onSortChange"
		>
			<template #footer>
				<div class="pagination" v-if="isBigCollection">
					<v-pagination
						:length="pages"
						:total-visible="5"
						show-first-last
						:value="currentPage"
						@input="toPage"
					/>
				</div>
			</template>
		</v-table>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, computed } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import useFieldsStore from '@/stores/fields';
import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field } from '@/stores/fields/types';
import router from '@/router';

const PAGE_COUNT = 75;

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: () => [],
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const table = ref<Vue>(null);

		const { currentProjectKey } = useProjectsStore().state;
		const fieldsStore = useFieldsStore();

		const error = ref(null);
		const items = ref([]);
		const loading = ref(true);
		const itemCount = ref<number>(null);
		const currentPage = ref(1);
		const pages = computed<number>(() => Math.ceil(itemCount.value || 0 / PAGE_COUNT));
		const isBigCollection = computed<boolean>(() => (itemCount.value || 0) > PAGE_COUNT);
		const sort = ref({ by: 'id', desc: false });

		const _selection = computed<Item[]>({
			get() {
				return props.selection;
			},
			set(newSelection) {
				emit('update:selection', newSelection);
			},
		});

		const fieldsInCurrentCollection = computed<Field[]>(() => {
			return fieldsStore.state.fields.filter(
				(field) => field.collection === props.collection
			);
		});

		const visibleFields = computed<Field[]>(() => {
			return fieldsInCurrentCollection.value.filter((field) => field.hidden_browse === false);
		});

		const headers = computed<HeaderRaw[]>(() => {
			return visibleFields.value.map((field) => ({
				text: field.name,
				value: field.field,
			}));
		});

		const primaryKeyField = computed<Field>(() => {
			// It's safe to assume that every collection has a primary key.
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return fieldsInCurrentCollection.value.find((field) => field.primary_key === true)!;
		});

		getItems();

		watch(
			() => props.collection,
			() => {
				items.value = [];
				itemCount.value = null;
				currentPage.value = 1;
				getItems();
			}
		);

		return {
			error,
			items,
			loading,
			headers,
			onRowClick,
			primaryKeyField,
			_selection,
			refresh,
			table,
			itemCount,
			pages,
			toPage,
			currentPage,
			isBigCollection,
			onSortChange,
		};

		async function refresh() {
			await getItems();
		}

		async function getItems() {
			error.value = null;
			loading.value = true;

			let sortString = sort.value.by;
			if (sort.value.desc === true) sortString = '-' + sortString;

			try {
				const response = await api.get(`/${currentProjectKey}/items/${props.collection}`, {
					params: {
						limit: PAGE_COUNT,
						page: currentPage.value,
						sort: sortString,
					},
				});

				items.value = response.data.data;

				if (itemCount.value === null) {
					if (response.data.data.length === PAGE_COUNT) {
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
			} catch (error) {
				error.value = error;
			} finally {
				loading.value = false;
			}
		}

		function onRowClick(item: Item) {
			if (props.selectMode) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(table.value as any).onItemSelected({
					item,
					value: _selection.value.includes(item) === false,
				});
			} else {
				const primaryKey = item[primaryKeyField.value.field];
				router.push(`/${currentProjectKey}/collections/${props.collection}/${primaryKey}`);
			}
		}

		function toPage(page: number) {
			currentPage.value = page;
			getItems();
			// We know this is only called after the element is mounted
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			table.value!.$el.parentElement!.parentElement!.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		function onSortChange(newSort: { by: string; desc: boolean }) {
			// Let the table component handle the sorting for small datasets
			if (isBigCollection.value === false) return;
			sort.value = newSort;
			currentPage.value = 1;
			getItems();
		}

		async function getTotalCount() {
			const response = await api.get(`/${currentProjectKey}/items/${props.collection}`, {
				params: {
					limit: 0,
					fields: primaryKeyField.value.field,
					meta: 'filter_count',
				},
			});

			itemCount.value = response.data.meta.filter_count;
		}
	},
});
</script>

<style lang="scss" scoped>
.layout-tabular {
	display: contents;
}

.v-table {
	--v-table-sticky-offset-top: var(--layout-offset-top);

	display: contents;
	padding: 0 32px;
}

.pagination {
	position: sticky;
	left: 0;
	width: 100%;
	padding: 32px;
	text-align: center;
}
</style>
