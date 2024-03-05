<script setup lang="ts">
import MetadataItem from '../../../components/metadata-item.vue';
import { useI18n } from 'vue-i18n';

defineProps<{ license: string | null }>();

const { t } = useI18n();
</script>

<template>
	<MetadataItem icon="policy" :title="t('license')" :class="{ known: !!license }">
		{{ license ?? t('unknown') }}
	</MetadataItem>
</template>

<style scoped>
.known {
	text-transform: uppercase;
}
</style>
