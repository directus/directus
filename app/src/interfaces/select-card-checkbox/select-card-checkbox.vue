<script setup lang="ts">
import { CheckboxGroupRoot, CheckboxRoot } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from '../select-card/card-preview.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';

type Choice = {
	text: string;
	value: string;
	description?: string;
	icon_type?: 'icon' | 'image';
	icon?: string;
	image?: string;
};

const props = withDefaults(
	defineProps<{
		value?: string[] | null;
		disabled?: boolean;
		choices?: Choice[] | null;
		size?: 'small' | 'medium' | 'large';
	}>(),
	{
		value: () => [],
		disabled: false,
		choices: null,
		size: 'medium',
	},
);

const emit = defineEmits<{
	input: [value: string[]];
}>();

const { t } = useI18n();

const selectedValues = ref<string[]>([...(props.value ?? [])]);
const searchQuery = ref('');
const showSearch = computed(() => (props.choices?.length ?? 0) > 10 || searchQuery.value.length > 0);

watch(
	() => props.value,
	(newValue) => {
		selectedValues.value = [...(newValue ?? [])];
	},
);

function handleChange(values: string[]) {
	emit('input', [...values]);
}

const filteredChoices = computed(() => {
	if (!props.choices) return [];
	if (!searchQuery.value) return props.choices;

	return props.choices.filter((choice) => (choice.text ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()));
});

function clearSearch() {
	searchQuery.value = '';
}
</script>

<template>
	<div class="card-select-interface content" :class="`size-${size}`">
		<VInput v-if="showSearch" v-model="searchQuery" :placeholder="t('search')" small type="search">
			<template #prepend>
				<VIcon name="search" />
			</template>
			<template #append>
				<VIcon v-if="searchQuery" name="close" clickable @click="clearSearch" />
			</template>
		</VInput>

		<CheckboxGroupRoot
			v-model="selectedValues"
			:disabled="disabled"
			class="group"
			loop
			role="group"
			@update:model-value="handleChange"
		>
			<TransitionGroup name="list" tag="div" class="grid" :class="{ 'two-column-floor': filteredChoices.length > 1 }">
				<div
					v-for="choice in filteredChoices"
					:key="choice.value"
					class="interface"
					:class="{
						active: selectedValues.includes(choice.value),
						gray: selectedValues.length > 0 && !selectedValues.includes(choice.value),
						disabled,
					}"
				>
					<CheckboxRoot :value="choice.value" :disabled="disabled" class="checkbox-root" :aria-label="choice.text">
						<CardPreview
							:choice="choice"
							:is-selected="selectedValues.includes(choice.value)"
							:disabled="disabled"
							selection-type="checkbox"
						/>
					</CheckboxRoot>
				</div>
			</TransitionGroup>

			<VNotice v-if="filteredChoices.length === 0 && searchQuery" type="info">
				{{ t('no_results') }}
			</VNotice>
		</CheckboxGroupRoot>
	</div>
</template>

<style scoped>
.card-select-interface {
	--card-min-width: 12rem;

	padding: 0;

	&.size-small {
		--card-min-width: 9rem;
	}

	&.size-large {
		--card-min-width: 16rem;
	}

	.grid {
		--card-track-min-width: min(var(--card-min-width), 100%);
		--focus-ring-space: calc(var(--focus-ring-width) + var(--focus-ring-offset));
		--card-select-focus-ring-color: var(--theme--primary-subdued);

		display: grid;
		inline-size: 100%;
		gap: var(--theme--form--row-gap) var(--theme--form--column-gap);
		grid-template-columns: repeat(auto-fill, minmax(var(--card-track-min-width), 1fr));
		padding: var(--focus-ring-space);
		margin: calc(-1 * var(--focus-ring-space));

		&.two-column-floor {
			--card-track-min-width: min(var(--card-min-width), calc((100% - var(--theme--form--column-gap)) / 2));
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
		transition: opacity var(--fast) var(--transition);

		&:hover:not(.disabled) {
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

		&.disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}
	}

	.v-input {
		margin-block-end: var(--theme--form--row-gap);
	}

	.list-enter-active,
	.list-leave-active {
		transition: opacity var(--fast) var(--transition);
	}

	.list-enter-from,
	.list-leave-to {
		opacity: 0;
	}

	.list-move {
		transition: transform var(--fast) var(--transition);
	}
}

:deep(.checkbox-root) {
	inline-size: 100%;
	outline: none;
	display: block;
	text-align: start;

	&:focus-visible {
		outline: none;

		.preview {
			outline: var(--focus-ring-width) solid var(--card-select-focus-ring-color);
			outline-offset: var(--focus-ring-offset);
		}
	}
}
</style>
