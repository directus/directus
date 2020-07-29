<template>
	<div class="permissions-header">
		<div class="name">{{ $tc('collection', 2) }}</div>
		<v-icon name="add_circle" v-tooltip="$t('create')" />
		<v-icon name="visibility" v-tooltip="$t('read')" />
		<v-icon name="edit" v-tooltip="$t('update')" />
		<v-icon name="delete" v-tooltip="$t('delete')" />
		<v-icon name="comment" v-tooltip="$t('comment')" />
		<div class="name fields">{{ $tc('field', 2) }}</div>
		<div class="name">{{ $t('statuses') }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style lang="scss" scoped>
.permissions-header {
	display: grid;
	grid-gap: var(--grid-gap);
	grid-template-columns: var(--grid-template-columns);
	align-items: center;
	padding: 8px 12px;

	.v-icon {
		--v-icon-color: var(--foreground-subdued);
	}

	.fields {
		margin-left: 40px;
	}

	.name {
		font-weight: 600;
	}
}
</style>
