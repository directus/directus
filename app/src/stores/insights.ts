import api from '@/api';
import { getPanels } from '@/panels';
import { usePermissionsStore } from '@/stores';
import { queryToGqlString } from '@/utils/query-to-gql-string';
import { unexpectedError } from '@/utils/unexpected-error';
import { Item, Panel } from '@directus/shared/types';
import { getSimpleHash, toArray } from '@directus/shared/utils';
import { AxiosResponse } from 'axios';
import { assign, isUndefined, mapKeys, omit, omitBy, pull, uniq, clone } from 'lodash';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, reactive, ref, unref } from 'vue';
import { Dashboard } from '../types';
import { nanoid } from 'nanoid';

export type CreatePanel = Partial<Panel> & Pick<Panel, 'id' | 'width' | 'height' | 'position_x' | 'position_y'>;

const MAX_CACHE_SIZE = 3; // Max number of dashboards to keep in cache at a time

export const useInsightsStore = defineStore('insightsStore', () => {
	/** All available dashboards in the platform */
	const dashboards = ref<Dashboard[]>([]);

	/** All available panels */
	const panels = ref<Panel[]>([]);

	/** Panels that are currently loading */
	const loading = ref<string[]>([]);

	/** Panels that errored while fetching data */
	const errors = ref<{ id: string; error: Error }[]>([]);

	/** Cache/store for the panel data */
	const data = ref<{ [panel: string]: Item | Item[] }>({});

	/** Staged edits  */
	const edits = reactive<{ create: CreatePanel[]; update: Partial<Panel>[]; delete: string[] }>({
		create: [],
		update: [],
		delete: [],
	});

	const saving = ref(false);

	/** Last MAX_CACHE_SIZE dashboards that we've loaded into data. Used to purge caches once too much data is loaded */
	const lastLoaded: string[] = [];

	/** If there's any unsaved staged changes */
	const hasEdits = computed(() => edits.create.length > 0 || edits.update.length > 0 || edits.delete.length > 0);

	/** Raw panels modified to assign the edits */
	const panelsWithEdits = computed(() => {
		return [
			...unref(panels)
				.filter((panel) => edits.delete.includes(panel.id) === false)
				.map((panel) => {
					const updates = edits.update.find((updated) => updated.id === panel.id);

					if (updates) {
						return assign({}, panel, updates);
					}

					return panel;
				}),
			...edits.create,
		];
	});

	return {
		dashboards,
		panels: panelsWithEdits,
		loading,
		errors,
		data,
		hasEdits,
		saving,
		edits,
		hydrate,
		dehydrate,
		clearCache,
		clearEdits,
		getDashboard,
		getPanelsForDashboard,
		refresh,
		stagePanelCreate,
		stagePanelUpdate,
		stagePanelDuplicate,
		stagePanelDelete,
		saveChanges,
	};

	async function hydrate() {
		const permissionsStore = usePermissionsStore();
		if (
			permissionsStore.hasPermission('directus_dashboards', 'read') &&
			permissionsStore.hasPermission('directus_panels', 'read')
		) {
			try {
				const [dashboardsResponse, panelsResponse] = await Promise.all([
					api.get<any>('/dashboards', {
						params: { limit: -1, fields: ['*'], sort: ['name'] },
					}),
					api.get('/panels', { params: { limit: -1, fields: ['*'], sort: ['dashboard'] } }),
				]);
				dashboards.value = dashboardsResponse.data.data;
				panels.value = panelsResponse.data.data;
			} catch {
				dashboards.value = [];
				panels.value = [];
			}
		}
	}

	function dehydrate() {
		dashboards.value = [];
		panels.value = [];

		clearCache();
		clearEdits();
	}

	function clearCache() {
		loading.value = [];
		errors.value = [];
		data.value = {};
	}

	function clearEdits() {
		edits.create = [];
		edits.update = [];
		edits.delete = [];
	}

	function getDashboard(id: string) {
		return unref(dashboards).find((dashboard) => dashboard.id === id);
	}

	function getPanelsForDashboard(dashboard: string) {
		return unref(panelsWithEdits).filter((panel) => panel.dashboard === dashboard);
	}

	async function refresh(dashboard: string) {
		const panelsForDashboard = unref(panels).filter((panel) => panel.dashboard === dashboard);

		await loadPanelData(panelsForDashboard);

		if (lastLoaded.includes(dashboard) === false) {
			lastLoaded.push(dashboard);

			if (lastLoaded.length > MAX_CACHE_SIZE) {
				const removed = lastLoaded.shift();
				const removedPanels = unref(panels)
					.filter((panel) => panel.dashboard === removed)
					.map(({ id }) => id);
				data.value = omit(data.value, ...removedPanels);
			}
		}
	}

	async function loadPanelData(panels: Panel | Panel[]) {
		panels = toArray(panels);

		const queries = new Map();

		for (const panel of panels) {
			const req = prepareQuery(panel);

			if (!req) continue;

			toArray(req).forEach(({ collection, query }, index) => {
				const key = getSimpleHash(panel.id + collection + JSON.stringify(query));
				queries.set(key, { panel: panel.id, collection, query, key, index, length: toArray(req).length });
			});
		}

		loading.value = uniq([...loading.value, ...Array.from(queries.values()).map(({ panel }) => panel)]);

		const gqlString = queryToGqlString(
			Array.from(queries.values())
				.filter(({ collection }) => {
					return collection.startsWith('directus_') === false;
				})
				.map(({ key, ...rest }) => ({ key: `query_${key}`, ...rest }))
		);

		const systemGqlString = queryToGqlString(
			Array.from(queries.values())
				.filter(({ collection }) => {
					return collection.startsWith('directus_') === true;
				})
				.map(({ key, collection, ...rest }) => ({
					key: `query_${key}`,
					collection: collection.substring(9),
					...rest,
				}))
		);

		try {
			const requests: Promise<AxiosResponse<any, any>>[] = [];

			if (gqlString) requests.push(api.post(`/graphql`, { query: gqlString }));
			if (systemGqlString) requests.push(api.post(`/graphql/system`, { query: systemGqlString }));

			const responses = await Promise.all(requests);

			const results: { [panel: string]: Item | Item[] } = {};

			for (const { data } of responses) {
				const result = mapKeys(data.data, (_, key) => key.substring('query_'.length));

				for (const [key, data] of Object.entries(result)) {
					const { panel, length } = queries.get(key);
					if (length === 1) results[panel] = data;
					else if (!results[panel]) results[panel] = [data];
					else results[panel].push(data);
				}
			}

			data.value = assign({}, data.value, results);
			/** @TODO Set errors based on failed paths */
		} catch (err) {
			/** @TODO Retry the broken query panels */
		} finally {
			loading.value = pull(unref(loading), ...Array.from(queries.values()).map(({ panel }) => panel));
		}
	}

	function prepareQuery(panel: Panel) {
		const { panels: panelTypes } = getPanels();
		const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type);
		return panelType?.query?.(panel.options) ?? null;
	}

	function stagePanelCreate(panel: CreatePanel) {
		edits.create.push(panel);
	}

	function stagePanelUpdate({ id, edits: panelEdits }: { id: string; edits: Partial<Panel> }) {
		panelEdits = omitBy(panelEdits, isUndefined);

		const isNew = id.startsWith('_');
		const arr = isNew ? edits.create : edits.update;

		if (arr.map(({ id }) => id).includes(id)) {
			const updatedArr = arr.map((currentEdit) => {
				if (currentEdit.id === id) {
					return assign({}, currentEdit, panelEdits);
				}

				return currentEdit;
			});

			if (isNew) edits.create = updatedArr as CreatePanel[];
			else edits.update = updatedArr;
		} else {
			arr.push({ id, ...panelEdits });
		}

		if ('options' in panelEdits) {
			/** @TODO Load panel data for updated panel */
		}
	}

	function stagePanelDuplicate(panelKey: string) {
		const panel = unref(panelsWithEdits).find((panel) => panel.id === panelKey);
		if (!panel) return;

		const newPanel = clone(panel);

		newPanel.id = `_${nanoid()}`;
		newPanel.position_x = (newPanel.position_x ?? 0) + 2;
		newPanel.position_y = (newPanel.position_y ?? 0) + 2;

		// In case width/height is totally unknown (which it shouldn't be) fallback to 4x4 as a last-resort
		newPanel.width ??= 4;
		newPanel.height ??= 4;

		stagePanelCreate(newPanel as CreatePanel);
	}

	function stagePanelDelete(panelKey: string) {
		if (edits.create.some((created) => created.id === panelKey)) {
			edits.create = edits.create.filter((created) => created.id !== panelKey);
			return;
		}

		edits.update = edits.update.filter((updated) => updated.id !== panelKey);
		edits.delete.push(panelKey);
	}

	async function saveChanges() {
		saving.value = true;

		try {
			const requests: Promise<AxiosResponse<any, any>>[] = [];

			if (edits.create) {
				// Created edits might come with a temporary ID for editing. Make sure to submit to API without temp ID
				requests.push(
					api.post(
						`/panels`,
						edits.create.map((create) => omit(create, 'id'))
					)
				);
			}

			if (edits.update) {
				requests.push(api.patch(`/panels`, edits.update));
			}

			if (edits.delete) {
				requests.push(api.delete(`/panels`, { data: edits.delete }));
			}

			await Promise.all(requests);
			await hydrate();
			clearEdits();
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			saving.value = false;
		}
	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useInsightsStore, import.meta.hot));
}
