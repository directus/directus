<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { ref } from 'vue';

export type CollapseState = 'open' | 'closed' | 'locked';

withDefaults(
	defineProps<{
		/** The item name for delete confirmation */
		itemName: string;
		/** Whether this is a folder/group (affects collapse options visibility) */
		isFolder?: boolean;
		/** Whether this item has children */
		hasChildren?: boolean;
		/** Current collapse state */
		collapseState?: CollapseState;
		/** Show collapse options */
		showCollapseOptions?: boolean;
		/** Translation key for delete confirmation title */
		deleteConfirmTitleKey?: string;
		/** Translation key for delete button */
		deleteButtonKey?: string;
		/** Whether delete is in progress */
		deleting?: boolean;
	}>(),
	{
		isFolder: false,
		hasChildren: false,
		collapseState: 'open',
		showCollapseOptions: true,
		deleteConfirmTitleKey: 'delete_are_you_sure',
		deleteButtonKey: 'delete',
		deleting: false,
	},
);

const emit = defineEmits<{
	'update:collapseState': [state: CollapseState];
	delete: [];
	toggleCollapse: [];
}>();

const deleteActive = ref(false);

function updateCollapse(state: CollapseState) {
	emit('update:collapseState', state);
}

function confirmDelete() {
	emit('delete');
	deleteActive.value = false;
}
</script>

<template>
	<div class="group-options">
		<VMenu placement="left-start" show-arrow>
			<template #activator="{ toggle }">
				<VIcon name="more_vert" clickable class="ctx-toggle" @click.prevent="toggle" />
			</template>
			<VList>
				<!-- Prepend slot for custom actions before standard options -->
				<slot name="prepend" />

				<!-- Collapse options -->
				<template v-if="showCollapseOptions && (isFolder || hasChildren)">
					<VDivider v-if="$slots.prepend" />

					<VListItem
						:active="collapseState === 'open'"
						clickable
						@click="updateCollapse('open')"
					>
						<VListItemIcon>
							<VIcon name="folder_open" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('start_open') }}
						</VListItemContent>
					</VListItem>

					<VListItem
						:active="collapseState === 'closed'"
						clickable
						@click="updateCollapse('closed')"
					>
						<VListItemIcon>
							<VIcon name="folder" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('start_collapsed') }}
						</VListItemContent>
					</VListItem>

					<VListItem
						:active="collapseState === 'locked'"
						clickable
						@click="updateCollapse('locked')"
					>
						<VListItemIcon>
							<VIcon name="folder_lock" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('always_open') }}
						</VListItemContent>
					</VListItem>

					<VDivider />
				</template>

				<!-- Append slot for custom actions before delete -->
				<slot name="append" />

				<VDivider v-if="$slots.append" />

				<!-- Delete action -->
				<VListItem clickable class="danger" @click="deleteActive = true">
					<VListItemIcon>
						<VIcon name="delete" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t(deleteButtonKey) }}
					</VListItemContent>
				</VListItem>
			</VList>
		</VMenu>

		<VDialog v-model="deleteActive" @esc="deleteActive = false" @apply="confirmDelete">
			<VCard>
				<VCardTitle>
					{{ $t(deleteConfirmTitleKey, { name: itemName }) }}
				</VCardTitle>
				<VCardText>
					<slot name="delete-warning" />
				</VCardText>
				<VCardActions>
					<VButton :disabled="deleting" secondary @click="deleteActive = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton :loading="deleting" kind="danger" @click="confirmDelete">
						{{ $t(deleteButtonKey) }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
.ctx-toggle {
	--v-icon-color: var(--theme--foreground-subdued);

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}
</style>
