<template>
	<div v-if="active" class="v-tab-item">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script setup lang="ts">
import { useGroupable } from '../composables';

interface Props {
	value?: string | number;
}

const props = defineProps<Props>();

const { active, toggle } = useGroupable({ value: props.value, group: 'v-tabs-items' });
</script>
