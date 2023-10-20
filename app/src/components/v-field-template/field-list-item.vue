<script setup lang="ts">
import { FieldTree } from './types';
import formatTitle from '@directus/format-title';

interface Props {
	field: FieldTree;
	depth?: number;
}

withDefaults(defineProps<Props>(), {
	depth: undefined,
});

defineEmits(['add']);
</script>

<template>
	<v-list-item
		v-if="field.children === undefined || depth === 0"
		:disabled="field.disabled"
		clickable
		@click="$emit('add', field)"
	>
		<v-list-item-icon v-if="field.field.startsWith('$')">
			<v-icon name="auto_awesome" small color="var(--theme--primary)" />
		</v-list-item-icon>
		<v-list-item-content>{{ field.name || formatTitle(field.field) }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else :value="field.key" clickable @click="$emit('add', field)">
		<template #activator>{{ field.name || formatTitle(field.field) }}</template>
		<field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:depth="depth ? depth - 1 : undefined"
			@add="$emit('add', $event)"
		/>
	</v-list-group>
</template>
