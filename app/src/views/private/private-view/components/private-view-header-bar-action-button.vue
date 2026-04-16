<script lang="ts" setup>
import { useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import VButton, { type VButtonEmits, type VButtonProps } from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { BREAKPOINTS } from '@/constants';

const {
	label,
	kind = 'normal',
	variant = 'solid',
} = defineProps<{
	icon: string;
	label?: string;
	tooltip?: VButtonProps['tooltip'];
	disabled?: VButtonProps['disabled'];
	loading?: VButtonProps['loading'];
	kind?: VButtonProps['kind'];
	variant?: 'solid' | 'ghost';
	outlined?: VButtonProps['outlined'];
	to?: VButtonProps['to'];
	href?: VButtonProps['href'];
	download?: VButtonProps['download'];
	active?: VButtonProps['active'];
}>();

defineEmits<VButtonEmits>();

const { showIcon } = useIcon();

function useIcon() {
	const breakpoints = useBreakpoints({
		...BREAKPOINTS,
		labelMin: '25rem',
	});

	const belowLabelMin = breakpoints.smallerOrEqual('labelMin');
	const lteSmall = breakpoints.smallerOrEqual('sm');
	const lteLarge = breakpoints.smallerOrEqual('lg');

	const showIcon = computed(() => {
		if (!label) return true;
		return belowLabelMin.value || (!lteSmall.value && lteLarge.value);
	});

	return { showIcon };
}
</script>

<template>
	<VButton
		class="header-button"
		:class="[variant === 'ghost' ? kind : undefined, variant]"
		:kind="variant === 'ghost' ? undefined : kind"
		:disabled
		:active
		:loading
		:outlined
		:to
		:href
		:download
		:tooltip
		:icon="showIcon"
		small
		exact
		@click="$emit('click', $event)"
	>
		<VIcon v-if="showIcon" :name="icon" />
		<span v-else>{{ label }}</span>
		<template v-if="$slots['split-menu']" #split-menu><slot name="split-menu" /></template>
		<template #append-outer><slot name="append-outer" /></template>
	</VButton>
</template>

<style scoped lang="scss">
.header-button.ghost {
	--v-button-color: var(--theme--foreground);
	--v-button-background-color: transparent;
	--v-button-background-color-active: var(--v-button-background-color-hover);
	--v-button-color-active: var(--v-button-color-hover);

	&.normal {
		--v-button-color: var(--theme--foreground);
		--v-button-color-hover: var(--theme--foreground);
		--v-button-background-color-hover: var(--theme--background-accent);
	}

	&.info {
		--v-button-color-hover: var(--blue);
		--v-button-background-color-hover: var(--blue-10);
	}

	&.success {
		--v-button-color-hover: var(--theme--success);
		--v-button-background-color-hover: var(--theme--success-background);
	}

	&.danger {
		--v-button-color-hover: var(--theme--danger);
		--v-button-background-color-hover: var(--theme--danger-background);
	}

	&.warning {
		--v-button-color-hover: var(--theme--warning);
		--v-button-background-color-hover: var(--theme--warning-background);
	}
}
</style>
