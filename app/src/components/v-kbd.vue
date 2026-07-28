<script setup lang="ts">
import { translateShortcut } from '@directus/composables';
import { computed } from 'vue';

export interface Props {
	/** Keyboard key name to display, translated per platform (e.g. 'meta' → '⌘' on Mac) */
	value?: string;
	/** Size of the key cap */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	/** Visual style variant */
	variant?: 'outlined' | 'solid' | 'inverted';
}

const props = withDefaults(defineProps<Props>(), {
	size: 'md',
	variant: 'outlined',
});

const translatedValue = computed(() => {
	if (!props.value) return undefined;
	return translateShortcut([props.value]) || props.value;
});
</script>

<template>
	<kbd class="v-kbd" :class="[size, variant]">
		<slot>{{ translatedValue }}</slot>
	</kbd>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-kbd-color             [var(--theme--foreground-subdued)]
		--v-kbd-background-color  [var(--theme--background-subdued)]
		--v-kbd-border-color      [var(--theme--border-color)]

*/

.v-kbd {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-inline-size: 1.25rem;
	block-size: 1.25rem;
	padding: 0 0.25rem;
	font-size: 0.6875rem;
	font-family: var(--theme--fonts--sans--font-family);
	font-weight: 500;
	text-transform: uppercase;
	border-radius: var(--theme--border-radius);

	&.xs {
		min-inline-size: 0.75rem;
		block-size: 0.75rem;
		font-size: 0.5625rem;
	}

	&.sm {
		min-inline-size: 1rem;
		block-size: 1rem;
		font-size: 0.625rem;
	}

	&.md {
		min-inline-size: 1.25rem;
		block-size: 1.25rem;
		font-size: 0.6875rem;
	}

	&.lg {
		min-inline-size: 1.5rem;
		block-size: 1.5rem;
		font-size: 0.75rem;
	}

	&.xl {
		min-inline-size: 1.75rem;
		block-size: 1.75rem;
		font-size: 0.875rem;
	}

	&.outlined {
		color: var(--v-kbd-color, var(--theme--foreground-subdued));
		box-shadow: inset 0 0 0 1px var(--v-kbd-border-color, var(--theme--border-color));
	}

	&.solid {
		color: var(--v-kbd-color, var(--theme--foreground-subdued));
		background-color: var(--v-kbd-background-color, var(--theme--background-subdued));
	}

	&.inverted {
		color: var(--v-kbd-color, var(--foreground-inverted));
		box-shadow: inset 0 0 0 1px
			var(--v-kbd-border-color, color-mix(in srgb, var(--foreground-inverted) 20%, transparent));
	}
}
</style>
