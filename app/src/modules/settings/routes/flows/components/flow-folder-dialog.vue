<script setup lang="ts">
import { GroupDialog, type GroupDialogValues } from '@/components/grouped-list';
import { useFlowsStore } from '@/stores/flows';
import type { FlowRaw } from '@directus/types';
import { ref, watch } from 'vue';

const props = defineProps<{
	modelValue?: boolean;
	flow?: FlowRaw | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

const flowsStore = useFlowsStore();
const saving = ref(false);

const dialogItem = ref<{
	id?: string;
	name?: string | null;
	icon?: string | null;
	color?: string | null;
	description?: string | null;
} | null>(null);

watch(
	() => props.flow,
	(flow) => {
		if (flow) {
			dialogItem.value = {
				id: flow.id,
				name: flow.name,
				icon: flow.icon,
				color: flow.color,
				description: flow.description,
			};
		} else {
			dialogItem.value = null;
		}
	},
	{ immediate: true },
);

async function handleSave(values: GroupDialogValues, isEdit: boolean) {
	saving.value = true;

	try {
		if (isEdit && props.flow) {
			await flowsStore.updateFlow(props.flow.id, {
				name: values.name!,
				icon: values.icon,
				color: values.color,
				description: values.description,
			});
		} else {
			await flowsStore.createFolder({
				name: values.name!,
				icon: values.icon ?? undefined,
				color: values.color ?? undefined,
				description: values.description ?? undefined,
			});
		}

		emit('update:modelValue', false);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<GroupDialog
		:model-value="modelValue"
		:item="dialogItem"
		:saving="saving"
		create-title-key="create_folder"
		edit-title-key="edit_folder"
		name-placeholder-key="folder_name"
		default-icon="folder"
		:show-translations="false"
		:show-description="true"
		@update:model-value="$emit('update:modelValue', $event)"
		@save="handleSave"
	>
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>
	</GroupDialog>
</template>
