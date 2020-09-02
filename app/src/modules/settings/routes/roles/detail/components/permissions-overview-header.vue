<template>
	<div class="permissions-overview-header">
		<span class="name">{{ $t('collection') }}</span>
		<v-icon name="add" />
		<v-icon name="visibility" />
		<v-icon name="edit" outline />
		<v-icon name="delete" outline />
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
