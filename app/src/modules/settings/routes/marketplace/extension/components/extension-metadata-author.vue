<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';

const { t } = useI18n();

defineProps<{ username: string; verified: boolean }>();
</script>

<template>
	<ExtensionMetadataMetric icon="face">
		<span>
			{{ username }}
			<v-icon v-if="verified" v-tooltip="t('verified')" name="verified" small />
		</span>
	</ExtensionMetadataMetric>
</template>
