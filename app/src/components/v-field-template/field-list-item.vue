<template>
	<v-list-item
		v-if="field.children === undefined || depth === 0"
		:disabled="field.disabled"
		clickable
		@click="$emit('add', field)"
	>
		<v-list-item-content>{{ field.name || formatTitle(field.field) }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else :value="field.key" clickable @click="$emit('add', field)">
		<template #activator>{{ field.name || formatTitle(field.field) }}</template>
		<field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:depth="depth - 1"
			@add="$emit('add', $event)"
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FieldTree } from './types';
import formatTitle from '@directus/format-title';

export default defineComponent({
	name: 'FieldListItem',
	props: {
		field: {
			type: Object as PropType<FieldTree>,
			required: true,
		},
		depth: {
			type: Number,
			default: undefined,
		},
	},
	emits: ['add'],
	setup() {
		return { formatTitle };
	},
});
</script>
