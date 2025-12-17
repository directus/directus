<script setup lang="ts">
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
</script>

<template>
	<sidebar-detail icon="info" :title="$t('information')" close>
		<div v-md="$t('page_help_marketplace_extension')" />
	</sidebar-detail>
</template>
