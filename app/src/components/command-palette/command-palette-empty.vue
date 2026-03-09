<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
	show?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
	<div v-if="show" class="empty-item">
		<span class="icon">
			<v-icon name="search" />
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
	min-height: 40px;

	.icon {
		margin-right: 12px;
		width: 24px;
		height: 24px;
	}

	.content {
		flex: 1;
	}

	.title {
		color: var(--theme--foreground);
	}
}
</style>
