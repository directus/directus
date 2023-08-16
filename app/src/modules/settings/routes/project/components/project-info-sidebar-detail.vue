<template>
	<sidebar-detail icon="info" :title="t('information')" close>
		<div v-md="t('page_help_settings_project')" class="page-description" />
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
