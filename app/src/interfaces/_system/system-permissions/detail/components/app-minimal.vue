<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VNotice from '@/components/v-notice.vue';

defineProps<{
	value?: any;
}>();
</script>

<template>
	<div v-if="value" class="app-minimal">
		<VDivider />
		<VNotice type="warning">{{ $t('the_following_are_minimum_permissions') }}</VNotice>
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
