<template>
	<v-divider
		:class="{ 'add-margin-top': marginTop }"
		:style="{
			'--v-divider-label-color': color,
			'--v-divider-color': 'var(--border-subdued)',
		}"
		large
		:inline-title="inlineTitle"
	>
		<template v-if="icon" #icon><v-icon :name="icon" /></template>
		<template v-if="title" #default>{{ title }}</template>
	</v-divider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
		inlineTitle: {
			type: Boolean,
			default: false,
		},
		marginTop: {
			type: Boolean,
			default: true,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin-top: 10px;
	margin-bottom: -10px;
}

.add-margin-top {
	margin-top: 40px;
}
</style>
