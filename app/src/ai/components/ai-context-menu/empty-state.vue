<script setup lang="ts">
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';

defineProps<{
	message?: string;
}>();
</script>

<template>
	<VListItem disabled>
		<VListItemContent>
			<div class="no-results">
				<slot>{{ message }}</slot>
			</div>
		</VListItemContent>
	</VListItem>
</template>

<style scoped>
.no-results {
	text-align: center;
	color: var(--theme--foreground-subdued);
	padding: 12px;
}
</style>
