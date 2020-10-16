<template>
	<v-list-item
		v-if="field.children === undefined"
		@click="$emit('add', `${parent ? parent + '.' : ''}${field.field}`)"
	>
		<v-list-item-content>{{ field.name }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else>
		<template #activator>{{ field.name }}</template>
		<field-list-item
			v-for="childField in field.children"
			:key="childField.field"
			:parent="`${parent ? parent + '.' : ''}${field.field}`"
			:field="childField"
			@add="$emit('add', $event)"
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { FieldTree } from './types';

export default defineComponent({
	name: 'field-list-item',
	props: {
		field: {
			type: Object as PropType<FieldTree>,
			required: true,
		},
		parent: {
			type: String,
			default: null,
		},
	},
});
</script>
