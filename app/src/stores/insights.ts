import api from '@/api';
import { usePermissionsStore, useUserStore } from '@/stores';
import { queryToGqlString } from '@/utils/query-to-gql-string';
import { PanelQuery } from '@directus/shared/types';
import { AxiosResponse } from 'axios';
import { difference, uniq, assign, mapKeys } from 'lodash';
import { defineStore } from 'pinia';
import { Dashboard } from '../types';
import { unexpectedError } from '@/utils/unexpected-error';

export const useInsightsStore = defineStore({
	id: 'insightsStore',
	state: () => ({
		dashboards: [] as Dashboard[],
		queries: {} as {
			[dashboard: string]: {
				loading: string[]; // query keys that are currently loading
				errors: { err: Error; key: string }[]; // queries that caused errors
				data: {
					[queryKey: string]: Record<string, any>[];
				};
			};
		},
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();
			const permissionsStore = usePermissionsStore();

			if (userStore.isAdmin !== true && !permissionsStore.hasPermission('directus_dashboards', 'read')) {
				this.dashboards = [];
			} else {
				try {
					const response = await api.get<any>('/dashboards', {
						params: { limit: -1, fields: ['*', 'panels.*'], sort: ['name'] },
					});

					this.dashboards = response.data.data;
				} catch {
					this.dashboards = [];
				}
			}
		},
		async dehydrate() {
			this.$reset();
		},
		async updateQueries(dashboard: string, queries: PanelQuery[]) {
			// If this is the first fetch of the dashboard, skip key difference and query all
			if (!(dashboard in this.queries)) {
				await this.executeQueries(dashboard, queries);
				return;
			}

			const queryKeys = queries.map(({ key }) => key) as string[];
			const currentKeys = Object.keys(this.queries[dashboard]?.data ?? {});

			const added = difference(queryKeys, currentKeys);
			const removed = difference(currentKeys, queryKeys);

			// Only fetch items that aren't already fetching currently
			const keysToExecute = added.filter((key) => key && this.queries[dashboard].loading.includes(key) === false);
			const queriesToExecute = queries.filter(({ key }) => keysToExecute.includes(key!));

			if (queriesToExecute.length === 0) return;

			await this.executeQueries(dashboard, queriesToExecute);

			for (const removedKey of removed) {
				delete this.queries[dashboard].data[removedKey];
			}
		},
		async executeQueries(dashboard: string, queries: PanelQuery[]) {
			if (!(dashboard in this.queries)) {
				this.queries[dashboard] = {
					loading: [],
					errors: [],
					data: {},
				};
			}

			const queryKeys = queries.map(({ key }) => key) as string[];

			this.queries[dashboard].loading = uniq([...this.queries[dashboard].loading, ...queryKeys]);

			const queriesPrefixed = queries.map((query) => ({ ...query, key: `query_${query.key}` }));

			const gqlString = queryToGqlString(
				queriesPrefixed.filter(({ collection }) => collection.startsWith('directus_') === false)
			);

			const systemGqlString = queryToGqlString(
				queriesPrefixed
					.filter(({ collection }) => collection.startsWith('directus_') === true)
					.map((query) => ({ ...query, collection: query.collection.substring(9) }))
			);

			try {
				const requests: Promise<AxiosResponse<any, any>>[] = [];

				if (gqlString) requests.push(api.post(`/graphql`, { query: gqlString }));
				if (systemGqlString) requests.push(api.post(`/graphql/system`, { query: systemGqlString }));

				const responses = await Promise.all(requests);

				responses.forEach(({ data }) => {
					const result = mapKeys(data.data, (_, key) => key.substring('query_'.length));
					const successfulKeys = Object.keys(result);

					this.queries[dashboard].data = assign(this.queries[dashboard].data, result);

					const updatedErrors = this.queries[dashboard].errors.filter(
						({ key }) => successfulKeys.includes(key) === false
					);

					updatedErrors.push(
						...(data.errors?.filter((err: any) => !!err.path).map((err: any) => ({ key: err.path[0], err })) ?? [])
					);

					this.queries[dashboard].errors = updatedErrors;
				});
			} catch (err) {
				unexpectedError(err);
			} finally {
				this.queries[dashboard].loading = difference(this.queries[dashboard].loading, queryKeys);
			}
		},
	},
});
