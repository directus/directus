<template>
	<div class="v-item">
		<slot v-bind="{ active: isActive, toggle }" />
	</div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { useGroupable } from '../composables';

interface Props {
	value?: string | number;
	scope?: string;
	active?: boolean;
	watch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	scope: 'item-group',
	active: undefined,
	watch: true,
});

const { active } = toRefs(props);
const { active: isActive, toggle } = useGroupable({
	value: props.value,
	group: props.scope,
	watch: props.watch,
	active,
});
</script>
