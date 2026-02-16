import { useCollection, useFilterFields, useItems, useSync } from '@directus/composables';
import { defineLayout } from '@directus/extensions';
import { Field, PermissionsAction, User } from '@directus/types';
import { getEndpoint, getRelationType, moveInArray } from '@directus/utils';
import { uniq } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import KanbanActions from './actions.vue';
import KanbanLayout from './kanban.vue';
import KanbanOptions from './options.vue';
import type { ChangeEvent, Group, Item, LayoutOptions, LayoutQuery } from './types';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import api from '@/api';
import { useLayoutClickHandler } from '@/composables/use-layout-click-handler';
import { usePermissionsStore } from '@/stores/permissions';
import { useRelationsStore } from '@/stores/relations';
import { useServerStore } from '@/stores/server';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { formatItemsCountRelative } from '@/utils/format-items-count';
import { getRootPath } from '@/utils/get-root-path';
import { translate } from '@/utils/translate-literal';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'kanban',
	name: '$t:layouts.kanban.name',
	icon: 'view_week',
	component: KanbanLayout,
	headerShadow: false,
	sidebarShadow: false,
	slots: {
		options: KanbanOptions,
		sidebar: () => undefined,
		actions: KanbanActions,
	},
	setup(props, { emit }) {
		const toolsStore = useAiToolsStore();

		toolsStore.onSystemToolResult((tool, input) => {
			if (tool === 'items' && input.collection === collection.value) {
				refresh();
			}
		});

		const { t, n } = useI18n();
		const permissionsStore = usePermissionsStore();
		const relationsStore = useRelationsStore();
		const { info: serverInfo } = useServerStore();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);

		const { collection, filter, filterSystem, search } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		const { sort, limit, page, fields } = useLayoutQuery();

		const { onClick } = useLayoutClickHandler({ props, selection, primaryKeyField });

		const { fieldGroups } = useFilterFields(fieldsInCollection, {
			title: (field) => field.type === 'string' || fieldIsRelatedField(field),
			text: (field) => field.type === 'string' || field.type === 'text' || fieldIsRelatedField(field),
			group: (field) => fieldHasChoices(field) || fieldIsRelatedField(field, ['m2o']),

			tags: (field) => field.type === 'json' || field.type === 'csv',
			date: (field) => ['date', 'time', 'dateTime', 'timestamp'].includes(field.type),
			user: (field) => {
				const junction = relationsStore.relations.find(
					(relation) =>
						relation.meta?.one_collection === props.collection &&
						relation.meta.one_field === field.field &&
						relation.meta.junction_field !== null,
				);

				if (junction !== undefined) {
					const related = relationsStore.relations.find(
						(relation) =>
							relation.collection === junction.collection &&
							relation.field === junction.meta?.junction_field &&
							relation.related_collection === 'directus_users',
					);

					return related !== undefined;
				} else {
					const related = relationsStore.relations.find(
						(relation) =>
							relation.collection === props.collection &&
							relation.field === field.field &&
							relation.related_collection === 'directus_users',
					);

					return related !== undefined;
				}
			},

			file: (field) => {
				if (field.field === '$thumbnail') return true;

				const relation = relationsStore.relations.find((relation) => {
					return (
						relation.collection === props.collection &&
						relation.field === field.field &&
						relation.related_collection === 'directus_files'
					);
				});

				return !!relation;
			},
		});

		const {
			groupField,
			groupTitle,
			imageSource,
			titleField,
			textField,
			crop,
			selectedGroup,
			dateField,
			tagsField,
			userField,
			showUngrouped,
			groupOrder,
			userFieldJunction,
			userFieldType,
		} = useLayoutOptions();

		const {
			groups,
			groupsSortField,
			groupsPrimaryKeyField,
			groupTitleFields,
			groupsCollection,
			changeGroupSort,
			getGroups,
			addGroup,
			editGroup,
			deleteGroup,
			isRelational,
			ungroupedDisabled,
		} = useGrouping();

		const {
			items,
			loading,
			error,
			totalPages,
			itemCount,
			totalCount,
			changeManualSort,
			getItems,
			getItemCount,
			getTotalCount,
		} = useItems(collection, {
			sort,
			limit,
			page,
			fields,
			filter,
			search,
			filterSystem,
		});

		watch(ungroupedDisabled, (disabled) => {
			if (disabled && showUngrouped.value) showUngrouped.value = false;
		});

		const groupedItems = computed<Group[]>(() => {
			const groupsCollectionPrimaryKeyField = groupsPrimaryKeyField.value?.field;
			const groupTitleField = groupTitle?.value || groupsCollectionPrimaryKeyField;
			const group = groupField.value;
			const pkField = primaryKeyField.value?.field;
			const itemGroups: Record<string | number, Group> = {};

			if (!pkField || !group) return [];

			if (isRelational.value && !groupTitleField) return [];

			groups.value.forEach((group: Record<string, any>, index: number) => {
				const id =
					isRelational.value && groupsCollectionPrimaryKeyField ? group[groupsCollectionPrimaryKeyField] : group.value;

				const title = String(isRelational.value && groupTitleField ? group[groupTitleField] : group.text);

				itemGroups[id] = {
					id,
					title: translate(title),
					items: [],
					sort: index,
				};
			});

			if (!ungroupedDisabled.value && showUngrouped.value) {
				itemGroups['_ungrouped'] = {
					id: null,
					items: [],
					title: '_ungrouped',
					sort: -1,
				};
			}

			items.value.forEach((item, index) => {
				if (!group || !pkField) return;

				const junctionField = userFieldJunction.value?.meta?.junction_field;

				let users: User[];

				if (userField.value && item[userField.value]) {
					users = junctionField
						? (item[userField.value] as Record<string, any>[]).map((val) => val[junctionField] as User)
						: [item[userField.value] as User];
				} else {
					users = [];
				}

				itemGroups[item[group] ?? '_ungrouped']?.items.push({
					id: item[pkField],
					title: titleField.value ? item[titleField.value] : undefined,
					text: textField.value ? item[textField.value] : undefined,
					image: imageSource.value ? parseUrl(item[imageSource.value]) : undefined,
					date: dateField.value ? item[dateField.value] : undefined,
					dateType: fieldGroups.value.date.find((field) => field.field === dateField.value)?.type,
					tags: tagsField.value ? item[tagsField.value] : undefined,
					sort: index,
					users,
					item,
				});
			});

			return Object.values(itemGroups).sort((a, b) => a.sort - b.sort);
		});

		const showingCount = computed(() => {
			if (totalCount.value === null) return;

			// Return total count if no group field is selected or no group options are available
			if (!groupField.value || groupedItems.value.length === 0)
				return t('item_count', { count: n(totalCount.value) }, totalCount.value);

			const displayedCount = groupedItems.value.reduce((sum, { items }) => sum + items.length, 0);

			return formatItemsCountRelative({
				totalItems: totalCount.value,
				currentItems: displayedCount,
				isFiltered: !!props.filterUser,
				i18n: { t, n },
			});
		});

		const isFiltered = computed(() => !!props.filterUser || !!props.search);

		const { canReorderGroups, canReorderItems, canUpdateGroupTitle, canDeleteGroups } = useLayoutPermissions();

		return {
			isRelational,
			ungroupedDisabled,
			canReorderGroups,
			canReorderItems,
			canUpdateGroupTitle,
			canDeleteGroups,
			groupedItems,
			groupsPrimaryKeyField,
			groups,
			groupTitle,
			groupTitleFields,
			groupField,
			imageSource,
			titleField,
			textField,
			crop,
			items,
			loading,
			error,
			totalPages,
			page,
			itemCount,
			totalCount,
			showingCount,
			isFiltered,
			fieldsInCollection,
			fields,
			limit,
			primaryKeyField,
			info,
			sortField,
			changeManualSort,
			dateField,
			tagsField,
			change,
			changeGroupSort,
			groupsSortField,
			fieldGroups,
			userField,
			groupsCollection,
			addGroup,
			editGroup,
			deleteGroup,
			showUngrouped,
			userFieldType,
			resetPresetAndRefresh,
			refresh,
			onClick,
		};

		function fieldHasChoices(field: Field) {
			if (
				field.meta?.options &&
				Object.keys(field.meta.options).includes('choices') &&
				['string', 'integer', 'float', 'bigInteger'].includes(field.type)
			) {
				return Object.keys(field.meta.options).includes('choices');
			}

			return false;
		}

		function fieldIsRelatedField(
			field: Field,
			allowedTypes: Array<'m2o' | 'o2m' | 'm2a' | null> = ['m2o', 'o2m', 'm2a'],
		) {
			const relation = relationsStore.relations.find((relation) =>
				allowedTypes.includes(getRelationType({ relation, collection: collection.value, field: field.field })),
			);

			return !!relation;
		}

		async function change(group: Group, event: ChangeEvent<Item>) {
			const gField = groupField.value;
			const pkField = primaryKeyField.value?.field;

			if (gField === null || pkField === undefined || event.removed || !collection.value) return;

			if (event.moved) {
				const item = group.items[event.moved.oldIndex]?.id;
				const to = group.items[event.moved.newIndex]?.id;

				if (item !== undefined && to !== undefined) await changeManualSort({ item, to });
			} else if (event.added) {
				if (group.items.length > 0) {
					const item = event.added.element;
					const before = group.items[event.added.newIndex - 1] as Item | undefined;
					const after = group.items[event.added.newIndex] as Item | undefined;

					if (item.sort !== undefined && sortField.value) {
						if (after?.sort !== undefined && after.sort < item.sort) {
							await changeManualSort({ item: item.id, to: after.id });
						} else if (before?.sort !== undefined && before.sort > item.sort) {
							await changeManualSort({ item: item.id, to: before.id });
						}
					}
				}

				try {
					await api.patch(`${getEndpoint(collection.value)}/${event.added.element.id}`, {
						[gField]: group.id,
					});
				} catch (error: unknown) {
					return unexpectedError(error);
				}

				items.value = items.value.map((item) => {
					if (item[pkField] === event.added?.element.id) {
						return {
							...item,
							[gField]: group.id,
						};
					}

					return item;
				});
			}
		}

		function parseUrl(file: Record<string, any>) {
			if (!file || !file.type) return;
			if (file.type.startsWith('image') === false) return;
			if (file.type.includes('svg')) return;

			const fit = crop.value ? '&width=250&height=150' : `&key=system-medium-contain`;

			const url = getRootPath() + `assets/${file.id}?modified=${file.modified_on}` + fit;
			return url;
		}

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
			getTotalCount();
			getItemCount();
			// potentially reload the related group items, if the group field is relational
			if (isRelational.value) getGroups();
		}

		function useLayoutOptions() {
			const groupField = createViewOption<string | null>('groupField', () => fieldGroups.value.group[0]?.field ?? null);
			const groupTitle = createViewOption<string | null>('groupTitle', () => null);
			const dateField = createViewOption<string | null>('dateField', () => fieldGroups.value.date[0]?.field ?? null);
			const tagsField = createViewOption<string | null>('tagsField', () => fieldGroups.value.tags[0]?.field ?? null);
			const userField = createViewOption<string | null>('userField', () => fieldGroups.value.user[0]?.field ?? null);
			const titleField = createViewOption<string | null>('titleField', () => fieldGroups.value.title[0]?.field ?? null);
			const textField = createViewOption<string | null>('textField', () => fieldGroups.value.text[0]?.field ?? null);
			const showUngrouped = createViewOption<boolean>('showUngrouped', () => false);

			const groupOrder = createViewOption<LayoutOptions['groupOrder']>('groupOrder', () => ({
				groupField: null,
				sortMap: {},
			}));

			const imageSource = createViewOption<string | null>(
				'imageSource',
				() => fieldGroups.value.file[0]?.field ?? null,
			);

			const crop = createViewOption<boolean>('crop', () => true);

			const selectedGroup = computed(() => fieldGroups.value.group.find((group) => group.field === groupField.value));

			watch([groupField, () => props.collection], ([newField, newCollection], [oldField, oldCollection]) => {
				if (groupTitle.value === null) return;
				const groupFieldChangedWithinCollection = newCollection === oldCollection && newField !== oldField;
				if (groupFieldChangedWithinCollection) groupTitle.value = null;
			});

			const userFieldJunction = computed(() => {
				if (userField.value === null) return;

				return relationsStore.relations.find(
					(relation) =>
						relation.meta?.one_collection === props.collection &&
						relation.meta.one_field === userField.value &&
						relation.meta.junction_field !== null,
				);
			});

			const userFieldType = computed(() => {
				if (userField.value === null) return;
				return userFieldJunction.value !== undefined ? 'm2m' : 'm2o';
			});

			return {
				groupField,
				groupTitle,
				imageSource,
				selectedGroup,
				titleField,
				textField,
				crop,
				dateField,
				tagsField,
				userField,
				showUngrouped,
				groupOrder,
				userFieldJunction,
				userFieldType,
			};

			function createViewOption<T>(key: keyof LayoutOptions, defaultValue: () => any) {
				return computed<T>({
					get() {
						return layoutOptions.value?.[key] !== undefined ? layoutOptions.value[key] : defaultValue();
					},
					set(newValue: T) {
						layoutOptions.value = {
							...layoutOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function useGrouping() {
			const isRelational = computed(() => !selectedGroup.value?.meta?.options?.choices);

			const groupsCollection = computed(() => {
				if (isRelational.value) {
					const field = groupField.value;

					if (field === null) return null;

					const relation = (relationsStore.relations as any[]).find(
						(relation) => getRelationType({ relation, collection: collection.value, field }) === 'm2o',
					);

					if (relation === undefined || relation.related_collection === null) return null;

					return relation.related_collection as string;
				}

				return null;
			});

			const {
				fields: groupsCollectionFields,
				sortField: groupsSortField,
				primaryKeyField: groupsPrimaryKeyField,
			} = useCollection(groupsCollection);

			const sort = computed(() => {
				if (groupsSortField.value) return [groupsSortField.value];
				if (groupsPrimaryKeyField.value?.field) return [groupsPrimaryKeyField.value.field];
				return [];
			});

			const groupFieldsToLoad = computed(() => {
				if (primaryKeyField.value === null || groupTitle.value === null) return [];
				return [primaryKeyField.value?.field, groupTitle.value];
			});

			const groupTitleFields = computed(() => {
				if (isRelational.value) {
					return groupsCollectionFields.value.filter((field) => field.type === 'string' || field.type === 'text');
				}

				return null;
			});

			const limit = serverInfo.queryLimit?.max && serverInfo.queryLimit.max !== -1 ? serverInfo.queryLimit.max : 100;

			const {
				items: relationalGroupsItems,
				loading: groupsLoading,
				error: groupsError,
				changeManualSort: groupsChangeManualSort,
				getItems: getGroups,
			} = useItems(groupsCollection, {
				sort,
				limit: ref(limit),
				page: ref(1),
				fields: groupFieldsToLoad,
				filter: ref({}),
				search: ref(null),
			});

			const choices = computed(() => (isRelational.value ? [] : (selectedGroup.value?.meta?.options?.choices ?? [])));

			watch(
				() => groupField.value,
				(newGroupField) => {
					if (!isRelational.value && groupOrder.value.groupField !== newGroupField) {
						const sortMap: LayoutOptions['groupOrder']['sortMap'] = {};

						choices.value.forEach((item: Record<string, any>, index: number) => {
							sortMap[item.value] = index;
						});

						groupOrder.value = { groupField: newGroupField, sortMap };
					}
				},
				{ immediate: true },
			);

			const groups = computed(() => {
				if (isRelational.value) return relationalGroupsItems.value;

				if (groupOrder.value.groupField !== groupField.value || !groupOrder.value.sortMap) return choices.value;

				choices.value.sort((a: Record<string, string>, b: Record<string, string>) => {
					const aOrder = a.value ? (groupOrder.value.sortMap[a.value] ?? 0) : 0;
					const bOrder = b.value ? (groupOrder.value.sortMap[b.value] ?? 0) : 0;
					return aOrder - bOrder;
				});

				return choices.value;
			});

			const ungroupedDisabled = computed(() => {
				if (isRelational.value || selectedGroup.value?.schema?.is_nullable) return false;
				return true;
			});

			return {
				groups,
				groupsLoading,
				groupsError,
				groupsChangeManualSort,
				info,
				fields,
				groupTitleFields,
				groupsPrimaryKeyField,
				groupsSortField,
				groupsCollection,
				getGroups,
				addGroup,
				editGroup,
				deleteGroup,
				changeGroupSort,
				isRelational,
				ungroupedDisabled,
			};

			async function deleteGroup(id: string | number) {
				const pkField = primaryKeyField.value?.field;

				if (pkField === undefined || !groupsCollection.value) return;

				items.value = items.value.filter((item) => item[pkField] !== id);

				await api.delete(`${getEndpoint(groupsCollection.value)}/${id}`);

				refresh();
			}

			async function addGroup(title: string) {
				if (groupTitle.value === null || !groupsCollection.value) return;

				await api.post(getEndpoint(groupsCollection.value), {
					[groupTitle.value]: title,
				});

				await getGroups();
			}

			async function editGroup(id: string | number, title: string) {
				if (!isRelational.value || groupTitle.value === null || !groupsCollection.value) return;

				await api.patch(`${getEndpoint(groupsCollection.value)}/${id}`, {
					[groupTitle.value]: title,
				});

				await getGroups();
			}

			async function changeGroupSort(event: ChangeEvent<Group>) {
				if (!event.moved) return;

				const item = groupedItems.value[event.moved.oldIndex]?.id;
				const to = groupedItems.value[event.moved.newIndex]?.id;

				// the special "ungrouped" group has null id
				if (!item || !to) return;

				if (isRelational.value) {
					if (groupsSortField.value == null) return;
					await groupsChangeManualSort({ item, to });
				} else {
					if (!selectedGroup.value) return;
					const groupedIds = groupedItems.value.map((item) => item.id).filter((item) => item !== null);
					const currentIndex = groupedIds.indexOf(item);
					const targetIndex = groupedIds.indexOf(to);
					const sortMap: LayoutOptions['groupOrder']['sortMap'] = {};

					moveInArray(groupedIds, currentIndex, targetIndex).forEach((id, index) => {
						if (id !== null) sortMap[id] = index;
					});

					groupOrder.value = { ...groupOrder.value, sortMap };
				}
			}
		}

		function useLayoutPermissions() {
			const canUpdateLocalField = computed(() => {
				if (selectedGroup.value?.meta?.readonly) return false;

				return hasFieldPermissions(collection.value, 'update', selectedGroup.value?.field);
			});

			const canReorderGroups = computed(() => {
				if (!canUpdateLocalField.value) return false;

				if (isRelational.value) return hasFieldPermissions(groupsCollection.value, 'update', groupsSortField.value);

				return true;
			});

			const canReorderItems = computed(() => canUpdateLocalField.value);

			const canUpdateGroupTitle = computed(() => {
				if (!canUpdateLocalField.value) return false;

				if (isRelational.value) return hasFieldPermissions(groupsCollection.value, 'update', groupTitle?.value);

				return true;
			});

			const canDeleteGroups = computed(() => {
				if (!canUpdateLocalField.value) return false;

				if (isRelational.value) return permissionsStore.hasPermission(groupsCollection.value ?? '', 'delete');

				return true;
			});

			return { canReorderGroups, canReorderItems, canUpdateGroupTitle, canDeleteGroups };

			function hasFieldPermissions(
				collection: string | null,
				action: PermissionsAction,
				field: Field['field'] | undefined | null,
			) {
				if (!collection || !field) return false;

				const permissions = permissionsStore.getPermission(collection, action);
				if (permissions?.access === 'none') return false;

				if (permissions?.fields?.[0] === '*' || permissions?.fields?.includes(field)) return true;

				return false;
			}
		}

		function useLayoutQuery() {
			const page = computed({
				get() {
					return layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed(() => {
				if (sortField.value) return [sortField.value];
				if (primaryKeyField.value?.field) return [primaryKeyField.value.field];
				return [];
			});

			const limit = computed({
				get() {
					return layoutQuery.value?.limit || 1000;
				},
				set(newLimit: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

			const fields = computed<string[]>(() => {
				if (!primaryKeyField.value || !props.collection) return [];
				const fields = [primaryKeyField.value.field];

				if (imageSource.value) {
					fields.push(`${imageSource.value}.modified_on`);
					fields.push(`${imageSource.value}.type`);
					fields.push(`${imageSource.value}.filename_disk`);
					fields.push(`${imageSource.value}.storage`);
					fields.push(`${imageSource.value}.id`);
				}

				if (props.collection === 'directus_files' && imageSource.value === '$thumbnail') {
					fields.push('modified_on');
					fields.push('type');
				}

				if (userFieldType.value !== undefined) {
					const relatedUser =
						userFieldType.value === 'm2m'
							? `${userField.value}.${userFieldJunction.value?.meta?.junction_field}`
							: `${userField.value}`;

					fields.push(`${relatedUser}.id`);
					fields.push(`${relatedUser}.first_name`);
					fields.push(`${relatedUser}.last_name`);
					fields.push(`${relatedUser}.avatar.id`);
					fields.push(`${relatedUser}.avatar.storage`);
					fields.push(`${relatedUser}.avatar.filename_disk`);
					fields.push(`${relatedUser}.avatar.type`);
					fields.push(`${relatedUser}.avatar.modified_on`);
				}

				if (sort.value[0]) {
					const sortField = sort.value[0].startsWith('-') ? sort.value[0].substring(1) : sort.value[0];

					if (fields.includes(sortField) === false) {
						fields.push(sortField);
					}
				}

				[groupField.value, tagsField.value, dateField.value].forEach(addFieldIfNotNull);

				adjustFieldsForDisplays(
					[titleField.value, textField.value].filter((val) => val !== null),
					collection.value!,
				)?.forEach(addFieldIfNotNull);

				return uniq(fields);

				function addFieldIfNotNull(val: string | null) {
					if (val !== null) fields.push(val);
				}
			});

			return { sort, limit, page, fields };
		}
	},
});
