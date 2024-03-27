<script setup lang="ts">
import UseDatetime, { type Props } from '@/components/use-datetime.vue';

withDefaults(defineProps<Props>(), {
	format: 'long',
	relative: false,
	strict: false,
	round: 'round',
	suffix: true,
});
</script>

<template>
	<use-datetime v-slot="{ datetime }" v-bind="$props">
		<span class="datetime">{{ datetime }}</span>
	</use-datetime>
</template>

<style lang="scss" scoped>
.datetime {
	overflow: hidden;
	line-height: 1.15;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
