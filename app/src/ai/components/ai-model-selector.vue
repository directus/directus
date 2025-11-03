<script setup lang="ts">
import { computed, ref } from 'vue';
import {
	SelectArrow,
	SelectContent,
	SelectIcon,
	SelectItem,
	SelectItemIndicator,
	SelectItemText,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from 'reka-ui';

interface Model {
	provider: string;
	model: string;
	icon: string;
}

const props = withDefaults(
	defineProps<{
		models?: Model[];
		selectedModel?: Model | null;
	}>(),
	{
		models: () => [],
	},
);

const emit = defineEmits<{
	'update:selectedModel': [model: Model];
}>();

const selectedValue = ref(
	props.models && props.models.length > 0 ? props.models[0] : null,
);

const selectedModel = computed(() => {
	if (!selectedValue.value) return null;
	return props.models?.find((m) => m.provider === selectedValue.value!.provider && m.model === selectedValue.value!.model);
});

function handleValueChange(value: string) {
	selectedValue.value = props.models?.find((m) => m.provider === provider && m.model === model);
	const [provider, model] = value.split('/');
	const selected = props.models?.find((m) => m.provider === provider && m.model === model);

	if (selected) {
		emit('update:selectedModel', selected);
	}
}
</script>

<template>
	<SelectRoot :model-value="selectedValue" @update:model-value="handleValueChange">
		<SelectTrigger class="select-trigger">
			<SelectValue>
				{{ selectedModel?.model }}
			</SelectValue>
			<SelectIcon class="select-icon">
				<v-icon name="expand_more" x-small />
			</SelectIcon>
		</SelectTrigger>


			<SelectContent class="select-content" position="popper" side="bottom" align="start" :side-offset="8">
				<SelectArrow class="select-arrow">
					<div class="arrow-triangle" />
				</SelectArrow>


					<SelectItem
						v-for="model in models"
						:key="`${model.provider}-${model.model}`"
						:value="`${model.provider}/${model.model}`"
						class="select-item"
					>
						<div class="select-item-content">
							<v-icon :name="model.icon" small class="select-item-icon" />
							<SelectItemText class="select-item-text">
								<v-text-overflow :text="`${model.provider}/${model.model}`" />
							</SelectItemText>
							<SelectItemIndicator class="select-item-indicator">
								<v-icon name="check" x-small />
							</SelectItemIndicator>
						</div>
					</SelectItem>

			</SelectContent>

	</SelectRoot>
</template>

<style lang="scss" scoped>
.select-trigger {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;

	padding: 0 6px;
	background: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	color: var(--theme--form--field--input--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
	text-align: left;

	&:hover:not(:disabled) {
		border-color: var(--theme--form--field--input--border-color-hover, var(--theme--primary));
	}

	&:focus,
	&:focus-visible {
		border-color: var(--theme--primary);
		outline: none !important;
		outline-offset: 0 !important;
		box-shadow: 0 0 0 2px var(--theme--primary-25);
	}

	&:disabled {
		background: var(--theme--form--field--input--background-subdued);
		color: var(--theme--form--field--input--foreground-subdued);
		cursor: not-allowed;
	}
}

.select-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform var(--fast) var(--transition);

	[data-state='open'] & {
		transform: rotate(180deg);
	}
}

:deep(.select-content) {

	z-index: 600;
	min-inline-size: 100px;
	background-color: var(--theme--popover--menu--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
	transform-origin: var(--reka-select-content-transform-origin);
	animation: scaleIn 150ms var(--transition-in);

	&[data-state='closed'] {
		animation: scaleOut 150ms var(--transition-out);
	}
}

@keyframes scaleIn {
	from {
		opacity: 0;
		transform: scale(0.95);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes scaleOut {
	from {
		opacity: 1;
		transform: scale(1);
	}
	to {
		opacity: 0;
		transform: scale(0.95);
	}
}





:deep(.select-arrow) {
	position: absolute;
	z-index: 1;
	inline-size: 10px;
	block-size: 10px;
}

:deep(.arrow-triangle),
:deep(.arrow-triangle::before),
:deep(.arrow-triangle::after) {
	position: absolute;
	inline-size: 10px;
	block-size: 10px;
}

.arrow-triangle {
	overflow: visible clip;

	&::before,
	&::after {
		content: '';
		background: var(--theme--popover--menu--background);
		transform: rotate(45deg);
	}

	&::after {
		box-shadow: var(--theme--popover--menu--box-shadow);
		opacity: 0.75;
	}
}

[data-side='top'] .select-arrow {
	inset-block-end: -10px;

	.arrow-triangle {
		&::before,
		&::after {
			inset-block-end: 7px;
		}
	}
}

[data-side='bottom'] .select-arrow {
	inset-block-start: -10px;

	.arrow-triangle {
		&::before,
		&::after {
			inset-block-start: 7px;
		}
	}
}

[data-side='right'] .select-arrow {
	inset-inline-start: -10px;

	.arrow-triangle {
		overflow: clip visible;

		&::before,
		&::after {
			inset-inline-start: 7px;
		}
	}
}

[data-side='left'] .select-arrow {
	inset-inline-end: -10px;

	.arrow-triangle {
		overflow: clip visible;

		&::before,
		&::after {
			inset-inline-end: 7px;
		}
	}
}

:deep(.select-item) {
	position: relative;
	display: flex;
	align-items: center;
	min-height: 40px;
	padding: 8px 8px;
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
