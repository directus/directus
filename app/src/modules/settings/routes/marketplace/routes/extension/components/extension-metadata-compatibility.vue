<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { satisfies } from 'semver';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

const props = defineProps<{
	hostVersion: string;
}>();

const serverStore = useServerStore();
const { t } = useI18n();

const isCompatible = computed(() => satisfies(serverStore.info.version!, props.hostVersion));
const icon = computed(() => (isCompatible.value ? 'check' : 'warning'));

const label = computed(() =>
	isCompatible.value ? t('compatible_with_your_project') : t('compatibility_not_guaranteed'),
);
</script>

<template>
	<MetadataItem
		v-tooltip="
			isCompatible
				? $t('compatible_with_your_project_copy', {
						currentVersion: serverStore.info.version!,
						hostVersion: hostVersion,
					})
				: $t('compatibility_not_guaranteed_copy', {
						currentVersion: serverStore.info.version!,
						hostVersion: hostVersion,
					})
		"
		:icon="icon"
		:color="isCompatible ? 'subdued' : 'warning'"
		has-tooltip
	>
		{{ label }}
	</MetadataItem>
</template>
