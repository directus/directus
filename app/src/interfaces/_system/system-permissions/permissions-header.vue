<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
	<thead class="permissions-overview-header">
		<tr>
			<th>{{ t('collection') }}</th>
			<th colspan="6">{{ t('actions') }}</th>
		</tr>
	</thead>
</template>

<style lang="scss" scoped>
.permissions-overview-header {
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
		border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}
</style>
