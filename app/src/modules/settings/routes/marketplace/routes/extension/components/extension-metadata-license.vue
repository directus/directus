<script setup lang="ts">
import MetadataItem from '../../../components/metadata-item.vue';

defineProps<{ license: string | null }>();
</script>

<template>
	<MetadataItem icon="policy" :class="{ known: !!license }">
		{{ license ?? $t('unknown') }}
	</MetadataItem>
</template>

<style scoped>
.known {
	text-transform: uppercase;
}
</style>
