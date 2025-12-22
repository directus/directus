<script setup lang="ts">
import VNotice from '@/components/v-notice.vue';

defineProps<{
	readme: string | null;
}>();
</script>

<template>
	<VNotice v-if="!readme" class="notice">{{ $t('extension_readme_missing') }}</VNotice>
	<div v-else v-md="{ value: readme, target: '_blank' }" class="readme" />
</template>

<style scoped lang="scss">
@use '@/styles/mixins';

.readme {
	:deep() {
		@include mixins.markdown;
	}

	:deep(* + *) {
		margin-block-start: 1rem;
	}

	:deep(img) {
		border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}

.notice {
	align-self: flex-start;
	margin-block-start: 4px;
}
</style>
