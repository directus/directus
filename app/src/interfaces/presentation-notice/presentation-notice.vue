<template>
	<div class="presentation-notice">
		<v-notice :icon="icon" :type="color">
			<div v-md="text ?? t('interfaces.presentation-notice.no_text')" />
		</v-notice>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

withDefaults(
	defineProps<{
		color?: string;
		icon?: string;
		text?: string;
	}>(),
	{
		color: 'normal',
		icon: 'info',
	}
);
</script>

<style lang="scss" scoped>
:deep(a) {
	color: var(--primary);

	&:hover {
		color: var(--primary-125);
	}
}
</style>
