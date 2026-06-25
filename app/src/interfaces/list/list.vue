<script setup lang="ts">
import { computed } from 'vue';
import ListDrawer from './list-drawer.vue';
import ListInline from './list-inline.vue';
import type { RepeaterEmits, RepeaterProps } from './types';

const props = withDefaults(defineProps<RepeaterProps & { editMode?: 'drawer' | 'inline' }>(), {
	fields: () => [],
	editMode: 'drawer',
	showConfirmDiscard: true,
});

defineEmits<RepeaterEmits>();

const activeComponent = computed(() => (props.editMode === 'inline' ? ListInline : ListDrawer));
</script>

<template>
	<component :is="activeComponent" v-bind="$props" @input="$emit('input', $event)" />
</template>
