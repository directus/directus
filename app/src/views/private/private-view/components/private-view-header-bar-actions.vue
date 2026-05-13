<script setup lang="ts">
import { toRef } from 'vue';
import { useProvideHeaderBarInline } from '../composables/use-header-bar';

const props = defineProps<{
	headerBarInline?: boolean;
}>();

useProvideHeaderBarInline(toRef(props, 'headerBarInline'));
</script>

<template>
	<div class="actions">
		<div class="prepend">
			<slot name="prepend" />
		</div>

		<div class="default">
			<slot />
		</div>

		<div class="primary">
			<slot name="primary" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.actions {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.625rem;
	flex-grow: 1;
	min-inline-size: 0;
	justify-content: end;
}

.default {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.125rem;
	flex-grow: 1;
	min-inline-size: 0;
	max-inline-size: fit-content;
}

.primary {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	flex-shrink: 0;
}

.prepend,
.default,
.primary {
	&:empty {
		display: contents;
	}
}
</style>
