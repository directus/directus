<script setup>
defineProps({
	title: String,
	type: {
		type: String,
		default: 'info'	// warning | link | user-guide | dev-docs | api-ref | tutorials
	}
})
</script>

<template>
  <div>
	<p>{{ type }} <b>{{ title }}</b></p>
    <ContentSlot :use="$slots.default" />
  </div>
</template>

<style scoped>
div {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 1px 1rem;
	border-radius: 8px;
}
</style>
