<template>
	<div v-if="active" class="v-tab-item">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script setup lang="ts">
import { useGroupable } from '@directus/shared/composables';

interface Props {
	/** Custom value to use for selection state */
	value?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
});

const { active, toggle } = useGroupable({ value: props.value, group: 'v-tabs-items' });
</script>
