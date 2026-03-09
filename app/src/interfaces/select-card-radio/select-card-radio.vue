<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from './card-preview.vue';

type Choice = {
	text: string;
	value: string | number;
	description?: string;
	icon_type?: 'icon' | 'svg' | 'image';
	icon?: string;
	svg_icon?: string;
	image?: string;
};

const props = withDefaults(
	defineProps<{
		value: string | number | null;
		disabled?: boolean;
		choices?: Choice[] | null;
		gridSize?: number;
		enableSearch?: boolean;
	}>(),
	{
		disabled: false,
		choices: null,
		gridSize: 4,
		enableSearch: false,
	},
);

const emit = defineEmits<{
	input: [value: string | number | null];
}>();

const { t } = useI18n();

const selectedValue = ref(props.value);
const searchQuery = ref('');

watch(
	() => props.value,
	(newValue) => {
		selectedValue.value = newValue;
	},
);

function handleChange(value: AcceptableValue) {
	emit('input', value as string | number);
}

const gridColumns = computed(() => ({
	'--columns-xl': props.gridSize,
	'--columns-lg': Math.min(props.gridSize, 3),
	'--columns-md': Math.min(props.gridSize, 2),
	'--columns-sm': 1,
}));

const filteredChoices = computed(() => {
	if (!props.choices) return [];
	if (!searchQuery.value) return props.choices;

	return props.choices.filter((choice) =>
		(choice.text ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()),
	);
});

function clearSearch() {
	searchQuery.value = '';
}
</script>

<template>
	<div class="card-select-interface content">
		<v-input v-if="enableSearch" v-model="searchQuery" :placeholder="t('search')" small type="search">
			<template #prepend>
				<v-icon name="search" />
			</template>
			<template #append>
				<v-icon v-if="searchQuery" name="close" clickable @click="clearSearch" />
			</template>
		</v-input>

		<RadioGroupRoot v-model="selectedValue" :disabled="disabled" class="group" @update:model-value="handleChange">
			<transition-group name="list" tag="div" class="grid" :style="gridColumns">
				<RadioGroupItem
					v-for="choice in filteredChoices"
					:key="choice.value"
					:value="choice.value"
					:aria-label="choice.text"
					class="interface radio-root"
					:class="{ active: selectedValue === choice.value, gray: selectedValue && selectedValue !== choice.value }"
				>
					<CardPreview
						:choice="choice"
						:is-selected="selectedValue === choice.value"
						:disabled="disabled"
						selection-type="radio"
					/>
				</RadioGroupItem>
			</transition-group>

			<v-notice v-if="filteredChoices.length === 0 && searchQuery" type="info">
				{{ t('no_results') }}
			</v-notice>
		</RadioGroupRoot>
	</div>
</template>

<style scoped>
.card-select-interface {
	padding: 0;
	container-type: inline-size;

	.grid {
		display: grid;
		width: 100%;
		max-height: 480px;
		overflow-y: auto;
		gap: var(--theme--form--column-gap);
		grid-template-columns: repeat(var(--columns-xl), minmax(0, 1fr));
	}

	@container (max-width: 840px) {
		.grid {
			grid-template-columns: repeat(var(--columns-lg), minmax(0, 1fr));
		}
	}

	@container (max-width: 600px) {
		.grid {
			grid-template-columns: repeat(var(--columns-md), minmax(0, 1fr));
		}
	}

	@container (max-width: 400px) {
		.grid {
			grid-template-columns: repeat(var(--columns-sm), minmax(0, 1fr));
		}
	}

	.interface {
		--border-color: var(--v-input-border-color, var(--theme--form--field--input--border-color));
		display: flex;
		flex-direction: column;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		transition: all var(--fast) var(--transition);

		&:hover {
			--border-color: var(--theme--form--field--input--border-color-hover);
		}

		&:focus {
			--border-color: var(--theme--primary);
		}

		&.active {
			--border-color: var(--theme--primary);
		}

		&.gray {
			opacity: 0.8;
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}
	}

	.v-input {
		margin-bottom: 16px;
	}

	.list-enter-active,
	.list-leave-active {
		transition: all 0.3s ease;
	}

	.list-enter-from,
	.list-leave-to {
		opacity: 0;
	}

	.list-move {
		transition: transform 0.3s ease;
	}
}

:deep(.radio-root) {
	width: 100%;
	outline: none;
	display: block;
	text-align: left;

	&:focus-visible {
		outline: none;

		.preview {
			outline: 2px solid var(--theme--primary);
			outline-offset: 2px;
			border-color: var(--theme--primary);
		}
	}
}
</style>
