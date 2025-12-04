<script setup lang="ts">
import { getAssetUrl } from '@/utils/get-asset-url';
import type { Field, PrimaryKey } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import type { ChangeEvent, Group, Item, LayoutOptions } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		collection?: string | null;
		itemCount: number | null;
		totalCount: number | null;
		isFiltered: boolean;
		limit: number;
		groupCollection?: string | null;
		fieldsInCollection?: Field[];
		primaryKeyField?: Record<string, any> | null;
		groupedItems?: Group[];
		groupTitle?: string | null;
		groupPrimaryKeyField?: Record<string, any> | null;
		change: (group: Group, event: ChangeEvent<Item>) => void;
		changeGroupSort: (event: ChangeEvent<Group>) => void;
		addGroup: (title: string) => Promise<void>;
		editGroup: (id: string | number, title: string) => Promise<void>;
		deleteGroup: (id: string | number) => Promise<void>;
		isRelational?: boolean;
		canReorderGroups: boolean;
		canReorderItems: boolean;
		canUpdateGroupTitle: boolean;
		canDeleteGroups: boolean;
		sortField?: string | null;
		userField?: string | null;
		groupsSortField?: string | null;
		layoutOptions: LayoutOptions | null;
		resetPresetAndRefresh: () => Promise<void>;
		error?: any;
		selection: PrimaryKey[];
		selectMode?: boolean;
		onClick: (options: { item: Item; event: MouseEvent }) => void;
	}>(),
	{
		collection: null,
		groupCollection: null,
		fieldsInCollection: () => [],
		primaryKeyField: null,
		groupedItems: () => [],
		groupTitle: null,
		groupPrimaryKeyField: null,
		isRelational: true,
		sortField: null,
		userField: null,
		groupsSortField: null,
	},
);

defineEmits(['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width']);

const { n } = useI18n();

const editDialogOpen = ref<string | number | null>(null);
const editTitle = ref('');

const atLimit = computed(() => {
	const count = (props.isFiltered ? props.itemCount : props.totalCount) ?? 0;
	return count > props.limit;
});

function openEditGroup(group: Group) {
	editDialogOpen.value = group.id;
	editTitle.value = group.title;
}

function parseAvatar(file: Record<string, any>) {
	if (!file || !file.type) return;
	if (file.type.startsWith('image') === false) return;

	return getAssetUrl(file.id, {
		imageKey: 'system-small-cover',
		cacheBuster: file.modified_on,
	});
}

function cancelChanges() {
	editDialogOpen.value = null;
	editTitle.value = '';
}

function saveChanges() {
	if (editDialogOpen.value === '+') {
		props.addGroup(editTitle.value);
	} else if (editDialogOpen.value) {
		props.editGroup(editDialogOpen.value, editTitle.value);
	}

	editDialogOpen.value = null;
	editTitle.value = '';
}

const fieldDisplay = computed(() => {
	return {
		titleField: getRenderDisplayOptions('titleField'),
		textField: getRenderDisplayOptions('textField'),
		dateField: getRenderDisplayOptions('dateField'),
	};

	function getRenderDisplayOptions(fieldName: keyof LayoutOptions) {
		const fieldConfiguration = props.fieldsInCollection.find(
			(field) => field.field === props.layoutOptions?.[fieldName],
		);

		if (!fieldConfiguration) return;
		const { field, type, meta } = fieldConfiguration;
		return {
			collection: props.collection,
			field,
			type,
			display: meta?.display,
			options: meta?.display_options,
			interface: meta?.interface,
			interfaceOptions: meta?.options,
		};
	}
});

const reorderGroupsDisabled = computed(() => !props.canReorderGroups || props.selectMode);
</script>

<template>
	<div class="kanban-layout">
		<slot v-if="error" name="error" :error="error" :reset="resetPresetAndRefresh" />

		<template v-else>
			<v-notice v-if="atLimit" type="warning" class="limit">
				{{ $t('dataset_too_large_currently_showing_n_items', { n: n(props.limit ?? 0) }) }}
			</v-notice>

			<div class="kanban">
				<draggable
					:model-value="groupedItems"
					group="groups"
					item-key="id"
					draggable=".draggable"
					:disabled="reorderGroupsDisabled"
					:animation="150"
					class="draggable"
					:class="{ sortable: groupsSortField !== null }"
					@change="changeGroupSort"
				>
					<template #item="{ element: group }">
						<div class="group" :class="{ draggable: group.id !== null, disabled: reorderGroupsDisabled }">
							<div class="header">
								<div class="title">
									<div class="title-content">
										{{ group.id === null ? $t('layouts.kanban.no_group') : group.title }}
									</div>
									<span class="badge">{{ group.items.length }}</span>
								</div>
								<div v-if="isRelational && group.id !== null && !selectMode" class="actions">
									<v-menu show-arrow placement="bottom-end">
										<template #activator="{ toggle }">
											<v-icon name="more_horiz" clickable @click="toggle" />
										</template>

										<v-list>
											<v-list-item
												:disabled="!canUpdateGroupTitle || selectMode"
												clickable
												@click="openEditGroup(group)"
											>
												<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
												<v-list-item-content>{{ $t('layouts.kanban.edit_group') }}</v-list-item-content>
											</v-list-item>
											<v-list-item
												:disabled="!canDeleteGroups || selectMode"
												class="danger"
												clickable
												@click="deleteGroup(group.id)"
											>
												<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
												<v-list-item-content>{{ $t('layouts.kanban.delete_group') }}</v-list-item-content>
											</v-list-item>
										</v-list>
									</v-menu>
								</div>
							</div>
							<draggable
								:model-value="group.items"
								group="items"
								draggable=".item"
								:disabled="!canReorderItems || selectMode"
								:animation="150"
								:sort="sortField !== null"
								class="items"
								item-key="id"
								@change="change(group, $event)"
							>
								<template #item="{ element }">
									<div
										class="item"
										:class="{ selected: selection.includes(element[primaryKeyField?.field]) }"
										@click="onClick({ item: element, event: $event })"
									>
										<div v-if="element.title" class="title">
											<render-display
												v-if="fieldDisplay.titleField"
												v-bind="fieldDisplay.titleField"
												:value="element.title"
											/>
										</div>
										<img v-if="element.image" class="image" :src="element.image" draggable="false" />
										<div v-if="element.text" class="text">
											<render-display
												v-if="fieldDisplay.textField"
												v-bind="fieldDisplay.textField"
												:value="element.text"
											/>
										</div>
										<display-labels
											v-if="element.tags"
											:value="element.tags"
											:type="Array.isArray(element.tags) ? 'csv' : 'json'"
										/>
										<div class="bottom">
											<display-datetime
												v-if="element.date"
												v-bind="
													fieldDisplay.dateField?.display === 'datetime'
														? fieldDisplay.dateField.options
														: { format: 'short' }
												"
												:value="element.date"
												:type="element.dateType"
											/>
											<div class="avatars">
												<span v-if="element.users.length > 3" class="avatar-overflow">
													+{{ element.users.length - 3 }}
												</span>
												<v-avatar
													v-for="user in element.users.slice(0, 3)"
													:key="user.id"
													v-tooltip.bottom="`${user.first_name} ${user.last_name}`"
													class="avatar"
												>
													<v-image v-if="user.avatar && parseAvatar(user.avatar)" :src="parseAvatar(user.avatar)" />
													<v-icon v-else name="person" />
												</v-avatar>
											</div>
										</div>
									</div>
								</template>
							</draggable>
						</div>
					</template>
				</draggable>

				<v-dialog :model-value="editDialogOpen !== null" @esc="cancelChanges()" @apply="saveChanges">
					<v-card>
						<v-card-title>
							{{ editDialogOpen === '+' ? $t('layouts.kanban.add_group') : $t('layouts.kanban.edit_group') }}
						</v-card-title>
						<v-card-text>
							<v-input v-model="editTitle" :placeholder="$t('layouts.kanban.add_group_placeholder')" />
						</v-card-text>
						<v-card-actions>
							<v-button secondary @click="cancelChanges()">{{ $t('cancel') }}</v-button>
							<v-button @click="saveChanges">{{ editDialogOpen === '+' ? $t('create') : $t('save') }}</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>
			</div>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.kanban-layout {
	--limit-notice-height: 0px;
	--limit-notice-margin-bottom: 24px;
	--header-bar-margin: 24px;

	block-size: calc(100% - calc(var(--header-bar-height) + 2 * var(--header-bar-margin) + var(--limit-notice-height)));
	padding: var(--content-padding);

	&:has(> .limit) {
		--limit-notice-height: calc(60px + var(--limit-notice-margin-bottom));
	}

	.limit {
		margin-block-end: var(--limit-notice-margin-bottom);
	}
}

.kanban {
	display: flex;
	block-size: 100%;

	--user-spacing: 16px;

	.draggable {
		display: flex;

		.group {
			display: flex;
			flex-direction: column;
			inline-size: 320px;
			padding: 8px 0;
			background-color: var(--theme--background-normal);
			border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
			border-radius: var(--theme--border-radius);
			margin-inline-end: 20px;
			transition: border-color var(--transition) var(--fast);

			&:not(.disabled).active {
				border-color: var(--theme--form--field--input--border-color-hover);
				cursor: move;
			}

			.header {
				display: flex;
				justify-content: space-between;
				margin: 0 16px 8px;
				font-weight: 700;

				.title {
					max-inline-size: calc(100% - 60px);
					display: flex;

					.title-content {
						inline-size: auto;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						color: var(--theme--foreground-accent);
						margin-inline-end: 6px;
					}
				}

				.badge {
					display: inline-flex;
					justify-content: center;
					padding: 0 6px;
					block-size: 20px;
					min-inline-size: 20px;
					margin-block-start: 2px;
					text-align: center;
					font-size: 12px;
					line-height: 20px;
					background-color: var(--theme--background-accent);
					border-radius: 12px; // var(--theme--border-radius);
				}

				.actions {
					color: var(--theme--foreground-subdued);

					.v-icon {
						margin-inline-start: 4px;
						transition: color var(--transition) var(--fast);
					}

					.v-icon:hover {
						color: var(--theme--foreground);
					}
				}
			}

			.items {
				flex: 1;
				overflow: hidden auto;

				.item {
					display: block;
					margin: 2px 16px 6px;
					padding: 12px 16px;
					background-color: var(--theme--background);
					border-radius: var(--theme--border-radius);
					cursor: pointer;

					&:hover .title {
						text-decoration: underline;

						& * {
							color: var(--theme--primary);
						}
					}

					&.selected {
						outline: 2px solid var(--theme--primary);
					}
				}

				.title {
					color: var(--theme--primary);
					transition: color var(--transition) var(--fast);
					font-weight: 700;
					margin-block-end: 4px;
				}

				.title,
				.text {
					line-height: 24px;
					block-size: 24px;

					& * {
						line-height: inherit;
					}

					// This fixes the broken underline spacing when rendering a related field as title
					& > :deep(.render-template) > span:not(.vertical-aligner) {
						vertical-align: baseline;
					}
				}

				.text {
					display: flex;
					white-space: nowrap;
				}

				.image {
					inline-size: 100%;
					border-radius: var(--theme--border-radius);
					margin-block-start: 4px;
					max-block-size: 300px;
				}

				.display-labels {
					display: flex;
					flex-wrap: wrap;
					margin-block-start: 6px;

					:deep(.v-chip) {
						border: none;
						background-color: var(--theme--background-normal);
						font-size: 12px;
						font-weight: 600;
						margin-block-start: 4px;
						margin-inline-end: 4px;
						block-size: 20px;
						padding: 0 6px;
					}
					:deep(.v-chip + .v-chip) {
						margin-inline-start: 0;
					}
				}

				.bottom {
					inline-size: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-block: 8px 2px;

					.datetime {
						display: inline-block;
						color: var(--theme--foreground-subdued);
						font-size: 13px;
						font-weight: 600;
						line-height: 24px;
					}

					.avatars {
						padding-inline-start: var(--user-spacing);
						display: flex;
						flex-direction: row-reverse;
						.avatar {
							margin-inline-start: calc(var(--user-spacing) * -1);
							border-radius: 24px;
							border: 4px solid var(--theme--background);
							block-size: 32px;
							inline-size: 32px;
							margin-block: -4px;
						}

						.avatar-overflow {
							align-self: center;
							color: var(--theme--foreground-subdued);
							margin-inline-start: 2px;
						}
					}
				}
			}
		}
	}

	.add-group {
		cursor: pointer;
		padding: 8px;
		border: var(--theme--border-width) dashed var(--theme--border-color-subdued);
		border-radius: var(--theme--border-radius);
		transition: border-color var(--transition) var(--fast);

		.v-icon {
			color: var(--theme--foreground-subdued);
			transition: color var(--transition) var(--fast);
		}

		&:hover {
			border-color: var(--theme--primary);

			.v-icon {
				color: var(--theme--primary);
			}
		}
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}
</style>
