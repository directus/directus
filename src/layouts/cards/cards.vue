<template>
	<div class="layout-cards" :style="{ '--size': size + 'px' }">
		<portal to="drawer">
			<drawer-detail icon="settings" :title="$t('setup')">
				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.image_source') }}</div>
					<v-select
						v-model="imageSource"
						full-width
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
						full-width
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
					<v-input full-width v-model="title" />
				</div>

				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.subtitle') }}</div>
					<v-input full-width v-model="subtitle" />
				</div>

				<div class="setting">
					<div class="label type-text">{{ $t('layouts.cards.fallback_icon') }}</div>
					<v-input full-width v-model="icon" />
				</div>
			</drawer-detail>
		</portal>

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

			<div class="per-page">
				<span>{{ $t('layouts.tabular.per_page') }}</span>
				<v-select
					@input="limit = +$event"
					:value="`${limit}`"
					:items="['10', '25', '50', '100', '250']"
				/>
			</div>
		</div>

		<v-info
			v-if="loading === false && items.length === 0"
			:title="$tc('item_count', 0)"
			icon="box"
		/>
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
	},
	setup(props, { emit }) {
		const mainElement = inject('main-element', ref<Element>(null));
		const projectsStore = useProjectsStore();

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);
		const _filters = useSync(props, 'filters', emit);

		const { collection } = toRefs(props);
		const { primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const availableFields = computed(() =>
			fieldsInCollection.value.filter((field) => field.hidden_browse === false)
		);

		const fileFields = computed(() => {
			return [...availableFields.value.filter((field) => field.type === 'file')];
		});

		const { size, icon, imageSource, title, subtitle, imageFit } = useViewOptions();
		const { sort, limit, page, fields } = useViewQuery();

		const { items, loading, error, totalPages, itemCount } = useItems(collection, {
			sort,
			limit,
			page,
			fields: fields,
			filters: _filters,
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
		};

		function toPage(newPage: number) {
			page.value = newPage;
			mainElement.value?.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
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
</style>
