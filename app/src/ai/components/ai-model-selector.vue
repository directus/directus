<script setup lang="ts">
import {
	SelectArrow,
	SelectContent,
	SelectIcon,
	SelectItem,
	SelectItemIndicator,
	SelectItemText,
	SelectRoot,
	SelectTrigger,
} from 'reka-ui';
import { computed } from 'vue';
import { useAiStore } from '../stores/use-ai';

const aiStore = useAiStore();

const selectedModel = computed({
	get: () => aiStore.selectedModel,
	set: (value) => aiStore.updateSelectedModel(value ?? ''),
});
</script>

<template>
	<SelectRoot v-model="selectedModel">
		<SelectTrigger class="select-trigger">
			{{ aiStore.currentModel }}
			<SelectIcon class="select-icon">
				<v-icon name="expand_more" x-small />
			</SelectIcon>
		</SelectTrigger>

		<SelectContent class="select-content" position="popper" side="bottom" align="start" :side-offset="8">
			<SelectArrow class="select-arrow">
				<div class="arrow-triangle" />
			</SelectArrow>

			<SelectItem v-for="model in aiStore.models" :key="model" :value="model" class="select-item">
				<div class="select-item-content">
					<SelectItemText class="select-item-text">
						<v-text-overflow :text="model.split('/')[1]" />
					</SelectItemText>
					<SelectItemIndicator class="select-item-indicator">
						<v-icon name="check" x-small />
					</SelectItemIndicator>
				</div>
			</SelectItem>
		</SelectContent>
	</SelectRoot>
</template>

<style scoped>
.select-trigger {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 4px;
	padding: 4px 8px;
	background: transparent;
	border: var(--theme--border-width) solid transparent;
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground-subdued);
	font-family: var(--theme--fonts--sans--font-family);
	font-size: 12px;
	cursor: pointer;
	transition: all var(--fast) var(--transition);
	text-align: start;

	&:hover:not(:disabled) {
		background: var(--theme--background-subdued);
		color: var(--theme--foreground);
	}

	&:focus,
	&:focus-visible {
		background: var(--theme--background-subdued);
		color: var(--theme--foreground);
		outline: none !important;
		outline-offset: 0 !important;
	}

	&:disabled {
		color: var(--theme--foreground-subdued);
		cursor: not-allowed;
		opacity: 0.5;
	}
}

.select-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform var(--fast) var(--transition);
}

[data-state='open'] .select-icon {
	transform: rotate(180deg);
}

:deep(.select-content) {
	z-index: 600;
	min-inline-size: 100px;
	background-color: var(--theme--popover--menu--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
	transform-origin: var(--reka-select-content-transform-origin);
	opacity: 1;
	transform: scale(1);
	transition:
		opacity var(--fast) var(--transition-in),
		transform var(--fast) var(--transition-in);

	&[data-state='closed'] {
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--fast) var(--transition-out),
			transform var(--fast) var(--transition-out);
	}
}

:deep(.select-item) {
	position: relative;
	display: flex;
	align-items: center;
	min-block-size: 40px;
	padding: 8px;
	color: var(--theme--foreground);
	background-color: transparent;
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	outline: none;
	user-select: none;
	transition: background-color var(--fast) var(--transition);

	&:hover {
		background-color: var(--theme--background-normal);
	}

	&[data-highlighted] {
		background-color: var(--theme--background-normal);
	}

	&[data-state='checked'] {
		background-color: var(--theme--background-normal-alt);
		color: var(--theme--primary);
	}

	&[data-disabled] {
		color: var(--theme--foreground-subdued);
		cursor: not-allowed;
		opacity: 0.5;
	}
}

:deep(.select-item-content) {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 8px;
}

:deep(.select-item-icon) {
	flex-shrink: 0;
	color: var(--theme--foreground-subdued);
}

:deep(.select-item-text) {
	flex: 1;
	font-size: 14px;
	line-height: 1.4;
}

:deep(.select-item-indicator) {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-inline-start: auto;
	color: var(--theme--primary);
}
</style>
