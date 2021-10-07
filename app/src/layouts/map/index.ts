import { defineLayout } from '@directus/shared/utils';
import MapLayout from './map.vue';
import MapOptions from './options.vue';
import MapSidebar from './sidebar.vue';
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

import { cloneDeep, merge } from 'lodash';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'map',
	name: '$t:layouts.map.map',
	icon: 'map',
	smallHeader: true,
	component: MapLayout,
	slots: {
		options: MapOptions,
		sidebar: MapSidebar,
		actions: MapActions,
	},
	setup(props, { emit }) {
		const { t, n } = useI18n();

		const router = useRouter();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);
		const filters = useSync(props, 'filters', emit);
		const searchQuery = useSync(props, 'searchQuery', emit);

		const { collection } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const page = syncOption(layoutQuery, 'page', 1);
		const limit = syncOption(layoutQuery, 'limit', 1000);
		const sort = syncOption(layoutQuery, 'sort', fieldsInCollection.value?.[0]?.field);

		const customLayerDrawerOpen = ref(false);

		const displayTemplate = syncOption(layoutOptions, 'displayTemplate', undefined);
		const cameraOptions = syncOption(layoutOptions, 'cameraOptions', undefined);
		const customLayers = syncOption(layoutOptions, 'customLayers', layers);
		const autoLocationFilter = syncOption(layoutOptions, 'autoLocationFilter', false);
		const clusterData = syncOption(layoutOptions, 'clusterData', false);
		const geometryField = syncOption(layoutOptions, 'geometryField', undefined);
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
			if (!isGeometryFieldNative.value || !cameraOptions.value) {
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
				key: 'location-filter',
				field: geometryField.value,
				operator: 'intersects_bbox',
				value: {
					type: 'Polygon',
					coordinates: [bboxPolygon],
				} as any,
			} as Filter;
		}

		function updateLocationFilter() {
			const locationFilter = getLocationFilter();
			locationFilterOutdated.value = false;
			filters.value = filters.value.filter((filter) => filter.key !== 'location-filter').concat(locationFilter ?? []);
		}

		function clearLocationFilter() {
			shouldUpdateCamera.value = true;
			locationFilterOutdated.value = false;
			filters.value = filters.value.filter((filter) => filter.key !== 'location-filter');
		}

		function fitGeoJSONBounds() {
			shouldUpdateCamera.value = true;
			locationFilterOutdated.value = false;
			if (geojson.value) {
				geojsonBounds.value = cloneDeep(geojson.value.bbox);
			}
		}

		function clearDataFilters() {
			filters.value = filters.value.filter((filter) => filter.key === 'location-filter');
			searchQuery.value = null;
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
			filters,
			searchQuery,
			fields: queryFields,
		});

		const geojson = ref<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
		const geojsonBounds = ref<GeoJSON.BBox>();
		const geojsonError = ref<string | null>(null);
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

		const activeFilterCount = computed(() => {
			return filters.value.filter((filter) => !filter.locked).length;
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
			filters,
			primaryKeyField,
			sort,
			info,
			showingCount,
			activeFilterCount,
			refresh,
			resetPresetAndRefresh,
			geometryFields,
			customLayerDrawerOpen,
			locationFilterOutdated,
			updateLocationFilter,
			clearLocationFilter,
			clearDataFilters,
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
