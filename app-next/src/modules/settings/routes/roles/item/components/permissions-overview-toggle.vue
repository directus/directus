<template>
	<div
		class="permissions-overview-toggle"
		:class="[{ 'has-app-minimal': !!appMinimal }, permissionLevel, appMinimalLevel]"
		v-tooltip="appMinimal && $t('required_for_app_access')"
	>
		<v-icon v-if="appMinimalLevel === 'full'" name="check" class="all app-minimal" />

		<v-menu show-arrow v-else>
			<template #activator="{ toggle }">
				<div>
					<v-progress-circular indeterminate v-if="loading || saving" small />
					<v-icon v-else-if="permissionLevel === 'all'" @click="toggle" name="check" />
					<v-icon
						v-else-if="appMinimalLevel === 'partial' || permissionLevel === 'custom'"
						@click="toggle"
						name="rule"
					/>
					<v-icon v-else-if="permissionLevel === 'none'" @click="toggle" name="block" />
				</div>
			</template>

			<v-list>
				<v-list-item :disabled="permissionLevel === 'all'" @click="setFullAccess(action)">
					<v-list-item-icon>
						<v-icon name="check" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('all_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item
					v-if="!!appMinimalLevel === false"
					:disabled="permissionLevel === 'none'"
					@click="setNoAccess(action)"
				>
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
import { defineComponent, PropType, computed, inject, ref, toRefs } from '@vue/composition-api';
import { Collection, Permission } from '@/types';
import api from '@/api';
import router from '@/router';
import useUpdatePermissions from '../composables/use-update-permissions';

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
		permissions: {
			type: Array as PropType<Permission[]>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		appMinimal: {
			type: [Boolean, Object] as PropType<false | Partial<Permission>>,
			default: false,
		},
	},
	setup(props) {
		const { collection, role, permissions } = toRefs(props);
		const { setFullAccess, setNoAccess, getPermission } = useUpdatePermissions(collection, permissions, role);

		const permission = computed(() => getPermission(props.action));

		const permissionLevel = computed<'all' | 'none' | 'custom'>(() => {
			if (permission.value === undefined) return 'none';
			if (hasAll() === true) return 'all';

			return 'custom';

			function hasAll() {
				if (!permission.value) return false;
				if (permission.value.fields?.includes('*') === false) return false;
				if (Object.keys(permission.value.permissions || {}).length > 0) return false;
				if (Object.keys(permission.value.validation || {}).length > 0) return false;

				return true;
			}
		});

		const saving = ref(false);

		const refresh = inject<() => Promise<void>>('refresh-permissions');

		const appMinimalLevel = computed(() => {
			if (props.appMinimal === false) return null;
			if (Object.keys(props.appMinimal).length === 2) return 'full';
			return 'partial';
		});

		return { permissionLevel, saving, setFullAccess, setNoAccess, openPermissions, appMinimalLevel };

		async function openPermissions() {
			// If this collection isn't "managed" yet, make sure to add it to directus_collections first
			// before trying to associate any permissions with it
			if (props.collection.meta === null) {
				await api.patch(`/collections/${props.collection.collection}`, {
					meta: {},
				});
			}

			if (permission.value) {
				router.push(`/settings/roles/${props.role || 'public'}/${permission.value.id}`);
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

	&::before {
		transition: opacity var(--slow) var(--transition);
		position: absolute;
		top: -4px;
		left: -4px;
		width: calc(100% + 8px);
		height: calc(100% + 8px);
		background-color: var(--background-highlight);
		border-radius: 50%;
		content: '';
		opacity: 0;
	}
	&:hover::before,
	&.has-app-minimal::before {
		opacity: 1;
	}
}

.none {
	--v-icon-color: var(--danger);
	--v-icon-color-hover: var(--danger);

	&::before {
		background-color: var(--danger-10);
	}
}

.partial,
.custom {
	--v-icon-color: var(--warning);
	--v-icon-color-hover: var(--warning);

	&::before {
		background-color: var(--warning-10);
	}
}

.all {
	--v-icon-color: var(--success);
	--v-icon-color-hover: var(--success);

	&::before {
		background-color: var(--success-10);
	}
}

.has-app-minimal {
	&::before {
		background-color: var(--background-highlight) !important;
	}
}

.app-minimal {
	cursor: not-allowed;
}
</style>
