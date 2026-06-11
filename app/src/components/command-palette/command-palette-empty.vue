<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	show?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
	<div v-if="show" class="empty-item">
		<span class="icon">
			<VIcon name="search" />
		</span>
		<div class="content">
			<div class="title">
				<slot>{{ t('no_results') }}</slot>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.empty-item {
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	padding: 0.375rem 0.75rem 0.375rem 0.5rem;
	border-radius: 0.375rem;
	min-block-size: 2.5rem;

	.icon {
		margin-inline-end: 0.75rem;
		inline-size: 1.5rem;
		block-size: 1.5rem;
	}

	.content {
		flex: 1;
	}

	.title {
		color: var(--theme--foreground);
	}
}
</style>
