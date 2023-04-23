<template>
	<div>
		<v-notice type="info">
			{{ revision.activity.action === 'create' ? t('revision_post_create') : t('revision_post_update') }}
			<br />
			{{ t('no_relational_data') }}
		</v-notice>

		<v-form disabled :collection="revision.collection" :primary-key="revision.item" :initial-values="revision.data" />
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Revision } from '@/types/revisions';

defineProps<{
	revision: Revision;
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
