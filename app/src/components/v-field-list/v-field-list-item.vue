<template>
	<v-list-item
		v-if="field.children === undefined"
		:disabled="field.disabled"
		clickable
		@click="$emit('add', field.key)"
	>
		<v-list-item-content>
			<v-text-overflow :text="field.name || formatTitle(field.field)" :highlight="search" />
		</v-list-item-content>
	</v-list-item>

	<v-list-group v-else :clickable="!field.disabled" :value="field.path" @click="$emit('add', field.key)">
		<template #activator>
			<v-list-item-content>
				<v-text-overflow :text="field.name || formatTitle(field.field)" :highlight="search" />
			</v-list-item-content>
		</template>

		<v-field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:search="search"
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
	path: string;
	disabled?: boolean;
	children?: FieldInfo[];
};

interface Props {
	field: FieldInfo;
	search?: string;
}

withDefaults(defineProps<Props>(), { depth: undefined, search: undefined });

defineEmits(['add']);
</script>
