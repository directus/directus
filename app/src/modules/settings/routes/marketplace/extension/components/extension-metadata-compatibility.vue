<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { satisfies } from 'semver';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ExtensionMetadataItem from './extension-metadata-item.vue';

const props = defineProps<{
	hostVersion: string;
}>();

const serverStore = useServerStore();
const { t } = useI18n();

const isCompatible = computed(() => satisfies(serverStore.info.version!, props.hostVersion));
const icon = computed(() => (isCompatible.value ? 'check' : 'warning'));

const label = computed(() =>
	isCompatible.value ? t('compatible_with_your_project') : t('not_compatible_with_your_project'),
);
</script>

<template>
	<ExtensionMetadataItem :icon="icon" color="primary">{{ label }}</ExtensionMetadataItem>
</template>
