<script lang="ts" setup>
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import type { RouteLocationRaw } from 'vue-router';

defineProps<{
	icon: string;
	disabled?: boolean;
	loading?: boolean;
	secondary?: boolean;
	outlined?: boolean;
	to?: RouteLocationRaw;
	href?: string;
	download?: string;
	active?: boolean;
}>();

defineEmits<{
	click: [];
}>();
</script>

<template>
	<VButton
		:disabled
		:active
		:loading
		:secondary
		:outlined
		:to
		:href
		:download
		icon
		rounded
		small
		@click="$emit('click')"
	>
		<VIcon :name="icon" small />
		<template #append-outer><slot name="append-outer" /></template>
	</VButton>
</template>
