<script setup lang="ts">
import { DeepPartial, Field } from '@directus/types';
import { computed } from 'vue';
import ListDrawer from './list-drawer.vue';
import ListInline from './list-inline.vue';

const props = withDefaults(
	defineProps<{
		value: Record<string, unknown>[] | null;
		field?: string;
		fields?: DeepPartial<Field>[];
		template?: string;
		addLabel?: string;
		sort?: string;
		limit?: number;
		disabled?: boolean;
		nonEditable?: boolean;
		headerPlaceholder?: string;
		collection?: string;
		placeholder?: string;
		direction?: string;
		editMode?: 'drawer' | 'inline';
		showConfirmDiscard?: boolean;
	}>(),
	{
		fields: () => [],
		editMode: 'drawer',
		showConfirmDiscard: true,
	},
);

defineEmits<{
	(e: 'input', value: Record<string, unknown>[] | null): void;
}>();

const activeComponent = computed(() => (props.editMode === 'inline' ? ListInline : ListDrawer));
</script>

<template>
	<component :is="activeComponent" v-bind="$props" @input="$emit('input', $event)" />
</template>
