<script setup lang="ts">
import { useCollections } from './use-collections';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';

const props = defineProps<{
	excludeCollections?: string[];
}>();

defineEmits<{
	select: [string];
}>();

const { displayItems } = useCollections({ excludeCollections: () => props.excludeCollections || [] });
</script>

<template>
	<div>
		<VSelect
			:items="displayItems"
			item-text="collection"
			item-value="collection"
			placement="bottom-start"
			item-label-font-family="var(--theme--fonts--monospace--font-family)"
			:close-on-content-click="false"
			@update:model-value="$emit('select', $event)"
		>
			<template #preview="{ toggle }">
				<VButton @click="toggle">
					{{ $t('permission_add_collection') }}
					<VIcon name="arrow_drop_down" right />
				</VButton>
			</template>
		</VSelect>
	</div>
</template>
