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
	padding: 6px 12px 6px 8px;
	border-radius: 6px;
	min-block-size: 40px;

	.icon {
		margin-inline-end: 12px;
		inline-size: 24px;
		block-size: 24px;
	}

	.content {
		flex: 1;
	}

	.title {
		color: var(--theme--foreground);
	}
}
</style>
