<template>
	<span class="definition-type" :class="{ alert }"><slot /></span>
</template>

<script>
	export default {
		props: {
			alert: {
				type: Boolean,
				default: false
			}
		}
	}
</script>

<style scoped>
.definition-type {
	color: #aaa;
	font-size: 0.75rem;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.definition-type.alert {
	color: #ff9800;
	text-transform: uppercase;
}
</style>