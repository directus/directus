<template>
	<div class="permissions-overview-toggle">
		<v-menu show-arrow>
			<template #activator="{ toggle }">
				<div>
					<v-progress-circular indeterminate v-if="loading || saving" small />
					<v-icon v-else-if="permissionLevel === 'all'" @click="toggle" name="check" class="all" />
					<v-icon v-else-if="permissionLevel === 'custom'" @click="toggle" name="rule" class="custom" />
					<v-icon v-else-if="permissionLevel === 'none'" @click="toggle" name="block" class="none" />
				</div>
			</template>

			<v-list>
				<v-list-item @click="setFullAccess">
					<v-list-item-icon>
						<v-icon name="check" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('all_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item @click="setNoAccess">
					<v-list-item-icon>
						<v-icon name="block" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('no_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-divider />

				<v-list-item @click="openPermissions">
					<v-list-item-icon>
						<v-icon name="rule" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('use_custom') }}
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="launch" />
					</v-list-item-icon>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from '@vue/composition-api';
import { Collection, Permission } from '@/types';
import api from '@/api';
import router from '@/router';

export default defineComponent({
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		role: {
			type: String,
			default: null,
		},
		action: {
			type: String,
			required: true,
		},
		permission: {
			type: Object as PropType<Permission>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const permissionLevel = computed<'all' | 'none' | 'custom'>(() => {
			if (props.permission === null) return 'none';
			if (hasAll() === true) return 'all';

			return 'custom';

			function hasAll() {
				if (!props.permission) return false;
				if (props.permission.fields !== '*') return false;
				if (Object.keys(props.permission.permissions || {}).length > 0) return false;
				if (Object.keys(props.permission.validation || {}).length > 0) return false;

				return true;
			}
		});

		const saving = ref(false);

		const refresh = inject<() => Promise<void>>('refresh-permissions');

		return { permissionLevel, saving, setFullAccess, setNoAccess, openPermissions };

		async function setFullAccess() {
			saving.value = true;

			// If this collection isn't "managed" yet, make sure to add it to directus_collections first
			// before trying to associate any permissions with it
			if (props.collection.meta === null) {
				await api.patch(`/collections/${props.collection.collection}`, {
					meta: {},
				});
			}

			if (props.permission) {
				try {
					await api.patch(`/permissions/${props.permission.id}`, {
						fields: '*',
						permissions: null,
						validation: null,
					});
				} catch (err) {
					console.error(err);
				} finally {
					await refresh?.();
					saving.value = false;
				}
			} else {
				try {
					await api.post('/permissions/', {
						role: props.role,
						collection: props.collection.collection,
						action: props.action,
						fields: '*',
					});
				} catch (err) {
					console.error(err);
				} finally {
					await refresh?.();
					saving.value = false;
				}
			}
		}

		async function setNoAccess() {
			if (!props.permission) return;

			saving.value = true;

			try {
				await api.delete(`/permissions/${props.permission.id}`);
			} catch (err) {
				console.error(err);
			} finally {
				await refresh?.();
				saving.value = false;
			}
		}

		async function openPermissions() {
			// If this collection isn't "managed" yet, make sure to add it to directus_collections first
			// before trying to associate any permissions with it
			if (props.collection.meta === null) {
				await api.patch(`/collections/${props.collection.collection}`, {
					meta: {},
				});
			}

			if (props.permission) {
				router.push(`/settings/roles/${props.role || 'public'}/${props.permission.id}`);
			} else {
				saving.value = true;

				const permResponse = await api.post('/permissions', {
					role: props.role,
					collection: props.collection.collection,
					action: props.action,
				});

				await refresh?.();

				saving.value = false;
				router.push(`/settings/roles/${props.role || 'public'}/${permResponse.data.data.id}`);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview-toggle {
	position: relative;
}

.all {
	--v-icon-color: var(--success);
}

.custom {
	--v-icon-color: var(--warning);
}

.none {
	--v-icon-color: var(--danger);
}
</style>
