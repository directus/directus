<script setup lang="ts">
import { GroupOptions, type CollapseState } from '@/components/grouped-list';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import { useFlowsStore } from '@/stores/flows';
import type { FlowRaw } from '@directus/types';
import { computed, ref } from 'vue';

const props = defineProps<{
	flow: FlowRaw;
	isFolder: boolean;
	hasChildren: boolean;
}>();

const emit = defineEmits<{
	edit: [];
	toggleCollapse: [];
}>();

const flowsStore = useFlowsStore();
const deleting = ref(false);

const collapseState = computed<CollapseState>(() => props.flow.collapse || 'open');

async function updateCollapse(state: CollapseState) {
	await flowsStore.updateFlow(props.flow.id, { collapse: state });
}

async function toggleStatus() {
	const newStatus = props.flow.status === 'active' ? 'inactive' : 'active';
	await flowsStore.updateFlow(props.flow.id, { status: newStatus });
}

async function handleDelete() {
	deleting.value = true;

	try {
		await flowsStore.deleteFlow(props.flow.id);
	} finally {
		deleting.value = false;
	}
}
</script>

<template>
	<GroupOptions
		:item-name="flow.name"
		:is-folder="isFolder"
		:has-children="hasChildren"
		:collapse-state="collapseState"
		:show-collapse-options="isFolder || hasChildren"
		:delete-confirm-title-key="isFolder ? 'delete_folder_are_you_sure' : 'delete_flow_are_you_sure'"
		:delete-button-key="isFolder ? 'delete_folder' : 'delete_flow'"
		:deleting="deleting"
		@update:collapse-state="updateCollapse"
		@delete="handleDelete"
	>
		<template #prepend>
			<!-- Edit flow/folder -->
			<VListItem clickable @click="$emit('edit')">
				<VListItemIcon>
					<VIcon name="edit" />
				</VListItemIcon>
				<VListItemContent>
					{{ isFolder ? $t('edit_folder') : $t('edit_flow') }}
				</VListItemContent>
			</VListItem>

			<!-- Toggle status (only for flows, not folders) -->
			<VListItem v-if="!isFolder" clickable @click="toggleStatus">
				<template v-if="flow.status === 'active'">
					<VListItemIcon><VIcon name="block" /></VListItemIcon>
					<VListItemContent>{{ $t('deactivate_flow') }}</VListItemContent>
				</template>
				<template v-else>
					<VListItemIcon><VIcon name="check_circle" /></VListItemIcon>
					<VListItemContent>{{ $t('activate_flow') }}</VListItemContent>
				</template>
			</VListItem>
		</template>

		<template #delete-warning>
			<template v-if="hasChildren">
				{{ $t('delete_folder_children_warning') }}
			</template>
		</template>
	</GroupOptions>
</template>
