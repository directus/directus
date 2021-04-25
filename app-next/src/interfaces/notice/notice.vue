<template>
	<v-notice :icon="icon" :type="color">
		<div v-html="marked(text)" />
	</v-notice>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import marked from 'marked';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: 'normal',
		},
		icon: {
			type: String,
			default: 'info',
		},
		text: {
			type: String,
			default: 'No text configured...',
		},
	},
	setup() {
		return { marked };
	},
});
</script>
