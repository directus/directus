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
		xSmall: {
			type: Boolean,
			default: false
		},
		small: {
			type: Boolean,
			default: false
		},
		large: {
			type: Boolean,
			default: false
		},
		xLarge: {
			type: Boolean,
			default: false
		}
	},
	setup(props) {
		const sizeClass = computed<string | null>(() => {
			if (props.xSmall) return 'x-small';
			if (props.small) return 'small';
			if (props.large) return 'large';
			if (props.xLarge) return 'x-large';
			return null;
		});

		return { sizeClass };
	}
});
</script>

<style lang="scss" scoped>
.v-button {
	--v-button-width: auto;
	--v-button-height: 44px;
	--v-button-color: var(--button-primary-text-color);
	--v-button-background-color: var(--button-primary-background-color);
	--v-button-hover-color: var(--button-primary-text-color);
	--v-button-hover-background-color: var(--button-primary-background-color-hover);
	--v-button-font-size: 16px;

	color: var(--v-button-color);
	background-color: var(--v-button-background-color);
	border-radius: var(--border-radius);
	font-weight: var(--weight-bold);
	cursor: pointer;
	border: var(--input-border-width) solid var(--v-button-background-color);

	font-size: var(--v-button-font-size);
	padding: 0 19px;
	min-width: 78px;
	width: var(--v-button-width);
	height: var(--v-button-height);

	transition: var(--fast) var(--transition);
	transition-property: background-color border;

	position: relative;

	&:focus {
		outline: 0;
	}

	&:not(.loading):not(:disabled):hover {
		color: var(--v-button-hover-color);
		background-color: var(--v-button-hover-background-color);
		border: var(--input-border-width) solid var(--v-button-hover-background-color);
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

	&:disabled {
		background-color: var(--button-primary-background-color-disabled);
		border: var(--input-border-width) solid var(--button-primary-background-color-disabled);
		color: var(--button-primary-text-color-disabled);
		cursor: not-allowed;
	}

	&.x-small {
		--v-button-height: 28px;
		--v-button-font-size: 12px;
		padding: 0 12px;
		min-width: 48px;
	}

	&.small {
		--v-button-height: 36px;
		--v-button-font-size: 14px;
		padding: 0 16px;
		min-width: 64px;
	}

	&.large {
		--v-button-height: 52px;
		padding: 0 23px;
		min-width: 92px;
	}

	&.x-large {
		--v-button-height: 58px;
		--v-button-font-size: 18px;
		padding: 0 32px;
		min-width: 120px;
	}

	&.icon {
		min-width: 0;
		padding: 0;
		width: var(--v-button-height);
	}

	.content,
	.spinner {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 100%;
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
