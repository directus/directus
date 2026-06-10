<script setup lang="ts">
import { ListboxGroup, ListboxGroupLabel } from 'reka-ui';

defineProps<{
	heading?: string;
	icon?: string;
}>();
</script>

<template>
	<ListboxGroup class="command-group">
		<ListboxGroupLabel v-if="heading" class="group-heading">
			<slot name="heading">
				{{ heading }}
			</slot>
		</ListboxGroupLabel>
		<slot />
	</ListboxGroup>
</template>

<style scoped lang="scss">
.command-group + .command-group {
	margin-block-start: 0.375rem;
}

.command-group + .command-group::before {
	display: block;
	margin: 0 0.75rem 0.375rem 0.5rem;
	border-block-start: 1px solid var(--theme--border-color-subdued);
	content: '';
}

.group-heading {
	display: flex;
	align-items: center;
	padding: 0 0.75rem 0 0.5rem;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--theme--foreground-subdued);
	block-size: 2rem;
	gap: 0.375rem;
}
</style>
