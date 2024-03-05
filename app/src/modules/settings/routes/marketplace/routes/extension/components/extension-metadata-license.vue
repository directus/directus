<script setup lang="ts">
import MetadataItem from '../../../components/metadata-item.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{ license: string | null }>();
</script>

<template>
	<MetadataItem icon="policy" :class="{ known: !!license }">
		{{ license ?? t('unknown') }}
	</MetadataItem>
</template>

<style scoped>
.known {
	text-transform: uppercase;
}
</style>
