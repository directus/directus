<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ExtensionMetadataItem from './extension-metadata-item.vue';

const { t } = useI18n();

defineProps<{ id: string; username: string; verified: boolean }>();
</script>

<template>
	<ExtensionMetadataItem icon="face" :to="`/marketplace/author/${id}`">
		<span>
			{{ username }}
			<v-icon v-if="verified" v-tooltip="t('verified')" name="verified" small />
		</span>
	</ExtensionMetadataItem>
</template>
