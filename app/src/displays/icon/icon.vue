<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { isHex } from '@/utils/is-hex';
import { computed } from 'vue';

const props = defineProps<{
	value: string | null;
	color?: string;
	filled?: boolean;
}>();

const style = computed(() => {
	if (props.color && isHex(props.color)) return { '--v-icon-color': props.color };
	else return {};
});
</script>

<template>
	<v-icon small :name="value" :style="style" :filled="filled" />
</template>
