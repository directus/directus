<template>
	<div class="v-item">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGroupable } from '@/composables/groupable';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { active, toggle } = useGroupable(props.value);
		return { active, toggle };
	},
});
</script>
