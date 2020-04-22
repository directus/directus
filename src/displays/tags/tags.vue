<template>
	<div class="display-tags">
		<v-chip v-for="val in value" :key="val" small label>
			{{ val }}
		</v-chip>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
});
</script>

<style lang="scss" scoped>
.display-tags {
	display: inline-block;
}

.v-chip + .v-chip {
	margin-left: 4px;
}
</style>
