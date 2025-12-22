<template>
	<thead class="permissions-overview-header">
		<tr>
			<th>{{ $t('collection') }}</th>
			<th colspan="6">{{ $t('actions') }}</th>
		</tr>
	</thead>
</template>

<style lang="scss" scoped>
.permissions-overview-header {
	th {
		text-align: start;
		padding: 12px;
		font-weight: 600;
		background-color: var(--theme--form--field--input--background);
		border-start-start-radius: var(--theme--border-radius);
		border-start-end-radius: var(--theme--border-radius);
		border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}
</style>
