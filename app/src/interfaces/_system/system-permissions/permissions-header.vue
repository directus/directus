<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
	<thead class="permissions-overview-header">
		<tr class="labels">
			<th class="name">{{ t('collection') }}</th>
			<th>
				{{ t('actions') }}
			</th>
		</tr>
		<tr>
			<th></th>
			<th class="actions">
				<v-icon v-tooltip="t('create')" name="add" />
				<v-icon v-tooltip="t('read')" name="visibility" />
				<v-icon v-tooltip="t('update')" name="edit" />
				<v-icon v-tooltip="t('delete_label')" name="delete" />
				<v-icon v-tooltip="t('share')" name="share" />
			</th>
		</tr>
	</thead>
</template>

<style lang="scss" scoped>
.permissions-overview-header {
	--v-icon-color: var(--theme--foreground-subdued);

	tr:last-child {
		z-index: 4;
		position: sticky;
		top: calc(var(--header-bar-height) - 2px); // minus 1px to avoid gaps
	}

	th {
		text-align: start;
		padding: 12px;
		font-weight: 600;
		background-color: var(--theme--form--field--input--background);
		border-top-left-radius: var(--theme--border-radius);
		border-top-right-radius: var(--theme--border-radius);
		border-bottom: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	}

	th:first-child {
		width: 100%;
	}

	.labels th {
		border-bottom: none;
	}

	.actions {
		display: flex;
		flex-wrap: nowrap;

		.v-icon + .v-icon {
			margin-left: 20px;
		}
	}
}
</style>
