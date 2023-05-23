<template>
	<div class="kanban">
		<draggable
			:model-value="groupedItems"
			group="groups"
			item-key="id"
			draggable=".draggable"
			:animation="150"
			class="draggable"
			:class="{ sortable: groupsSortField !== null }"
			@change="changeGroupSort"
		>
			<template #item="{ element: group }">
				<div class="group" :class="{ draggable: group.id !== null }">
					<div class="header">
						<div class="title">
							<div class="title-content">
								{{ group.id === null ? t('layouts.kanban.no_group') : group.title }}
							</div>
							<span class="badge">{{ group.items.length }}</span>
						</div>
						<div v-if="group.id !== null" class="actions">
							<!-- <router-link :to="`${collection}/+`"><v-icon name="add" /></router-link> -->
							<v-menu show-arrow placement="bottom-end">
								<template #activator="{ toggle }">
									<v-icon name="more_horiz" clickable @click="toggle" />
								</template>

								<v-list>
									<v-list-item clickable @click="openEditGroup(group)">
										<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
										<v-list-item-content>{{ t('layouts.kanban.edit_group') }}</v-list-item-content>
									</v-list-item>
									<v-list-item v-if="isRelational" class="danger" clickable @click="deleteGroup(group.id)">
										<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
										<v-list-item-content>{{ t('layouts.kanban.delete_group') }}</v-list-item-content>
									</v-list-item>
								</v-list>
							</v-menu>
						</div>
					</div>
					<draggable
						:model-value="group.items"
						group="items"
						draggable=".item"
						:animation="150"
						:sort="sortField !== null"
						class="items"
						item-key="id"
						@change="change(group, $event)"
					>
						<template #item="{ element }">
							<router-link :to="getItemRoute(collection, element.id)" class="item">
								<div v-if="element.title" class="title">{{ element.title }}</div>
								<img v-if="element.image" class="image" :src="element.image" />
								<div v-if="element.text" class="text">{{ element.text }}</div>
								<display-labels
									v-if="element.tags"
									:value="element.tags"
									:type="Array.isArray(element.tags) ? 'csv' : 'json'"
								/>
								<div class="bottom">
									<display-datetime v-if="element.date" format="short" :value="element.date" :type="element.dateType" />
									<div class="avatars">
										<span v-if="element.users.length > 3" class="avatar-overflow">+{{ element.users.length - 3 }}</span>
										<v-avatar
											v-for="user in element.users.slice(0, 3)"
											:key="user.id"
											v-tooltip.bottom="`${user.first_name} ${user.last_name}`"
											class="avatar"
										>
											<img v-if="user.avatar" :src="parseAvatar(user.avatar)" />
											<v-icon v-else name="person" />
										</v-avatar>
									</div>
								</div>
							</router-link>
						</template>
					</draggable>
				</div>
			</template>
		</draggable>
		<!-- <div v-if="isRelational" class="add-group" @click="editDialogOpen = '+'">
			<v-icon name="add_box" />
		</div> -->

		<v-dialog :model-value="editDialogOpen !== null" @esc="cancelChanges()">
			<v-card>
				<v-card-title>
					{{ editDialogOpen === '+' ? t('layouts.kanban.add_group') : t('layouts.kanban.edit_group') }}
				</v-card-title>
				<v-card-text>
					<v-input v-model="editTitle" :placeholder="t('layouts.kanban.add_group_placeholder')" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="cancelChanges()">{{ t('cancel') }}</v-button>
					<v-button @click="saveChanges">{{ editDialogOpen === '+' ? t('create') : t('save') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { addTokenToURL } from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { getItemRoute } from '@/utils/get-item-route';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import type { ChangeEvent, Group, Item } from './types';

const props = withDefaults(
	defineProps<{
		collection?: string | null;
		groupCollection?: string | null;
		fieldsInCollection?: Record<string, any>[];
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
		sortField?: string | null;
		userField?: string | null;
		groupsSortField?: string | null;
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
	}
);

defineEmits(['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width']);

const { t } = useI18n();

const editDialogOpen = ref<string | number | null>(null);
const editTitle = ref('');

function openEditGroup(group: Group) {
	editDialogOpen.value = group.id;
	editTitle.value = group.title;
}

function parseAvatar(file: Record<string, any>) {
	if (!file || !file.type) return;
	if (file.type.startsWith('image') === false) return;
	if (file.type.includes('svg')) return;

	const url = getRootPath() + `assets/${file.id}?modified=${file.modified_on}&width=48&height=48`;
	return addTokenToURL(url);
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
</script>

<style lang="scss" scoped>
.kanban {
	display: flex;
	height: calc(100% - 65px - 2 * 24px);
	padding: 0px 32px 24px 32px;
	overflow-x: auto;
	overflow-y: hidden;
	--user-spacing: 16px;

	.draggable {
		display: flex;

		.group {
			display: flex;
			flex-direction: column;
			width: 320px;
			padding: 8px 0;
			background-color: var(--background-normal);
			border: var(--border-width) solid var(--border-normal);
			border-radius: var(--border-radius);
			margin-right: 20px;
			transition: border-color var(--transition) var(--fast);

			&:active {
				border-color: var(--border-normal-alt);
				cursor: move;
			}

			.header {
				display: flex;
				justify-content: space-between;
				margin: 0 16px 8px 16px;
				font-weight: 700;

				.title {
					max-width: calc(100% - 60px);
					display: flex;

					.title-content {
						width: auto;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						color: var(--foreground-normal-alt);
						margin-right: 6px;
					}
				}

				.badge {
					display: inline-flex;
					justify-content: center;
					padding: 0px 6px;
					height: 20px;
					min-width: 20px;
					margin-top: 2px;
					text-align: center;
					font-size: 12px;
					line-height: 20px;
					background-color: var(--background-normal-alt);
					border-radius: 12px; //var(--border-radius);
				}

				.actions {
					color: var(--foreground-subdued);

					.v-icon {
						margin-left: 4px;
						transition: color var(--transition) var(--fast);
					}

					.v-icon:hover {
						color: var(--foreground-normal);
					}
				}
			}

			.items {
				flex: 1;
				overflow-x: hidden;
				overflow-y: auto;

				.item {
					display: block;
					margin: 2px 16px 6px 16px;
					padding: 12px 16px;
					background-color: var(--background-page);
					border-radius: var(--border-radius);
					box-shadow: 0px 2px 4px 0px rgba(var(--card-shadow-color), 0.1);

					&:hover .title {
						// color: var(--primary);
						text-decoration: underline;
					}
				}

				.title {
					color: var(--primary);
					transition: color var(--transition) var(--fast);
					font-weight: 700;
					line-height: 1.25;
					margin-bottom: 4px;
				}

				.text {
					font-size: 14px;
					line-height: 1.4em;
					-webkit-line-clamp: 4;
					-webkit-box-orient: vertical;
					overflow: hidden;
					display: -webkit-box;
				}

				.image {
					width: 100%;
					margin-top: 10px;
					border-radius: var(--border-radius);
					margin-top: 4px;
					max-height: 300px;
				}

				.display-labels {
					display: flex;
					flex-wrap: wrap;
					margin-top: 6px;

					:deep(.v-chip) {
						border: none;
						background-color: var(--background-normal);
						font-size: 12px;
						font-weight: 600;
						margin-top: 4px;
						margin-right: 4px;
						height: 20px;
						padding: 0 6px;
					}
					:deep(.v-chip + .v-chip) {
						margin-left: 0;
					}
				}

				.bottom {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-top: 8px;
					margin-bottom: 2px;
					.datetime {
						display: inline-block;
						color: var(--foreground-subdued);
						font-size: 13px;
						font-weight: 600;
						line-height: 24px;
					}

					.avatars {
						padding-left: var(--user-spacing);
						display: flex;
						flex-direction: row-reverse;
						.avatar {
							margin-left: calc(var(--user-spacing) * -1);
							border-radius: 24px;
							border: 4px solid var(--background-page);
							height: 32px;
							width: 32px;
							margin-bottom: -4px;
							margin-top: -4px;
						}

						.avatar-overflow {
							align-self: center;
							color: var(--foreground-subdued);
							margin-left: 2px;
						}
					}
				}
			}
		}
	}

	.add-group {
		cursor: pointer;
		padding: 8px 8px;
		border: var(--border-width) dashed var(--border-subdued);
		border-radius: var(--border-radius);
		transition: border-color var(--transition) var(--fast);

		.v-icon {
			color: var(--foreground-subdued);
			transition: color var(--transition) var(--fast);
		}

		&:hover {
			border-color: var(--primary);

			.v-icon {
				color: var(--primary);
			}
		}
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}
</style>
