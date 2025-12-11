<script lang="ts" setup>
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	icon: string;
	disabled?: boolean;
	loading?: boolean;
	secondary?: boolean;
	outlined?: boolean;
	to?: string;
}>();

defineEmits<{
	click: [];
}>();
</script>

<template>
	<VButton
		:disabled
		:loading
		:secondary
		:outlined
		:to
		icon
		rounded
		small
		@click="$emit('click')"
	>
		<VIcon :name="icon" small />
	</VButton>
</template>
