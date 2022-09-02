<template>
	<span
		v-if="internalActive"
		class="v-chip"
		:class="[sizeClass, { outlined, label, disabled, close }]"
		@click="onClick"
	>
		<span class="chip-content">
			<slot />
			<span v-if="close" class="close-outline" :class="{ disabled }" @click.stop="onCloseClick">
				<v-icon class="close" :name="closeIcon" x-small />
			</span>
		</span>
	</span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSizeClass } from '@directus/shared/composables';

interface Props {
	/** Model the active state */
	active?: boolean;
	/** Displays a close icon which triggers the close event */
	close?: boolean;
	/** Which icon should be displayed to close it */
	closeIcon?: string;
	/** No background */
	outlined?: boolean;
	/** Adds a border radius */
	label?: boolean;
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
}

const props = withDefaults(defineProps<Props>(), {
	active: undefined,
	close: false,
	closeIcon: 'close',
	outlined: false,
	label: true,
	disabled: false,
});

const emit = defineEmits(['update:active', 'click', 'close']);

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

<style>
body {
	--v-chip-color: var(--foreground-normal);
	--v-chip-background-color: var(--background-normal-alt);
	--v-chip-color-hover: var(--white);
	--v-chip-background-color-hover: var(--primary-125);
	--v-chip-close-color: var(--danger);
	--v-chip-close-color-disabled: var(--primary);
	--v-chip-close-color-hover: var(--primary-125);
}
</style>

<style lang="scss" scoped>
.v-chip {
	display: inline-flex;
	align-items: center;
	height: 36px;
	padding: 0 8px;
	color: var(--v-chip-color);
	font-weight: var(--weight-normal);
	line-height: 22px;
	background-color: var(--v-chip-background-color);
	border: var(--border-width) solid var(--v-chip-background-color);
	border-radius: 16px;

	&.clickable:hover {
		color: var(--v-chip-color-hover);
		background-color: var(--v-chip-background-color-hover);
		border-color: var(--v-chip-background-color-hover);
		cursor: pointer;
	}

	&.outlined {
		background-color: transparent;
	}

	&.disabled {
		color: var(--v-chip-color);
		background-color: var(--v-chip-background-color);
		border-color: var(--v-chip-background-color);

		&.clickable:hover {
			color: var(--v-chip-color);
			background-color: var(--v-chip-background-color);
			border-color: var(--v-chip-background-color);
		}
	}

	&.x-small {
		height: 20px;
		padding: 0 4px;
		font-size: 12px;
		border-radius: 10px;
	}

	&.small {
		height: 24px;
		padding: 0 4px;
		font-size: 14px;
		border-radius: 12px;
	}

	&.large {
		height: 44px;
		padding: 0 20px;
		font-size: 16px;
		border-radius: 22px;
	}

	&.x-large {
		height: 48px;
		padding: 0 20px;
		font-size: 18px;
		border-radius: 24px;
	}

	&.label {
		border-radius: var(--border-radius);
	}

	.chip-content {
		display: inline-flex;
		align-items: center;
		white-space: nowrap;

		.close-outline {
			position: relative;
			right: -4px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 14px;
			height: 14px;
			margin-left: 4px;
			background-color: var(--v-chip-close-color);
			border-radius: 10px;

			.close {
				--v-icon-color: var(--v-chip-background-color);
			}

			&.disabled {
				background-color: var(--v-chip-close-color-disabled);

				&:hover {
					background-color: var(--v-chip-close-color-disabled);
				}
			}

			&:hover {
				background-color: var(--v-chip-close-color-hover);
			}
		}
	}
}
</style>
