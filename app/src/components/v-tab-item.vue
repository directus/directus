<template>
	<div v-if="active" class="v-tab-item">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useGroupable } from '@/composables/groupable';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { active, toggle } = useGroupable({ value: props.value, group: 'v-tabs-items' });
		return { active, toggle };
	},
});
</script>
