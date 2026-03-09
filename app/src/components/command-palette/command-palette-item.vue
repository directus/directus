<script setup lang="ts">
import { ListboxItem } from 'reka-ui';

defineProps<{
	value?: string;
	icon?: string;
	forceMount?: boolean;
}>();

defineEmits<{
	select: [];
}>();
</script>

<template>
	<ListboxItem class="result-item" :value="value ?? ''" @select.prevent="$emit('select')">
		<span class="icon">
			<slot name="icon">
				<v-icon v-if="icon" :name="icon" />
			</slot>
		</span>
		<div class="content">
			<div class="title">
				<slot />
			</div>
			<div class="description">
				<slot name="description" />
			</div>
		</div>
	</ListboxItem>
</template>

<style scoped lang="scss">
.result-item {
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	padding: 6px 12px 6px 8px;
	border-radius: 6px;
	min-height: 40px;
	cursor: pointer;

	&[data-highlighted] {
		background-color: var(--theme--background-subdued);
		--v-icon-color: var(--theme--foreground);

		.title {
			color: var(--theme--foreground-accent);
		}

		.description {
			color: var(--theme--foreground);
		}
	}

	.icon {
		margin-right: 12px;
		width: 24px;
		height: 24px;
	}

	.content {
		flex: 1;
	}

	.title {
		color: var(--theme--foreground);
	}

	.description {
		color: var(--theme--foreground-subdued);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
	}
}
</style>
