<template>
	<div class="permissions-overview-header">
		<span class="name">{{ t('collection') }}</span>
		<v-icon v-tooltip="t('create')" name="add" />
		<v-icon v-tooltip="t('read')" name="visibility" />
		<v-icon v-tooltip="t('update')" name="edit" />
		<v-icon v-tooltip="t('delete_label')" name="delete" />
		<v-icon v-tooltip="t('share')" name="share" />
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.permissions-overview-header {
	--v-icon-color: var(--foreground-subdued);

	position: sticky;
	top: calc(var(--header-bar-height) - 1px); // minus 1px to avoid gaps
	z-index: 4;
	display: flex;
	padding: 12px;
	background-color: var(--background-input);
	border-bottom: var(--border-width) solid var(--border-normal);

	.name {
		flex-grow: 1;
		font-weight: 600;
	}

	.v-icon + .v-icon {
		margin-left: 20px;
	}
}
</style>
