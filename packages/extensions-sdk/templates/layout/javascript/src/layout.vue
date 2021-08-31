<template>
	<div>
		<p>Name: {{ name }}</p>
		<p>Collection: {{ collection }}</p>
	</div>
</template>

<script>
export default {
	props: {
		collection: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
	},
};
</script>
