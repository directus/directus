<script setup lang="ts">
import api from '@/api';
import axios from 'axios';
import { debounce, get, throttle } from 'lodash';
import { render } from 'micromustache';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value: string | number | null;
		url?: string;
		resultsPath?: string;
		textPath?: string;
		valuePath?: string;
		trigger?: 'debounce' | 'throttle';
		rate?: number | string;
		placeholder?: string;
		iconLeft?: string;
		iconRight?: string;
		font?: 'sans-serif' | 'serif' | 'monospace';
		disabled?: boolean;
		nonEditable?: boolean;
		direction?: string;
	}>(),
	{
		trigger: 'throttle',
		rate: 500,
		font: 'sans-serif',
	},
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const results = ref<Record<string, any>[]>([]);

const fetchResultsRaw = async (value: string | null) => {
	if (!value) {
		results.value = [];
		return;
	}

	const url = render(props.url!, { value });

	try {
		const result = await (url.startsWith('/') ? api.get(url) : axios.get(url));
		const resultsArray = props.resultsPath ? get(result.data, props.resultsPath) : result.data;

		if (Array.isArray(resultsArray) === false) {
			// eslint-disable-next-line no-console
			console.warn(`Expected results type of array, "${typeof resultsArray}" received`);
			return;
		}

		results.value = resultsArray.map((result: Record<string, unknown>) => {
			if (props.textPath && props.valuePath) {
				return { text: get(result, props.textPath), value: get(result, props.valuePath) };
			} else if (props.valuePath) {
				return { value: get(result, props.valuePath) };
			} else {
				return { value: result };
			}
		});
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(err);
	}
};

const fetchResults =
	props.trigger === 'debounce'
		? debounce(fetchResultsRaw, Number(props.rate))
		: throttle(fetchResultsRaw, Number(props.rate));

function onInput(value: string) {
	emitValue(value);
	return fetchResults(value);
}

function emitValue(value: string) {
	emit('input', value);
}

async function onValueChange(value: string, activate: () => void, deactivate: () => void) {
	await onInput(value);

	if (value && results.value.length) activate();
	else deactivate();
}
</script>

<template>
	<v-notice v-if="!url" type="warning">
		{{ t('one_or_more_options_are_missing') }}
	</v-notice>
	<div v-else>
		<v-menu attached :disabled="disabled">
			<template #activator="{ activate, deactivate }">
				<v-input
					:placeholder="placeholder"
					:disabled="disabled"
					:non-editable="nonEditable"
					:class="font"
					:model-value="value"
					:dir="direction"
					@update:model-value="(value: string) => onValueChange(value, activate, deactivate)"
				>
					<template v-if="iconLeft" #prepend><v-icon :name="iconLeft" /></template>
					<template v-if="iconRight" #append><v-icon :name="iconRight" /></template>
				</v-input>
			</template>

			<v-list v-if="results.length">
				<v-list-item v-for="result of results" :key="result.value" clickable @click="() => emitValue(result.value)">
					<v-list-item-content>{{ textPath ? result.text : result.value }}</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.v-input {
	&.monospace {
		--v-input-font-family: var(--theme--fonts--monospace--font-family);
	}

	&.serif {
		--v-input-font-family: var(--theme--fonts--serif--font-family);
	}

	&.sans-serif {
		--v-input-font-family: var(--theme--fonts--sans--font-family);
	}
}
</style>
