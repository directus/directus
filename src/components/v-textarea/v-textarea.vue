<template>
	<div
		class="v-textarea"
		:class="{
			disabled,
			'expand-on-focus': expandOnFocus,
			'full-width': fullWidth,
		}"
	>
		<div class="prepend" v-if="$scopedSlots.prepend"><slot name="prepend" /></div>
		<textarea
			v-bind="$attrs"
			v-focus="autofocus"
			v-on="_listeners"
			:class="{
				monospace,
				'allow-resize-x': !allowResizeY && allowResizeX,
				'allow-resize-y': !allowResizeX && allowResizeY,
				'allow-resize-both': allowResizeX && allowResizeY,
			}"
			:disabled="disabled"
			:value="value"
		/>
		<div class="append" v-if="$scopedSlots.append"><slot name="append" /></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		autofocus: {
			type: Boolean,
			default: false,
		},
		monospace: {
			type: Boolean,
			default: false,
		},
		fullWidth: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [String, Number],
			default: null,
		},
		expandOnFocus: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit, listeners }) {
		const _listeners = computed(() => ({
			...listeners,
			input: emitValue,
		}));

		return { _listeners };

		function emitValue(event: InputEvent) {
			emit('input', (event.target as HTMLInputElement).value);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-textarea {
	--v-textarea-min-height: none;
	--v-textarea-max-height: var(--input-height-tall);
	--v-textarea-height: var(--input-height-tall);

	position: relative;
	display: flex;
	flex-direction: column;
	width: max-content;
	height: var(--v-textarea-height);
	min-height: var(--v-textarea-min-height);
	max-height: var(--v-textarea-max-height);
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	.append,
	.prepend {
		flex-shrink: 0;
	}

	&.expand-on-focus {
		height: var(--input-height);
		transition: height var(--medium) var(--transition);

		&:focus,
		&:focus-within {
			height: var(--v-textarea-max-height);
		}
	}

	&:hover {
		border-color: var(--border-normal);
	}

	&:focus,
	&:focus-within {
		border-color: var(--primary);
	}

	&.full-width {
		width: 100%;
	}

	&.disabled {
		color: var(--foreground-subdued);
		background-color: var(--background-subdued);
		border-color: var(--border-subdued);
		cursor: not-allowed;
	}

	textarea {
		position: relative;
		display: block;
		flex-grow: 1;
		width: 100%;
		height: var(--input-height);
		padding: var(--input-padding);
		color: var(--foreground-normal);
		background-color: transparent;
		border: 0;
		resize: none;

		&::placeholder {
			color: var(--foreground-subdued);
		}

		&.monospace {
			font-family: var(--family-monospace);
		}
	}
}
</style>
