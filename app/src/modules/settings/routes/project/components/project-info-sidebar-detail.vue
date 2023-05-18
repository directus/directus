<template>
	<sidebar-detail icon="info" :title="t('information')" close>
		<dl v-if="parsedInfo">
			<div>
				<dt>{{ t('directus_version') }}</dt>
				<dd>{{ parsedInfo.directus.version }}</dd>
			</div>
		</dl>

		<v-divider />

		<div v-md="t('page_help_settings_project')" class="page-description" />
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useProjectInfo } from '../../../composables/use-project-info';

const { t } = useI18n();

const { parsedInfo } = useProjectInfo();
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
