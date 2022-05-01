import { defineLayout } from '@directus/shared/utils';
import MapLayout from './map.vue';
import MapOptions from './options.vue';
import MapActions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, computed, ref, watch } from 'vue';

import { toGeoJSON, getGeometryFormatForType } from '@/utils/geometry';
import { getMapStyle } from './style';
import { useRouter } from 'vue-router';
import { useSync } from '@directus/shared/composables';
import { LayoutOptions, LayoutQuery } from './types';
import { Filter, Item } from '@directus/shared/types';
import { useCollection } from '@directus/shared/composables';
import { useItems } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { Field, GeometryOptions } from '@directus/shared/types';
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
		const defaultSort = computed(() => (primaryKeyField.value ? [primaryKeyField.value?.field] : []));
		const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);

		const locationFilter = ref<Filter>();

		const filterWithLocation = computed<Filter | null>(() => {
			if (!locationFilter.value) return filter.value;
			if (!filter.value) return locationFilter.value;

			return {
				_and: [filter.value, locationFilter.value],
			};
		});

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

				// clear the location filter when it is no longer using a valid geometryField
				if (
					geometryField.value &&
					locationFilter.value &&
					!Object.keys(locationFilter.value).includes(geometryField.value)
				) {
					locationFilter.value = undefined;
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
			return { geometryField, geometryFormat, geometryType };
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

		const shouldUpdateCamera = ref(false);

		function fitDataBounds() {
			shouldUpdateCamera.value = true;
			if (isGeometryFieldNative.value) {
				locationFilter.value = undefined;
				return;
			}
			if (geojson.value?.features.length) {
				geojsonBounds.value = cloneDeep(geojson.value.bbox);
			}
		}

		watch(cameraOptions, () => {
			shouldUpdateCamera.value = false;
			locationFilter.value = getLocationFilter();
		});

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

		function setSelection(ids: Item[]) {
			selection.value = Array.from(new Set(ids));
		}

		function pushSelection(ids: Item[]) {
			selection.value = Array.from(new Set(selection.value.concat(ids)));
		}

		function handleSelect({ ids, replace }: { ids: Item[]; replace: boolean }) {
			if (replace) setSelection(ids);
			else pushSelection(ids);
		}

		function handleClick({ id, replace }: { id: Item; replace: boolean }) {
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
