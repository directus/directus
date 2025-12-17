<script setup lang="ts">
import { useSizeClass } from '@directus/composables';
import { computed, ref } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';

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
	clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	active: undefined,
	close: false,
	closeIcon: 'close',
	outlined: false,
	label: true,
	disabled: false,
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
		:class="[sizeClass, { outlined, label, disabled, close, clickable }]"
		@click="onClick"
	>
		<span class="chip-content">
			<slot />
			<span v-if="close" class="close-outline" :class="{ disabled }" @click.stop="onCloseClick">
				<v-icon class="close" :name="closeIcon" x-small />
			</span>
		</span>
	</component>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-chip-color                   [var(--theme--foreground)]
		--v-chip-color-hover             [var(--white)]
		--v-chip-background-color        [var(--theme--background-normal)]
		--v-chip-background-color-hover  [var(--theme--primary-accent)]
		--v-chip-border-color            [var(--v-chip-background-color)]
		--v-chip-border-color-hover      [var(--v-chip-background-color-hover)]
		--v-chip-close-color             [var(--theme--danger)]
		--v-chip-close-color-disabled    [var(--theme--primary)]
		--v-chip-close-color-hover       [var(--theme--primary-accent)]
		--v-chip-padding                 [0 8px]

*/

.v-chip {
	display: inline-flex;
	align-items: center;
	block-size: 36px;
	padding: var(--v-chip-padding, 0 8px);
	color: var(--v-chip-color, var(--theme--foreground));
	font-weight: var(--weight-normal);
	font-family: var(--v-chip-font-family);
	line-height: 22px;
	background-color: var(--v-chip-background-color, var(--theme--background-normal));
	border: var(--theme--border-width) solid
		var(--v-chip-border-color, var(--v-chip-background-color, var(--theme--background-normal)));
	border-radius: 16px;

	&.clickable:hover {
		color: var(--v-chip-color-hover, var(--white));
		background-color: var(--v-chip-background-color-hover, var(--theme--primary-accent));
		border-color: var(--v-chip-border-color-hover, var(--v-chip-background-color-hover), var(--theme--primary-accent));
	}

	&.outlined {
		background-color: transparent;
	}

	&.disabled {
		cursor: auto;

		color: var(--v-chip-color, var(--theme--foreground));
		background-color: var(--v-chip-background-color, var(--theme--background-normal));
		border-color: var(--v-chip-border-color, var(--v-chip-background-color, var(--theme--background-normal)));

		&.clickable:hover {
			color: var(--v-chip-color, var(--theme--foreground));
			background-color: var(--v-chip-background-color, var(--theme--background-normal));
			border-color: var(--v-chip-background-color, var(--theme--background-normal));
		}
	}

	&.x-small {
		block-size: 20px;
		padding: var(--v-chip-padding, 0 6px);
		font-size: 12px;
		border-radius: 10px;
	}

	&.small {
		block-size: 24px;
		padding: var(--v-chip-padding, 0 8px);
		font-size: 14px;
		border-radius: 12px;
	}

	&.large {
		block-size: 44px;
		padding: var(--v-chip-padding, 0 20px);
		font-size: 16px;
		border-radius: 22px;
	}

	&.x-large {
		block-size: 48px;
		padding: var(--v-chip-padding, 0 20px);
		font-size: 18px;
		border-radius: 24px;
	}

	&.label {
		border-radius: var(--theme--border-radius);
	}

	.chip-content {
		display: inline-flex;
		align-items: center;
		white-space: nowrap;

		.close-outline {
			position: relative;
			inset-inline-end: -4px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			inline-size: 14px;
			block-size: 14px;
			margin-inline-start: 4px;
			background-color: var(--v-chip-close-color, var(--theme--danger));
			border-radius: 10px;

			&.disabled {
				background-color: var(--v-chip-close-color-disabled, var(--theme--primary));

				&:hover {
					background-color: var(--v-chip-close-color-disabled, var(--theme--primary));
				}
			}

			&:hover {
				background-color: var(--v-chip-close-color-hover, var(--theme--primary-accent));
			}
		}
	}
}
</style>
