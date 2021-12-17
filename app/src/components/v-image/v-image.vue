<template>
	<div v-if="!ready" placeholder />
	<img v-else-if="source" class="fileType" :src="source" alt="alt" role="role" @error="imgError = true" />
	<v-icon v-else large :name="icon" />
</template>

<script lang="ts">
import { queue } from '@/api';
import { defineComponent, ref } from 'vue';
import api from '@/api';

export default defineComponent({
	props: {
		source: { type: String, required: true },
		fileType: { type: String, default: 'img' },
		alt: { type: String, default: '' },
		role: { type: String, default: 'presentation' },
	},
	setup(props) {
		const ready = ref(false);

		(async () => {
			await queue.add(() => {
				api.get(props.source);
			});
			ready.value = true;
		})();

		return { ready };
	},
});
</script>
