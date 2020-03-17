<template functional>
	<v-notice danger>[{{ props.status }}] {{ props.error }}</v-notice>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		error: {
			type: String,
			required: true
		},
		status: {
			type: Number,
			required: true
		}
	}
});
</script>
