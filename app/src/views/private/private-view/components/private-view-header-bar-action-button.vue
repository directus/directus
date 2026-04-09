<script lang="ts" setup>
import VButton, { Props as VButtonProps } from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const { kind = 'normal', variant = 'solid' } = defineProps<{
	icon: string;
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

defineEmits<{
	click: [];
}>();
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
		icon
		small
		exact
		@click="$emit('click')"
	>
		<VIcon :name="icon" />
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
