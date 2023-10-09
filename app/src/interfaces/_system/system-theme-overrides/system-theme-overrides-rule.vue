<script setup lang="ts">
import Color from 'color';
import { computed } from 'vue';
import { SetValueFn } from './types';

const props = defineProps<{
	rule: string;
	type: 'color';
	set: SetValueFn;
	path: string[];
	value: string | number | undefined;
}>();

const onInput = (event: Event) => {
	props.set(props.path, (event.target as HTMLInputElement).value);
};

const isValidColor = computed(() => {
	try {
		Color(props.value);
		return true;
	} catch {
		return false;
	}
});
</script>

<template>
	<div class="rule">
		<p>{{ rule }}:</p>
		<input class="value" type="text" :value="value" @input="onInput" />
		<display-color v-if="type === 'color' && isValidColor" :value="value" />
	</div>
</template>

<style scoped lang="scss">
.rule {
	display: flex;
	align-items: center;
	font-family: var(--family-monospace);

	p {
		margin-right: 1ch;
	}

	.value {
		margin-right: 1ch;
		border: none;
		border-bottom: 1px solid var(--border-normal);
		width: 10ch;
	}
}
</style>
