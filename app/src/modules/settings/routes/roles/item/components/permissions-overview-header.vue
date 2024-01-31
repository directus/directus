<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

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

<style lang="scss" scoped>
.permissions-overview-header {
	--v-icon-color: var(--theme--foreground-subdued);

	position: sticky;
	top: calc(var(--header-bar-height) - 1px); // minus 1px to avoid gaps
	z-index: 4;
	display: flex;
	padding: 12px;
	background-color: var(--theme--form--field--input--background);
	border-bottom: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-top-left-radius: var(--theme--border-radius);
	border-top-right-radius: var(--theme--border-radius);

	.name {
		flex-grow: 1;
		font-weight: 600;
	}

	.v-icon + .v-icon {
		margin-left: 20px;
	}
}
</style>
