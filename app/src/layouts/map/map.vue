<template>
	<div class="layout-map" ref="layoutElement">
		<portal to="layout-options">
			<template v-if="geometryFields.length == 0">
				<div class="field">
					<v-input type="text" disabled :prefix="'No compatible fields'"></v-input>
				</div>
			</template>
			<template v-else>
				<template>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.field') }}</div>
						<v-select
							v-model="geometryField"
							:items="geometryFields.map(({ name, field }) => ({ text: name, value: field }))"
						/>
					</div>
				</template>
			</template>

			<div class="field">
				<v-checkbox v-model="fitViewToData" :label="$t('layouts.map.fit_view')" />
			</div>
			<div class="field">
				<v-checkbox
					:label="$t('layouts.map.fit_data')"
					v-model="fitDataToView"
					:disabled="geometryOptions && geometryOptions.geometryFormat !== 'native'"
				/>
			</div>
			<div class="field">
				<v-checkbox
					:label="$t('layouts.map.cluster')"
					v-model="clusterData"
					:disabled="geometryOptions && geometryOptions.geometryType !== 'Point'"
				/>
			</div>
			<div class="field">
				<v-drawer
					v-model="customLayerDrawerOpen"
					:title="$t('layouts.map.custom_layers')"
					@cancel="customLayerDrawerOpen = false"
				>
					<template #activator="{ on }">
						<v-button @click="on">{{ $t('layouts.map.edit_custom_layers') }}</v-button>
					</template>

					<template #actions>
						<v-button icon rounded class="delete-action" @click="resetLayers" v-tooltip.bottom="$t('reset')">
							<v-icon name="replay" />
						</v-button>
						<v-button icon rounded @click="updateLayers" v-tooltip.bottom="$t('save')">
							<v-icon name="check" />
						</v-button>
					</template>
					<div class="custom-layers">
						<interface-input-code v-model="customLayers" language="json" type="json" :lineNumber="false" />
					</div>
				</v-drawer>
			</div>
		</portal>

		<portal to="sidebar">
			<filter-sidebar-detail v-model="_filters" :collection="collection" :loading="loading" />
		</portal>

		<portal to="actions:prepend">
			<transition name="fade">
				<span class="item-count" v-if="itemCount">
					{{ showingCount }}
				</span>
			</transition>
		</portal>

		<map-component
			ref="map"
			class="mapboxgl-map"
			:class="{ loading, error: error || geojsonError || !geometryOptions }"
			:data="geojson"
			:featureId="featureId"
			:selection="_selection"
			:camera="cameraOptions"
			:bounds="geojsonBounds"
			:source="directusSource"
			:layers="directusLayers"
			@click="handleClick"
			@select="updateSelection"
			@moveend="cameraOptions = $event"
		/>

		<transition name="fade">
			<v-info v-if="error" type="danger" :title="$t('unexpected_error')" icon="error" center>
				{{ $t('unexpected_error_copy') }}
				<template #append>
					<v-error :error="error" />
					<v-button small @click="resetPresetAndRefresh" class="reset-preset">
						{{ $t('reset_page_preferences') }}
					</v-button>
				</template>
			</v-info>
			<v-info
				v-else-if="geojsonError"
				type="warning"
				icon="wrong_location"
				center
				:title="$t('layouts.map.invalid_geometry')"
			>
				{{ geojsonError }}
			</v-info>
			<v-progress-circular v-else-if="loading || geojsonLoading" indeterminate x-large class="center" />
			<slot v-else-if="itemCount === 0 && (_searchQuery || activeFilterCount > 0)" name="no-results" />
		</transition>

		<template v-if="loading || itemCount > 0">
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
				<div class="mapboxgl-ctrl-dropdown">
					<span>{{ $t('per_page') }}</span>
					<v-select
						@input="limit = +$event"
						:value="`${limit}`"
						:items="['1e2', '1e3', '1e4', '1e5', '1e6', '1e7']"
						inline
					/>
				</div>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import MapComponent from './components/map.vue';
import { CameraOptions, AnyLayer } from 'maplibre-gl';
import { GeometryOptions, toGeoJSON } from '@/utils/geometry';
import { layers } from './style';
import { defineComponent, toRefs, computed, ref, watch } from '@vue/composition-api';
import type { PropType, Ref } from '@vue/composition-api';
import router from '@/router';
import { Filter } from '@/types';
import useCollection from '@/composables/use-collection/';
import useSync from '@/composables/use-sync/';
import useItems from '@/composables/use-items';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import type { Field, GeometryFormat } from '@/types';

import i18n from '@/lang';
import { cloneDeep, merge } from 'lodash';

type Item = Record<string, any>;

type LayoutQuery = {
	fields: string[];
	sort: string;
	limit: number;
	page: number;
};

type LayoutOptions = {
	cameraOptions?: CameraOptions & { bbox: any };
	customLayers?: Array<AnyLayer>;
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	fitViewToData?: boolean;
	fitDataToView?: boolean;
	clusterData?: boolean;
	animateOptions?: any;
};

export default defineComponent({
	components: { MapComponent },
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
			type: Object as PropType<LayoutOptions>,
			default: () => ({}),
		},
		layoutQuery: {
			type: Object as PropType<LayoutQuery>,
			default: () => ({}),
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		selectMode: {
			type: Boolean,
			default: false,
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
		const customLayerDrawerOpen = ref(false);
		const layoutElement = ref<HTMLElement | null>(null);
		const _filters = useSync(props, 'filters', emit);
		const _selection = useSync(props, 'selection', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);
		const _layoutQuery = useSync(props, 'layoutQuery', emit) as Ref<LayoutQuery>;
		const _layoutOptions = useSync(props, 'layoutOptions', emit) as Ref<LayoutOptions>;
		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const page = syncOption(_layoutQuery, 'page', 1);
		const limit = syncOption(_layoutQuery, 'limit', 1000);
		const sort = syncOption(_layoutQuery, 'sort', fieldsInCollection.value[0].field);

		const cameraOptions = syncOption(_layoutOptions, 'cameraOptions', undefined);
		const customLayers = syncOption(_layoutOptions, 'customLayers', layers);
		const fitViewToData = syncOption(_layoutOptions, 'fitViewToData', true);
		const fitDataToView = syncOption(_layoutOptions, 'fitDataToView', true);
		const clusterData = syncOption(_layoutOptions, 'clusterData', false);
		const geometryField = syncOption(_layoutOptions, 'geometryField', undefined);
		const geometryFormat = computed<GeometryFormat | undefined>({
			get: () => _layoutOptions.value?.geometryFormat,
			set(newValue: GeometryFormat | undefined) {
				_layoutOptions.value = {
					...(_layoutOptions.value || {}),
					geometryFormat: newValue,
					geometryField: undefined,
				};
			},
		});

		const geometryFields = computed(() => {
			return (fieldsInCollection.value as Field[]).filter(
				({ type, meta }) => type == 'geometry' || meta?.interface == 'map'
			);
		});

		watch(
			() => geometryFields.value,
			(fields) => {
				if (!geometryField.value && fields.length > 0) {
					geometryField.value = fields[0].field;
				}
			},
			{ immediate: true }
		);

		const geometryOptions = computed<GeometryOptions | undefined>(() => {
			const field = fieldsInCollection.value.filter((field: Field) => field.field == geometryField.value)[0];
			if (!field) return undefined;
			if (field.type == 'geometry') {
				return {
					geometryField: field.field,
					geometryFormat: 'native',
					geometryType: field.schema.geometry_type,
				} as GeometryOptions;
			}
			if (field.meta && field.meta.interface == 'map' && field.meta.options) {
				return {
					geometryField: field.field,
					geometryFormat: field.meta.options.geometryFormat,
					geometryType: field.meta.options.geometryType,
				} as GeometryOptions;
			}
			return undefined;
		});

		watch(
			() => geometryOptions.value,
			(options, previous) => {
				if (options?.geometryFormat !== 'native') {
					fitDataToView.value = false;
				}
			}
		);

		const template = computed(() => {
			if (info.value?.meta?.display_template) return info.value?.meta?.display_template;
			const fields: Field[] = fieldsInCollection.value;
			return fields
				.slice(0, 3)
				.map((f) => `{{${f.field}}}`)
				.join(' ');
		});

		const queryFields = computed(() => {
			return [geometryField.value, ...getFieldsFromTemplate(template.value)]
				.concat(primaryKeyField.value?.field)
				.filter((e) => !!e) as string[];
		});

		const viewBoundsfilter = computed<Filter | undefined>(() => {
			/* eslint-disable vue/no-side-effects-in-computed-properties */
			if (geometryOptions.value?.geometryFormat !== 'native') {
				return;
			}
			if (!geometryField.value || !cameraOptions.value || !fitDataToView.value) {
				shouldUpdateCamera.value = true;
				return;
			}
			shouldUpdateCamera.value = false;
			const bbox = cameraOptions.value.bbox;
			const bboxPolygon = [
				[bbox[0], bbox[1]],
				[bbox[2], bbox[1]],
				[bbox[2], bbox[3]],
				[bbox[0], bbox[3]],
				[bbox[0], bbox[1]],
			];
			return {
				field: geometryField.value,
				operator: 'intersects' as any,
				value: {
					type: 'Polygon',
					coordinates: [bboxPolygon],
				} as any,
			} as Filter;
		});

		const shouldUpdateCamera = ref(false);
		const __filters = computed(() => {
			return _filters.value.concat(viewBoundsfilter.value ?? []);
		});

		const { items, loading, error, totalPages, itemCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			fields: queryFields,
			filters: __filters,
			searchQuery: _searchQuery,
		});

		const geojson = ref<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
		const geojsonBounds = ref<GeoJSON.BBox>();
		const geojsonError = ref<string | null>();
		const geojsonLoading = ref(false);

		watch(() => searchQuery.value, onQueryChange);
		watch(() => collection.value, onQueryChange);
		watch(() => limit.value, onQueryChange);
		watch(() => sort.value, onQueryChange);
		watch(() => items.value, updateGeojson);

		watch(
			() => geometryField.value,
			() => (shouldUpdateCamera.value = true)
		);

		function onQueryChange() {
			shouldUpdateCamera.value = true;
			geojsonLoading.value = false;
			page.value = 1;
		}

		function updateGeojson() {
			if (geometryOptions.value) {
				try {
					geojson.value = { type: 'FeatureCollection', features: [] };
					geojsonLoading.value = true;
					geojsonError.value = null;
					geojson.value = toGeoJSON(items.value, geometryOptions.value, template.value);
					geojsonLoading.value = false;
					if (!cameraOptions.value || (shouldUpdateCamera.value && fitViewToData.value)) {
						geojsonBounds.value = geojson.value.bbox;
					}
					shouldUpdateCamera.value = true;
				} catch (error) {
					geojsonLoading.value = false;
					geojsonError.value = error;
					geojson.value = { type: 'FeatureCollection', features: [] };
				}
			} else {
				geojson.value = { type: 'FeatureCollection', features: [] };
			}
		}

		const directusLayers = ref(layers);
		const directusSource = ref({
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
		});

		watch(() => clusterData.value, updateSource, { immediate: true });
		updateLayers();

		function updateLayers() {
			customLayerDrawerOpen.value = false;
			directusLayers.value = customLayers.value ?? [];
		}

		function resetLayers() {
			directusLayers.value = cloneDeep(layers);
			customLayers.value = directusLayers.value;
		}

		function updateSource() {
			directusSource.value = merge({}, directusSource.value, {
				cluster: clusterData.value,
			});
		}

		function updateSelection(selected: Array<string | number> | null) {
			if (selected) {
				_selection.value = Array.from(new Set(_selection.value.concat(selected)));
			} else {
				_selection.value = [];
			}
		}

		const featureId = computed(() => {
			return props.readonly ? null : primaryKeyField.value?.field;
		});

		function handleClick(key: number | string) {
			if (props.selectMode) {
				updateSelection([key]);
			} else {
				router.push(`/collections/${collection.value}/${key}`);
			}
		}

		const showingCount = computed(() => {
			return i18n.t('start_end_of_count_items', {
				start: i18n.n((+page.value - 1) * limit.value + 1),
				end: i18n.n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: i18n.n(itemCount.value || 0),
			});
		});

		const activeFilterCount = computed(() => {
			return _filters.value.filter((filter) => !filter.locked).length;
		});

		return {
			template,
			_selection,
			geojson,
			directusSource,
			directusLayers,
			customLayers,
			updateLayers,
			resetLayers,
			featureId,
			geojsonBounds,
			geojsonLoading,
			geojsonError,
			geometryOptions,
			handleClick,
			geometryFormat,
			geometryField,
			cameraOptions,
			fitViewToData,
			fitDataToView,
			clusterData,
			updateSelection,
			items,
			loading,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			fieldsInCollection,
			limit,
			primaryKeyField,
			sort,
			_filters,
			_searchQuery,
			info,
			showingCount,
			layoutElement,
			activeFilterCount,
			refresh,
			resetPresetAndRefresh,
			geometryFields,
			customLayerDrawerOpen,
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
		}

		function syncOption<R, T extends keyof R>(ref: Ref<R>, key: T, defaultValue: R[T]) {
			return computed<R[T]>({
				get: () => ref.value?.[key] ?? defaultValue,
				set: (value: R[T]) => {
					ref.value = Object.assign({}, ref.value, { [key]: value }) as R;
				},
			});
		}
	},
});
</script>

<style lang="scss">
.mapboxgl-ctrl-dropdown {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 36px;
	padding: 10px;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	border: var(--border-width) solid var(--background-subdued);
	border-radius: var(--border-radius);

	span {
		width: auto;
		margin-right: 4px;
	}

	.v-select {
		color: var(--foreground-normal);
	}
}
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';
@import '@/styles/mixins/form-grid';

.layout-map {
	width: 100%;
	height: calc(100% - 65px);
}
.layout-map::v-deep .mapboxgl-map .mapboxgl-canvas-container {
	transition: opacity 0.2s;
}
.layout-map::v-deep .mapboxgl-map.loading .mapboxgl-canvas-container {
	opacity: 0.9;
}
.layout-map::v-deep .mapboxgl-map.error .mapboxgl-canvas-container {
	opacity: 0.4;
}
.center {
	position: absolute;
	top: 50%;
	left: 50%;
	-webkit-transform: translate(-50%, -50%);
	transform: translate(-50%, -50%);
}

.v-progress-circular {
	--v-progress-circular-background-color: var(--primary-25);
	--v-progress-circular-color: var(--primary-75);
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

.delete-action {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.custom-layers {
	padding: var(--content-padding);
	padding-top: 0;
}

.v-info {
	padding: 20px;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
}

.footer {
	position: absolute;
	right: 10px;
	bottom: 10px;
	left: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	padding-top: 40px;
	overflow: hidden;
	background-color: transparent !important;

	.pagination {
		--v-button-height: 28px;

		display: inline-block;

		button {
			box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.2);
		}
	}
}
</style>
