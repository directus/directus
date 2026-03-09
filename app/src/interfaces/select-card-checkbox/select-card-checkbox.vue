<script setup lang="ts">
import { CheckboxGroupRoot, CheckboxRoot } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from './card-preview.vue';

type Choice = {
	text: string;
	value: string;
	description?: string;
	icon_type?: 'icon' | 'svg' | 'image';
	icon?: string;
	svg_icon?: string;
	image?: string;
};

const props = withDefaults(
	defineProps<{
		value: string[] | null;
		disabled?: boolean;
		choices?: Choice[] | null;
		gridSize?: number;
		enableSearch?: boolean;
	}>(),
	{
		value: () => [],
		disabled: false,
		choices: null,
		gridSize: 4,
		enableSearch: false,
	},
);

const emit = defineEmits<{
	input: [value: string[]];
}>();

const { t } = useI18n();

const selectedValues = ref<string[]>(props.value || []);
const searchQuery = ref('');

watch(
	() => props.value,
	(newValue) => {
		selectedValues.value = newValue || [];
	},
);

function handleChange(values: string[]) {
	emit('input', values);
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

		<CheckboxGroupRoot
			v-model="selectedValues"
			:disabled="disabled"
			class="group"
			loop
			role="group"
			@update:model-value="handleChange"
		>
			<transition-group name="list" tag="div" class="grid" :style="gridColumns">
				<div
					v-for="choice in filteredChoices"
					:key="choice.value"
					class="interface"
					:class="{
						active: selectedValues.includes(choice.value),
						gray: selectedValues.length > 0 && !selectedValues.includes(choice.value),
					}"
				>
					<CheckboxRoot
						:value="choice.value"
						:disabled="disabled"
						class="checkbox-root"
						:aria-label="choice.text"
					>
						<CardPreview
							:choice="choice"
							:is-selected="selectedValues.includes(choice.value)"
							:disabled="disabled"
							selection-type="checkbox"
						/>
					</CheckboxRoot>
				</div>
			</transition-group>

			<v-notice v-if="filteredChoices.length === 0 && searchQuery" type="info">
				{{ t('no_results') }}
			</v-notice>
		</CheckboxGroupRoot>
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

:deep(.checkbox-root) {
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
