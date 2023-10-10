<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
	<sidebar-detail icon="info" :title="t('information')" close>
		<div v-md="t('page_help_settings_extensions')" class="page-description" />
	</sidebar-detail>
</template>
