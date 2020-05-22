<template>
	<v-form
		disabled
		:collection="revision.collection"
		:primary-key="revision.item"
		:initial-values="revision.data"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Revision } from './types';

export default defineComponent({
	props: {
		revision: {
			type: Object as PropType<Revision>,
			required: true,
		},
	},
});
</script>
