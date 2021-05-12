import { defineLayout } from '@/layouts/define';
import CardsLayout from './cards.vue';
import CardsOptions from './options.vue';
import CardsSidebar from './sidebar.vue';
import CardsActions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, inject, computed, ref } from 'vue';
import { FieldMeta } from '@/types';
import useCollection from '@/composables/use-collection/';
import useItems from '@/composables/use-items';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { useRelationsStore } from '@/stores/';

import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import useElementSize from '@/composables/use-element-size';
import { clone } from 'lodash';

export default defineLayout({
	id: 'cards',
	name: '$t:layouts.cards.cards',
	icon: 'grid_4',
	component: CardsLayout,
	slots: {
		options: CardsOptions,
		sidebar: CardsSidebar,
		actions: CardsActions,
	},
	setup(props) {
		const { t, n } = useI18n();

		const relationsStore = useRelationsStore();

		const layoutElement = ref<HTMLElement>();
		const mainElement = inject('main-element', ref<Element | null>(null));

		const { collection, searchQuery, selection, layoutOptions, layoutQuery, filters } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const fileFields = computed(() => {
			return fieldsInCollection.value.filter((field: FieldMeta) => {
				if (field.field === '$thumbnail') return true;

				const relation = relationsStore.relations.find((relation) => {
					return (
						relation.many_collection === props.collection &&
						relation.many_field === field.field &&
						relation.one_collection === 'directus_files'
					);
				});

				return !!relation;
			});
		});

		const { size, icon, imageSource, title, subtitle, imageFit } = uselayoutOptions();
		const { sort, limit, page, fields } = uselayoutQuery();

		const { items, loading, error, totalPages, itemCount, totalCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			fields: fields,
			filters: filters,
			searchQuery: searchQuery as any,
		});

		const newLink = computed(() => {
			return `/collections/${collection.value}/+`;
		});

		const showingCount = computed(() => {
			if ((itemCount.value || 0) < (totalCount.value || 0)) {
				if (itemCount.value === 1) {
					return t('one_filtered_item');
				}
				return t('start_end_of_count_filtered_items', {
					start: n((+page.value - 1) * limit.value + 1),
					end: n(Math.min(page.value * limit.value, itemCount.value || 0)),
					count: n(itemCount.value || 0),
				});
			}
			if (itemCount.value === 1) {
				return t('one_item');
			}
			return t('start_end_of_count_items', {
				start: n((+page.value - 1) * limit.value + 1),
				end: n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: n(itemCount.value || 0),
			});
		});

		const { width } = useElementSize(layoutElement);

		const isSingleRow = computed(() => {
			const cardsWidth = items.value.length * (size.value * 40) + (items.value.length - 1) * 24;
			return cardsWidth <= width.value;
		});

		const activeFilterCount = computed(() => {
			return filters.value.filter((filter) => !filter.locked).length;
		});

		return {
			items,
			loading,
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
			getLinkForItem,
			imageFit,
			sort,
			newLink,
			info,
			showingCount,
			isSingleRow,
			width,
			layoutElement,
			activeFilterCount,
			refresh,
			selectAll,
			resetPresetAndRefresh,
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
		}

		function toPage(newPage: number) {
			page.value = newPage;
			mainElement.value?.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		function uselayoutOptions() {
			const size = createViewOption<number>('size', 4);
			const icon = createViewOption('icon', 'box');
			const title = createViewOption<string>('title', null);
			const subtitle = createViewOption<string>('subtitle', null);
			const imageSource = createViewOption<string>('imageSource', fileFields.value[0]?.field ?? null);
			const imageFit = createViewOption<string>('imageFit', 'crop');

			return { size, icon, imageSource, title, subtitle, imageFit };

			function createViewOption<T>(key: string, defaultValue: any) {
				return computed<T>({
					get() {
						return layoutOptions.value?.[key] !== undefined ? layoutOptions.value?.[key] : defaultValue;
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

		function uselayoutQuery() {
			const page = computed({
				get() {
					return layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed({
				get() {
					return layoutQuery.value?.sort || primaryKeyField.value.field;
				},
				set(newSort: string) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: 1,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return layoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

			const fields = computed<string[]>(() => {
				if (!primaryKeyField.value) return [];
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

				if (sort.value) {
					const sortField = sort.value.startsWith('-') ? sort.value.substring(1) : sort.value;

					if (fields.includes(sortField) === false) {
						fields.push(sortField);
					}
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

		function getLinkForItem(item: Record<string, any>) {
			if (!primaryKeyField.value) return;
			return `/collections/${props.collection}/${encodeURIComponent(item[primaryKeyField.value!.field])}`;
		}

		function selectAll() {
			if (!primaryKeyField.value) return;
			selection.value = clone(items.value).map((item: any) => item[primaryKeyField.value.field]);
		}
	},
});
