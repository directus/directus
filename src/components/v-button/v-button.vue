<template>
	<div class="v-button" :class="{ secondary, 'full-width': fullWidth }">
		<slot name="prepend-outer" />
		<component
			:is="component"
			:active-class="to ? 'activated' : null"
			:exact="exact"
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
				},
			]"
			:type="type"
			:disabled="disabled"
			:to="to"
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
import useSizeClass, { sizeProps } from '@/compositions/size-class';
import { useGroupable } from '@/compositions/groupable';

export default defineComponent({
	props: {
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
		...sizeProps,
	},
	setup(props, { emit }) {
		const sizeClass = useSizeClass(props);

		const component = computed<string>(() => (props.to ? 'router-link' : 'button'));
		const { active, toggle } = useGroupable(props.value, 'button-group');

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

<style lang="scss" scoped>
.v-button {
	--v-button-width: auto;
	--v-button-height: 44px;
	--v-button-color: var(--white);
	--v-button-color-activated: var(--white);
	--v-button-color-disabled: var(--foreground-subdued);
	--v-button-background-color: var(--primary);
	--v-button-background-color-activated: var(--primary);
	--v-button-background-color-disabled: var(--background-subdued);
	--v-button-font-size: 16px;

	display: inline-flex;
	align-items: center;

	&.secondary {
		--v-button-color: var(--foreground-color);
		--v-button-color-hover: var(--foreground-color);
		--v-button-color-activated: var(--foreground-color);
		--v-button-background-color: var(--background-normal-alt);
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
		min-width: 78px;
		height: var(--v-button-height);
		padding: 0 19px;
		color: var(--v-button-color);
		font-weight: 500;
		font-size: var(--v-button-font-size);
		text-decoration: none;
		background-color: var(--v-button-background-color);
		border: var(--border-width) solid var(--v-button-background-color);
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: var(--fast) var(--transition);
		transition-property: background-color border;

		&.align-left {
			justify-content: flex-start;
		}

		&.align-center {
			justify-content: center;
		}

		&.align-right {
			justify-content: flex-end;
		}

		&:active {
			transform: scale(0.98);
		}

		&:focus {
			outline: 0;
		}

		&:disabled {
			color: var(--v-button-color-disabled);
			background-color: var(--v-button-background-color-disabled);
			border: var(--border-width) solid var(--v-button-background-color-disabled);
			cursor: not-allowed;

			&:active {
				transform: scale(1);
			}
		}

		&.rounded {
			border-radius: calc(var(--v-button-height) / 2);
		}

		&.outlined {
			--v-button-color: var(--v-button-background-color);

			background-color: transparent;

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
			--v-button-height: 64px;
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

		&.activated {
			--v-button-color: var(--v-button-color-activated) !important;
			--v-button-background-color: var(--v-button-background-color-activated) !important;
		}

		&.tile {
			border-radius: 0;
		}
	}
}
</style>
