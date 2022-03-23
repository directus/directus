<template>
	<v-list-item
		v-if="field.children === undefined || depth === 0"
		:disabled="field.disabled"
		clickable
		@click="$emit('add', field.key)"
	>
		<v-list-item-content>{{ field.name || formatTitle(field.field) }}</v-list-item-content>
	</v-list-item>

	<v-list-group v-else :value="field.key" :clickable="!field.disabled" @click="$emit('add', field.key)">
		<template #activator>
			<v-list-item-content>{{ field.name || formatTitle(field.field) }}</v-list-item-content>
		</template>

		<v-field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:depth="depth && depth - 1"
			@add="$emit('add', $event)"
		/>
	</v-list-group>
</template>

<script lang="ts">
export default {
	name: 'VFieldListItem',
};
</script>

<script lang="ts" setup>
import formatTitle from '@directus/format-title';

type FieldInfo = {
	field: string;
	name: string;
	key: string;
	disabled?: boolean;
	children?: FieldInfo[];
};

interface Props {
	field: FieldInfo;
	depth?: number;
}

withDefaults(defineProps<Props>(), { depth: undefined });

defineEmits(['add']);
</script>
