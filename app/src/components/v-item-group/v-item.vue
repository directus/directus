<template>
	<div class="v-item">
		<slot v-bind="{ active: isActive, toggle }" />
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { useGroupable } from '@/composables/groupable';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		scope: {
			type: String,
			default: 'item-group',
		},
		active: {
			type: Boolean,
			default: undefined
		},
		watch: {
			type: Boolean,
			default: true
		}
	},
	setup(props) {
		const {active} = toRefs(props)
		const { active: isActive, toggle } = useGroupable({
			value: props.value,
			group: props.scope,
			watch: props.watch,
			active
		});

		return { isActive, toggle };
	},
});
</script>
