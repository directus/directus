<template>
	<v-drawer
		:model-value="isOpen"
		:title="title"
		persistent
		@cancel="$emit('cancel')"
		@update:model-value="$emit('cancel')"
	>
		Full
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { Collection } from '@directus/shared/types';

export default defineComponent({
	emits: ['cancel'],
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
	},
	setup() {
		const isOpen = useDialogRoute();

		return { isOpen };
	},
});
</script>
