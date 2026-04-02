<script lang="ts" setup>
import VButton, { Props as VButtonProps } from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const { kind = 'normal' } = defineProps<{
	icon: string;
	disabled?: VButtonProps['disabled'];
	loading?: VButtonProps['loading'];
	kind?: VButtonProps['kind'];
	secondary?: VButtonProps['secondary'];
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
		:class="[secondary ? kind : undefined, secondary]"
		:kind="!secondary ? kind : undefined"
		:disabled
		:active
		:loading
		:secondary
		:outlined
		:to
		:href
		:download
		icon
		small
		@click="$emit('click')"
	>
		<VIcon :name="icon" />
		<template #append-outer><slot name="append-outer" /></template>
	</VButton>
</template>

<style scoped lang="scss">
.header-button.secondary {
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
