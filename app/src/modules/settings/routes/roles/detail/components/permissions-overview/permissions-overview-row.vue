<template>
	<div class="permissions-overview-row">
		<span class="name">
			{{ collection.name }}
		</span>

		<permissions-overview-toggle :collection="collection" :role="role" action="create" />
		<permissions-overview-toggle :collection="collection" :role="role" action="read" />
		<permissions-overview-toggle :collection="collection" :role="role" action="update" />
		<permissions-overview-toggle :collection="collection" :role="role" action="delete" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Collection } from '@/types';
import PermissionsOverviewToggle from './permissions-overview-toggle.vue';

export default defineComponent({
	components: { PermissionsOverviewToggle },
	props: {
		role: {
			type: String,
			required: true,
		},
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview-row {
	display: flex;
	padding: 12px;
	background-color: var(--background-page);

	.name {
		flex-grow: 1;
	}

	.permissions-overview-toggle + .permissions-overview-toggle {
		margin-left: 20px;
	}

	& + .permissions-overview-row {
		border-top: var(--border-width) solid var(--border-subdued);
	}
}
</style>
