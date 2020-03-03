<template>
	<div class="v-item">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, provide } from '@vue/composition-api';
import { useGroupable } from '@/compositions/groupable';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null
		}
	},
	setup(props, context) {
		const { active, toggle } = useGroupable(props.value);
		return { active, toggle };
	}
});
</script>
