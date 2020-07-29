<template>
	<div class="permissions-row">
		<div class="row">
			<div class="name">{{ info.name }}</div>

			<permissions-toggle
				type="create"
				:options="['none', 'full']"
				:value="getCombinedPermission('create')"
				:save-permission="saveForAllStatuses"
				:collection="collection"
				:role="role"
			/>
			<permissions-toggle
				type="read"
				:options="userCreatedField ? ['none', 'mine', 'role', 'full'] : ['none', 'full']"
				:value="getCombinedPermission('read')"
				:save-permission="saveForAllStatuses"
				:collection="collection"
				:role="role"
			/>
			<permissions-toggle
				type="update"
				:options="userCreatedField ? ['none', 'mine', 'role', 'full'] : ['none', 'full']"
				:value="getCombinedPermission('update')"
				:save-permission="saveForAllStatuses"
				:collection="collection"
				:role="role"
			/>
			<permissions-toggle
				type="delete"
				:options="userCreatedField ? ['none', 'mine', 'role', 'full'] : ['none', 'full']"
				:value="getCombinedPermission('delete')"
				:save-permission="saveForAllStatuses"
				:collection="collection"
				:role="role"
			/>
			<permissions-toggle
				type="comment"
				:options="['none', 'read', 'create', 'update', 'full']"
				:value="getCombinedPermission('comment')"
				:save-permission="saveForAllStatuses"
				:collection="collection"
				:role="role"
			/>

			<permissions-fields
				:collection="collection"
				:role="role"
				:save-permission="saveForAllStatuses"
				:read-blacklist="getCombinedPermission('read_field_blacklist')"
				:write-blacklist="getCombinedPermission('write_field_blacklist')"
				combined
			/>
			<permissions-statuses
				v-if="statuses"
				:collection="collection"
				:role="role"
				:save-permission="saveForAllStatuses"
				:status-blacklist="getCombinedPermission('status_blacklist')"
				:statuses="statuses"
				combined
			/>
			<div class="spacer" v-else>--</div>

			<v-icon @click="detailsOpen = !detailsOpen" :name="detailsOpen ? 'expand_less' : 'expand_more'" />
		</div>

		<div class="details" v-if="detailsOpen">
			<div class="row">
				<div class="name">
					<v-icon class="sub-indicator" name="subdirectory_arrow_right" />
					{{ $t('on_create') }}
				</div>

				<v-icon v-for="n in 5" :key="n" class="spacer" name="block" />

				<permissions-fields
					:collection="collection"
					:role="role"
					:save-permission="savePermission"
					status="$create"
					:permission-id="getPermissionValue('id', '$create')"
					:read-blacklist="getPermissionValue('read_field_blacklist', '$create')"
					:write-blacklist="getPermissionValue('write_field_blacklist', '$create')"
				/>

				<permissions-statuses
					v-if="statuses"
					:collection="collection"
					:role="role"
					:save-permission="savePermission"
					status="$create"
					:statuses="statuses"
					:permission-id="getPermissionValue('id', '$create')"
					:status-blacklist="getPermissionValue('status_blacklist', '$create')"
				/>
				<div class="spacer" v-else>--</div>
			</div>

			<template v-if="statuses">
				<div class="row" v-for="status in statuses" :key="status.value">
					<div class="name">
						<v-icon class="sub-indicator" name="subdirectory_arrow_right" />
						{{ status.name }}
					</div>

					<permissions-toggle
						type="create"
						:options="['none', 'full']"
						:value="getPermissionValue('create', status.value)"
						:status="status.value"
						:save-permission="savePermission"
						:permission-id="getPermissionValue('id', status.value)"
						:collection="collection"
						:role="role"
					/>
					<permissions-toggle
						type="read"
						:options="userCreatedField ? ['none', 'mine', 'role', 'full'] : ['none', 'full']"
						:value="getPermissionValue('read', status.value)"
						:status="status.value"
						:save-permission="savePermission"
						:permission-id="getPermissionValue('id', status.value)"
						:collection="collection"
						:role="role"
					/>
					<permissions-toggle
						type="update"
						:options="userCreatedField ? ['none', 'mine', 'role', 'full'] : ['none', 'full']"
						:value="getPermissionValue('update', status.value)"
						:status="status.value"
						:save-permission="savePermission"
						:permission-id="getPermissionValue('id', status.value)"
						:collection="collection"
						:role="role"
					/>
					<permissions-toggle
						type="delete"
						:options="userCreatedField ? ['none', 'mine', 'role', 'full'] : ['none', 'full']"
						:value="getPermissionValue('delete', status.value)"
						:status="status.value"
						:save-permission="savePermission"
						:permission-id="getPermissionValue('id', status.value)"
						:collection="collection"
						:role="role"
					/>
					<permissions-toggle
						type="comment"
						:options="['none', 'read', 'create', 'update', 'full']"
						:value="getPermissionValue('comment', status.value)"
						:status="status.value"
						:save-permission="savePermission"
						:permission-id="getPermissionValue('id', status.value)"
						:collection="collection"
						:role="role"
					/>

					<permissions-fields
						:collection="collection"
						:role="role"
						:save-permission="savePermission"
						:status="status.value"
						:permission-id="getPermissionValue('id', status.value)"
						:read-blacklist="getPermissionValue('read_field_blacklist', status.value)"
						:write-blacklist="getPermissionValue('write_field_blacklist', status.value)"
					/>

					<permissions-statuses
						v-if="statuses"
						:collection="collection"
						:role="role"
						:save-permission="savePermission"
						:status="status.value"
						:statuses="statuses"
						:permission-id="getPermissionValue('id', status.value)"
						:status-blacklist="getPermissionValue('status_blacklist', status.value)"
					/>
					<div class="spacer" v-else>--</div>

					<div class="spacer" />
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, computed, PropType } from '@vue/composition-api';
import useCollection from '@/composables/use-collection';
import PermissionsToggle from '../permissions-toggle';
import PermissionsFields from '../permissions-fields';
import PermissionsStatuses from '../permissions-statuses';
import { Permission } from '../../composables/use-permissions';

function getDefaultPermission(collection: string, role: number, status?: string) {
	const defaultPermission: Permission = {
		collection: collection,
		role: role,
		create: 'none',
		read: 'none',
		update: 'none',
		delete: 'none',
		comment: 'none',
		read_field_blacklist: [],
		write_field_blacklist: [],
		status_blacklist: [],
		status: status || null,
	};

	return defaultPermission;
}

export default defineComponent({
	components: { PermissionsToggle, PermissionsFields, PermissionsStatuses },
	props: {
		role: {
			type: Number,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		system: {
			type: Boolean,
			default: false,
		},
		savedPermissions: {
			type: Array as PropType<Permission[]>,
			required: true,
		},
		savePermission: {
			type: Function,
			required: true,
		},
		saveAll: {
			type: Function as PropType<(create: Partial<Permission>[], update: Partial<Permission>[]) => void>,
			required: true,
		},
	},
	setup(props) {
		const { collection } = toRefs(props);
		const { fields, info, statusField, userCreatedField } = useCollection(collection);

		const detailsOpen = ref(false);

		type Status = {
			value: string;
			name: string;
		};

		const statuses = computed<Status[] | null>(() => {
			if (statusField.value && statusField.value.system.options) {
				return Object.keys(statusField.value.system.options.status_mapping).map((key: string) => ({
					...statusField.value?.system.options?.status_mapping[key],
					value: key,
				}));
			}
			return null;
		});

		const permissions = computed<Permission[]>(() => {
			const createPermission =
				props.savedPermissions?.find((permission) => permission.status === '$create') ||
				getDefaultPermission(props.collection, props.role, '$create');

			if (statusField.value && statuses.value) {
				const statusPermissions = statuses.value.map((status) => {
					const existing = props.savedPermissions.find((permission) => permission.status === status.value);

					return existing || getDefaultPermission(props.collection, props.role, status.value);
				});

				return [...statusPermissions, createPermission];
			} else {
				const collectionPermission =
					props.savedPermissions.find((permission) => permission.status === null) ||
					getDefaultPermission(props.collection, props.role);

				return [collectionPermission, createPermission];
			}
		});

		return {
			info,
			fields,
			statusField,
			statuses,
			detailsOpen,
			permissions,
			userCreatedField,
			getPermissionValue,
			getCombinedPermission,
			saveForAllStatuses,
		};

		function getPermissionValue(type: keyof Permission, status: string | null = null) {
			const permission = permissions.value.find((permission) => permission.status === status);

			return permission?.[type];
		}

		function getCombinedPermission(type: keyof Permission) {
			if (type.endsWith('_blacklist')) {
				return permissions.value.map((permission) => permission[type]);
			}

			if (statusField.value) {
				let value = permissions.value[0][type];

				for (const permission of permissions.value.filter(({ status }) => status !== '$create')) {
					if (value !== permission[type]) {
						value = 'indeterminate';
						break;
					}
				}

				return value;
			} else {
				const permission = permissions.value.find((permission) => permission.status === null);

				return permission?.[type];
			}
		}

		async function saveForAllStatuses(updates: Partial<Permission>) {
			const create: Partial<Permission>[] = [];
			const update: Partial<Permission>[] = [];

			permissions.value.forEach((permission) => {
				if (permission.id) {
					update.push({
						...updates,
						id: permission.id,
						status: permission.status,
					});
				} else {
					create.push({
						...updates,
						status: permission.status,
					});
				}
			});

			await props.saveAll(create, update);
		}
	},
});
</script>

<style lang="scss" scoped>
.row {
	display: grid;
	grid-gap: var(--grid-gap);
	grid-template-columns: var(--grid-template-columns);
	align-items: center;
	padding: 8px 12px;
}

.permissions-row:not(:first-child),
.details .row:first-child {
	border-top: 2px solid var(--border-subdued);
}

.details {
	grid-column: 1 / -1;
	background-color: var(--background-subdued);
}

.sub-indicator {
	--v-icon-color: var(--foreground-subdued);
}

.spacer {
	color: var(--foreground-subdued);
}
</style>
