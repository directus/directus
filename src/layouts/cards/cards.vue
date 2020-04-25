<template>
	<div class="layout-cards" :style="{ '--size': size * 40 + 'px' }">
		<portal to="drawer">
			<filter-drawer-detail v-model="_filters" :collection="collection" :loading="loading" />

			<drawer-detail icon="settings" :title="$t('setup')">
				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.image_source') }}</div>
					<v-select
						v-model="imageSource"
						allow-null
						item-value="field"
						item-text="name"
						:items="fileFields"
					/>
				</div>

				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.image_fit') }}</div>
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

				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.title') }}</div>
					<v-input v-model="title" />
				</div>

				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.subtitle') }}</div>
					<v-input v-model="subtitle" />
				</div>

				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.fallback_icon') }}</div>
					<v-input v-model="icon" />
				</div>
			</drawer-detail>
		</portal>

		<portal to="actions:prepend">
			<transition name="fade">
				<span class="item-count" v-if="totalCount">{{ showingCount }}</span>
			</transition>
		</portal>

		<template v-if="loading || itemCount > 0">
			<cards-header
				:fields="availableFields"
				:size.sync="size"
				:selection.sync="_selection"
				:sort.sync="sort"
			/>

			<div class="grid">
				<template v-if="loading">
					<card v-for="n in limit" :key="`loader-${n}`" loading />
				</template>

				<card
					v-else
					v-for="item in items"
					:key="item[primaryKeyField.field]"
					:crop="imageFit === 'crop'"
					:icon="icon"
					:file="imageSource ? item[imageSource] : null"
					:item="item"
					:select-mode="selectMode || _selection.length > 0"
					:to="getLinkForItem(item)"
					v-model="_selection"
				>
					<template #title v-if="title">
						<render-template :collection="collection" :item="item" :template="title" />
					</template>
					<template #subtitle v-if="subtitle">
						<render-template
							:collection="collection"
							:item="item"
							:template="subtitle"
						/>
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
					<v-select
						@input="limit = +$event"
						:value="`${limit}`"
						:items="['25', '50', '100', '250']"
					/>
				</div>
			</div>
		</template>

		<v-info v-else-if="itemCount === 0" :title="$t('no_results')" icon="search">
			{{ $t('no_results_copy') }}

			<template #append>
				<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
			</template>
		</v-info>

		<v-info v-else :title="$tc('item_count', 0)" :icon="info.icon">
			{{ $t('no_items_copy') }}

			<template #append>
				<v-button :to="newLink">{{ $t('add_new_item') }}</v-button>
			</template>
		</v-info>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, inject, computed, ref } from '@vue/composition-api';
import { Filter } from '@/stores/collection-presets/types';
import useSync from '@/compositions/use-sync/';
import useCollection from '@/compositions/use-collection/';
import useItems from '@/compositions/use-items';
import Card from './components/card.vue';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import { render } from 'micromustache';
import useProjectsStore from '@/stores/projects';
import CardsHeader from './components/header.vue';
import i18n from '@/lang';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		detailRoute: {
			type: String,
			default: `/{{project}}/collections/{{collection}}/{{primaryKey}}`,
		},
		file: {
			type: Object as PropType<File>,
			default: null,
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const mainElement = inject('main-element', ref<Element>(null));
		const projectsStore = useProjectsStore();

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const availableFields = computed(() =>
			fieldsInCollection.value.filter((field) => field.hidden_browse === false)
		);

		const fileFields = computed(() => {
			return [...availableFields.value.filter((field) => field.type === 'file')];
		});

		const { size, icon, imageSource, title, subtitle, imageFit } = useViewOptions();
		const { sort, limit, page, fields } = useViewQuery();

		const { items, loading, error, totalPages, itemCount, totalCount } = useItems(collection, {
			sort,
			limit,
			page,
			fields: fields,
			filters: _filters,
			searchQuery,
		});

		const newLink = computed(() => {
			return render(props.detailRoute, {
				project: projectsStore.state.currentProjectKey,
				collection: collection.value,
				primaryKey: '+',
				item: null,
			});
		});

		const showingCount = computed(() => {
			return i18n.t('showing_start_end_of_count_items', {
				start: i18n.n((+page.value - 1) * limit.value + 1),
				end: i18n.n(Math.min(page.value * limit.value, totalCount.value || 0)),
				count: i18n.n(totalCount.value || 0),
			});
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
			clearFilters,
			totalCount,
			showingCount,
		};

		function toPage(newPage: number) {
			page.value = newPage;
			mainElement.value?.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		function clearFilters() {
			_filters.value = [];
			_searchQuery.value = null;
		}

		function useViewOptions() {
			const size = createViewOption('size', 120);
			const icon = createViewOption('icon', 'box');
			const title = createViewOption<string>('title', null);
			const subtitle = createViewOption<string>('subtitle', null);
			const imageSource = createViewOption<string>(
				'imageSource',
				fileFields.value[0]?.field ?? null
			);
			const imageFit = createViewOption<string>('imageFit', 'crop');

			return { size, icon, imageSource, title, subtitle, imageFit };

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			function createViewOption<T>(key: keyof ViewOptions, defaultValue: any) {
				return computed<T>({
					get() {
						return _viewOptions.value?.[key] !== undefined
							? _viewOptions.value?.[key]
							: defaultValue;
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

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const sort = createViewQueryOption<string>('sort', primaryKeyField.value!.field);
			const limit = createViewQueryOption<number>('limit', 25);

			const fields = computed<string[]>(() => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const fields = [primaryKeyField.value!.field];

				if (imageSource.value) {
					fields.push(`${imageSource.value}.type`);
					fields.push(`${imageSource.value}.data`);
				}

				if (title.value) {
					fields.push(...getFieldsFromTemplate(title.value));
				}

				if (subtitle.value) {
					fields.push(...getFieldsFromTemplate(subtitle.value));
				}

				const sortField = sort.value.startsWith('-') ? sort.value.substring(1) : sort.value;

				if (fields.includes(sortField) === false) {
					fields.push(sortField);
				}

				return fields;
			});

			return { sort, limit, page, fields };

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function getLinkForItem(item: Record<string, any>) {
			const currentProjectKey = projectsStore.state.currentProjectKey;

			return render(props.detailRoute, {
				item: item,
				collection: props.collection,
				project: currentProjectKey,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				primaryKey: item[primaryKeyField.value!.field],
			});
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
	grid-gap: 32px 24px;
	grid-template-columns: repeat(auto-fit, minmax(var(--size), 1fr));
	justify-content: stretch;
	justify-items: stretch;
}

.v-info {
	margin: 20vh 0;
}

.label {
	margin-bottom: 4px;
}

.setting {
	margin-bottom: 12px;
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
	}
}

.item-count {
	position: relative;
	margin-right: 8px;
	color: var(--foreground-subdued);
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
