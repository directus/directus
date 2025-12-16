<script setup lang="ts">
import { FieldTree } from './types';
import formatTitle from '@directus/format-title';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';

withDefaults(
	defineProps<{
		field: FieldTree;
		depth?: number;
	}>(),
	{
		depth: undefined,
	},
);

defineEmits(['add']);
</script>

<template>
	<VListItem
		v-if="field.children === undefined || depth === 0"
		:disabled="field.disabled"
		clickable
		@click="$emit('add', field)"
	>
		<VListItemIcon v-if="field.field.startsWith('$')">
			<VIcon name="auto_awesome" small color="var(--theme--primary)" />
		</VListItemIcon>
		<VListItemContent>{{ field.name || formatTitle(field.field) }}</VListItemContent>
	</VListItem>
	<VListGroup v-else :value="field.key" clickable @click="$emit('add', field)">
		<template #activator>{{ field.name || formatTitle(field.field) }}</template>
		<field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:depth="depth ? depth - 1 : undefined"
			@add="$emit('add', $event)"
		/>
	</VListGroup>
</template>
