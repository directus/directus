import { defineLayout } from '@directus/shared/utils';
import MapLayout from './map.vue';
import MapOptions from './options.vue';
import MapActions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, computed, ref, watch, Ref } from 'vue';

import { toGeoJSON } from '@/utils/geometry';
import { layers } from './style';
import { useRouter } from 'vue-router';
import { useSync } from '@directus/shared/composables';
import { LayoutOptions, LayoutQuery } from './types';
import { Filter } from '@directus/shared/types';
import { useCollection } from '@directus/shared/composables';
import { useItems } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { Field, GeometryFormat, GeometryOptions } from '@directus/shared/types';
import { syncRefProperty } from '@/utils/sync-ref-property';

import { cloneDeep, merge } from 'lodash';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'map',
	name: '$t:layouts.map.map',
	icon: 'map',
	smallHeader: true,
	component: MapLayout,
	slots: {
		options: MapOptions,
		sidebar: () => undefined,
		actions: MapActions,
	},
	setup(props, { emit }) {
		const { t, n } = useI18n();

		const router = useRouter();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);

		const { collection, filter, filterUser, search } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const page = syncRefProperty(layoutQuery, 'page', 1);
		const limit = syncRefProperty(layoutQuery, 'limit', 1000);
		const sort = syncRefProperty(layoutQuery, 'sort', [fieldsInCollection.value?.[0]?.field]);

		const locationFilter = ref<Filter>();

		const filterWithLocation = computed<Filter | null>(() => {
			if (!locationFilter.value) return filter.value;
			if (!filter.value) return locationFilter.value;

			return {
				_and: [filter.value, locationFilter.value],
			};
		});

		const customLayerDrawerOpen = ref(false);

		const displayTemplate = syncRefProperty(layoutOptions, 'displayTemplate', undefined);
		const cameraOptions = syncRefProperty(layoutOptions, 'cameraOptions', undefined);
		const customLayers = syncRefProperty(layoutOptions, 'customLayers', layers);
		const autoLocationFilter = syncRefProperty(layoutOptions, 'autoLocationFilter', false);
		const clusterData = syncRefProperty(layoutOptions, 'clusterData', false);
		const geometryField = syncRefProperty(layoutOptions, 'geometryField', undefined);
		const geometryFormat = computed<GeometryFormat | undefined>({
			get: () => layoutOptions.value?.geometryFormat,
			set(newValue: GeometryFormat | undefined) {
				layoutOptions.value = {
					...(layoutOptions.value || {}),
					geometryFormat: newValue,
					geometryField: undefined,
				};
			},
		});

		const geometryFieldData = computed(() => {
			return fieldsInCollection.value.find((f: Field) => f.field == geometryField.value);
		});

		const isGeometryFieldNative = computed(() => geometryFieldData.value?.type == 'geometry');

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
			const field = geometryFieldData.value;
			if (!field) return undefined;
			if (isGeometryFieldNative.value) {
				return {
					geometryField: field.field,
					geometryFormat: 'native',
					geometryType: field.schema?.geometry_type,
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

		const template = computed(() => {
			return displayTemplate.value || info.value?.meta?.display_template || `{{ ${primaryKeyField.value?.field} }}`;
		});

		const queryFields = computed(() => {
			return [geometryField.value, ...getFieldsFromTemplate(template.value)]
				.concat(primaryKeyField.value?.field)
				.filter((e) => !!e) as string[];
		});

		const locationFilterOutdated = ref(false);

		function getLocationFilter(): Filter | undefined {
			if (!isGeometryFieldNative.value || !cameraOptions.value || !geometryField.value) {
				return;
			}

			const bbox = cameraOptions.value.bbox;

			const bboxPolygon = [
				[bbox[0], bbox[1]],
				[bbox[2], bbox[1]],
				[bbox[2], bbox[3]],
				[bbox[0], bbox[3]],
				[bbox[0], bbox[1]],
			];

			return {
				[geometryField.value]: {
					_intersects_bbox: {
						type: 'Polygon',
						coordinates: [bboxPolygon],
					},
				},
			} as Filter;
		}

		function updateLocationFilter() {
			locationFilterOutdated.value = false;
			locationFilter.value = getLocationFilter();
		}

		function clearLocationFilter() {
			shouldUpdateCamera.value = true;
			locationFilterOutdated.value = false;
			locationFilter.value = undefined;
		}

		function fitGeoJSONBounds() {
			if (!geojson.value?.features.length) {
				return;
			}
			shouldUpdateCamera.value = true;
			locationFilterOutdated.value = false;
			if (geojson.value) {
				geojsonBounds.value = cloneDeep(geojson.value.bbox);
			}
		}

		function clearDataFilters() {
			props?.clearFilters();
		}

		const shouldUpdateCamera = ref(false);

		watch(
			() => cameraOptions.value,
			() => {
				shouldUpdateCamera.value = false;
				locationFilterOutdated.value = true;
				if (autoLocationFilter.value) {
					updateLocationFilter();
				}
			}
		);

		watch(
			() => autoLocationFilter.value,
			(value) => {
				if (value) updateLocationFilter();
			}
		);

		const { items, loading, error, totalPages, itemCount, totalCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			search,
			filter: filterWithLocation,
			fields: queryFields,
		});

		const geojson = ref<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
		const geojsonBounds = ref<GeoJSON.BBox>();
		const geojsonError = ref<string | null>(null);
		const geojsonLoading = ref(false);

		watch([search, collection, limit, sort], onQueryChange);
		watch(items, updateGeojson);

		watch(
			() => geometryField.value,
			() => (shouldUpdateCamera.value = true)
		);

		function onQueryChange() {
			shouldUpdateCamera.value = true;
			geojsonLoading.value = false;
		}

		function updateGeojson() {
			if (geometryOptions.value) {
				try {
					geojson.value = { type: 'FeatureCollection', features: [] };
					geojsonLoading.value = true;
					geojsonError.value = null;
					geojson.value = toGeoJSON(items.value, geometryOptions.value, template.value);
					geojsonLoading.value = false;
					if (!cameraOptions.value || shouldUpdateCamera.value) {
						geojsonBounds.value = geojson.value.bbox;
					}
				} catch (error: any) {
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

		function setSelection(ids: Array<string | number>) {
			selection.value = ids;
		}

		function pushSelection(ids: Array<string | number>) {
			selection.value = Array.from(new Set(selection.value.concat(ids)));
		}

		function handleSelect({ ids, replace }: { ids: Array<string | number>; replace: boolean }) {
			if (replace) setSelection(ids);
			else pushSelection(ids);
		}

		function handleClick({ id, replace }: { id: string | number; replace: boolean }) {
			if (props.selectMode) {
				handleSelect({ ids: [id], replace });
			} else {
				router.push(`/collections/${collection.value}/${id}`);
			}
		}

		const featureId = computed(() => {
			return props.readonly ? null : primaryKeyField.value?.field ?? null;
		});

		const showingCount = computed(() => {
			if ((itemCount.value || 0) < (totalCount.value || 0) && filterUser.value) {
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

		return {
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
			handleSelect,
			geometryFormat,
			geometryField,
			displayTemplate,
			isGeometryFieldNative,
			cameraOptions,
			autoLocationFilter,
			clusterData,
			items,
			loading,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			fieldsInCollection,
			limit,
			filter,
			primaryKeyField,
			sort,
			info,
			showingCount,
			refresh,
			resetPresetAndRefresh,
			geometryFields,
			customLayerDrawerOpen,
			locationFilterOutdated,
			updateLocationFilter,
			clearLocationFilter,
			clearDataFilters,
			locationFilter,
			fitGeoJSONBounds,
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
	},
});
