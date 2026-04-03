<script setup lang="ts">
import type { Field, PrimaryKey } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import type { ChangeEvent, Group, Item, LayoutOptions } from './types';
import VAvatar from '@/components/v-avatar.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import DisplayDatetime from '@/displays/datetime/datetime.vue';
import DisplayLabels from '@/displays/labels/labels.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import RenderDisplay from '@/views/private/components/render-display.vue';

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
			<VNotice v-if="atLimit" type="warning" class="limit">
				{{ $t('dataset_too_large_currently_showing_n_items', { n: n(props.limit ?? 0) }) }}
			</VNotice>

			<div class="kanban">
				<Draggable
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
									<VMenu show-arrow placement="bottom-end">
										<template #activator="{ toggle }">
											<VIcon name="more_horiz" clickable @click="toggle" />
										</template>

										<VList>
											<VListItem :disabled="!canUpdateGroupTitle || selectMode" clickable @click="openEditGroup(group)">
												<VListItemIcon><VIcon name="edit" /></VListItemIcon>
												<VListItemContent>{{ $t('layouts.kanban.edit_group') }}</VListItemContent>
											</VListItem>
											<VListItem
												:disabled="!canDeleteGroups || selectMode"
												class="danger"
												clickable
												@click="deleteGroup(group.id)"
											>
												<VListItemIcon><VIcon name="delete" /></VListItemIcon>
												<VListItemContent>{{ $t('layouts.kanban.delete_group') }}</VListItemContent>
											</VListItem>
										</VList>
									</VMenu>
								</div>
							</div>
							<Draggable
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
											<RenderDisplay
												v-if="fieldDisplay.titleField"
												v-bind="fieldDisplay.titleField"
												:value="element.title"
											/>
										</div>
										<img v-if="element.image" class="image" :src="element.image" draggable="false" />
										<div v-if="element.text" class="text">
											<RenderDisplay
												v-if="fieldDisplay.textField"
												v-bind="fieldDisplay.textField"
												:value="element.text"
											/>
										</div>
										<DisplayLabels
											v-if="element.tags"
											:value="element.tags"
											:type="Array.isArray(element.tags) ? 'csv' : 'json'"
										/>
										<div class="bottom">
											<DisplayDatetime
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
												<VAvatar
													v-for="user in element.users.slice(0, 3)"
													:key="user.id"
													v-tooltip.bottom="`${user.first_name} ${user.last_name}`"
													class="avatar"
												>
													<VImage v-if="user.avatar && parseAvatar(user.avatar)" :src="parseAvatar(user.avatar)" />
													<VIcon v-else name="person" />
												</VAvatar>
											</div>
										</div>
									</div>
								</template>
							</Draggable>
						</div>
					</template>
				</Draggable>

				<VDialog :model-value="editDialogOpen !== null" @esc="cancelChanges()" @apply="saveChanges">
					<VCard>
						<VCardTitle>
							{{ editDialogOpen === '+' ? $t('layouts.kanban.add_group') : $t('layouts.kanban.edit_group') }}
						</VCardTitle>
						<VCardText>
							<VInput v-model="editTitle" :placeholder="$t('layouts.kanban.add_group_placeholder')" />
						</VCardText>
						<VCardActions>
							<VButton secondary @click="cancelChanges()">{{ $t('cancel') }}</VButton>
							<VButton @click="saveChanges">{{ editDialogOpen === '+' ? $t('create') : $t('save') }}</VButton>
						</VCardActions>
					</VCard>
				</VDialog>
			</div>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.kanban-layout {
	--limit-notice-height: 0;
	--limit-notice-margin-bottom: 1.375rem;
	--header-bar-margin: 1.375rem;

	block-size: 100%;
	padding: var(--content-padding);

	&:has(> .limit) {
		--limit-notice-height: calc(3.375rem + var(--limit-notice-margin-bottom));
	}

	.limit {
		margin-block-end: var(--limit-notice-margin-bottom);
	}
}

.kanban {
	display: flex;
	block-size: 100%;

	--user-spacing: 0.875rem;

	.draggable {
		display: flex;

		.group {
			display: flex;
			flex-direction: column;
			inline-size: 18rem;
			padding: 0.4375rem 0;
			background-color: var(--theme--background-normal);
			border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
			border-radius: var(--theme--border-radius);
			margin-inline-end: 1.125rem;
			transition: border-color var(--transition) var(--fast);

			&:not(.disabled).active {
				border-color: var(--theme--form--field--input--border-color-hover);
				cursor: move;
			}

			.header {
				display: flex;
				justify-content: space-between;
				margin: 0 0.875rem 0.4375rem;
				font-weight: 700;

				.title {
					max-inline-size: calc(100% - 3.375rem);
					display: flex;

					.title-content {
						inline-size: auto;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						color: var(--theme--foreground-accent);
						margin-inline-end: 0.3125rem;
					}
				}

				.badge {
					display: inline-flex;
					justify-content: center;
					padding: 0 0.3125rem;
					block-size: 1.125rem;
					min-inline-size: 1.125rem;
					margin-block-start: 0.125rem;
					text-align: center;
					font-size: 0.6875rem;
					line-height: 1.6364;
					background-color: var(--theme--background-accent);
					border-radius: 0.6875rem; // var(--theme--border-radius);
				}

				.actions {
					color: var(--theme--foreground-subdued);

					.v-icon {
						margin-inline-start: 0.25rem;
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
					margin: 0.125rem 0.875rem 0.3125rem;
					padding: 0.6875rem 0.875rem;
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
						/* Not a focus ring, so using --theme--border-width for outline width */
						outline: var(--theme--border-width) solid var(--theme--primary);
					}
				}

				.title {
					color: var(--theme--primary);
					transition: color var(--transition) var(--fast);
					font-weight: 700;
					margin-block-end: 0.25rem;
				}

				.title,
				.text {
					line-height: 1.375rem;
					block-size: 1.375rem;

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
					margin-block-start: 0.25rem;
					max-block-size: 16.875rem;
				}

				.display-labels {
					display: flex;
					flex-wrap: wrap;
					margin-block-start: 0.3125rem;

					:deep(.v-chip) {
						border: none;
						background-color: var(--theme--background-normal);
						font-size: 0.6875rem;
						font-weight: 600;
						margin-block-start: 0.25rem;
						margin-inline-end: 0.25rem;
						block-size: 1.125rem;
						padding: 0 0.3125rem;
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
					margin-block: 0.4375rem 0.125rem;

					.datetime {
						display: inline-block;
						color: var(--theme--foreground-subdued);
						font-size: 0.75rem;
						font-weight: 600;
						line-height: 1.8333;
					}

					.avatars {
						padding-inline-start: var(--user-spacing);
						display: flex;
						flex-direction: row-reverse;
						.avatar {
							margin-inline-start: calc(var(--user-spacing) * -1);
							border-radius: 1.375rem;
							border: 4px solid var(--theme--background);
							block-size: 1.8125rem;
							inline-size: 1.8125rem;
							margin-block: -0.25rem;
						}

						.avatar-overflow {
							align-self: center;
							color: var(--theme--foreground-subdued);
							margin-inline-start: 0.125rem;
						}
					}
				}
			}
		}
	}

	.add-group {
		cursor: pointer;
		padding: 0.4375rem;
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
