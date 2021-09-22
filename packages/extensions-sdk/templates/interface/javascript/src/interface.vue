<template>
	<input :value="value" @input="handleChange($event.target.value)" />
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			required: true,
		},
	},
	emits: ['input'],
	methods: {
		handleChange(value) {
			this.$emit('input', value);
		},
	},
};
</script>
