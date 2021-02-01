<template>
	<div class="layout-cards" :style="{ '--size': size * 40 + 'px' }" ref="layoutElement">
		<portal to="layout-options">
			<div class="field">
				<div class="type-label">{{ $t('layouts.cards.image_source') }}</div>
				<v-select v-model="imageSource" show-deselect item-value="field" item-text="name" :items="fileFields" />
			</div>

			<div class="field">
				<div class="type-label">{{ $t('layouts.cards.title') }}</div>
				<v-field-template :collection="collection" v-model="title" />
			</div>

			<div class="field">
				<div class="type-label">{{ $t('layouts.cards.subtitle') }}</div>
				<v-field-template :collection="collection" v-model="subtitle" />
			</div>

			<v-detail class="field">
				<template #title>{{ $t('layout_setup') }}</template>

				<div class="nested-options">
					<div class="field">
						<div class="type-label">{{ $t('layouts.cards.image_fit') }}</div>
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

					<div class="field">
						<div class="type-label">{{ $t('fallback_icon') }}</div>
						<interface-icon v-model="icon" />
					</div>
				</div>
			</v-detail>
		</portal>

		<portal to="sidebar">
			<filter-sidebar-detail v-model="_filters" :collection="collection" :loading="loading" />
		</portal>

		<portal to="actions:prepend">
			<transition name="fade">
				<span class="item-count" v-if="itemCount">{{ showingCount }}</span>
			</transition>
		</portal>

		<template v-if="loading || itemCount > 0">
			<cards-header
				@select-all="selectAll"
				:fields="fieldsInCollection"
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

		<v-info v-else-if="error" type="danger" :title="$t('unexpected_error')" icon="error" center>
			{{ $t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />

				<v-button small @click="resetPresetAndRefresh" class="reset-preset">
					{{ $t('reset_page_preferences') }}
				</v-button>
			</template>
		</v-info>

		<slot v-else-if="itemCount === 0 && activeFilterCount > 0" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, inject, computed, ref } from '@vue/composition-api';
import { Filter } from '../../types';
import useSync from '../../composables/use-sync/';
import useCollection from '../../composables/use-collection/';
import useItems from '../../composables/use-items';
import Card from './components/card.vue';
import getFieldsFromTemplate from '../../utils/get-fields-from-template';
import { useRelationsStore } from '../../stores/';

import CardsHeader from './components/header.vue';
import i18n from '../../lang';
import adjustFieldsForDisplays from '../../utils/adjust-fields-for-displays';
import useElementSize from '../../composables/use-element-size';
import { clone } from 'lodash';

type Item = Record<string, any>;

type layoutOptions = {
	size?: number;
	icon?: string;
	imageSource?: string;
	title?: string;
	subtitle?: string;
	imageFit?: 'crop' | 'contain';
};

type layoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
	page?: number;
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
		layoutOptions: {
			type: Object as PropType<layoutOptions>,
			default: null,
		},
		layoutQuery: {
			type: Object as PropType<layoutQuery>,
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
		resetPreset: {
			type: Function as PropType<() => Promise<void>>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();

		const layoutElement = ref<HTMLElement | null>(null);
		const mainElement = inject('main-element', ref<Element | null>(null));

		const _selection = useSync(props, 'selection', emit);
		const _layoutOptions = useSync(props, 'layoutOptions', emit);
		const _layoutQuery = useSync(props, 'layoutQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const fileFields = computed(() => {
			return fieldsInCollection.value.filter((field) => {
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

		const { size, icon, imageSource, title, subtitle, imageFit } = uselayoutOptions();
		const { sort, limit, page, fields } = uselayoutQuery();

		const { items, loading, error, totalPages, itemCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			fields: fields,
			filters: _filters,
			searchQuery: _searchQuery as any,
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

			function createViewOption<T>(key: keyof layoutOptions, defaultValue: any) {
				return computed<T>({
					get() {
						return _layoutOptions.value?.[key] !== undefined ? _layoutOptions.value?.[key] : defaultValue;
					},
					set(newValue: T) {
						_layoutOptions.value = {
							..._layoutOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function uselayoutQuery() {
			const page = computed({
				get() {
					return _layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed({
				get() {
					return _layoutQuery.value?.sort || fieldsInCollection.value[0].field;
				},
				set(newSort: string) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
						page: 1,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return _layoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
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

				if (props.collection === 'directus_files' && imageSource.value === '$file') {
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
@import '../../styles/mixins/breakpoint';
@import '../../styles/mixins/form-grid';

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
	display: none;
	margin: 0 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;

	@include breakpoint(small) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}

.nested-options {
	@include form-grid;
}

.reset-preset {
	margin-top: 24px;
}
</style>
