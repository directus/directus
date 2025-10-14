<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import TriggerFlow from './trigger-flow.vue';

const { t } = useI18n();
</script>

<template>
	<sidebar-detail icon="bolt" :title="t('flows')">
		<trigger-flow />
	</sidebar-detail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/colors';
</style>
