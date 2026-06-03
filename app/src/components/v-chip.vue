<script setup lang="ts">
import { useSizeClass } from '@directus/composables';
import { computed, ref } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';

interface Props {
	/** Model the active state */
	active?: boolean;
	/** Styling of the chip */
	kind?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
	/** No background */
	outlined?: boolean;
	/** Adds a border radius */
	label?: boolean;
	/** Renders as button */
	clickable?: boolean;
	/** Disables the chip */
	disabled?: boolean;
	/** Renders a smaller chip */
	xSmall?: boolean;
	/** Renders a small chip */
	small?: boolean;
	/** Renders a large chip */
	large?: boolean;
	/** Renders a larger chip */
	xLarge?: boolean;
	/** @deprecated Use the default slot instead */
	close?: boolean;
	/** @deprecated Use the default slot instead */
	closeIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
	active: undefined,
	close: false,
	closeIcon: 'close',
	outlined: false,
	label: true,
	disabled: false,
	kind: 'neutral',
});

const emit = defineEmits<{
	'update:active': [active: boolean];
	click: [event: MouseEvent];
	close: [event: MouseEvent];
}>();

const internalLocalActive = ref(true);

const internalActive = computed<boolean>({
	get: () => {
		if (props.active !== undefined) return props.active;
		return internalLocalActive.value;
	},
	set: (active: boolean) => {
		emit('update:active', active);
		internalLocalActive.value = active;
	},
});

const sizeClass = useSizeClass(props);

const kindClass = computed(() => {
	return props.kind !== 'neutral' ? props.kind : undefined;
});

function onClick(event: MouseEvent) {
	if (props.disabled) return;
	emit('click', event);
}

function onCloseClick(event: MouseEvent) {
	if (props.disabled) return;
	internalActive.value = !internalActive.value;
	emit('close', event);
}
</script>

<template>
	<component
		:is="clickable ? 'button' : 'span'"
		v-if="internalActive"
		:type="clickable ? 'button' : undefined"
		:disabled="clickable ? disabled : undefined"
		:aria-pressed="internalActive ? 'true' : 'false'"
		class="v-chip"
		:class="[sizeClass, kindClass, { outlined, label, disabled, close, clickable }]"
		@click="onClick"
	>
		<span class="chip-content">
			<slot />

			<span v-if="close" class="close-outline" :class="{ disabled }" @click.stop="onCloseClick">
				<VIcon class="close" :name="closeIcon" x-small />
			</span>
		</span>
	</component>
</template>

<style lang="scss" scoped>
@use '@/styles/colors';

/*

	Available Variables:

		--v-chip-font-family			 [var(--theme--fonts--sans--font-family)]
		--v-chip-font-weight			 [inherit]
		--v-chip-color                   [var(--neutral-ondimmed)]
		--v-chip-color-hover             [var(--v-chip-color)]
		--v-chip-background-color        [var(--neutral-dimmed)]
		--v-chip-background-color-hover  [var(--v-chip-background-color)]
		--v-chip-border-color            [var(--v-chip-background-color)]
		--v-chip-border-color-hover      [var(--v-chip-background-color-hover)]
		--v-chip-padding                 [0 0.4375rem]

		Deprecated Variables:
		--v-chip-close-color             [var(--theme--danger)]
		--v-chip-close-color-hover       [var(--theme--danger-accent)]
		--v-chip-close-color-disabled    [var(--v-chip-background-color)]

*/

.v-chip {
	--height: 2rem;

	display: inline-flex;
	align-items: center;
	block-size: var(--height);
	padding: var(--v-chip-padding, 0 0.4375rem);
	color: var(--v-chip-color, var(--neutral-ondimmed));
	font-weight: var(--v-chip-font-weight, inherit);
	font-family: var(--v-chip-font-family, var(--theme--fonts--sans--font-family));
	line-height: 1.25rem;
	background-color: var(--v-chip-background-color, var(--neutral-dimmed));
	border: var(--theme--border-width) solid
		var(--v-chip-border-color, var(--v-chip-background-color, var(--neutral-dimmed)));
	border-radius: calc(var(--height) / 2);

	&.clickable:not(.disabled):hover {
		--hover-color: var(--v-chip-color, var(--neutral-ondimmed));

		&:not(.outlined) {
			--hover-color: color-mix(in srgb, var(--v-chip-color, var(--neutral-ondimmed)), #{colors.$light-theme-shade} 50%);

			.dark & {
				--hover-color: color-mix(
					in srgb,
					var(--v-chip-color, var(--neutral-ondimmed)),
					#{colors.$light-theme-shade} 25%
				);
			}
		}

		color: var(--v-chip-color-hover, var(--hover-color));
		background-color: var(--v-chip-background-color-hover, var(--v-chip-background-color, var(--neutral-dimmed)));
		border-color: var(
			--v-chip-border-color-hover,
			var(--v-chip-background-color-hover, var(--v-chip-background-color, var(--neutral-dimmed)))
		);
	}

	&.outlined {
		background-color: transparent;

		&:not(.disabled):hover {
			border-color: var(--v-chip-border-color-hover, var(--v-chip-color, var(--neutral-ondimmed)));
		}
	}

	&.disabled {
		cursor: auto;
	}

	&.x-small {
		--height: 1.125rem;

		padding: var(--v-chip-padding, 0 0.3125rem);
		font-size: 0.6875rem;
	}

	&.small {
		--height: 1.375rem;

		padding: var(--v-chip-padding, 0 0.4375rem);
		font-size: 0.8125rem;
	}

	&.large {
		--height: 2.5rem;

		padding: var(--v-chip-padding, 0 1.125rem);
		font-size: 0.875rem;
	}

	&.x-large {
		--height: 2.6875rem;

		padding: var(--v-chip-padding, 0 1.125rem);
		font-size: 1rem;
	}

	&.label {
		border-radius: var(--theme--border-radius);
	}

	.chip-content {
		display: inline-flex;
		align-items: center;
		white-space: nowrap;

		/** @deprecated Use the default slot instead */
		.close-outline {
			position: relative;
			inset-inline-end: -0.25rem;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			inline-size: 0.8125rem;
			block-size: 0.8125rem;
			margin-inline-start: 0.25rem;
			background-color: var(--v-chip-close-color, var(--theme--danger));
			border-radius: 0.5625rem;

			&:not(.disabled):hover {
				background-color: var(--v-chip-close-color-hover, var(--theme--danger-accent));
			}

			&.disabled {
				background-color: var(--v-chip-close-color-disabled, var(--v-chip-background-color));
			}
		}
	}

	&.primary {
		--v-chip-color: var(--primary-ondimmed);
		--v-chip-background-color: var(--primary-dimmed);
	}

	&.secondary {
		--v-chip-color: var(--secondary-ondimmed);
		--v-chip-background-color: var(--secondary-dimmed);
	}

	&.success {
		--v-chip-color: var(--success-ondimmed);
		--v-chip-background-color: var(--success-dimmed);
	}

	&.warning {
		--v-chip-color: var(--warning-ondimmed);
		--v-chip-background-color: var(--warning-dimmed);
	}

	&.danger {
		--v-chip-color: var(--danger-ondimmed);
		--v-chip-background-color: var(--danger-dimmed);
	}

	&.info {
		--v-chip-color: var(--info-ondimmed);
		--v-chip-background-color: var(--info-dimmed);
	}
}
</style>
