<template>
	<v-icon small :name="value" :style="style" :filled="filled" />
</template>

<script setup lang="ts">
import { isHex } from '@/utils/is-hex';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: string | null;
		color?: string;
		filled?: boolean;
	}>(),
	{
		color: undefined,
	}
);

const style = computed(() => {
	if (props.color && isHex(props.color)) return { '--v-icon-color': props.color };
	else return {};
});
</script>
