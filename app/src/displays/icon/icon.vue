<script setup lang="ts">
import { computed } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { isHex } from '@/utils/is-hex';

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
	<VIcon small :name="value" :style="style" :filled="filled" />
</template>
