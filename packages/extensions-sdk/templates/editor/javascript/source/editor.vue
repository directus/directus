<template>
	<div class="custom-editor">
		<textarea :value="value" @input="handleChange($event.target.value)" />
	</div>
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		return { handleChange };

		function handleChange(value) {
			emit('input', value);
		}
	},
};
</script>

<style scoped>
.custom-editor textarea {
	inline-size: 100%;
	min-block-size: 200px;
	font-family: monospace;
}
</style>
