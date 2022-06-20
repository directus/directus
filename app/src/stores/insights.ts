import api from '@/api';
import { unref } from 'vue';
import { usePermissionsStore } from '@/stores';
import { queryToGqlString } from '@/utils/query-to-gql-string';
import { unexpectedError } from '@/utils/unexpected-error';
import { Panel, PanelQuery, Item } from '@directus/shared/types';
import { AxiosResponse } from 'axios';
import { assign, difference, mapKeys, uniq, groupBy, omit, pull } from 'lodash';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { Dashboard } from '../types';
import { getPanels } from '@/panels';
import { toArray, getSimpleHash } from '@directus/shared/utils';

type CreatePanel = Partial<Panel> & Pick<Panel, 'id' | 'width' | 'height' | 'position_x' | 'position_y'>;

export const useInsightsStore = defineStore({
	id: 'insightsStore',
	state: () => ({
		dashboards: [] as Dashboard[],
		panels: [] as Panel[],

		loading: [] as string[], // Panels that are currently loading
		errors: [] as { id: string; error: Error }[], // Panels that error while fetching data
		data: {} as { [panel: string]: Item | Item[] }, // Data cache for the panel data

		edits: {
			create: [],
			update: [],
			delete: [],
		} as { create: CreatePanel[]; update: Partial<Panel>[]; delete: string[] },
	}),
	actions: {
		async hydrate() {
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

					this.dashboards = dashboardsResponse.data.data;
					this.panels = panelsResponse.data.data;
				} catch {
					this.dashboards = [];
					this.panels = [];
				}
			}
		},
		async dehydrate() {
			this.$reset();
		},
		getDashboard(id: string) {
			return this.dashboards.find((dashboard) => dashboard.id === id);
		},
		getPanels(dashboard: string) {
			return [
				...this.panels
					.filter((panel) => panel.dashboard === dashboard && this.edits.delete.includes(panel.id) === false)
					.map((panel) => {
						const updates = this.edits.update.find((updated) => updated.id === panel.id);

						if (updates) {
							return assign({}, panel, updates);
						}

						return panel;
					}),
				...this.edits.create,
			];
		},
		clearCache() {
			this.data = {};
			this.loading = [];
			this.errors = [];
		},
		clearEdits() {
			this.edits = {
				create: [],
				update: [],
				delete: [],
			};
		},
		async refresh(dashboard: string) {
			const panels = this.panels.filter((panel) => panel.dashboard === dashboard);
			this.loadPanelData(panels);
		},
		async loadPanelData(panels: Panel | Panel[]) {
			panels = toArray(panels);

			this.loading = uniq([...this.loading, ...panels.map(({ id }) => id)]);

			const queries = new Map();

			for (const panel of panels) {
				const req = this.prepareQuery(panel);

				if (!req) continue;

				toArray(req).forEach(({ collection, query }, index) => {
					const key = getSimpleHash(panel.id + collection + JSON.stringify(query));
					queries.set(key, { panel: panel.id, collection, query, key, index, length: toArray(req).length });
				});
			}

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

				this.data = assign({}, this.data, results);
			} catch (err) {
				// Retry the broken query panels
			} finally {
				this.loading = pull(this.loading, ...panels.map(({ id }) => id));
			}
		},
		prepareQuery(panel: Panel) {
			const { panels: panelTypes } = getPanels();
			const panelType = unref(panelTypes).find((panelType) => panelType.id === panel.type);
			return panelType?.query?.(panel.options) ?? null;
		},

		// async executeQueries(dashboard: string, queries: PanelQuery[]) {
		// 	if (!(dashboard in this.queries)) {
		// 		this.queries[dashboard] = {
		// 			loading: [],
		// 			errors: [],
		// 			data: {},
		// 		};
		// 	}

		// 	const queryKeys = queries.map(({ key }) => key) as string[];

		// 	this.queries[dashboard].loading = uniq([...this.queries[dashboard].loading, ...queryKeys]);

		// 	const queriesPrefixed = queries.map((query) => ({ ...query, key: `query_${query.key}` }));

		// 	const gqlString = queryToGqlString(
		// 		queriesPrefixed.filter(({ collection }) => collection.startsWith('directus_') === false)
		// 	);

		// 	const systemGqlString = queryToGqlString(
		// 		queriesPrefixed
		// 			.filter(({ collection }) => collection.startsWith('directus_') === true)
		// 			.map((query) => ({ ...query, collection: query.collection.substring(9) }))
		// 	);

		// 	try {
		// 		const requests: Promise<AxiosResponse<any, any>>[] = [];

		// 		if (gqlString) requests.push(api.post(`/graphql`, { query: gqlString }));
		// 		if (systemGqlString) requests.push(api.post(`/graphql/system`, { query: systemGqlString }));

		// 		const responses = await Promise.all(requests);

		// 		responses.forEach(({ data }) => {
		// 			const result = mapKeys(data.data, (_, key) => key.substring('query_'.length));
		// 			const successfulKeys = Object.keys(result);

		// 			this.queries[dashboard].data = assign(this.queries[dashboard].data, result);

		// 			const updatedErrors = this.queries[dashboard].errors.filter(
		// 				({ key }) => successfulKeys.includes(key) === false
		// 			);

		// 			updatedErrors.push(
		// 				...(data.errors?.filter((err: any) => !!err.path).map((err: any) => ({ key: err.path[0], err })) ?? [])
		// 			);

		// 			this.queries[dashboard].errors = updatedErrors;
		// 		});
		// 	} catch (err) {
		// 		unexpectedError(err);
		// 	} finally {
		// 		this.queries[dashboard].loading = difference(this.queries[dashboard].loading, queryKeys);
		// 	}
		// },
	},
	getters: {
		hasEdits(state) {
			return state.edits.create.length > 0 || state.edits.update.length > 0 || state.edits.delete.length > 0;
		},
	},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useInsightsStore, import.meta.hot));
}
