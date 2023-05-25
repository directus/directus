import { formatCollectionItemsCount } from '@/utils/format-collection-items-count';
import { getGeometryFormatForType, toGeoJSON } from '@/utils/geometry';
import { saveAsCSV } from '@/utils/save-as-csv';
import { syncRefProperty } from '@/utils/sync-ref-property';
import { useCollection, useItems, useSync } from '@directus/composables';
import { Field, Filter, GeometryOptions } from '@directus/types';
import { defineLayout, getFieldsFromTemplate } from '@directus/utils';
import { cloneDeep, merge } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import MapActions from './actions.vue';
import MapLayout from './map.vue';
import MapOptions from './options.vue';
import { getMapStyle } from './style';
import { LayoutOptions, LayoutQuery } from './types';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'map',
	name: '$t:layouts.map.map',
	icon: 'map',
	smallHeader: true,
	sidebarShadow: true,
	component: MapLayout,
	slots: {
		options: MapOptions,
		sidebar: () => undefined,
		actions: MapActions,
	},
	setup(props, { emit }) {
		const router = useRouter();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);

		const { collection, filter, filterUser, search } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const page = syncRefProperty(layoutQuery, 'page', 1);
		const limit = syncRefProperty(layoutQuery, 'limit', 1000);
		const defaultSort = computed(() => (primaryKeyField.value ? [primaryKeyField.value?.field] : []));
		const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);

		const displayTemplate = syncRefProperty(layoutOptions, 'displayTemplate', undefined);
		const cameraOptions = syncRefProperty(layoutOptions, 'cameraOptions', undefined);
		const clusterData = syncRefProperty(layoutOptions, 'clusterData', false);
		const geometryField = syncRefProperty(layoutOptions, 'geometryField', undefined);

		const geometryFieldData = computed(() => {
			return fieldsInCollection.value.find((f: Field) => f.field == geometryField.value);
		});

		const geometryFields = computed(() => {
			return (fieldsInCollection.value as Field[]).filter(
				({ type, meta }) => type.startsWith('geometry') || meta?.interface == 'map'
			);
		});

		watch(
			geometryFields,
			(fields) => {
				if (!geometryField.value && fields.length > 0) {
					geometryField.value = fields[0].field;
				}
			},
			{ immediate: true }
		);

		const geometryOptions = computed<GeometryOptions | undefined>(() => {
			const field = geometryFieldData.value;

			if (!field) {
				return;
			}

			const geometryField = field.field;
			const geometryFormat = getGeometryFormatForType(field.type);
			const geometryType = field.type.split('.')[1] ?? field.meta?.options?.geometryType;

			if (!geometryFormat) {
				return;
			}

			return { geometryField, geometryFormat, geometryType } as GeometryOptions;
		});

		const isGeometryFieldNative = computed(() => geometryOptions.value?.geometryFormat === 'native');

		const template = computed(() => {
			return displayTemplate.value || info.value?.meta?.display_template || `{{ ${primaryKeyField.value?.field} }}`;
		});

		const queryFields = computed(() => {
			return [geometryField.value, ...getFieldsFromTemplate(template.value)]
				.concat(primaryKeyField.value?.field)
				.filter((e) => !!e) as string[];
		});

		const locationFilter = computed<Filter | null>(() => {
			if (!isGeometryFieldNative.value || !cameraOptions.value || !geometryField.value) {
				return null;
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
		});

		const filterWithLocation = computed<Filter | null>(() => {
			if (!locationFilter.value) return filter.value;
			if (!filter.value) return locationFilter.value;

			return {
				_and: [filter.value, locationFilter.value],
			};
		});

		const shouldUpdateCamera = ref(false);

		function fitDataBounds() {
			shouldUpdateCamera.value = true;

			if (isGeometryFieldNative.value) {
				return;
			}

			if (geojson.value?.features.length) {
				geojsonBounds.value = cloneDeep(geojson.value.bbox);
			}
		}

		watch(cameraOptions, () => {
			shouldUpdateCamera.value = false;
		});

		const { items, loading, error, totalPages, itemCount, totalCount, getItems, getTotalCount, getItemCount } =
			useItems(collection, {
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

		watch(geometryField, () => (shouldUpdateCamera.value = true));

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
					geojson.value = toGeoJSON(items.value, geometryOptions.value);
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

		const directusSource = ref({
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
		});

		watch(clusterData, updateSource, { immediate: true });

		function updateSource() {
			directusSource.value = merge({}, directusSource.value, {
				cluster: clusterData.value,
			});
		}

		function setSelection(ids: (string | number)[]) {
			selection.value = Array.from(new Set(ids));
		}

		function pushSelection(ids: (string | number)[]) {
			selection.value = Array.from(new Set(selection.value.concat(ids)));
		}

		function handleSelect({ ids, replace }: { ids: (string | number)[]; replace: boolean }) {
			if (replace) setSelection(ids);
			else pushSelection(ids);
		}

		function handleClick({ id, replace }: { id: string | number; replace: boolean }) {
			if (props.selectMode) {
				handleSelect({ ids: [id], replace });
			} else {
				router.push(`/content/${collection.value}/${id}`);
			}
		}

		const featureId = computed(() => {
			return props.readonly ? null : primaryKeyField.value?.field ?? null;
		});

		const showingCount = computed(() => {
			const filtering = Boolean((itemCount.value || 0) < (totalCount.value || 0) && filterUser.value);
			return formatCollectionItemsCount(itemCount.value || 0, page.value, limit.value, filtering);
		});

		type ItemPopup = { item?: any; position?: { x: number; y: number } };
		const itemPopup = ref<ItemPopup>({ item: null });

		function updateItemPopup(update: Partial<ItemPopup>) {
			if ('item' in update) {
				const field = primaryKeyField.value?.field;
				update.item = !field ? null : items.value.find((i) => i[field] === update.item) ?? null;
			}

			itemPopup.value = merge({}, itemPopup.value, update);
		}

		return {
			collection,
			geojson,
			directusSource,
			directusLayers: getMapStyle(),
			featureId,
			geojsonBounds,
			geojsonLoading,
			geojsonError,
			geometryOptions,
			handleClick,
			handleSelect,
			geometryField,
			displayTemplate,
			isGeometryFieldNative,
			cameraOptions,
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
			fitDataBounds,
			template,
			itemPopup,
			updateItemPopup,
			download,
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
			getTotalCount();
			getItemCount();
		}

		function download() {
			if (!collection.value) return;
			saveAsCSV(collection.value, queryFields.value, items.value);
		}

		function toPage(newPage: number) {
			page.value = newPage;
		}
	},
});
