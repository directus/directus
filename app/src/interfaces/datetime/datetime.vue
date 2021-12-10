<template>
	<v-date-picker
		:type="type"
		:disabled="disabled"
		:include-seconds="includeSeconds"
		:use-24="use24"
		:model-value="value"
		@update:model-value="$emit('input', $event)"
	></v-date-picker>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		type: {
			type: String as PropType<'timestamp' | 'dateTime' | 'time' | 'date'>,
			required: true,
			validator: (val: string) => ['dateTime', 'date', 'time', 'timestamp'].includes(val),
		},
		includeSeconds: {
			type: Boolean,
			default: false,
		},
		use24: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['input'],
});
</script>

<style lang="scss" scoped>
.date-selects,
.time-selects {
	display: grid;
	grid-gap: 8px;
	width: 100%;
	padding: 16px 8px;
}

.date-selects {
	grid-template-columns: repeat(2, 1fr);
}

.time-selects {
	grid-template-columns: repeat(3, 1fr);

	&.seconds {
		grid-template-columns: repeat(4, 1fr);
	}

	&.use-24 {
		grid-template-columns: repeat(2, 1fr);

		&.seconds {
			grid-template-columns: repeat(3, 1fr);
		}
	}
}

.month {
	grid-column: 1 / span 2;
}

.to-now {
	width: 100%;
	margin: 8px 0;
	color: var(--primary);
	text-align: center;
}

.v-icon.active {
	--v-icon-color: var(--primary);
}
</style>
