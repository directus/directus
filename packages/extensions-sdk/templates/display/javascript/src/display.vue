<template>
	<div>Value: {{ value }}</div>
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			required: true,
		},
	},
};
</script>
