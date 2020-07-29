<template>
	<div class="permissions-management">
		<div
			class="loading"
			v-if="loading && permissions === null"
			:style="{
				'--rows': collectionKeys.normal.length,
			}"
		>
			<v-progress-circular indeterminate />
		</div>
		<template v-else>
			<permissions-header />

			<permissions-row
				v-for="key in collectionKeys.normal"
				:key="key"
				:collection="key"
				:role="role"
				:saved-permissions="getPermissionsForCollection(key)"
				:save-permission="savePermission"
				:save-all="saveAll"
			/>

			<div class="system" v-if="systemActive">
				<permissions-row
					v-for="key in collectionKeys.system"
					system
					:key="key"
					:collection="key"
					:role="role"
					:saved-permissions="getPermissionsForCollection(key)"
					:save-permission="savePermission"
					:save-all="saveAll"
				/>
			</div>

			<button @click="systemActive = !systemActive" class="system-toggle">
				{{ systemActive ? $t('hide_system_collections') : $t('show_system_collections') }}
			</button>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import { orderBy } from 'lodash';
import PermissionsRow from '../permissions-row';
import usePermissions from '../../composables/use-permissions';
import PermissionsHeader from '../permissions-header';

export default defineComponent({
	components: { PermissionsRow, PermissionsHeader },
	props: {
		role: {
			type: Number,
			required: true,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const { role } = toRefs(props);
		const collectionKeys = computed(() => {
			const keys = orderBy(
				collectionsStore.state.collections.map((collection) => collection.collection),
				['collection'],
				['asc']
			);

			return {
				normal: keys.filter((key) => key.startsWith('directus_') === false),
				system: keys.filter((key) => key.startsWith('directus_') === true),
			};
		});

		const systemActive = ref(false);

		const { loading, error, permissions, savePermission, saveAll } = usePermissions(role);

		return {
			collectionKeys,
			systemActive,
			loading,
			error,
			permissions,
			getPermissionsForCollection,
			savePermission,
			saveAll,
		};

		function getPermissionsForCollection(key: string) {
			return permissions.value?.filter((permission) => permission.collection === key);
		}
	},
});
</script>

<style lang="scss" scoped>
.permissions-management {
	--grid-template-columns: 2fr repeat(5, 24px) repeat(2, 1fr) 24px;
	--grid-gap: 0 8px;

	max-width: 800px; // same as fields setup
	border: 2px solid var(--border-normal);
	border-radius: var(--border-radius);
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	height: calc((var(--rows) * (40px + 2px)) + 38px);
}

.system {
	border-top: 2px solid var(--border-subdued);
}

.system-toggle {
	display: block;
	width: 100%;
	padding: 8px 0;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	border-bottom-right-radius: var(--border-radius);
	border-bottom-left-radius: var(--border-radius);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--foreground-normal);
	}
}
</style>
