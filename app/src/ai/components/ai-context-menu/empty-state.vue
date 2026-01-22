<script setup lang="ts">
defineProps<{
	message?: string;
}>();
</script>

<template>
	<v-list-item disabled>
		<v-list-item-content>
			<div class="no-results">
				<slot>{{ message }}</slot>
			</div>
		</v-list-item-content>
	</v-list-item>
</template>

<style scoped>
.no-results {
	text-align: center;
	color: var(--theme--foreground-subdued);
	padding: 12px;
}
</style>
