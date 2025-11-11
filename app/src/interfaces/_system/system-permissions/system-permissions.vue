<script setup lang="ts">
import api from '@/api';
import { appRecommendedPermissions, disabledActions } from '@/app-permissions.js';
import { DisplayItem } from '@/composables/use-relation-multiple';
import { RelationO2M, useRelationO2M } from '@/composables/use-relation-o2m';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';
import { unexpectedError } from '@/utils/unexpected-error';
import { PERMISSION_ACTIONS } from '@directus/constants';
import { appAccessMinimalPermissions, isSystemCollection } from '@directus/system-data';
import { type Alterations, Filter, Permission, PermissionsAction } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { cloneDeep, get, groupBy, isNil, merge, orderBy, sortBy } from 'lodash';
import { computed, inject, nextTick, type Ref, ref, toRefs, watch } from 'vue';
import AddCollection from './add-collection.vue';
import PermissionsDetail from './detail/permissions-detail.vue';
import PermissionsHeader from './permissions-header.vue';
import PermissionsRow from './permissions-row.vue';

type PermissionGroup = {
	collection: Collection;
	permissions: Permission[];
};

const props = withDefaults(
	defineProps<{
		primaryKey: string;
		disabled?: boolean;
		value: number[] | Alterations<Permission>;
		collection: string;
		field: string;
	}>(),
	{
		disabled: false,
	},
);

const emit = defineEmits<{
	(e: 'input', value: Permission[] | number[] | Alterations<Permission>): void;
}>();

const { collection, primaryKey, field } = toRefs(props);

const contentEl = inject<Ref<Element | null>>('main-element');
const permissionsTable = ref<HTMLTableElement | null>(null);

const collectionsStore = useCollectionsStore();
const { relationInfo } = useRelationO2M(collection, field);

const values = inject<Ref<Record<string, any>>>('values');
const appAccess = computed(() => values?.value.app_access ?? false);
const adminAccess = computed(() => values?.value.admin_access ?? false);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const { update, remove, create, displayItems, getItemEdits, loading, resetActive, resetSystemPermissions } =
	usePermissions(value, relationInfo, primaryKey, appAccess);

const { allPermissions, regularPermissions, systemPermissions, addEmptyPermission, removeEmptyCollection } =
	useGroupedPermissions();

function getPermission(collection: string, action: PermissionsAction) {
	return displayItems.value.find(
		(item) => item.collection === collection && item.action === action && !isNil(item.policy),
	);
}

function createEmptyPermission<P extends Permission>(
	overrides: Pick<P, 'collection' | 'action'> & Partial<Omit<P, 'collection' | 'action'>>,
): P {
	return {
		policy: primaryKey.value,
		permissions: null,
		validation: null,
		fields: null,
		presets: null,
		...overrides,
	} as P;
}

const currentlyEditingKey = ref<string | null>(null);
const currentlyEditingItem = ref<DisplayItem | null>(null);
const editsAtStart = ref<Record<string, any>>({});
const newItem = ref(false);

function editItem(collection: string, action: PermissionsAction) {
	if (!relationInfo.value) return;

	const existingPermission = getPermission(collection, action);

	newItem.value = existingPermission === undefined;

	editsAtStart.value = existingPermission
		? getItemEdits(existingPermission)
		: createEmptyPermission({
				collection,
				action,
			});

	if (newItem.value || existingPermission?.$type === 'created') {
		currentlyEditingKey.value = '+';
	} else {
		currentlyEditingKey.value = existingPermission!.id;
	}

	currentlyEditingItem.value = existingPermission ?? null;
}

function stageEdits(item: Permission | null) {
	if (newItem.value && item !== null) {
		create(item);
	} else if (item) {
		update(item);
	} else if (currentlyEditingItem.value) {
		remove(currentlyEditingItem.value);
	}
}

function cancelEdit() {
	currentlyEditingItem.value = null;
	currentlyEditingKey.value = null;
}

function removeCollection(collection: string) {
	setNoAccessAll(collection);
	removeEmptyCollection(collection);
}

function setFullAccessAll(collection: string) {
	for (const action of PERMISSION_ACTIONS) {
		setFullAccess(collection, action);
	}
}

function setNoAccessAll(collection: string) {
	for (const action of PERMISSION_ACTIONS) {
		setNoAccess(collection, action);
	}
}

function setFullAccess(collection: string, action: PermissionsAction) {
	if (disabledActions[collection]?.includes(action)) return;

	const existing = getPermission(collection, action);

	if (existing) {
		update({
			...existing,
			fields: ['*'],
			permissions: null,
			validation: null,
			presets: null,
		});
	} else {
		create(
			createEmptyPermission({
				collection,
				action,
				policy: primaryKey.value,
				fields: ['*'],
			}),
		);
	}
}

function setNoAccess(collection: string, action: PermissionsAction) {
	if (disabledActions[collection]?.includes(action)) return;

	const existing = getPermission(collection, action);

	if (existing && existing.$type !== 'deleted') {
		remove(existing);
	}
}

function usePermissions(
	value: Ref<number[] | Alterations<Permission> | undefined>,
	relation: Ref<RelationO2M | undefined>,
	itemId: Ref<string | number>,
	addMinimalAppPermissions: Ref<boolean>,
) {
	const loading = ref(false);
	const fetchedItems = ref<Permission[]>([]);

	const _value = computed<Alterations<Record<string, any>>>({
		get() {
			if (!value.value || Array.isArray(value.value)) {
				return {
					create: [],
					update: [],
					delete: [],
				};
			}

			return value.value as Alterations<Permission>;
		},
		set(newValue) {
			if (newValue.create.length === 0 && newValue.update.length === 0 && newValue.delete.length === 0) {
				value.value = undefined;
				return;
			}

			value.value = newValue;
		},
	});

	// Fetch new items when the value gets changed by the external "save and stay"
	// We don't want to refresh when we ourself reset the value (when we have no more changes)
	watch(value, (newValue, oldValue) => {
		if (
			Array.isArray(newValue) &&
			oldValue &&
			(('create' in oldValue && Array.isArray(oldValue.create) && oldValue.create.length > 0) ||
				('update' in oldValue && Array.isArray(oldValue.update) && oldValue.update.length > 0) ||
				('delete' in oldValue && Array.isArray(oldValue.delete) && oldValue.delete.length > 0))
		) {
			fetchPermissions();
		}
	});

	watch([primaryKey, relationInfo], fetchPermissions, { immediate: true });

	const createdItems = computed(() => {
		const info = relation.value;
		if (info?.type === undefined) return [];

		const items = _value.value.create.map((item, index) => {
			return {
				...item,
				$type: 'created',
				$index: index,
			} as DisplayItem;
		});

		return items;
	});

	const displayItems = computed(() => {
		if (!relation.value) return [];

		const targetPKField = relation.value.relatedPrimaryKeyField.field;

		const items: DisplayItem[] = fetchedItems.value.map((item: Record<string, any>) => {
			let edits;

			for (const [index, value] of _value.value.update.entries()) {
				if (typeof value === 'object' && value[targetPKField] === item[targetPKField]) {
					edits = { index, value };
					break;
				}
			}

			let updatedItem: Record<string, any> = cloneDeep(item);

			if (edits) {
				updatedItem = {
					...updatedItem,
					...edits.value,
				};

				updatedItem.$type = 'updated';
				updatedItem.$index = edits.index;
				updatedItem.$edits = edits.index;
			}

			const deleteIndex = _value.value.delete.findIndex((id) => id === item[targetPKField]);

			if (deleteIndex !== -1) {
				merge(updatedItem, { $type: 'deleted', $index: deleteIndex });
			}

			return updatedItem;
		});

		items.push(...createdItems.value);

		if (addMinimalAppPermissions.value) {
			for (const perm of appAccessMinimalPermissions) {
				if (items.find((item) => item.collection === perm.collection && item.action === perm.collection)) continue;
				items.push(perm);
			}
		}

		const sortField = 'collection';

		return items.sort((a, b) => {
			return get(a, sortField) - get(b, sortField);
		});
	});

	const { cleanItem, isEmpty, isLocalItem, getItemEdits } = useUtil();
	const { create, update, remove } = useActions(_value);
	const { resetActive, resetSystemPermissions } = useReset();

	return {
		loading,
		create,
		update,
		remove,
		displayItems,
		isLocalItem,
		getItemEdits,
		resetActive,
		resetSystemPermissions,
	};

	function useActions(target: Ref<any>) {
		return { create, update, remove };

		function create(...items: Record<string, any>[]) {
			for (const item of items) {
				target.value.create.push(cleanItem(item));
			}

			updateValue();
		}

		function update(...items: DisplayItem[]) {
			if (!relation.value) return;

			for (const item of items) {
				if (item.$type === undefined || item.$index === undefined) {
					target.value.update.push(cleanItem(item));
				} else if (item.$type === 'created') {
					target.value.create[item.$index] = cleanItem(item);
				} else if (item.$type === 'updated') {
					if (isEmpty(item)) target.value.update.splice(item.$index, 1);
					else target.value.update[item.$index] = cleanItem(item);
				} else if (item.$type === 'deleted') {
					if (item.$edits !== undefined) {
						if (isEmpty(item)) target.value.update.splice(item.$index, 1);
						else target.value.update[item.$edits] = cleanItem(item);
					} else {
						target.value.update.push(cleanItem(item));
					}

					target.value.delete.splice(item.$index, 1);
				}
			}

			updateValue();
		}

		function remove(...items: DisplayItem[]) {
			if (!relation.value) return;

			// Ensure that the objects are removed in reverse order to not mess up the indices while we're working with them
			items = orderBy(items, ['$index'], ['desc']);

			for (const item of items) {
				if (item.$type === undefined || item.$index === undefined) {
					target.value.delete.push(item.id);
				} else if (item.$type === 'created') {
					target.value.create.splice(item.$index, 1);
				} else if (item.$type === 'updated') {
					target.value.update.splice(item.$index, 1);
					target.value.delete.push(item.id);
				} else if (item.$type === 'deleted') {
					target.value.delete.splice(item.$index, 1);
				}
			}

			updateValue();
		}

		function updateValue() {
			target.value = cloneDeep(target.value);
		}
	}

	function useUtil() {
		return { cleanItem, isEmpty, isLocalItem, getItemEdits };

		function cleanItem(item: DisplayItem) {
			return Object.entries(item).reduce((acc, [key, value]) => {
				if (!key.startsWith('$')) acc[key] = value;
				return acc;
			}, {} as DisplayItem);
		}

		function isLocalItem(item: DisplayItem) {
			return item.$type !== undefined && item.$type !== 'updated';
		}

		function isEmpty(item: DisplayItem): boolean {
			if (item.$type !== 'updated' && item.$edits === undefined) return false;

			const topLevelKeys = Object.keys(item).filter((key) => !key.startsWith('$'));

			return topLevelKeys.length === 1 && topLevelKeys[0] === 'id';
		}

		function getItemEdits(item: DisplayItem) {
			if ('$type' in item && item.$index !== undefined) {
				if (item.$type === 'created') {
					return {
						..._value.value.create[item.$index],
						$type: 'created',
						$index: item.$index,
					};
				} else if (item.$type === 'updated') {
					return {
						..._value.value.update[item.$index],
						$type: 'updated',
						$index: item.$index,
					};
				} else if (item.$type === 'deleted' && item.$edits !== undefined) {
					return {
						..._value.value.update[item.$edits],
						$type: 'deleted',
						$index: item.$index,
						$edits: item.$edits,
					};
				}
			}

			return {};
		}
	}

	async function fetchPermissions() {
		if (!relation.value) return;

		if (!itemId.value || itemId.value === '+') {
			fetchedItems.value = [];
			return;
		}

		try {
			loading.value = true;

			if (itemId.value !== '+') {
				const filter: Filter = { _and: [{ policy: itemId.value } as Filter] };

				const response = await api.get(getEndpoint('directus_permissions'), {
					params: {
						fields: '*',
						filter,
						page: 0,
						limit: -1,
					},
				});

				fetchedItems.value = response.data.data;
			}
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	function useReset() {
		const resetActive = ref<string | boolean>(false);

		return { resetActive, resetSystemPermissions };

		async function resetSystemPermissions(useRecommended: boolean) {
			if (!relation.value) return;

			// remove all system permissions that are not locally added app permissions
			const toBeRemoved = displayItems.value
				.filter((item) => isSystemCollection(item.collection))
				.filter((item) => item.$type !== undefined || item.id !== undefined);

			remove(...toBeRemoved);

			if (addMinimalAppPermissions.value && useRecommended) {
				// Add recommended permissions for the app
				create(
					...appRecommendedPermissions.map((perm) => ({
						...perm,
						policy: itemId.value,
					})),
				);
			}

			resetActive.value = false;
		}
	}
}

function useGroupedPermissions() {
	const localPermissions = ref<PermissionGroup[]>([]);
	const loading = ref(false);

	const groupedPermissions = computed(() => {
		const groups = groupBy(
			displayItems.value.filter(({ $type }) => $type !== 'deleted'),
			'collection',
		);

		return Object.entries(groups)
			.map(([collection, permissions]) => ({
				collection: collectionsStore.getCollection(collection),
				permissions,
			}))
			.filter(({ collection }) => collection !== null) as PermissionGroup[];
	});

	watch(groupedPermissions, (newValue, oldValue) => {
		// Remove local permissions that have since been added to the configured permissions
		localPermissions.value = localPermissions.value.filter(
			(local) => !newValue.find((group) => group.collection.collection === local.collection.collection),
		);

		// Add local permissions that have been removed from the configured permissions for visual consistency
		localPermissions.value.push(
			...oldValue
				.filter((old) => !newValue.find((group) => group.collection.collection === old.collection.collection))
				.map(({ collection }) => ({ collection, permissions: [] })),
		);
	});

	const allPermissions = computed(() =>
		sortBy([...groupedPermissions.value, ...localPermissions.value], 'collection.collection'),
	);

	const regularPermissions = computed(() =>
		allPermissions.value.filter(({ collection }) => !isSystemCollection(collection.collection)),
	);

	const systemPermissions = computed(() =>
		allPermissions.value.filter(({ collection }) => isSystemCollection(collection.collection)),
	);

	return {
		loading,
		addEmptyPermission,
		removeEmptyCollection,
		allPermissions,
		regularPermissions,
		systemPermissions,
	};

	function addEmptyPermission(collection: string) {
		if (groupedPermissions.value.filter((group) => group.collection.collection === collection).length > 0) {
			return;
		}

		const info = collectionsStore.getCollection(collection);
		if (info === null) return;

		localPermissions.value.push({
			collection: info,
			permissions: [],
		});

		nextTick(() => {
			if (!contentEl?.value) return;

			const tableRow = permissionsTable.value?.querySelector(`tr[data-collection=${collection}]`);

			if (!tableRow) return;

			/** Header height + additional spacing */
			const TOP_SPACING = 80;
			const tableRowTop = tableRow.getBoundingClientRect().top - TOP_SPACING;

			// Only scroll to row if it is out of view
			if (tableRowTop > 0) return;

			const top = tableRowTop + contentEl.value.scrollTop;

			contentEl.value.scrollTo({ top, behavior: 'smooth' });
		});
	}

	function removeEmptyCollection(collection: string) {
		// Delay this to the next tick, since in the meantime it will have been added to the localPermissions
		nextTick(
			() =>
				(localPermissions.value = localPermissions.value.filter((group) => group.collection.collection !== collection)),
		);
	}
}
</script>

<template>
	<div>
		<v-notice v-if="adminAccess">
			{{ $t('admins_have_all_permissions') }}
		</v-notice>

		<div v-else-if="!loading || allPermissions.length > 0" class="permissions-list">
			<table ref="permissionsTable">
				<permissions-header />

				<tbody>
					<tr v-if="allPermissions.length === 0">
						<td class="empty-state" colspan="7">
							{{ $t('no_permissions') }}
						</td>
					</tr>

					<permissions-row
						v-for="group in regularPermissions"
						:key="group.collection.collection"
						:permissions="group.permissions"
						:collection="group.collection"
						@edit-item="editItem(group.collection.collection, $event)"
						@remove-row="removeCollection(group.collection.collection)"
						@set-full-access-all="setFullAccessAll(group.collection.collection)"
						@set-no-access-all="setNoAccessAll(group.collection.collection)"
						@set-full-access="setFullAccess(group.collection.collection, $event)"
						@set-no-access="setNoAccess(group.collection.collection, $event)"
					/>

					<tr v-if="regularPermissions.length > 0 && systemPermissions.length > 0">
						<td colspan="7" class="system-divider">
							<v-divider>
								{{ $t('system_collections') }}
							</v-divider>
						</td>
					</tr>

					<permissions-row
						v-for="group in systemPermissions"
						:key="group.collection.collection"
						:permissions="group.permissions"
						:collection="group.collection"
						:policy="primaryKey"
						:disabled-actions="disabledActions[group.collection.collection]"
						:app-minimal="
							appAccess
								? appAccessMinimalPermissions.filter(
										(permission) => permission.collection === group.collection.collection,
									)
								: undefined
						"
						@edit-item="editItem(group.collection.collection, $event)"
						@remove-row="removeCollection(group.collection.collection)"
						@set-full-access-all="setFullAccessAll(group.collection.collection)"
						@set-no-access-all="setNoAccessAll(group.collection.collection)"
						@set-full-access="setFullAccess(group.collection.collection, $event)"
						@set-no-access="setNoAccess(group.collection.collection, $event)"
					/>
				</tbody>

				<tfoot>
					<tr v-if="appAccess">
						<td colspan="7" class="reset-toggle">
							<span>
								{{ $t('reset_system_permissions_to') }}
								<button @click="resetActive = 'minimum'">{{ $t('app_access_minimum') }}</button>
								/
								<button @click="resetActive = 'recommended'">{{ $t('recommended_defaults') }}</button>
							</span>
						</td>
					</tr>
				</tfoot>
			</table>

			<add-collection
				class="add-collection"
				:exclude-collections="
					[...regularPermissions, ...systemPermissions].map(({ collection }) => collection.collection)
				"
				@select="addEmptyPermission($event)"
			/>
		</div>

		<permissions-detail
			:active="currentlyEditingKey !== null"
			:edits="editsAtStart"
			:permission-key="currentlyEditingKey"
			:policy-key="primaryKey"
			:policy-edits="values"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<v-dialog :model-value="!!resetActive" @update:model-value="resetActive = false" @esc="resetActive = false">
			<v-card>
				<v-card-title>
					{{ $t('reset_system_permissions_copy') }}
				</v-card-title>
				<v-card-actions>
					<v-button secondary @click="resetActive = false">{{ $t('cancel') }}</v-button>
					<v-button @click="resetSystemPermissions(resetActive === 'recommended')">
						{{ $t('reset') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped lang="scss">
.permissions-list {
	overflow: auto;

	table {
		inline-size: 100%;
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
		border-spacing: 0;

		th,
		td {
			padding: 0;
		}
	}

	.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}

	.system-toggle {
		&:not(:first-child) td {
			border-block-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		}

		& button {
			display: flex;
			align-items: center;
			inline-size: 100%;
			block-size: 44px;
			padding: 0 4px;
			color: var(--theme--foreground-subdued);
			cursor: pointer;

			&:hover {
				color: var(--theme--foreground);
			}
		}
	}

	.empty-state {
		padding: 12px;
		color: var(--theme--foreground-subdued);
	}

	.reset-toggle {
		color: var(--theme--foreground-subdued);
		text-align: center;
		padding: 12px;
		border-block-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);

		button {
			color: var(--theme--primary) !important;
			transition: color var(--fast) var(--transition);
		}

		button:hover {
			color: var(--theme--foreground) !important;
		}
	}

	.system-divider {
		--v-divider-label-color: var(--theme--foreground-subdued);
		padding-inline-start: 12px;
	}
}

.add-collection {
	margin-block-start: 12px;
}
</style>
