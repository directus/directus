<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
	limitWarning?: boolean;
}

withDefaults(defineProps<Props>(), {
	limitWarning: false,
});

const { t } = useI18n();
</script>

<template>
	<v-button v-if="limitWarning" rounded icon>
		<v-icon v-tooltip.bottom.start="t('layouts.kanban.not_all_loaded')" name="warning" />
	</v-button>
</template>

<style lang="scss" scoped>
.v-button :deep(.button) {
	background-color: var(--warning-10);
	border: none;
	color: var(--theme--warning);
	margin-right: 8px;
}
</style>
