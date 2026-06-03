<script setup lang="ts">
import { computed } from 'vue';
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';
import { formatTimezoneLabel } from '@/utils/format-date';

const props = withDefaults(defineProps<UseDatetimeProps>(), {
	format: 'long',
	relative: false,
	strict: false,
	round: 'round',
	suffix: true,
	use24: false,
});

const tzTooltip = computed(() => {
	if (!props.tz || !props.value) return undefined;
	return formatTimezoneLabel(props.tz, props.value);
});
</script>

<template>
	<UseDatetime v-slot="{ datetime }" v-bind="$props">
		<span v-tooltip.bottom="tzTooltip" class="datetime">
			{{ datetime }}
		</span>
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
