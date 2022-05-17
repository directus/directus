<template>
	<sidebar-detail :title="t('logs')" icon="fact_check" :badge="5"></sidebar-detail>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { FlowRaw } from '@directus/shared/types';

const { t } = useI18n();

interface Props {
	flow: FlowRaw;
}

defineProps<Props>();
</script>

<style lang="scss" scoped></style>
