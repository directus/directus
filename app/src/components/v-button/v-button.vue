<template>
	<div class="v-button" :class="{ secondary, 'full-width': fullWidth }">
		<slot name="prepend-outer" />
		<component
			v-focus="autofocus"
			:is="component"
			:active-class="to ? 'activated' : null"
			:exact="exact"
			:download="download"
			class="button"
			:class="[
				sizeClass,
				`align-${align}`,
				{
					rounded,
					icon,
					outlined,
					loading,
					active,
					dashed,
					tile,
					'full-width': fullWidth,
				},
			]"
			:type="type"
			:disabled="disabled"
			:to="to"
			:href="href"
			:target="component === 'a' ? '_blank' : null"
			:ref="component === 'a' ? 'noopener noreferer' : null"
			@click="onClick"
		>
			<span class="content" :class="{ invisible: loading }">
				<slot v-bind="{ active, toggle }" />
			</span>
			<div class="spinner">
				<slot v-if="loading" name="loading">
					<v-progress-circular :x-small="xSmall" :small="small" indeterminate />
				</slot>
			</div>
		</component>
		<slot name="append-outer" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import { Location } from 'vue-router';
import useSizeClass, { sizeProps } from '@/composables/size-class';
import { useGroupable } from '@/composables/groupable';
import { notEmpty } from '@/utils/is-empty';

export default defineComponent({
	props: {
		autofocus: {
			type: Boolean,
			default: false,
		},
		fullWidth: {
			type: Boolean,
			default: false,
		},
		rounded: {
			type: Boolean,
			default: false,
		},
		outlined: {
			type: Boolean,
			default: false,
		},
		icon: {
			type: Boolean,
			default: false,
		},
		type: {
			type: String,
			default: 'button',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		to: {
			type: [String, Object] as PropType<string | Location>,
			default: null,
		},
		href: {
			type: String,
			default: null,
		},
		exact: {
			type: Boolean,
			default: false,
		},
		secondary: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [Number, String],
			default: null,
		},
		dashed: {
			type: Boolean,
			default: false,
		},
		tile: {
			type: Boolean,
			default: false,
		},
		align: {
			type: String,
			default: 'center',
			validator: (val: string) => ['left', 'center', 'right'].includes(val),
		},
		download: {
			type: String,
			default: null,
		},
		...sizeProps,
	},
	setup(props, { emit }) {
		const sizeClass = useSizeClass(props);

		const component = computed<'a' | 'router-link' | 'button'>(() => {
			if (props.disabled) return 'button';
			if (notEmpty(props.href)) return 'a';
			if (notEmpty(props.to)) return 'router-link';
			return 'button';
		});

		const { active, toggle } = useGroupable({
			value: props.value,
			group: 'button-group',
		});

		return { sizeClass, onClick, component, active, toggle };

		function onClick(event: MouseEvent) {
			if (props.loading === true) return;
			// Toggles the active state in the parent groupable element. Allows buttons to work ootb in button-groups
			toggle();
			emit('click', event);
		}
	},
});
</script>

<style>
body {
	--v-button-width: auto;
	--v-button-height: 44px;
	--v-button-color: var(--foreground-inverted);
	--v-button-color-hover: var(--foreground-inverted);
	--v-button-color-activated: var(--foreground-inverted);
	--v-button-color-disabled: var(--foreground-subdued);
	--v-button-background-color: var(--primary);
	--v-button-background-color-hover: var(--primary-125);
	--v-button-background-color-activated: var(--primary);
	--v-button-background-color-disabled: var(--background-normal);
	--v-button-font-size: 16px;
	--v-button-font-weight: 600;
	--v-button-line-height: 22px;
	--v-button-min-width: 140px;
}
</style>

<style lang="scss" scoped>
.v-button {
	display: inline-flex;
	align-items: center;

	&.secondary {
		--v-button-color: var(--foreground-normal);
		--v-button-color-hover: var(--foreground-normal);
		--v-button-color-activated: var(--foreground-normal);
		--v-button-background-color: var(--border-subdued); // I'm so sorry! 🥺
		--v-button-background-color-hover: var(--background-normal-alt);
		--v-button-background-color-activated: var(--background-normal-alt);
	}

	&.full-width {
		display: flex;
		min-width: 100%;
	}

	.button {
		position: relative;
		display: flex;
		align-items: center;
		width: var(--v-button-width);
		min-width: var(--v-button-min-width);
		height: var(--v-button-height);
		padding: 0 19px;
		color: var(--v-button-color);
		font-weight: var(--v-button-font-weight);
		font-size: var(--v-button-font-size);
		line-height: var(--v-button-line-height);
		text-decoration: none;
		background-color: var(--v-button-background-color);
		border: var(--border-width) solid var(--v-button-background-color);
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: var(--fast) var(--transition);
		transition-property: background-color border;

		&:hover {
			color: var(--v-button-color-hover);
			background-color: var(--v-button-background-color-hover);
			border-color: var(--v-button-background-color-hover);
		}

		&.align-left {
			justify-content: flex-start;
		}

		&.align-center {
			justify-content: center;
		}

		&.align-right {
			justify-content: flex-end;
		}

		&:focus {
			outline: 0;
		}

		&:disabled {
			color: var(--v-button-color-disabled);
			background-color: var(--v-button-background-color-disabled);
			border: var(--border-width) solid var(--v-button-background-color-disabled);
			cursor: not-allowed;
		}

		&.rounded {
			border-radius: calc(var(--v-button-height) / 2);
		}

		&.outlined {
			--v-button-color: var(--v-button-background-color);

			background-color: transparent;

			&:not(.activated):hover {
				color: var(--v-button-background-color-hover);
				background-color: transparent;
				border-color: var(--v-button-background-color-hover);
			}

			&.secondary {
				--v-button-color: var(--foreground-subdued);
			}
		}

		&.dashed {
			border-style: dashed;
		}

		&.x-small {
			--v-button-height: 28px;
			--v-button-font-size: 12px;
			--v-button-font-weight: 600;
			--v-button-min-width: 60px;
			--border-radius: 4px;

			padding: 0 12px;
		}

		&.small {
			--v-button-height: 36px;
			--v-button-font-size: 14px;
			--v-button-min-width: 120px;

			padding: 0 12px;
		}

		&.large {
			--v-button-height: 52px;
			--v-button-min-width: 154px;

			padding: 0 12px;
		}

		&.x-large {
			--v-button-height: 64px;
			--v-button-font-size: 18px;
			--v-button-min-width: 180px;

			padding: 0 12px;
		}

		&.icon {
			width: var(--v-button-height);
			min-width: 0;
			padding: 0;
		}

		&.full-width {
			min-width: 100%;
		}

		.content,
		.spinner {
			max-width: 100%;
			margin: 0 -1px; // Fixes slightly cropped icons
			padding: 0 1px; // Fixes slightly cropped icons
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.content {
			position: relative;
			display: flex;
			align-items: center;
			line-height: normal;

			&.invisible {
				opacity: 0;
			}
		}

		.spinner {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);

			.v-progress-circular {
				--v-progress-circular-color: var(--v-button-color);
				--v-progress-circular-background-color: transparent;
			}
		}

		&.activated,
		&.active {
			--v-button-color: var(--v-button-color-activated) !important;
			--v-button-color-hover: var(--v-button-color-activated) !important;
			--v-button-background-color: var(--v-button-background-color-activated) !important;
			--v-button-background-color-hover: var(--v-button-background-color-activated) !important;
		}

		&.tile {
			border-radius: 0;
		}
	}
}
</style>
