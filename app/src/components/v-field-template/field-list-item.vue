<template>
	<v-list-item
		v-if="field.children === undefined"
		:disabled="field.disabled"
		@click="$emit('add', `${parent ? parent + '.' : ''}${field.field}`)"
	>
		<v-list-item-content>{{ field.name || formatTitle(field.field) }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else>
		<template #activator>
			<div @click="addParent">{{ field.name || formatTitle(field.field) }}</div>
		</template>
		<field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:parent="`${parent ? parent + '.' : ''}${field.field}`"
			:field="childField"
			:depth="depth - 1"
			:addable-parent="addableParent"
			@add="$emit('add', $event)"
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { FieldTree } from './types';
import formatTitle from '@directus/format-title';

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
		depth: {
			type: Number,
			default: 2,
		},
		addableParent: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		function addParent() {
			if (props.addableParent) {
				emit('add', `${props.parent ? props.parent + '.' : ''}${props.field.field}`);
			}
		}
		return { formatTitle, addParent };
	},
});
</script>
