<script setup lang="ts">
defineProps<{
	value?: any;
}>();
</script>

<template>
	<div v-if="value" class="app-minimal">
		<v-divider />
		<v-notice type="warning">{{ $t('the_following_are_minimum_permissions') }}</v-notice>
		<pre class="app-minimal-preview">{{ value }}</pre>
	</div>
</template>

<style lang="scss" scoped>
.app-minimal {
	.v-divider {
		margin: 24px 0;
	}

	.v-notice {
		margin-block-end: 24px;
	}

	.app-minimal-preview {
		padding: 16px;
		font-family: var(--theme--fonts--monospace--font-family);
		background-color: var(--theme--background-subdued);
		border-radius: var(--theme--border-radius);
	}
}
</style>
