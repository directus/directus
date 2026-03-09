<script setup lang="ts">
import { ListboxGroup, ListboxGroupLabel } from 'reka-ui';

defineProps<{
	heading?: string;
	icon?: string;
}>();
</script>

<template>
	<ListboxGroup>
		<ListboxGroupLabel v-if="heading" class="group-heading">
			<slot name="heading">
				<v-icon v-if="icon" class="group-icon" :name="icon" />
				{{ heading }}
			</slot>
		</ListboxGroupLabel>
		<slot />
	</ListboxGroup>
</template>

<style scoped lang="scss">
.group-heading {
	display: flex;
	align-items: center;
	padding: 0 12px 0 8px;
	font-size: 13px;
	color: var(--theme--foreground-subdued);
	height: 36px;
	gap: 6px;

	.group-icon {
		--v-icon-size: 16px;
		--v-icon-color: var(--theme--foreground-subdued);
	}
}
</style>
