import { API_INJECT, EXTENSIONS_INJECT, SDK_INJECT, STORES_INJECT } from '@directus/constants';
import type { DirectusClient, RestClient } from '@directus/sdk';
import type { AppExtensionConfigs, RefRecord } from '@directus/types';
import type { AxiosInstance } from 'axios';
import { inject } from 'vue';

/**
 * Vue composable that provides access to the global Directus stores through dependency injection.
 *
 * This composable injects the stores object that contains all the Pinia stores used throughout
 * the Directus application, including user store, permissions store, collections store, etc.
 *
 * @returns The injected stores object containing all application stores
 * @throws Error if the stores could not be found in the injection context
 *
 * @example
 * ```typescript
 * import { useStores } from '@directus/composables';
 *
 * export default defineComponent({
 *   setup() {
 *     const stores = useStores();
 *
 *     // Access specific stores
 *     const userStore = stores.useUserStore();
 *     const collectionsStore = stores.useCollectionsStore();
 *     const permissionsStore = stores.usePermissionsStore();
 *
 *     return {
 *       userInfo: userStore.currentUser,
 *       collections: collectionsStore.collections,
 *       permissions: permissionsStore.permissions
 *     };
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using in a component with reactive store data
 * import { useStores } from '@directus/composables';
 * import { computed } from 'vue';
 *
 * export default defineComponent({
 *   setup() {
 *     const stores = useStores();
 *     const userStore = stores.useUserStore();
 *
 *     const isAdmin = computed(() => {
 *       return userStore.currentUser?.role?.admin_access === true;
 *     });
 *
 *     const hasCreatePermission = computed(() => {
 *       const permissionsStore = stores.usePermissionsStore();
 *       return permissionsStore.hasPermission('directus_files', 'create');
 *     });
 *
 *     return { isAdmin, hasCreatePermission };
 *   }
 * });
 * ```
 */
export function useStores(): Record<string, any> {
	const stores = inject<Record<string, any>>(STORES_INJECT);

	if (!stores) throw new Error('[useStores]: The stores could not be found.');

	return stores;
}

/**
 * Vue composable that provides access to the Axios HTTP client instance through dependency injection.
 *
 * This composable injects the configured Axios instance that is set up with the proper base URL,
 * authentication headers, interceptors, and other configuration needed to communicate with the
 * Directus API. It provides a convenient way to make HTTP requests from components and composables.
 *
 * @returns The injected Axios instance configured for Directus API communication
 * @throws Error if the API instance could not be found in the injection context
 *
 * @example
 * ```typescript
 * import { useApi } from '@directus/composables';
 *
 * export default defineComponent({
 *   setup() {
 *     const api = useApi();
 *
 *     const fetchUserData = async (userId: string) => {
 *       try {
 *         const response = await api.get(`/users/${userId}`);
 *         return response.data;
 *       } catch (error) {
 *         console.error('Failed to fetch user data:', error);
 *         throw error;
 *       }
 *     };
 *
 *     return { fetchUserData };
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with reactive data and error handling
 * import { useApi } from '@directus/composables';
 * import { ref, onMounted } from 'vue';
 *
 * export default defineComponent({
 *   setup() {
 *     const api = useApi();
 *     const collections = ref([]);
 *     const loading = ref(false);
 *     const error = ref(null);
 *
 *     const loadCollections = async () => {
 *       loading.value = true;
 *       error.value = null;
 *
 *       try {
 *         const response = await api.get('/collections');
 *         collections.value = response.data.data;
 *       } catch (err) {
 *         error.value = err.response?.data?.errors?.[0]?.message || 'Failed to load collections';
 *       } finally {
 *         loading.value = false;
 *       }
 *     };
 *
 *     onMounted(loadCollections);
 *
 *     return { collections, loading, error, loadCollections };
 *   }
 * });
 * ```
 */
export function useApi(): AxiosInstance {
	const api = inject<AxiosInstance>(API_INJECT);

	if (!api) throw new Error('[useApi]: The api could not be found.');

	return api;
}

/**
 * Vue composable that provides access to the Directus SDK client instance through dependency injection.
 *
 * This composable injects the configured Directus SDK client that provides a type-safe, modern API
 * for interacting with Directus. The SDK offers methods for CRUD operations, authentication, file
 * management, and more, with full TypeScript support and automatic type inference based on your schema.
 *
 * @template Schema - The TypeScript schema type for your Directus instance, defaults to `any`
 * @returns The injected Directus SDK client with REST client capabilities
 * @throws Error if the SDK instance could not be found in the injection context
 *
 * @example
 * ```typescript
 * import { useSdk } from '@directus/composables';
 *
 * // Using with default schema
 * export default defineComponent({
 *   setup() {
 *     const sdk = useSdk();
 *
 *     const fetchArticles = async () => {
 *       try {
 *         const articles = await sdk.items('articles').readByQuery({
 *           filter: { status: { _eq: 'published' } },
 *           sort: ['-date_created'],
 *           limit: 10
 *         });
 *         return articles;
 *       } catch (error) {
 *         console.error('Failed to fetch articles:', error);
 *         throw error;
 *       }
 *     };
 *
 *     return { fetchArticles };
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with typed schema for better type safety
 * import { useSdk } from '@directus/composables';
 *
 * interface MySchema {
 *   articles: {
 *     id: string;
 *     title: string;
 *     content: string;
 *     status: 'draft' | 'published';
 *     author: string;
 *     date_created: string;
 *   };
 *   authors: {
 *     id: string;
 *     name: string;
 *     email: string;
 *   };
 * }
 *
 * export default defineComponent({
 *   setup() {
 *     const sdk = useSdk<MySchema>();
 *
 *     const createArticle = async (articleData: Partial<MySchema['articles']>) => {
 *       try {
 *         const newArticle = await sdk.items('articles').createOne(articleData);
 *         return newArticle; // Fully typed return value
 *       } catch (error) {
 *         console.error('Failed to create article:', error);
 *         throw error;
 *       }
 *     };
 *
 *     const updateArticle = async (id: string, updates: Partial<MySchema['articles']>) => {
 *       try {
 *         const updatedArticle = await sdk.items('articles').updateOne(id, updates);
 *         return updatedArticle; // Type-safe updates
 *       } catch (error) {
 *         console.error('Failed to update article:', error);
 *         throw error;
 *       }
 *     };
 *
 *     return { createArticle, updateArticle };
 *   }
 * });
 * ```
 */
export function useSdk<Schema extends object = any>(): DirectusClient<Schema> & RestClient<Schema> {
	const sdk = inject<DirectusClient<Schema> & RestClient<Schema>>(SDK_INJECT);

	if (!sdk) throw new Error('[useSdk]: The sdk could not be found.');

	return sdk;
}

/**
 * Vue composable that provides access to the registered Directus extensions through dependency injection.
 *
 * This composable injects the extensions configuration object that contains all registered app
 * extensions including interfaces, displays, layouts, modules, panels, operations, and more.
 * The extensions are provided as reactive references and can be used to dynamically access
 * and utilize custom functionality within the Directus application.
 *
 * @returns A reactive record of extension configurations organized by extension type
 * @throws Error if the extensions could not be found in the injection context
 *
 * @example
 * ```typescript
 * import { useExtensions } from '@directus/composables';
 *
 * export default defineComponent({
 *   setup() {
 *     const extensions = useExtensions();
 *
 *     const getAvailableInterfaces = () => {
 *       return Object.values(extensions.interfaces || {});
 *     };
 *
 *     const getAvailableDisplays = () => {
 *       return Object.values(extensions.displays || {});
 *     };
 *
 *     const findInterfaceByName = (name: string) => {
 *       return extensions.interfaces?.[name] || null;
 *     };
 *
 *     return {
 *       getAvailableInterfaces,
 *       getAvailableDisplays,
 *       findInterfaceByName
 *     };
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with computed properties for reactive extension lists
 * import { useExtensions } from '@directus/composables';
 * import { computed } from 'vue';
 *
 * export default defineComponent({
 *   setup() {
 *     const extensions = useExtensions();
 *
 *     const availableLayouts = computed(() => {
 *       return Object.entries(extensions.layouts || {}).map(([key, config]) => ({
 *         id: key,
 *         name: config.name,
 *         icon: config.icon,
 *         component: config.component
 *       }));
 *     });
 *
 *     const customModules = computed(() => {
 *       return Object.values(extensions.modules || {}).filter(module =>
 *         !module.preRegisterCheck || module.preRegisterCheck()
 *       );
 *     });
 *
 *     const operationsByGroup = computed(() => {
 *       const operations = Object.values(extensions.operations || {});
 *       return operations.reduce((groups, operation) => {
 *         const group = operation.overview?.group || 'other';
 *         if (!groups[group]) groups[group] = [];
 *         groups[group].push(operation);
 *         return groups;
 *       }, {} as Record<string, any[]>);
 *     });
 *
 *     return {
 *       availableLayouts,
 *       customModules,
 *       operationsByGroup
 *     };
 *   }
 * });
 * ```
 */
export function useExtensions(): RefRecord<AppExtensionConfigs> {
	const extensions = inject<RefRecord<AppExtensionConfigs>>(EXTENSIONS_INJECT);

	if (!extensions) throw new Error('[useExtensions]: The extensions could not be found.');

	return extensions;
}
