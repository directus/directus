<script setup lang="ts">
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
</script>

<template>
	<SidebarDetail icon="info" :title="$t('information')" close>
		<div v-md="$t('page_help_marketplace_extension')" />
	</SidebarDetail>
</template>
