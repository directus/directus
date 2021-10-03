<template>
	<v-list-item v-if="field.children === undefined" clickable @click="$emit('add', field.key)">
		<v-list-item-content>{{ field.name }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else :value="field.key" clickable @click="$emit('add', field.key)">
		<template #activator>{{ field.name }}</template>
		<field-list-item
			v-for="childField in field.children"
			:key="childField.field"
			:field="childField"
			@add="$emit('add', $event)"
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FieldTree } from './types';

export default defineComponent({
	name: 'FieldListItem',
	props: {
		field: {
			type: Object as PropType<FieldTree>,
			required: true,
		},
	},
	emits: ['add'],
});
</script>
