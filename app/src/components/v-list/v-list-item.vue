<template>
	<component
		:is="component"
		active-class="active"
		class="v-list-item"
		:exact="exact"
		:to="to"
		:class="{
			active,
			large,
			dense,
			link: isClickable,
			'three-line': lines === 3,
			'two-line': lines === 2,
			'one-line': lines === 1,
			disabled,
			dashed,
		}"
		:href="href"
		:download="download"
		:target="component === 'a' ? '_blank' : null"
		v-on="disabled === false && $listeners"
	>
		<slot></slot>
	</component>
</template>

<script lang="ts">
import { Location } from 'vue-router';
import { defineComponent, PropType, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		large: {
			type: Boolean,
			default: false,
		},
		dense: {
			type: Boolean,
			default: false,
		},
		lines: {
			type: Number as PropType<1 | 2 | 3>,
			default: null,
		},
		to: {
			type: [String, Object] as PropType<string | Location>,
			default: null,
		},
		href: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
		dashed: {
			type: Boolean,
			default: false,
		},
		exact: {
			type: Boolean,
			default: false,
		},
		download: {
			type: String,
			default: null,
		},
	},
	setup(props, { listeners }) {
		const component = computed<string>(() => {
			if (props.to) return 'router-link';
			if (props.href) return 'a';
			return 'li';
		});

		const isClickable = computed(() => Boolean(props.to || props.href || listeners.click !== undefined));

		return { component, isClickable };
	},
});
</script>

<style>
body {
	--v-list-item-one-line-min-height-large: 40px;
	--v-list-item-two-line-min-height-large: 52px;
	--v-list-item-three-line-min-height-large: 64px;
	--v-list-item-one-line-min-height: 32px;
	--v-list-item-two-line-min-height: 36px;
	--v-list-item-three-line-min-height: 52px;
	--v-list-item-padding-large: 0 16px 0 calc(16px + var(--v-list-item-indent, 0px));
	--v-list-item-padding: 0 8px 0 calc(8px + var(--v-list-item-indent, 0px));
	--v-list-item-margin-large: 2px 0;
	--v-list-item-min-width: none;
	--v-list-item-max-width: none;
	--v-list-item-min-height: var(--v-list-item-one-line-min-height);
	--v-list-item-max-height: auto;
	--v-list-item-border-radius: var(--border-radius);
	--v-list-item-margin-bottom: 0;
	--v-list-item-color: var(--v-list-color, var(--foreground-normal));
	--v-list-item-color-hover: var(--v-list-color-hover, var(--foreground-normal));
	--v-list-item-color-active: var(--v-list-color-active, var(--foreground-normal));
	--v-list-item-background-color-hover: var(--v-list-background-color-hover, var(--background-normal-alt));
	--v-list-item-background-color-active: var(--v-list-background-color-active, var(--background-normal-alt));
}
</style>

<style lang="scss" scoped>
.v-list-item {
	$this: &;

	position: relative;
	display: flex;
	flex-basis: 100%;
	flex-grow: 1;
	flex-shrink: 1;
	align-items: center;
	min-width: var(--v-list-item-min-width);
	max-width: var(--v-list-item-max-width);
	min-height: var(--v-list-item-min-height);
	max-height: var(--v-list-item-max-height);
	margin-bottom: var(--v-list-item-margin-bottom);
	padding: var(--v-list-item-padding);
	overflow: hidden;
	color: var(--v-list-item-color);
	text-decoration: none;
	border-radius: var(--v-list-item-border-radius);

	&.dashed {
		&::after {
			// Borders normally render outside the element, this is a way of showing it as inner
			position: absolute;
			top: 0;
			left: 0;
			width: calc(100% - 4px);
			height: calc(100% - 4px);
			border: 2px dashed var(--border-normal);
			content: '';
			pointer-events: none;
		}
	}

	&.link {
		cursor: pointer;
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;
		user-select: none;

		&:not(.disabled):not(.dense):hover {
			color: var(--v-list-item-color-hover);
			background-color: var(--v-list-item-background-color-hover);
		}

		&:not(.disabled):not(.dense):active {
			color: var(--v-list-item-color-active);
			background-color: var(--v-list-item-background-color-active);
		}
	}

	&:not(.dense).active {
		color: var(--v-list-item-color-active);
		background-color: var(--v-list-item-background-color-active);
	}

	&.disabled {
		--v-list-item-color: var(--foreground-subdued) !important;

		cursor: not-allowed;
	}

	&.dense {
		::v-deep .v-list-item-title {
			color: var(--foreground-subdued);
		}

		&:hover,
		&.active {
			::v-deep .v-list-item-title {
				color: var(--primary);
			}
		}
	}

	@at-root {
		.v-list,
		#{$this},
		.v-list #{$this} {
			--v-list-item-min-height: var(--v-list-item-one-line-min-height);
			&.one-line {
				--v-list-item-min-height: var(--v-list-item-one-line-min-height);
			}
			&.two-line {
				--v-list-item-min-height: var(--v-list-item-two-line-min-height);
			}
			&.three-line {
				--v-list-item-min-height: var(--v-list-item-three-line-min-height);
			}
		}

		.v-list.large {
			#{$this} {
				--v-list-item-min-height: var(--v-list-item-one-line-min-height-large);

				--v-list-item-padding-large: 0 8px;
				--v-list-item-border-radius: 4px;

				margin: var(--v-list-item-margin-large);
				padding: var(--v-list-item-padding-large);

				&:not(:last-child):not(:only-child) {
					margin-bottom: 4px;
				}

				&.one-line {
					--v-list-item-min-height: var(--v-list-item-one-line-min-height-large);
				}
				&.two-line {
					--v-list-item-min-height: var(--v-list-item-two-line-min-height-large);
				}
				&.three-line {
					--v-list-item-min-height: var(--v-list-item-three-line-min-height-large);
				}
			}
		}
	}
}
</style>
