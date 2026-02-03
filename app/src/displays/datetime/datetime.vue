<script setup lang="ts">
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';

withDefaults(defineProps<UseDatetimeProps>(), {
	format: 'long',
	relative: false,
	strict: false,
	round: 'round',
	suffix: true,
	use24: false,
});
</script>

<template>
	<UseDatetime v-slot="{ datetime }" v-bind="$props">
		<span class="datetime">{{ datetime }}</span>
	</UseDatetime>
</template>

<style lang="scss" scoped>
.datetime {
	overflow: hidden;
	line-height: 1.15;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
