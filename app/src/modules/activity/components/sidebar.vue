<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { usePreset } from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { t } = useI18n();
const { layout, layoutOptions } = usePreset(ref('directus_activity'));
const currentLayout = useExtension('layout', layout);
</script>

<template>
	<SidebarDetail icon="info" :title="t('information')" close>
		<div v-md="t('page_help_activity_collection')" class="page-description" />
	</SidebarDetail>
	<LayoutSidebarDetail v-model="layout">
		<component :is="currentLayout?.components?.options" v-model="layoutOptions" />
	</LayoutSidebarDetail>
</template>
