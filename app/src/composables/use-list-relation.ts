import type { ContentVersion, Filter } from '@directus/types';
import { deepMap } from '@directus/utils';
import { isEmpty } from 'lodash';
import { render } from 'micromustache';
import { computed, inject, ref, type Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Sort } from '@/components/v-table/types';
import type { RelationM2M } from '@/composables/use-relation-m2m';
import type { DisplayItem, RelationQueryMultiple } from '@/composables/use-relation-multiple';
import { useRelationMultiple } from '@/composables/use-relation-multiple';
import type { RelationO2M } from '@/composables/use-relation-o2m';
import { useFieldsStore } from '@/stores/fields';
import { formatItemsCountPaginated } from '@/utils/format-items-count';
import { parseFilter } from '@/utils/parse-filter';

export type ListRelationHeader = {
	text: string;
	value: string;
	width: number;
	sortable: boolean;
};

export interface UseListRelationOptions {
	value: Ref<Record<string, any> | any[] | undefined | null>;
	relationInfo: Ref<RelationM2M | RelationO2M | undefined>;
	primaryKey: Ref<string | number | null>;
	version: Ref<ContentVersion | null>;
	/** Collection used for headers and field lookups (junction for M2M, related for O2M) */
	displayCollection: Ref<string | undefined>;
	/** Column keys for headers (e.g. props.fields) */
	fieldKeys: Ref<string[]>;
	/** Resolved display fields for the query */
	fields: Ref<string[]>;
	initialLimit: number;
	tableSpacing: Ref<'compact' | 'cozy' | 'comfortable'>;
	filter: Ref<Filter | null>;
	/** Optional extra filter merged into query (e.g. M2M junctionFilter) */
	extraFilter?: Ref<Filter | null>;
	/** Optional sort ref for query (M2M: sort from table; O2M: manualSort from props) */
	sortRef?: Ref<Sort | null | undefined>;
}

export function useListRelation(options: UseListRelationOptions) {
	const {
		value,
		relationInfo,
		primaryKey,
		version,
		displayCollection,
		fieldKeys,
		fields,
		initialLimit,
		tableSpacing,
		filter,
		extraFilter,
		sortRef,
	} = options;

	const { t, n } = useI18n();
	const fieldsStore = useFieldsStore();
	const values = inject<Ref<Record<string, any>>>('values', ref({}));

	const limit = ref(initialLimit);
	const page = ref(1);
	const search = ref('');
	const searchFilter = ref<Filter>();
	const headers = ref<ListRelationHeader[]>([]);

	const query = computed<RelationQueryMultiple>(() => {
		const q: RelationQueryMultiple = {
			limit: limit.value,
			page: page.value,
			fields: fields.value?.length ? fields.value : ['id'],
		};

		if (!relationInfo.value) return q;

		if (searchFilter.value) {
			q.filter = searchFilter.value;
		}

		if (extraFilter?.value) {
			q.filter = q.filter ? { _and: [q.filter, extraFilter.value] } : extraFilter.value;
		}

		if (search.value) {
			q.search = search.value;
		}

		if (sortRef?.value) {
			q.sort = [`${sortRef.value.desc ? '-' : ''}${sortRef.value.by}`];
		}

		return q;
	});

	watch([search, searchFilter, limit], () => {
		page.value = 1;
	});

	const {
		create,
		update,
		remove,
		select,
		displayItems,
		totalItemCount,
		loading,
		selected,
		isItemSelected,
		isLocalItem,
		getItemEdits,
	} = useRelationMultiple(value, query, relationInfo, primaryKey, version);

	const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

	const showingCount = computed(() =>
		formatItemsCountPaginated({
			currentItems: totalItemCount.value,
			currentPage: page.value,
			perPage: limit.value,
			isFiltered: !!(search.value || searchFilter.value),
			i18n: { t, n },
		}),
	);

	watch(
		[relationInfo, displayItems, fieldKeys],
		() => {
			if (!relationInfo.value || !displayCollection.value) {
				headers.value = [];
				return;
			}

			const collection = displayCollection.value;
			const keys = fieldKeys.value ?? [];

			const contentWidth: Record<string, number> = {};

			(displayItems.value ?? []).forEach((item: Record<string, any>) => {
				keys.forEach((key) => {
					if (!contentWidth[key]) {
						contentWidth[key] = 5;
					}

					if (String(item[key]).length > contentWidth[key]) {
						contentWidth[key] = String(item[key]).length;
					}
				});
			});

			headers.value = keys
				.map((key) => {
					const field = fieldsStore.getField(collection, key);

					if (!field) return null;

					return {
						text: field.name,
						value: key,
						width:
							contentWidth[key] !== undefined && contentWidth[key] < 10
								? contentWidth[key] * 16 + 10
								: 160,
						sortable: !['json'].includes(field.type),
					};
				})
				.filter((h): h is ListRelationHeader => h !== null);
		},
		{ immediate: true },
	);

	const spacings = { compact: 32, cozy: 48, comfortable: 64 };
	const tableRowHeight = computed(() => spacings[tableSpacing.value] ?? spacings.cozy);

	const allowDrag = computed(
		() => totalItemCount.value <= limit.value && relationInfo.value?.sortField !== undefined,
	);

	function deleteItem(item: DisplayItem) {
		if (
			page.value === Math.ceil(totalItemCount.value / limit.value) &&
			page.value !== Math.ceil((totalItemCount.value - 1) / limit.value)
		) {
			page.value = Math.max(1, page.value - 1);
		}

		remove(item);
	}

	const parsedFilter = computed(() => {
		const parsed = parseFilter(
			deepMap(filter.value, (val: any) => {
				if (val && typeof val === 'string') {
					return render(val, values.value);
				}

				return val;
			}),
		);

		return isEmpty(parsed) ? null : parsed;
	});

	return {
		limit,
		page,
		search,
		searchFilter,
		query,
		create,
		update,
		remove,
		select,
		displayItems,
		totalItemCount,
		loading,
		selected,
		isItemSelected,
		isLocalItem,
		getItemEdits,
		pageCount,
		showingCount,
		headers,
		spacings,
		tableRowHeight,
		allowDrag,
		deleteItem,
		values,
		parsedFilter,
	};
}
