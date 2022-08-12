<template>
	<v-notice v-if="!url" type="warning">
		{{ t('one_or_more_options_are_missing') }}
	</v-notice>
	<div v-else>
		<v-menu attached :disabled="disabled">
			<template #activator="{ activate }">
				<v-input
					:placeholder="placeholder"
					:disabled="disabled"
					:class="font"
					:model-value="value"
					:dir="direction"
					@update:model-value="onInput"
					@focus="activate"
				>
					<template v-if="iconLeft" #prepend><v-icon :name="iconLeft" /></template>
					<template v-if="iconRight" #append><v-icon :name="iconRight" /></template>
				</v-input>
			</template>

			<v-list v-if="results.length > 0">
				<v-list-item v-for="result of results" :key="result.value" @click="() => emitValue(result.value)">
					<v-list-item-content>{{ textPath ? result.text : result.value }}</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType } from 'vue';
import axios from 'axios';
import { throttle, get, debounce } from 'lodash';
import { render } from 'micromustache';
import api from '@/api';

export default defineComponent({
	props: {
		value: {
			type: [String, Number],
			default: null,
		},
		url: {
			type: String,
			default: null,
		},
		resultsPath: {
			type: String,
			default: null,
		},
		textPath: {
			type: String,
			default: null,
		},
		valuePath: {
			type: String,
			default: null,
		},
		trigger: {
			type: String as PropType<'debounce' | 'throttle'>,
			default: 'throttle',
		},
		rate: {
			type: [Number, String],
			default: 500,
		},
		placeholder: {
			type: String,
			default: null,
		},
		iconLeft: {
			type: String,
			default: null,
		},
		iconRight: {
			type: String,
			default: null,
		},
		font: {
			type: String as PropType<'sans-serif' | 'serif' | 'monospace'>,
			default: 'sans-serif',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		direction: {
			type: String,
			default: undefined,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const results = ref<Record<string, any>[]>([]);

		const fetchResultsRaw = async (value: string | null) => {
			if (!value) {
				results.value = [];
				return;
			}

			const url = render(props.url, { value });

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

		return { t, results, onInput, emitValue };

		function onInput(value: string) {
			emitValue(value);
			fetchResults(value);
		}

		function emitValue(value: string) {
			emit('input', value);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	&.monospace {
		--v-input-font-family: var(--family-monospace);
	}

	&.serif {
		--v-input-font-family: var(--family-serif);
	}

	&.sans-serif {
		--v-input-font-family: var(--family-sans-serif);
	}
}
</style>
