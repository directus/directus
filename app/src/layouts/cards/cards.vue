<template>
	<div class="layout-cards" :style="{ '--size': size * 40 + 'px' }" ref="layoutElement">
		<portal to="layout-options">
			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.cards.image_source') }}</div>
				<v-select v-model="imageSource" show-deselect item-value="field" item-text="name" :items="fileFields" />
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.cards.title') }}</div>
				<v-field-template :collection="collection" v-model="title" />
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.cards.subtitle') }}</div>
				<v-field-template :collection="collection" v-model="subtitle" />
			</div>

			<v-detail>
				<template #title>{{ $t('layout_setup') }}</template>

				<div class="layout-option">
					<div class="option-label">{{ $t('layouts.cards.image_fit') }}</div>
					<v-select
						v-model="imageFit"
						:disabled="imageSource === null"
						:items="[
							{
								text: $t('layouts.cards.crop'),
								value: 'crop',
							},
							{
								text: $t('layouts.cards.contain'),
								value: 'contain',
							},
						]"
					/>
				</div>

				<div class="layout-option">
					<div class="option-label">{{ $t('fallback_icon') }}</div>
					<interface-icon v-model="icon" />
				</div>
			</v-detail>
		</portal>

		<portal to="drawer">
			<filter-drawer-detail v-model="_filters" :collection="collection" :loading="loading" />
		</portal>

		<portal to="actions:prepend">
			<transition name="fade">
				<span class="item-count" v-if="itemCount">{{ showingCount }}</span>
			</transition>
		</portal>

		<template v-if="loading || itemCount > 0">
			<cards-header
				@select-all="selectAll"
				:fields="availableFields"
				:size.sync="size"
				:selection.sync="_selection"
				:sort.sync="sort"
			/>

			<div class="grid" :class="{ 'single-row': isSingleRow }">
				<template v-if="loading">
					<card v-for="n in 6" :key="`loader-${n}`" item-key="loading" loading />
				</template>

				<card
					v-else
					v-for="item in items"
					:item-key="primaryKeyField.field"
					:key="item[primaryKeyField.field]"
					:crop="imageFit === 'crop'"
					:icon="icon"
					:file="imageSource ? item[imageSource] : null"
					:item="item"
					:select-mode="selectMode || (_selection && _selection.length > 0)"
					:to="getLinkForItem(item)"
					:readonly="readonly"
					v-model="_selection"
				>
					<template #title v-if="title">
						<render-template :collection="collection" :item="item" :template="title" />
					</template>
					<template #subtitle v-if="subtitle">
						<render-template :collection="collection" :item="item" :template="subtitle" />
					</template>
				</card>
			</div>

			<div class="footer">
				<div class="pagination">
					<v-pagination
						v-if="totalPages > 1"
						:length="totalPages"
						:total-visible="7"
						show-first-last
						:value="page"
						@input="toPage"
					/>
				</div>

				<div v-if="loading === false && items.length >= 25" class="per-page">
					<span>{{ $t('per_page') }}</span>
					<v-select @input="limit = +$event" :value="`${limit}`" :items="['25', '50', '100', '250']" inline />
				</div>
			</div>
		</template>

		<slot v-else-if="itemCount === 0 && activeFilterCount > 0" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, inject, computed, ref } from '@vue/composition-api';
import { Filter } from '@/types';
import useSync from '@/composables/use-sync/';
import useCollection from '@/composables/use-collection/';
import useItems from '@/composables/use-items';
import Card from './components/card.vue';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import { useRelationsStore } from '@/stores/';

import CardsHeader from './components/header.vue';
import i18n from '@/lang';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import useElementSize from '@/composables/use-element-size';
import { clone } from 'lodash';

type Item = Record<string, any>;

type ViewOptions = {
	size?: number;
	icon?: string;
	imageSource?: string;
	title?: string;
	subtitle?: string;
	imageFit?: 'crop' | 'contain';
};

type ViewQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
};

export default defineComponent({
	components: { Card, CardsHeader },
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: undefined,
		},
		viewOptions: {
			type: Object as PropType<ViewOptions>,
			default: null,
		},
		viewQuery: {
			type: Object as PropType<ViewQuery>,
			default: null,
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		file: {
			type: Object as PropType<File>,
			default: null,
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();

		const layoutElement = ref<HTMLElement | null>(null);
		const mainElement = inject('main-element', ref<Element | null>(null));

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const availableFields = computed(() => fieldsInCollection.value.filter((field) => field.meta.hidden !== true));

		const fileFields = computed(() => {
			return availableFields.value.filter((field) => {
				if (field.field === '$file') return true;

				const relation = relationsStore.state.relations.find((relation) => {
					return (
						relation.many_collection === props.collection &&
						relation.many_field === field.field &&
						relation.one_collection === 'directus_files'
					);
				});

				return !!relation;
			});
		});

		const { size, icon, imageSource, title, subtitle, imageFit } = useViewOptions();
		const { sort, limit, page, fields } = useViewQuery();

		const { items, loading, error, totalPages, itemCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			fields: fields,
			filters: _filters,
			searchQuery,
		});

		const newLink = computed(() => {
			return `/collections/${collection.value}/+`;
		});

		const showingCount = computed(() => {
			return i18n.t('start_end_of_count_items', {
				start: i18n.n((+page.value - 1) * limit.value + 1),
				end: i18n.n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: i18n.n(itemCount.value || 0),
			});
		});

		const { width } = useElementSize(layoutElement);

		const isSingleRow = computed(() => {
			const cardsWidth = items.value.length * (size.value * 40) + (items.value.length - 1) * 24;
			return cardsWidth <= width.value;
		});

		const activeFilterCount = computed(() => {
			return _filters.value.filter((filter) => !filter.locked).length;
		});

		return {
			_selection,
			items,
			loading,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			availableFields,
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
			fieldsInCollection,
			_filters,
			newLink,
			info,
			showingCount,
			isSingleRow,
			width,
			layoutElement,
			activeFilterCount,
			refresh,
			selectAll,
		};

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

		function useViewOptions() {
			const size = createViewOption<number>('size', 4);
			const icon = createViewOption('icon', 'box');
			const title = createViewOption<string>('title', null);
			const subtitle = createViewOption<string>('subtitle', null);
			const imageSource = createViewOption<string>('imageSource', fileFields.value[0]?.field ?? null);
			const imageFit = createViewOption<string>('imageFit', 'crop');

			return { size, icon, imageSource, title, subtitle, imageFit };

			function createViewOption<T>(key: keyof ViewOptions, defaultValue: any) {
				return computed<T>({
					get() {
						return _viewOptions.value?.[key] !== undefined ? _viewOptions.value?.[key] : defaultValue;
					},
					set(newValue: T) {
						_viewOptions.value = {
							..._viewOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function useViewQuery() {
			const page = ref(1);

			const sort = createViewQueryOption<string>('sort', availableFields.value[0].field);
			const limit = createViewQueryOption<number>('limit', 25);

			const fields = computed<string[]>(() => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const fields = [primaryKeyField.value!.field];

				if (imageSource.value) {
					fields.push(`${imageSource.value}.type`);
					fields.push(`${imageSource.value}.filename_disk`);
					fields.push(`${imageSource.value}.storage`);
					fields.push(`${imageSource.value}.id`);
				}

				if (props.collection === 'directus_files' && imageSource.value === '$file') {
					fields.push('type');
				}

				const sortField = sort.value.startsWith('-') ? sort.value.substring(1) : sort.value;

				if (fields.includes(sortField) === false) {
					fields.push(sortField);
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

			function createViewQueryOption<T>(key: keyof ViewQuery, defaultValue: any) {
				return computed<T>({
					get() {
						return _viewQuery.value?.[key] || defaultValue;
					},
					set(newValue: T) {
						page.value = 1;
						_viewQuery.value = {
							..._viewQuery.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function getLinkForItem(item: Record<string, any>) {
			return `/collections/${props.collection}/${item[primaryKeyField.value!.field]}`;
		}

		function selectAll() {
			if (!primaryKeyField.value) return;
			emit(
				'update:selection',
				clone(items.value).map((item: any) => item[primaryKeyField.value.field])
			);
		}
	},
});
</script>

<style lang="scss" scoped>
.layout-cards {
	padding: var(--content-padding);
	padding-top: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(var(--size), 1fr));
	gap: 32px 24px;

	&.single-row {
		grid-template-columns: repeat(auto-fit, var(--size));
	}
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 40px;

	.pagination {
		display: inline-block;
	}

	.per-page {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		width: 240px;
		color: var(--foreground-subdued);

		span {
			width: auto;
			margin-right: 4px;
		}

		.v-select {
			color: var(--foreground-normal);
		}
	}
}

.item-count {
	position: relative;
	margin: 0 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
