<template>
	<div class="permissions-overview-header">
		<span class="name">{{ $t('collection') }}</span>
		<v-icon name="add" v-tooltip="$t('create')" />
		<v-icon name="visibility" v-tooltip="$t('read')" />
		<v-icon name="edit" outline v-tooltip="$t('update')" />
		<v-icon name="delete" outline v-tooltip="$t('delete')" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style lang="scss" scoped>
.permissions-overview-header {
	--v-icon-color: var(--foreground-subdued);

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
