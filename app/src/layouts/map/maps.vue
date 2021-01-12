<template>
	<div class="layout-map" ref="layoutElement">
		<portal to="layout-options">
			<div class="field">
				<div class="type-label">Background</div>
				<v-select v-model="backgroundLayer" :items="mapStyleOptions" item-icon="icon" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('layouts.map.format') }}</div>
				<v-select
					v-model="geometryFormat"
					:items="[
						{ value: 'lnglat', text: $t('layouts.map.lnglat') },
						{ value: 'geojson', text: 'GeoJSON' },
						{ value: 'wkt', text: '(E)WKT' },
						{ value: 'wkb', text: '(E)WKB' },
						{ value: 'twkb', text: 'TWKB' },
						{ value: 'csv', text: 'CSV' },
					]"
				/>
			</div>
			<template v-if="availableFieldsForFormat.length == 0">
				<div class="field">
					<v-input type="text" disabled :prefix="'No compatible fields'"></v-input>
				</div>
			</template>
			<template v-else>
				<template v-if="geometryFormat !== 'lnglat'">
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.field') }}</div>
						<v-select
							v-model="geometryField"
							:items="
								availableFieldsForFormat.map((field) => ({
									text: field.name,
									value: field.field,
								}))
							"
						/>
					</div>
				</template>
				<template v-else>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.longitude') }}</div>
						<v-select
							v-model="longitudeField"
							:items="
								availableFieldsForFormat.map((field) => ({
									text: field.name,
									value: field.field,
								}))
							"
						/>
					</div>
					<div class="field">
						<div class="type-label">{{ $t('layouts.map.latitude') }}</div>
						<v-select
							v-model="latitudeField"
							:items="
								availableFieldsForFormat.map((field) => ({
									text: field.name,
									value: field.field,
								}))
							"
						/>
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
					<v-divider></v-divider>
				</div>
			</template>
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
			<v-detail class="field">
				<template #title>Style</template>
				<div class="nested-options">
					<div class="field">
						<interface-code v-model="customLayers" language="json" type="json" :lineNumber="false" />
						<div class="form">
							<v-button x-small outlined class="set" @click="updateLayers">Set</v-button>
							<v-button x-small outlined class="reset" @click="resetLayers">Reset</v-button>
						</div>
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
			:class="{ loading, error: error || geojsonError || !geojsonOptionsOk || itemCount === 0 }"
			:data="geojson"
			:camera="cameraOptions"
			:bounds="geojsonBounds"
			:onClick="gotoEdit"
			:rootStyle="rootStyle"
			:source="userSource"
			:layers="userLayers"
			@moveend="cameraOptions = $event"
			:backgroundLayer="backgroundLayer"
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
				v-else-if="!geojsonOptionsOk"
				icon="not_listed_location"
				center
				:title="$t('layouts.map.missing_option')"
			></v-info>
			<v-info
				v-else-if="geojsonError"
				type="warning"
				icon="wrong_location"
				center
				:title="$t('layouts.map.wrong_geometry')"
			>
				{{ geojsonError }}
			</v-info>
			<v-progress-circular v-else-if="loading" indeterminate x-large class="center" />
			<v-progress-circular
				v-else-if="geojsonLoading"
				x-large
				class="center"
				:value="geojsonProgress * 100"
				:indeterminate="geojsonProgress == 1"
			/>
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
				<div class="per-page">
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
import { CameraOptions, Style, AnyLayer, MapLayerMouseEvent, LngLatBoundsLike } from 'maplibre-gl';
import { basemapNames, rootStyle, dataStyle } from './styles';
import type { GeoJSONSerializer } from './worker';

import {
	defineComponent,
	toRefs,
	inject,
	computed,
	ref,
	watch,
	watchEffect,
	onMounted,
	onUnmounted,
} from '@vue/composition-api';
import type { PropType, Ref, ComputedRef } from '@vue/composition-api';

import adjustFieldsForDisplays from '../../utils/adjust-fields-for-displays';
import router from '../../router';
import { Filter } from '../../types';
import useCollection from '../../composables/use-collection/';
import useSync from '../../composables/use-sync/';
import useItems from '../../composables/use-items';
import { useRelationsStore } from '../../stores/';

import i18n from '../../lang';
import { AnyCnameRecord } from 'dns';

import { assert } from 'joi';
import { wrap, proxy, releaseProxy, Remote } from 'comlink';
import { update } from 'lodash';

function isObject(obj: any): boolean {
	return typeof obj == 'object' && obj != null;
}
function isArray(obj: any): boolean {
	return Array.isArray(obj);
}

function clone<A>(a: A): A {
	// @ts-ignore
	return !isObject(a)
		? a
		: isArray(a)
		? // @ts-ignore
		  [...a].map(clone)
		: // @ts-ignore
		  Object.keys(a).reduce((r, k) => ({ ...r, [k]: clone(a[k]) }), {});
}
function assign(a: any, b: any): any {
	if (![a, b].every(isObject)) return (a = b);
	if ([a, b].every(isArray)) return a.concat(b);
	for (const key in b) a[key] = assign(a[key], b[key]);
	return a;
}

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
	backgroundLayer?: string;
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	longitudeField?: string;
	latitudeField?: string;
	geometrySRID?: string;
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

type GeometryFormat = 'geojson' | 'csv' | 'wkt' | 'wkb' | 'twkb' | 'lnglat' | undefined;

function valueOr<T>(a: T, b: T): T {
	return a == undefined ? b : a;
}

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
		const relationsStore = useRelationsStore();
		const layoutElement = ref<HTMLElement | null>(null);
		const mainElement = inject('main-element', ref<Element | null>(null));
		const _filters = useSync(props, 'filters', emit);
		const _selection = useSync(props, 'selection', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);
		const _layoutQuery: Ref<LayoutQuery> = useSync(props, 'layoutQuery', emit) as Ref<LayoutQuery>;
		const _layoutOptions: Ref<LayoutOptions> = useSync(props, 'layoutOptions', emit);
		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const page = syncOption(_layoutQuery, 'page', 1);
		const sort = syncOption(_layoutQuery, 'sort', fieldsInCollection.value[0].field);
		const limit = syncOption(_layoutQuery, 'limit', 1000);

		const cameraOptions = syncOption(_layoutOptions, 'cameraOptions', undefined);
		const customLayers = syncOption(_layoutOptions, 'customLayers', dataStyle.layers);
		const backgroundLayer = syncOption(_layoutOptions, 'backgroundLayer', 'CartoDB_PositronNoLabels');
		const simplification = syncOption(_layoutOptions, 'simplification', 0.375);
		const fitDataBounds = syncOption(_layoutOptions, 'fitDataBounds', true);
		const fitBoundsAnimate = syncOption(_layoutOptions, 'fitBoundsAnimate', true);
		const fitBoundsPadding = syncOption(_layoutOptions, 'fitBoundsPadding', 100);
		const fitBoundsSpeed = syncOption(_layoutOptions, 'fitBoundsSpeed', 1.4);
		const clusterActive = syncOption(_layoutOptions, 'clusterActive', true);
		const clusterRadius = syncOption(_layoutOptions, 'clusterRadius', 50);
		const clusterMaxZoom = syncOption(_layoutOptions, 'clusterMaxZoom', 12);
		const clusterMinPoints = syncOption(_layoutOptions, 'clusterMinPoints', 2);
		const geometrySRID = syncOption(_layoutOptions, 'geometrySRID', '2154');
		const longitudeField = syncOption(_layoutOptions, 'longitudeField', undefined);
		const latitudeField = syncOption(_layoutOptions, 'latitudeField', undefined);
		const geometryField = syncOption(_layoutOptions, 'geometryField', undefined);
		const geometryFormat = computed<GeometryFormat>({
			get: () => valueOr(_layoutOptions.value?.geometryFormat, undefined),
			set(newValue: GeometryFormat) {
				_layoutOptions.value = {
					...(_layoutOptions.value || {}),
					geometryFormat: newValue,
					geometryField: undefined,
					longitudeField: undefined,
					latitudeField: undefined,
				};
			},
		});
		const geojsonOptionsOk = computed(() => {
			return (
				(geometryFormat.value === 'lnglat' && longitudeField.value && latitudeField.value) ||
				(geometryFormat.value && geometryField.value)
			);
		});

		const queryFields = computed(() => {
			return [geometryField, latitudeField, longitudeField]
				.map((ref) => ref.value)
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

		function onQueryChange(next: any, prev: any) {
			resetWorker();
			page.value = 1;
			geojsonDataChanged.value = true;
		}

		const geojson = ref<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
		const geojsonBounds = ref<GeoJSON.BBox>();
		const geojsonError = ref<string | null>();
		const geojsonLoading = ref(false);
		const geojsonProgress = ref(0);
		const geojsonDataChanged = ref(false);
		let geojsonWorker: Worker;
		let workerProxy: Remote<GeoJSONSerializer>;

		resetWorker();
		watch(() => searchQuery.value, onQueryChange);
		watch(() => collection.value, onQueryChange);
		watch(() => limit.value, onQueryChange);
		watch(() => sort.value, onQueryChange);
		watch(() => page.value, resetWorker);
		watch(() => geometrySRID.value, updateGeojson);
		watch(() => items.value, updateGeojson);

		watch(
			() => geometrySRID.value,
			() => (geojsonDataChanged.value = true)
		);
		watch(
			() => longitudeField.value,
			() => (geojsonDataChanged.value = true)
		);
		watch(
			() => latitudeField.value,
			() => (geojsonDataChanged.value = true)
		);
		watch(
			() => geometryField.value,
			() => (geojsonDataChanged.value = true)
		);

		function resetWorker() {
			geojsonLoading.value && geojsonWorker && geojsonWorker.terminate();
			geojsonLoading.value = false;
			geojsonWorker = new Worker('./worker', { name: 'geojson-converter', type: 'module' });
			workerProxy = wrap(geojsonWorker);
		}

		function onProgress(progress: number) {
			geojsonProgress.value = progress;
		}

		async function updateGeojson() {
			if (geojsonOptionsOk.value) {
				try {
					geojson.value = { type: 'FeatureCollection', features: [] };
					geojsonLoading.value = true;
					geojsonProgress.value = 0;
					geojsonError.value = null;
					geojson.value = await workerProxy(items.value, _layoutOptions.value, proxy(onProgress));
					geojsonLoading.value = false;
					console.log(geojsonDataChanged, fitDataBounds.value);
					if (!cameraOptions.value || (geojsonDataChanged && fitDataBounds.value)) {
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

		const userStyle = clone(dataStyle);
		const userSource = ref(userStyle.sources);
		const userLayers = ref(userStyle.layers);
		updateSource();
		watch(() => clusterActive.value, updateSource);
		watch(() => clusterRadius.value, updateSource);
		watch(() => clusterMinPoints.value, updateSource);
		watch(() => clusterMaxZoom.value, updateSource);
		watch(() => simplification.value, updateSource);

		function updateLayers() {
			userLayers.value = customLayers.value;
		}

		function resetLayers() {
			userLayers.value = clone(dataStyle.layers);
		}

		function updateSource() {
			assign(userSource.value, {
				__directus: {
					cluster: clusterActive.value,
					clusterRadius: clusterRadius.value,
					clusterMinPoints: clusterMinPoints.value,
					clusterMaxZoom: clusterMaxZoom.value,
					tolerance: simplification.value,
				},
			});
			userSource.value = { ...userSource.value };
		}

		function gotoEdit(e: MapLayerMouseEvent) {
			const pkf: string = primaryKeyField.value?.field;
			if (!pkf || props.readonly) return;
			const key = e.features?.[0].properties?.[pkf];
			if (!key) return;
			const url = `/collections/${collection.value}/${key}`;
			router.push(url);
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
			return fieldsInCollection.value.filter((field) => field.meta?.special?.includes('no-data') !== true);
		});
		const availableFieldsForFormat = computed(() => {
			const types = availableTypesForFormat(geometryFormat.value);
			return availableFields.value.filter(({ type }) => types.includes(type));
		});

		function availableTypesForFormat(format: GeometryFormat) {
			switch (format) {
				case 'lnglat':
					return ['decimal', 'float'];
				case 'geojson':
					return ['json'];
				case 'csv':
					return ['csv'];
				case 'wkt':
					return ['string', 'text'];
				case 'wkb':
				case 'twkb':
					return ['string', 'text', 'binary', 'unknown'];
				default:
					return [];
			}
		}
		const mapStyleOptions = basemapNames;

		return {
			geojson,
			rootStyle,
			userSource,
			userLayers,
			customLayers,
			updateLayers,
			resetLayers,
			mapStyleOptions,
			backgroundLayer,
			geojsonBounds,
			geojsonLoading,
			geojsonProgress,
			geojsonError,
			geojsonOptionsOk,
			gotoEdit,
			geometrySRID,
			geometryFormat,
			geometryField,
			longitudeField,
			latitudeField,
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
			availableFieldsForFormat,
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

		function syncOption<R, T extends keyof R>(ref: Ref<R>, key: T, defaultValue: NonNullable<R>[T]) {
			return computed<NonNullable<R>[T]>({
				get: () => valueOr(ref.value?.[key], defaultValue) as NonNullable<R>[T],
				set: (value: R[T]) => {
					ref.value = { ...valueOr(ref.value, {}), [key]: value } as R;
				},
			});
		}
	},
});
</script>

<style lang="scss">
.layout-map .CodeMirror.cm-s-default {
	height: 500px;
}
</style>
<style lang="scss" scoped>
@import '../../styles/mixins/breakpoint';
@import '../../styles/mixins/form-grid';

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

.layout-map::v-deep .CodeMirror.cm-s-default {
	height: 300px !important;
	max-height: 300px !important;
}

.form .v-button {
	--v-button-background-color: var(--foreground-subdued);
	--v-button-background-color-hover: var(--foreground-normal);
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

	.pagination {
		--v-button-height: 28px;

		display: inline-block;

		button {
			box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.2);
		}
	}

	.per-page {
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
}
</style>
