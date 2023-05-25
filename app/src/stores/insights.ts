import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { queryToGqlString } from '@/utils/query-to-gql-string';
import { unexpectedError } from '@/utils/unexpected-error';
import { Item, Panel } from '@directus/types';
import { getSimpleHash, toArray, applyOptionsData } from '@directus/utils';
import { AxiosResponse } from 'axios';
import { assign, clone, get, isUndefined, mapKeys, omit, omitBy, pull, uniq } from 'lodash';
import { nanoid } from 'nanoid';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, reactive, ref, unref } from 'vue';
import { Dashboard } from '@/types/insights';
import escapeStringRegexp from 'escape-string-regexp';
import { useExtensions } from '@/extensions';
import { fetchAll } from '@/utils/fetch-all';

export type CreatePanel = Partial<Panel> &
	Pick<Panel, 'id' | 'width' | 'height' | 'position_x' | 'position_y' | 'type' | 'options'>;

const MAX_CACHE_SIZE = 3; // Max number of dashboards to keep in cache at a time

export const useInsightsStore = defineStore('insightsStore', () => {
	/** All available dashboards in the platform */
	const dashboards = ref<Dashboard[]>([]);

	/** All available panels */
	const panels = ref<Panel[]>([]);

	/** Panels that are currently loading */
	const loading = ref<string[]>([]);

	/** Panels that errored while fetching data */
	const errors = ref<{ [id: string]: Error }>({});

	/** Cache/store for the panel data */
	const data = ref<{ [panel: string]: Item | Item[] }>({});

	/** Runtime filter values */
	const variables = ref<{ [field: string]: any }>({});

	/** Staged edits  */
	const edits = reactive<{ create: CreatePanel[]; update: Partial<Panel>[]; delete: string[] }>({
		create: [],
		update: [],
		delete: [],
	});

	const refreshIntervals = {} as { [dashboard: string]: number };

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

	const { panels: panelTypes } = useExtensions();

	return {
		dashboards,
		panels: panelsWithEdits,
		loading,
		errors,
		data,
		hasEdits,
		saving,
		edits,
		variables,
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
		refreshIntervals,
		getVariable,
		setVariable,
	};

	async function hydrate() {
		const permissionsStore = usePermissionsStore();

		if (
			permissionsStore.hasPermission('directus_dashboards', 'read') &&
			permissionsStore.hasPermission('directus_panels', 'read')
		) {
			try {
				const [dashboardsResponse, panelsResponse] = await Promise.all([
					fetchAll<any>('/dashboards', { params: { fields: ['*'], sort: ['name'] } }),
					fetchAll<any>('/panels', { params: { fields: ['*'], sort: ['dashboard'] } }),
				]);

				dashboards.value = dashboardsResponse;
				panels.value = panelsResponse;
			} catch {
				dashboards.value = [];
				panels.value = [];
			}
		}

		const variableDefaults: Record<string, any> = {};

		panels.value.forEach((panel) => {
			const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type);

			if (panelType?.variable === true && panel.options?.field) {
				variableDefaults[panel.options.field] = panel.options?.defaultValue;
			}
		});

		variables.value = assign({}, variableDefaults, variables.value);
	}

	function dehydrate() {
		dashboards.value = [];
		panels.value = [];

		clearCache();
		clearEdits();
	}

	function clearCache() {
		loading.value = [];
		errors.value = {};
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

	function emptyRelations() {
		return unref(panels)
			.filter(({ type }) => type === 'relational-variable')
			.filter(({ options }) => get(unref(variables), options.field) == undefined)
			.map(({ options }) => options.field)
			.filter((fieldName) => typeof fieldName === 'string' && fieldName.length > 0);
	}

	function hasEmptyRelation(panel: Pick<Panel, 'options' | 'type'>) {
		const stringOptions = JSON.stringify(panel.options);

		for (const relationVar of emptyRelations()) {
			const fieldRegex = new RegExp(`{{\\s*?${escapeStringRegexp(relationVar)}\\s*?}}`);
			if (fieldRegex.test(stringOptions)) return true;
		}

		return false;
	}

	async function loadPanelData(
		panels: Pick<Panel, 'id' | 'options' | 'type'> | Pick<Panel, 'id' | 'options' | 'type'>[]
	) {
		panels = toArray(panels);

		const queries = new Map();

		for (const panel of panels) {
			const req = prepareQuery(panel);

			if (!req) continue;

			if (hasEmptyRelation(panel)) {
				data.value[panel.id] = {};
				continue;
			}

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
				.map(({ key, ...rest }) => ({
					key: `query_${key}`,
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

				if (Array.isArray(data.errors)) {
					setErrorsFromResponseData(data.errors);
				}
			}

			data.value = assign({}, data.value, results);

			const succeededPanels = Object.keys(results);
			errors.value = omit(errors.value, ...succeededPanels);
		} catch (err: any) {
			/**
			 * A thrown error means the request failed completely. This can happen for a wide variety
			 * of reasons, but there's one common one we need to account for: misconfigured panels. A
			 * GraphQL validation error will throw a 400 rather than a 200+partial data, so we need to
			 * retry the request without the failed panels */

			if (err.response.status === 400 && Array.isArray(err.response.data?.errors)) {
				const failedIDs = setErrorsFromResponseData(err.response.data.errors);

				const panelsToTryAgain = panels.filter(({ id }) => failedIDs.includes(id) === false);

				// Make sure we don't end in an infinite loop of retries
				if (panels.length !== panelsToTryAgain.length) {
					await loadPanelData(panelsToTryAgain);
				} else {
					unexpectedError(err);
				}
			} else {
				unexpectedError(err);
			}
		} finally {
			loading.value = pull(unref(loading), ...Array.from(queries.values()).map(({ panel }) => panel));
		}

		/**
		 * Set the error objects based on the gqlError paths, returns the panel IDs of the panels that failed
		 */
		function setErrorsFromResponseData(responseErrors: any[]): string[] {
			const failedIDs: string[] = [];

			for (const gqlError of responseErrors) {
				const queryKey = gqlError?.extensions?.graphqlErrors?.[0]?.path?.[0];
				if (!queryKey) continue;
				const panelID = queries.get(queryKey.substring('query_'.length))?.panel;
				if (!panelID) continue;
				failedIDs.push(panelID);
				errors.value = assign({}, errors.value, { [panelID]: gqlError });
			}

			return failedIDs;
		}
	}

	function prepareQuery(panel: Pick<Panel, 'options' | 'type'>) {
		const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type);
		return (
			panelType?.query?.(applyOptionsData(panel.options ?? {}, unref(variables), panelType.skipUndefinedKeys)) ?? null
		);
	}

	function stagePanelCreate(panel: CreatePanel) {
		edits.create.push(panel);
		loadPanelData(panel);
	}

	function stagePanelUpdate({ id, edits: panelEdits }: { id: string; edits: Partial<Panel> }) {
		panelEdits = omitBy(panelEdits, isUndefined);

		const isNew = id.startsWith('_');
		const arr = isNew ? edits.create : edits.update;

		/**
		 * Check what the currently used data query is, so we can compare it to the new query later to
		 * decide whether or not to reload the data
		 */
		let oldQuery;

		if ('options' in panelEdits) {
			// Edits not yet applied
			const panel = unref(panelsWithEdits).find((panel) => panel.id === id);

			if (panel) {
				const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type)!;

				oldQuery = panelType.query?.(
					applyOptionsData(panel.options ?? {}, unref(variables), panelType.skipUndefinedKeys)
				);
			}
		}

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

		// Reload data for panel if the query has changed
		if ('options' in panelEdits) {
			// This panel has the edits applied
			const panel = unref(panelsWithEdits).find((panel) => panel.id === id)!;
			const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type)!;

			const newQuery = panelType.query?.(
				applyOptionsData(panelEdits.options ?? {}, unref(variables), panelType.skipUndefinedKeys)
			);

			if (JSON.stringify(oldQuery) !== JSON.stringify(newQuery)) loadPanelData(panel);

			// Clear relational variable cache if collection was changed
			if (panel.type === 'relational-variable' && panelEdits.options?.collection && panel.options?.field) {
				variables.value[panel.options.field] = undefined;
			}
		}
	}

	function stagePanelDuplicate(panelKey: string, overrides?: Partial<Panel>) {
		const panel = unref(panelsWithEdits).find((panel) => panel.id === panelKey);
		if (!panel) return;

		const newPanel = clone(panel);

		newPanel.id = `_${nanoid()}`;
		newPanel.position_x = (newPanel.position_x ?? 0) + 2;
		newPanel.position_y = (newPanel.position_y ?? 0) + 2;

		// In case width/height is totally unknown (which it shouldn't be) fallback to 4x4 as a last-resort
		newPanel.width ??= 4;
		newPanel.height ??= 4;

		if (overrides) {
			assign(newPanel, overrides);
		}

		stagePanelCreate(newPanel as CreatePanel);
	}

	function stagePanelDelete(panelKey: string) {
		if (edits.create.some((created) => created.id === panelKey)) {
			edits.create = edits.create.filter((created) => created.id !== panelKey);
			return;
		}

		edits.update = edits.update.filter((updated) => updated.id !== panelKey);
		edits.delete.push(panelKey);
		data.value = omit(data.value, panelKey);
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

			// Remove cached data for the newly created panels
			data.value = omit(data.value, ...edits.create.map(({ id }) => id));

			// Fetch data for panels that now exist in the dashboard (from create) but haven't been fetched yet
			const panelsToLoad = unref(panelsWithEdits).filter(({ id }) => id in unref(data) === false);
			loadPanelData(panelsToLoad);

			clearEdits();
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			saving.value = false;
		}
	}

	function getVariable(field: string) {
		return get(unref(variables), field);
	}

	function setVariable(field: string, value: unknown) {
		const newVariables = assign({}, variables.value, { [field]: value });

		// Find all panels that are using this variable in their options
		const regex = new RegExp(`{{\\s*?${escapeStringRegexp(field)}\\s*?}}`);

		const needReload = unref(panelsWithEdits).filter((panel) => {
			if (panel.id in unref(data) === false) return false;

			const optionsString = JSON.stringify(panel.options ?? {});
			const containsVariable = regex.test(optionsString);
			if (!containsVariable) return false;

			const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type);
			if (!panelType) return false;

			const oldQuery = panelType.query?.(
				applyOptionsData(panel.options ?? {}, unref(variables), panelType.skipUndefinedKeys)
			);

			const newQuery = panelType.query?.(
				applyOptionsData(panel.options ?? {}, unref(newVariables), panelType.skipUndefinedKeys)
			);

			return JSON.stringify(oldQuery) !== JSON.stringify(newQuery);
		});

		variables.value = newVariables;

		if (needReload.length > 0) {
			loadPanelData(needReload);
		}
	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useInsightsStore, import.meta.hot));
}
