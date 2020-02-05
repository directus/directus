<template>
	<button
		class="v-button"
		:class="[sizeClass, { block, rounded, icon, outlined, loading }]"
		:type="type"
		:style="styles"
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
		color: {
			type: String,
			default: '--button-primary-text-color'
		},
		backgroundColor: {
			type: String,
			default: '--button-primary-background-color'
		},
		hoverColor: {
			type: String,
			default: '--button-primary-text-color'
		},
		hoverBackgroundColor: {
			type: String,
			default: '--button-primary-background-color-hover'
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
		width: {
			type: Number,
			default: null
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
		interface Styles {
			'--_v-button-color': string;
			'--_v-button-background-color': string;
			'--_v-button-hover-color': string;
			'--_v-button-hover-background-color': string;
			width?: string;
		}

		const styles = computed<Styles>(() => {
			let styles: Styles = {
				'--_v-button-color': parseCSSVar(props.color),
				'--_v-button-background-color': parseCSSVar(props.backgroundColor),
				'--_v-button-hover-color': parseCSSVar(props.hoverColor),
				'--_v-button-hover-background-color': parseCSSVar(props.hoverBackgroundColor)
			};

			if (props.width && +props.width > 0) {
				styles.width = props.width + 'px';
			}

			return styles;
		});

		const sizeClass = computed<string | null>(() => {
			if (props.xSmall) return 'x-small';
			if (props.small) return 'small';
			if (props.large) return 'large';
			if (props.xLarge) return 'x-large';
			return null;
		});

		return { styles, sizeClass };
	}
});
</script>

<style lang="scss" scoped>
.v-button {
	--_v-button-height: 44px;

	color: var(--_v-button-color);
	background-color: var(--_v-button-background-color);
	border-radius: var(--border-radius);
	font-weight: var(--weight-bold);
	cursor: pointer;
	border: var(--input-border-width) solid var(--_v-button-background-color);

	font-size: 14px;
	padding: 0 19px;
	min-width: 78px;
	height: var(--_v-button-height);

	transition: var(--fast) var(--transition);
	transition-property: background-color border;

	position: relative;

	&:focus {
		outline: 0;
	}

	&:not(.loading):not(:disabled):hover {
		color: var(--_v-button-hover-color);
		background-color: var(--_v-button-hover-background-color);
		border: var(--input-border-width) solid var(--_v-button-hover-background-color);
	}

	&.block {
		display: block;
		min-width: 100%;
	}

	&.rounded {
		border-radius: calc(var(--button-height) / 2);
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
		--_v-button-height: 28px;
		font-size: 12px;
		padding: 0 12px;
		min-width: 48px;
	}

	&.small {
		--_v-button-height: 36px;
		font-size: 14px;
		padding: 0 16px;
		min-width: 64px;
	}

	&.large {
		--_v-button-height: var(--button-height);
		font-size: var(--button-font-size);
		padding: 0 23px;
		min-width: 92px;
	}

	&.x-large {
		--_v-button-height: 58px;
		font-size: 18px;
		padding: 0 32px;
		min-width: 120px;
	}

	&.icon {
		min-width: 0;
		padding: 0;
		width: var(--_v-button-height);
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
