<template>
	<button
		class="v-button"
		:class="[sizeClass, { block, rounded, icon, outlined, loading }]"
		:type="type"
		:disabled="disabled"
		@click="!loading ? $emit('click') : null"
	>
		<span class="content" :class="{ invisible: loading }"><slot /></span>
		<div class="spinner">
			<slot v-if="loading" name="loading">
				<v-spinner :x-small="xSmall" :small="small" />
			</slot>
		</div>
	</button>
</template>

<script lang="ts">
import { createComponent, reactive, computed, Ref } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';
import useSizeClass, { sizeProps } from '@/compositions/size-class';

export default createComponent({
	props: {
		block: {
			type: Boolean,
			default: false
		},
		rounded: {
			type: Boolean,
			default: false
		},
		outlined: {
			type: Boolean,
			default: false
		},
		icon: {
			type: Boolean,
			default: false
		},
		type: {
			type: String,
			default: 'button'
		},
		disabled: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
		...sizeProps
	},
	setup(props) {
		const sizeClass = useSizeClass(props);
		return { sizeClass };
	}
});
</script>

<style lang="scss" scoped>
.v-button {
	--v-button-width: auto;
	--v-button-height: 44px;
	--v-button-color: var(--button-primary-foreground-color);
	--v-button-color-hover: var(--button-primary-foreground-color-hover);
	--v-button-background-color: var(--button-primary-background-color);
	--v-button-background-color-hover: var(--button-primary-background-color-hover);
	--v-button-font-size: 16px;

	position: relative;
	width: var(--v-button-width);
	min-width: 78px;
	height: var(--v-button-height);
	padding: 0 19px;
	color: var(--v-button-color);
	font-weight: 500;
	font-size: var(--v-button-font-size);
	background-color: var(--v-button-background-color);
	border: var(--button-border-width) solid var(--v-button-background-color);
	border-radius: var(--button-border-radius);
	cursor: pointer;
	transition: var(--fast) var(--transition);
	transition-property: background-color border;

	&:focus {
		outline: 0;
	}

	&:disabled {
		color: var(--button-primary-text-color-disabled);
		background-color: var(--button-primary-background-color-disabled);
		border: var(--input-border-width) solid var(--button-primary-background-color-disabled);
		cursor: not-allowed;
	}

	&:not(.loading):not(:disabled):hover {
		color: var(--v-button-color-hover);
		background-color: var(--v-button-background-color-hover);
		border: var(--button-border-width) solid var(--v-button-background-color-hover);
	}

	&.block {
		display: block;
		min-width: 100%;
	}

	&.rounded {
		border-radius: calc(var(--v-button-height) / 2);
	}

	&.outlined {
		background-color: transparent;
	}

	&.x-small {
		--v-button-height: 28px;
		--v-button-font-size: 12px;

		min-width: 48px;
		padding: 0 12px;
	}

	&.small {
		--v-button-height: 36px;
		--v-button-font-size: 14px;

		min-width: 64px;
		padding: 0 16px;
	}

	&.large {
		--v-button-height: 52px;

		min-width: 92px;
		padding: 0 23px;
	}

	&.x-large {
		--v-button-height: 58px;
		--v-button-font-size: 18px;

		min-width: 120px;
		padding: 0 32px;
	}

	&.icon {
		width: var(--v-button-height);
		min-width: 0;
		padding: 0;
	}

	.content,
	.spinner {
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.content {
		position: relative;
		top: -1;

		&.invisible {
			opacity: 0;
		}
	}

	.spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
}
</style>
