<script setup lang="ts">
import { Permission, PrimaryKey } from '@directus/types';
import { useI18n } from 'vue-i18n';

defineProps<{
	permission: Permission;
	policyKey: PrimaryKey | null;
}>();

const emit = defineEmits<{
	save: [];
}>();

const { t } = useI18n();
</script>

<template>
	<div class="actions">
		<v-button v-tooltip.bottom="t('save')" icon rounded @click="emit('save')">
			<v-icon name="check" />
		</v-button>
	</div>
</template>

<style lang="scss" scoped>
.actions {
	display: contents;
}

.v-button:not(:last-child) {
	margin-right: 8px;
}
</style>
