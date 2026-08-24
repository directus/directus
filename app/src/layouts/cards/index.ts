import { useCollection, useItems, useSync } from '@directus/composables';
import { isPublishedVersionKey } from '@directus/constants';
import { defineLayout } from '@directus/extensions';
import { getFieldsFromTemplate } from '@directus/utils';
import { clone } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import CardsActions from './actions.vue';
import CardsLayout from './cards.vue';
import CardsOptions from './options.vue';
import { LayoutOptions, LayoutQuery } from './types';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import { useLayoutClickHandler } from '@/composables/use-layout-click-handler';
import { useVersionQuery } from '@/composables/use-version-query';
import { useRelationsStore } from '@/stores/relations';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { formatItemsCountPaginated } from '@/utils/format-items-count';
import { saveAsCSV } from '@/utils/save-as-csv';
import { syncRefProperty } from '@/utils/sync-ref-property';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'cards',
	name: '$t:layouts.cards.cards',
	icon: 'grid_view',
	component: CardsLayout,
	slots: {
		options: CardsOptions,
		sidebar: () => undefined,
		actions: CardsActions,
	},
	setup(props, { emit }) {
		const toolsStore = useAiToolsStore();

		toolsStore.onSystemToolResult((tool, input) => {
			if (tool === 'items' && input.collection === collection.value) {
				refresh();
			}
		});

		const { t, n } = useI18n();
		const relationsStore = useRelationsStore();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);

		const { collection, filter, search, filterSystem, filterUser } = toRefs(props);

		const routeVersionKey = useVersionQuery();
		const versionKey = computed(() => (props.selectMode ? null : routeVersionKey.value));

		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const { onClick } = useLayoutClickHandler({ props, selection, primaryKeyField, versionKey });

		const fileFields = computed(() => {
			return fieldsInCollection.value.filter((field) => {
				if (field.field === '$thumbnail') return true;

				const relation = relationsStore.relations.find((relation) => {
					return (
						relation.collection === props.collection &&
						relation.field === field.field &&
						relation.related_collection === 'directus_files'
					);
				});

				return !!relation;
			});
		});

		const { size, icon, imageSource, title, subtitle, imageFit } = useLayoutOptions();
		const { sort, limit, page, fields } = useLayoutQuery();

		const {
			items,
			loading,
			loadingItemCount,
			error,
			totalPages,
			itemCount,
			totalCount,
			getItems,
			getTotalCount,
			getItemCount,
		} = useItems(collection, {
			sort,
			limit,
			page,
			fields,
			filter,
			search,
			filterSystem,
			version: versionKey,
		});

		const isVersion = computed(() => !!versionKey.value && !isPublishedVersionKey(versionKey.value));

		const itemsOrVersions = computed(() => {
			if (!isVersion.value) return items.value;

			return items.value.map((item: Record<string, any>) => ({
				...item,
				_versionId: item.$meta?.version_id ?? null,
			}));
		});

		const showingCount = computed(() => {
			// Don't show count if there are no items
			if (!totalCount.value || !itemCount.value) return;

			return formatItemsCountPaginated({
				currentItems: itemCount.value,
				currentPage: page.value,
				perPage: limit.value,
				isFiltered: !!filterUser.value,
				totalItems: totalCount.value,
				i18n: { t, n },
			});
		});

		const width = ref(0);

		const isSingleRow = computed(() => {
			const cardsWidth = items.value.length * (size.value * 40) + (items.value.length - 1) * 24;
			return cardsWidth <= width.value;
		});

		return {
			items: itemsOrVersions,
			loading,
			loadingItemCount,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			totalCount,
			fieldsInCollection,
			limit,
			size,
			primaryKeyField,
			icon,
			fileFields,
			imageSource,
			title,
			subtitle,
			onClick,
			imageFit,
			sort,
			info,
			showingCount,
			isSingleRow,
			width,
			refresh,
			selectAll,
			resetPresetAndRefresh,
			filterUser,
			search,
			download,
			versionKey,
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
			getTotalCount(true);
			getItemCount(true);
		}

		function download() {
			if (!collection.value) return;
			saveAsCSV(collection.value, fields.value, items.value);
		}

		function toPage(newPage: number) {
			page.value = newPage;
		}

		function useLayoutOptions() {
			const size = createViewOption<number>('size', 4);
			const icon = createViewOption<string>('icon', 'box');
			const title = createViewOption<string | null>('title', null);
			const subtitle = createViewOption<string | null>('subtitle', null);
			const imageSource = createViewOption<string | null>('imageSource', fileFields.value[0]?.field ?? null);
			const imageFit = createViewOption<string>('imageFit', 'crop');

			return { size, icon, imageSource, title, subtitle, imageFit };

			function createViewOption<T>(key: keyof LayoutOptions, defaultValue: any) {
				return computed<T>({
					get() {
						return layoutOptions.value?.[key] !== undefined ? layoutOptions.value[key] : defaultValue;
					},
					set(newValue: T) {
						layoutOptions.value = {
							...layoutOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function useLayoutQuery() {
			const page = syncRefProperty(layoutQuery, 'page', 1);
			const limit = syncRefProperty(layoutQuery, 'limit', 25);
			const defaultSort = computed(() => (primaryKeyField.value ? [primaryKeyField.value?.field] : []));
			const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);

			const fields = computed<string[]>(() => {
				if (!primaryKeyField.value || !props.collection) return [];
				const fields = [primaryKeyField.value.field];

				if (imageSource.value) {
					fields.push(`${imageSource.value}.modified_on`);
					fields.push(`${imageSource.value}.type`);
					fields.push(`${imageSource.value}.filename_disk`);
					fields.push(`${imageSource.value}.storage`);
					fields.push(`${imageSource.value}.id`);
				}

				if (props.collection === 'directus_files' && imageSource.value === '$thumbnail') {
					fields.push('modified_on');
					fields.push('type');
				}

				const titleSubtitleFields: string[] = [];

				if (title.value) {
					titleSubtitleFields.push(...getFieldsFromTemplate(title.value));
				}

				if (subtitle.value) {
					titleSubtitleFields.push(...getFieldsFromTemplate(subtitle.value));
				}

				return [...fields, ...adjustFieldsForDisplays(titleSubtitleFields, props.collection)];
			});

			return { sort, limit, page, fields };
		}

		function selectAll() {
			if (isVersion.value) {
				selection.value = items.value.map((item) => item.$meta?.version_id).filter((id): id is string => !!id);

				return;
			}

			if (!primaryKeyField.value) return;
			const pk = primaryKeyField.value;
			selection.value = clone(items.value).map((item) => item[pk.field]);
		}
	},
});
