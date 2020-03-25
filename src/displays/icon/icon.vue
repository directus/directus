<template functional>
	<v-icon :name="props.iconName" />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		iconName: {
			type: String,
			default: 'subject',
		},
	},
});
</script>
