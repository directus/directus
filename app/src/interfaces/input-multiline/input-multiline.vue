<template>
	<v-textarea
		v-bind="{ placeholder, trim }"
		:model-value="value"
		:nullable="!clear"
		:disabled="disabled"
		:class="font"
		:dir="direction"
		@update:model-value="$emit('input', $event)"
	>
		<template v-if="(percentageRemaining && percentageRemaining <= 20) || softLength" #append>
			<span
				v-if="(percentageRemaining && percentageRemaining <= 20) || softLength"
				class="remaining"
				:class="{
					warning: percentageRemaining < 10,
					danger: percentageRemaining < 5,
				}"
			>
				{{ charsRemaining }}
			</span>
		</template>
	</v-textarea>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		clear: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		trim: {
			type: Boolean,
			default: false,
		},
		font: {
			type: String as PropType<'sans-serif' | 'serif' | 'monospace'>,
			default: 'sans-serif',
		},
		softLength: {
			type: Number,
			default: undefined,
		},
		direction: {
			type: String,
			default: undefined,
		},
	},
	emits: ['input'],
	setup(props) {
		const charsRemaining = computed(() => {
			if (typeof props.value === 'number') return null;

			if (!props.softLength) return null;
			if (!props.value && props.softLength) return props.softLength;
			const realValue = props.value.replaceAll('\n', ' ').length;

			if (props.softLength) return +props.softLength - realValue;
			return null;
		});

		const percentageRemaining = computed(() => {
			if (typeof props.value === 'number') return null;

			if (!props.softLength) return null;
			if (!props.value) return 100;

			if (props.softLength) return 100 - (props.value.length / +props.softLength) * 100;
			return 100;
		});
		return {
			charsRemaining,
			percentageRemaining,
		};
	},
});
</script>

<style lang="scss" scoped>
.v-textarea {
	&.monospace {
		--v-textarea-font-family: var(--family-monospace);
	}

	&.serif {
		--v-textarea-font-family: var(--family-serif);
	}

	&.sans-serif {
		--v-textarea-font-family: var(--family-sans-serif);
	}
}

.remaining {
	position: absolute;
	right: 10px;
	bottom: 5px;
	color: var(--foreground-subdued);
	font-weight: 600;
	text-align: right;
	vertical-align: middle;
	font-feature-settings: 'tnum';
}

.v-input:focus-within .remaining {
	display: block;
}

.v-input:focus-within .hide {
	display: none;
}

.warning {
	color: var(--warning);
}
</style>
