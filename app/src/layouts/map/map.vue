<template>
	<div class="layout-map" ref="layoutElement">
		<portal to="layout-options">
			<template v-if="availableFields.length == 0">
				<div class="field">
					<v-input type="text" disabled :prefix="'No compatible fields'"></v-input>
				</div>
			</template>
			<template v-else>
				<template>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.field') }}</div>
						<v-select v-model="geometryField" :items="availableFields" />
					</div>
				</template>
			</template>

			<div class="field">
				<v-checkbox v-model="fitDataBounds" :label="$t('layouts.map.fit_auto')" />
			</div>
			<div class="field">
				<v-checkbox v-model="clusterActive" :label="$t('layouts.map.cluster')" />
			</div>
			<template v-if="clusterActive">
				<div class="field">
					<div class="type-label">{{ $t('layouts.map.cluster_radius') }}</div>
					<v-input v-model="clusterRadius" type="number" :min="0" />
				</div>
				<div class="field">
					<div class="type-label">{{ $t('layouts.map.cluster_minpoints') }}</div>
					<v-input v-model="clusterMinPoints" type="number" :min="0" />
				</div>
				<div class="field">
					<div class="type-label">{{ $t('layouts.map.cluster_maxzoom') }}</div>
					<v-input v-model="clusterMaxZoom" type="number" :min="0" />
				</div>
			</template>
			<v-detail class="field" :label="$t('advanced_settings')">
				<div class="nested-options">
					<div class="field">
						<v-checkbox v-model="fitBoundsAnimate" :label="$t('layouts.map.fit_animate')" />
					</div>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.fit_speed') }}</div>
						<v-input v-model="fitBoundsSpeed" type="number" :step="0.1" :min="0" />
					</div>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.fit_padding') }}</div>
						<v-input v-model="fitBoundsPadding" type="number" />
					</div>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.simplify') }}</div>
						<v-input v-model="simplification" type="number" :step="0.05" :min="0" :max="1" />
					</div>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.custom_layers') }}</div>
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
				</div>
			</v-detail>
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
			:class="{ loading, error: error || geojsonError || !geometryOptions || itemCount === 0 }"
			:data="geojson"
			:featureId="featureId"
			:selection="_selection"
			:camera="cameraOptions"
			:bounds="geojsonBounds"
			:source="directusSource"
			:layers="directusLayers"
			@click="gotoEdit"
			@select="updateSelection"
			@moveend="cameraOptions = $event"
			:animateOptions="{
				animate: fitBoundsAnimate,
				padding: fitBoundsPadding,
				speed: fitBoundsSpeed,
			}"
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
				v-else-if="!geometryOptions"
				icon="not_listed_location"
				center
				:title="$t('layouts.map.field_not_found')"
			></v-info>
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
			<slot v-else-if="itemCount === 0" name="no-items" />
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
import { GeometryOptions, GeometryFormat, GeometryType, toGeoJSON } from './lib';
import { layers } from './style';
import { defineComponent, toRefs, computed, ref, watch } from '@vue/composition-api';
import type { PropType, Ref } from '@vue/composition-api';
import router from '@/router';
import { Filter } from '@/types';
import useCollection from '@/composables/use-collection/';
import useSync from '@/composables/use-sync/';
import useItems from '@/composables/use-items';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import type { Field } from '@/types';

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
	cameraOptions?: CameraOptions;
	customLayers?: Array<AnyLayer>;
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	geometryCRS?: string;
	simplification?: number;
	fitDataBounds?: boolean;
	fitBoundsAnimate?: boolean;
	fitBoundsPadding?: number;
	fitBoundsSpeed?: number;
	clusterActive?: boolean;
	clusterRadius?: number;
	clusterMaxZoom?: number;
	clusterMinPoints?: number;
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
		const simplification = syncOption(_layoutOptions, 'simplification', 0.375);
		const fitDataBounds = syncOption(_layoutOptions, 'fitDataBounds', true);
		const fitBoundsAnimate = syncOption(_layoutOptions, 'fitBoundsAnimate', true);
		const fitBoundsPadding = syncOption(_layoutOptions, 'fitBoundsPadding', 100);
		const fitBoundsSpeed = syncOption(_layoutOptions, 'fitBoundsSpeed', 1.4);
		const clusterActive = syncOption(_layoutOptions, 'clusterActive', true);
		const clusterRadius = syncOption(_layoutOptions, 'clusterRadius', 50);
		const clusterMaxZoom = syncOption(_layoutOptions, 'clusterMaxZoom', 12);
		const clusterMinPoints = syncOption(_layoutOptions, 'clusterMinPoints', 2);
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

		const geometryOptions = computed<GeometryOptions | undefined>(() => {
			const field = fieldsInCollection.value.filter((field: Field) => field.field == geometryField.value)[0];
			if (!field) return;
			if (field.type == 'geometry') {
				const special = field.meta?.special ?? ([] as [string, GeometryFormat, GeometryType?]);
				return {
					geometryField: field.field,
					geometryFormat: special[1],
					geometryType: special[2],
				};
			}
			if (field?.meta?.interface == 'map') {
				return {
					geometryField: field.field,
					geometryFormat: field.meta.options.geometryFormat,
					geometryType: field.meta.options.geometryType,
					geometryCRS: field.meta.options.geometryCRS,
				};
			}
			return undefined;
		});

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

		const { items, loading, error, totalPages, itemCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			fields: queryFields,
			filters: _filters,
			searchQuery: _searchQuery,
		});

		const geojson = ref<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
		const geojsonBounds = ref<GeoJSON.BBox>();
		const geojsonError = ref<string | null>();
		const geojsonLoading = ref(false);
		const geojsonDataChanged = ref(false);

		watch(() => searchQuery.value, onQueryChange);
		watch(() => collection.value, onQueryChange);
		watch(() => limit.value, onQueryChange);
		watch(() => sort.value, onQueryChange);
		watch(() => items.value, updateGeojson);

		watch(
			() => geometryField.value,
			() => (geojsonDataChanged.value = true)
		);

		function onQueryChange() {
			geojsonLoading.value = false;
			page.value = 1;
			geojsonDataChanged.value = true;
		}

		function updateGeojson() {
			if (geometryOptions.value) {
				try {
					geojson.value = { type: 'FeatureCollection', features: [] };
					geojsonLoading.value = true;
					geojsonError.value = null;
					geojson.value = toGeoJSON(items.value, geometryOptions.value, template.value);
					geojsonLoading.value = false;
					if (!cameraOptions.value || (geojsonDataChanged.value && fitDataBounds.value)) {
						geojsonBounds.value = geojson.value.bbox;
					}
					geojsonDataChanged.value = true;
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

		updateSource();
		updateLayers();
		watch(() => clusterActive.value, updateSource);
		watch(() => clusterRadius.value, updateSource);
		watch(() => clusterMinPoints.value, updateSource);
		watch(() => clusterMaxZoom.value, updateSource);
		watch(() => simplification.value, updateSource);

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
				cluster: clusterActive.value,
				clusterRadius: clusterRadius.value,
				clusterMinPoints: clusterMinPoints.value,
				clusterMaxZoom: clusterMaxZoom.value,
				tolerance: simplification.value,
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

		function gotoEdit(key: number | string) {
			router.push(`/collections/${collection.value}/${key}`);
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

		const availableFields = computed(() => {
			return (fieldsInCollection.value as Field[])
				.filter(({ type, meta }) => type == 'geometry' || meta?.interface == 'map')
				.map(({ name, field }) => ({ text: name, value: field }));
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
			gotoEdit,
			geometryFormat,
			geometryField,
			cameraOptions,
			simplification,
			fitDataBounds,
			fitBoundsAnimate,
			fitBoundsPadding,
			fitBoundsSpeed,
			clusterActive,
			clusterRadius,
			clusterMaxZoom,
			clusterMinPoints,
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
			availableFields,
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
	opacity: 0.8;
}
.layout-map::v-deep .mapboxgl-map.error .mapboxgl-canvas-container {
	opacity: 0.15;
	pointer-events: none;
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
