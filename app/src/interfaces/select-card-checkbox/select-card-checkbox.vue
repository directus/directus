<script setup lang="ts">
import { CheckboxGroupRoot, CheckboxRoot } from 'reka-ui';
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from '../select-card/card-preview.vue';
import type { Choice } from '../select-card/types';
import { useCardSearch } from '../select-card/use-card-search';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';

const props = withDefaults(
	defineProps<{
		value?: string[] | null;
		disabled?: boolean;
		choices?: Choice<string>[] | null;
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
const choiceGroupId = useId();

const selectedValues = ref<string[]>([...(props.value ?? [])]);

const { searchQuery, showSearch, filteredChoices, clearSearch } = useCardSearch(computed(() => props.choices));

watch(
	() => props.value,
	(newValue) => {
		selectedValues.value = [...(newValue ?? [])];
	},
);

function handleChange(values: string[]) {
	emit('input', [...values]);
}

function getChoiceId(value: string) {
	return `${choiceGroupId}-${encodeURIComponent(value)}`;
}
</script>

<template>
	<div class="card-select-interface content" :class="`size-${size}`">
		<VInput v-if="showSearch" v-model="searchQuery" :placeholder="t('search')" small type="search">
			<template #prepend>
				<VIcon name="search" />
			</template>
			<template #append>
				<VIcon v-if="searchQuery" name="close" clickable :aria-label="t('clear_value')" @click="clearSearch" />
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
					<CheckboxRoot
						:value="choice.value"
						:disabled="disabled"
						class="checkbox-root"
						:aria-labelledby="`${getChoiceId(choice.value)}-label`"
						:aria-describedby="choice.description ? `${getChoiceId(choice.value)}-description` : undefined"
					>
						<CardPreview
							:choice="choice"
							:is-selected="selectedValues.includes(choice.value)"
							selection-type="checkbox"
							:label-id="`${getChoiceId(choice.value)}-label`"
							:description-id="`${getChoiceId(choice.value)}-description`"
						/>
					</CheckboxRoot>
				</div>
			</TransitionGroup>

			<VNotice v-if="filteredChoices.length === 0" type="info">
				{{ t(searchQuery ? 'no_results' : 'no_options_available') }}
			</VNotice>
		</CheckboxGroupRoot>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

@include mixins.card-select-interface('.checkbox-root', $hover: ':hover:not(.disabled)', $disabled: '.disabled');
</style>
