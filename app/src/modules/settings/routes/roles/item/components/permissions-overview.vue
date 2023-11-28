<script setup lang="ts">
import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { unexpectedError } from '@/utils/unexpected-error';
import { Permission } from '@directus/types';
import { orderBy } from 'lodash';
import { computed, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { appMinimalPermissions, appRecommendedPermissions } from '../../app-permissions';
import PermissionsOverviewHeader from './permissions-overview-header.vue';
import PermissionsOverviewRow from './permissions-overview-row.vue';

const props = defineProps<{
	role?: string;
	/** the permission row primary key in case we're on the permission detail modal view */
	permission?: string;
	appAccess?: boolean;
}>();

const { t } = useI18n();

const collectionsStore = useCollectionsStore();

const regularCollections = computed(() => collectionsStore.databaseCollections);

const systemCollections = computed(() =>
	orderBy(
		collectionsStore.collections.filter((collection) => collection.collection.startsWith('directus_') === true),
		'name',
	),
);

const systemVisible = ref(false);

const { permissions, fetchPermissions, refreshing } = usePermissions();

const { resetActive, resetSystemPermissions, resetting } = useReset();

watch(() => props.permission, fetchPermissions, { immediate: true });

provide('refresh-permissions', fetchPermissions);

function usePermissions() {
	const permissions = ref<Permission[]>([]);
	const loading = ref(false);
	const refreshing = ref<number[]>([]);

	return { permissions, loading, fetchPermissions, refreshPermission, refreshing };

	async function fetchPermissions() {
		loading.value = true;

		try {
			const params: any = { filter: { role: {} } };

			if (props.role === null) {
				params.filter.role = { _null: true };
			} else {
				params.filter.role = { _eq: props.role };
			}

			const response = await api.get('/permissions', { params });
			permissions.value = response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function refreshPermission(id: number) {
		if (refreshing.value.includes(id) === false) {
			refreshing.value.push(id);
		}

		try {
			const response = await api.get(`/permissions/${id}`);

			permissions.value = permissions.value.map((permission) => {
				if (permission.id === id) return response.data.data;
				return permission;
			});
		} catch (error) {
			unexpectedError(error);
		} finally {
			refreshing.value = refreshing.value.filter((inProgressID) => inProgressID !== id);
		}
	}
}

function useReset() {
	const resetActive = ref<string | boolean>(false);
	const resetting = ref(false);
	const resetError = ref<any>(null);

	return { resetActive, resetSystemPermissions, resetting, resetError };

	async function resetSystemPermissions(useRecommended: boolean) {
		resetting.value = true;

		const toBeDeleted = permissions.value
			.filter((permission) => permission.collection.startsWith('directus_'))
			.map((permission) => permission.id);

		try {
			if (toBeDeleted.length > 0) {
				await api.delete(`/permissions`, { data: toBeDeleted });
			}

			if (props.role !== null && props.appAccess === true && useRecommended === true) {
				await api.post(
					'/permissions',
					appRecommendedPermissions.map((permission) => ({
						...permission,
						role: props.role,
					})),
				);
			}

			await fetchPermissions();

			resetActive.value = false;
		} catch (err: any) {
			resetError.value = err;
		} finally {
			resetting.value = false;
		}
	}
}
</script>

<template>
	<div class="permissions-overview">
		<h2 class="title type-label">
			{{ t('permissions') }}
			<span class="instant-save">{{ t('saves_automatically') }}</span>
		</h2>

		<div class="table">
			<permissions-overview-header />

			<permissions-overview-row
				v-for="collection in regularCollections"
				:key="collection.collection"
				:collection="collection"
				:role="role"
				:permissions="permissions.filter((p) => p.collection === collection.collection)"
				:refreshing="refreshing"
			/>

			<button class="system-toggle" :class="{ active: systemVisible }" @click="systemVisible = !systemVisible">
				{{ t('system_collections') }}
				<v-icon :name="systemVisible ? 'expand_less' : 'expand_more'" />
			</button>

			<transition-expand>
				<div v-if="systemVisible">
					<permissions-overview-row
						v-for="collection in systemCollections"
						:key="collection.collection"
						:collection="collection"
						:role="role"
						:permissions="permissions.filter((p) => p.collection === collection.collection)"
						:refreshing="refreshing"
						:app-minimal="
							appAccess ? appMinimalPermissions.filter((p) => p.collection === collection.collection) : undefined
						"
					/>
				</div>
			</transition-expand>

			<span v-if="systemVisible && appAccess" class="reset-toggle">
				{{ t('reset_system_permissions_to') }}
				<button @click="resetActive = 'minimum'">{{ t('app_access_minimum') }}</button>
				/
				<button @click="resetActive = 'recommended'">{{ t('recommended_defaults') }}</button>
			</span>
		</div>

		<router-view name="permissionsDetail" :role-key="role" :permission-key="permission" />

		<v-dialog :model-value="!!resetActive" @update:model-value="resetActive = false" @esc="resetActive = false">
			<v-card>
				<v-card-title>
					{{ t('reset_system_permissions_copy') }}
				</v-card-title>
				<v-card-actions>
					<v-button secondary @click="resetActive = false">{{ t('cancel') }}</v-button>
					<v-button :loading="resetting" @click="resetSystemPermissions(resetActive === 'recommended')">
						{{ t('reset') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="scss" scoped>
.permissions-overview {
	position: relative;
}

.title {
	margin-bottom: 12px;

	.instant-save {
		margin-left: 4px;
		color: var(--theme--warning);
	}
}

.table {
	max-width: 792px;
	background-color: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}

.system-toggle {
	width: 100%;
	height: 48px;
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--background-subdued);
	border-bottom-left-radius: var(--theme--border-radius);
	border-bottom-right-radius: var(--theme--border-radius);

	&.active {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.v-icon {
		vertical-align: -7px;
	}
}

.reset-toggle {
	display: block;
	margin: 8px auto;
	color: var(--theme--foreground-subdued);
	text-align: center;

	button {
		color: var(--theme--primary) !important;
		transition: color var(--fast) var(--transition);
	}

	button:hover {
		color: var(--theme--foreground) !important;
	}
}
</style>
