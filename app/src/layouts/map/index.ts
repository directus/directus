import { defineLayout } from '@/layouts/define';
import MapLayout from './map.vue';
import MapOptions from './options.vue';
import MapSidebar from './sidebar.vue';
import MapActions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, computed, ref, watch, Ref } from 'vue';

import { CameraOptions, AnyLayer } from 'maplibre-gl';
import { GeometryOptions, toGeoJSON } from '@/utils/geometry';
import { layers } from './style';
import { useRouter } from 'vue-router';
import { Filter } from '@directus/shared/types';
import useCollection from '@/composables/use-collection/';
import useItems from '@/composables/use-items';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import type { Field, GeometryFormat } from '@/types';

import { cloneDeep, merge } from 'lodash';

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
	setup(props) {
		const { t, n } = useI18n();
		const router = useRouter();

		const { collection, searchQuery, selection, layoutOptions, layoutQuery, filters } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const page = syncOption(layoutQuery, 'page', 1);
		const limit = syncOption(layoutQuery, 'limit', 1000);
		const sort = syncOption(layoutQuery, 'sort', fieldsInCollection.value[0].field);

		const customLayerDrawerOpen = ref(false);
		const layoutElement = ref<HTMLElement | null>(null);

		const cameraOptions = syncOption(layoutOptions, 'cameraOptions', undefined);
		const customLayers = syncOption(layoutOptions, 'customLayers', layers);
		const fitViewToData = syncOption(layoutOptions, 'fitViewToData', true);
		const fitDataToView = syncOption(layoutOptions, 'fitDataToView', true);
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

		watch(
			() => geometryOptions.value,
			(options, _) => {
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
				key: 'bbox-filter',
				field: geometryField.value,
				operator: 'intersects_bbox',
				value: {
					type: 'Polygon',
					coordinates: [bboxPolygon],
				} as any,
			} as Filter;
		});

		const shouldUpdateCamera = ref(false);
		const _filters = computed(() => {
			return filters.value.concat(viewBoundsfilter.value ?? []);
		});

		const { items, loading, error, totalPages, itemCount, totalCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			searchQuery,
			fields: queryFields,
			filters: _filters,
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
				selection.value = Array.from(new Set(selection.value.concat(selected)));
			} else {
				selection.value = [];
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
			template,
			selection,
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
