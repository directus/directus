<template>
	<div class="permissions-overview">
		<h2 class="title type-label">
			{{ $t('permissions') }}
			<span class="instant-save">{{ $t('saves_automatically') }}</span>
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

			<button class="system-toggle" @click="systemVisible = !systemVisible">
				{{ $t('system_collections') }}
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
					/>
				</div>
			</transition-expand>
		</div>

		<router-view
			name="permissionsDetail"
			:role-key="role"
			:permission-key="permission"
			@refresh="refreshPermission"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, provide } from '@vue/composition-api';
import { useCollectionsStore } from '@/stores';
import PermissionsOverviewHeader from './permissions-overview-header.vue';
import PermissionsOverviewRow from './permissions-overview-row.vue';
import { Permission } from '@/types';
import api from '@/api';

export default defineComponent({
	components: { PermissionsOverviewHeader, PermissionsOverviewRow },
	props: {
		role: {
			type: String,
			default: null,
		},
		permission: {
			// the permission row primary key in case we're on the permission detail modal view
			type: String,
			default: null,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const regularCollections = computed(() =>
			collectionsStore.state.collections.filter(
				(collection) => collection.collection.startsWith('directus_') === false
			)
		);

		const systemCollections = computed(() =>
			collectionsStore.state.collections.filter(
				(collection) => collection.collection.startsWith('directus_') === true
			)
		);

		const systemVisible = ref(false);

		const { permissions, loading, error, fetchPermissions, refreshPermission, refreshing } = usePermissions();

		fetchPermissions();

		provide('refresh-permissions', fetchPermissions);

		return {
			systemVisible,
			regularCollections,
			systemCollections,
			permissions,
			loading,
			error,
			fetchPermissions,
			refreshPermission,
			refreshing,
		};

		function usePermissions() {
			const permissions = ref<Permission[]>([]);
			const loading = ref(false);
			const refreshing = ref<number[]>([]);
			const error = ref();

			return { permissions, loading, error, fetchPermissions, refreshPermission, refreshing };

			async function fetchPermissions() {
				error.value = null;
				loading.value = true;

				try {
					const response = await api.get('/permissions', {
						params: {
							filter: {
								role: {
									_eq: props.role,
								},
							},
						},
					});

					permissions.value = response.data.data;
				} catch (err) {
					error.value = err;
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
				} catch (err) {
					console.log(`Couldn't refresh permissions ${id}`);
				} finally {
					refreshing.value = refreshing.value.filter((inProgressID) => inProgressID !== id);
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview {
	position: relative;
}

.title {
	margin-bottom: 12px;

	.instant-save {
		margin-left: 4px;
		color: var(--warning);
	}
}

.table {
	max-width: 792px;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}

.system-toggle {
	width: 100%;
	height: 48px;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);

	.v-icon {
		vertical-align: -7px;
	}
}
</style>
