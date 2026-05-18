<script lang="ts" setup>
import { useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import { useInjectHeaderBarInline } from '../composables/use-header-bar';
import VButton, { type VButtonEmits, type VButtonProps } from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { BREAKPOINTS } from '@/constants';

const {
	label,
	tooltip,
	kind = 'normal',
	variant = 'solid',
} = defineProps<{
	icon: string;
	iconFilled?: boolean;
	label?: string;
	tooltip?: VButtonProps['tooltip'];
	disabled?: VButtonProps['disabled'];
	loading?: VButtonProps['loading'];
	kind?: VButtonProps['kind'];
	variant?: 'solid' | 'ghost';
	outlined?: VButtonProps['outlined'];
	secondary?: VButtonProps['secondary'];
	to?: VButtonProps['to'];
	href?: VButtonProps['href'];
	download?: VButtonProps['download'];
	active?: VButtonProps['active'];
}>();

defineEmits<VButtonEmits>();

const headerBarInline = useInjectHeaderBarInline();
const { showIcon, activeTooltip } = useIcon();

function useIcon() {
	const breakpoints = useBreakpoints(BREAKPOINTS);
	const lteXSmall = breakpoints.smallerOrEqual('xs');
	const lteSmall = breakpoints.smallerOrEqual('sm');
	const lteLarge = breakpoints.smallerOrEqual('lg');

	const showIcon = computed(() => {
		if (!label) return true;
		if (headerBarInline.value) return lteLarge.value;
		return lteXSmall.value || (!lteSmall.value && lteLarge.value);
	});

	const activeTooltip = computed(() => {
		if (showIcon.value && label && tooltip) return `${label} (${tooltip})`;
		if (tooltip) return tooltip;
		if (showIcon.value) return label;
		return undefined;
	});

	return { showIcon, activeTooltip };
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
		:secondary
		:to
		:href
		:download
		:tooltip="activeTooltip"
		:icon="showIcon"
		small
		exact
		@click="$emit('click', $event)"
	>
		<VIcon v-if="showIcon" :name="icon" :filled="iconFilled" />
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
	--v-button-background-color-disabled: transparent;
	--v-button-color-disabled: var(--theme--foreground-subdued);

	&.normal {
		--v-button-color-hover: var(--neutral-ondimmed);
		--v-button-background-color-hover: var(--neutral-dimmed);
	}

	&.info {
		--v-button-color-hover: var(--info-ondimmed);
		--v-button-background-color-hover: var(--info-dimmed);
	}

	&.success {
		--v-button-color-hover: var(--success-ondimmed);
		--v-button-background-color-hover: var(--success-dimmed);
	}

	&.danger {
		--v-button-color-hover: var(--danger-ondimmed);
		--v-button-background-color-hover: var(--danger-dimmed);
	}

	&.warning {
		--v-button-color-hover: var(--warning-ondimmed);
		--v-button-background-color-hover: var(--warning-dimmed);
	}
}
</style>
