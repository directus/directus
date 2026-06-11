<script setup lang="ts">
import { ListboxFilter } from 'reka-ui';
import VIcon from '@/components/v-icon/v-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';

defineProps<{
	loading?: boolean;
	placeholder?: string;
	showBack?: boolean;
}>();

defineEmits<{
	back: [];
}>();

const search = defineModel<string>({ default: '' });
</script>

<template>
	<div class="search-input">
		<span v-if="showBack" class="back" @click="$emit('back')">
			<VIcon name="keyboard_backspace" />
		</span>
		<span v-else class="back-placeholder" />
		<ListboxFilter
			:model-value="search"
			:placeholder="placeholder"
			auto-focus
			class="input"
			@update:model-value="search = $event as string"
		/>
		<VProgressCircular v-if="loading === true" indeterminate />
		<VIcon v-else-if="search" clickable name="close" @click="search = ''" />
	</div>
</template>

<style scoped lang="scss">
.search-input {
	display: flex;
	position: relative;
	align-items: center;
	padding: 0.5rem 0.75rem;
	block-size: 3.375rem;
	border-block-end: 0.0625rem solid var(--theme--primary);

	.back,
	.back-placeholder {
		margin-inline-end: 0.625rem;
	}

	.back {
		--v-icon-size: 1.125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.1875rem;
		background: var(--theme--background-normal);
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.input {
		flex: 1;
		background-color: transparent;
		border: none;
		color: var(--theme--foreground);
		outline: none;
		padding: 1.25rem 1.25rem 1.25rem 0;
		margin: 0;
		inline-size: 100%;
		block-size: 100%;
		line-height: 3rem;
		font-size: 1.125rem;
	}

	.v-progress-circular {
		position: absolute;
		inset-inline-end: 0.75rem;
	}
}
</style>
