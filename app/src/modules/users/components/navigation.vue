<script setup lang="ts">
import NavigationRole from './NavigationRole.vue';
import useNavigation from '../composables/use-navigation';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VItemGroup from '@/components/v-item-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { toRefs } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
	currentRole?: string;
}>();

const { currentRole } = toRefs(props);

const router = useRouter();

const { roles, roleTree, openRoles, loading } = useNavigation(currentRole);

function handleClick({ role }: { role: string }) {
	router.push(`/users/roles/${role}`);
}
</script>

<template>
	<VList nav>
		<VListItem to="/users" exact :active="!currentRole">
			<VListItemIcon><VIcon name="folder_shared" /></VListItemIcon>
			<VListItemContent>{{ $t('all_users') }}</VListItemContent>
		</VListItem>

		<VDivider v-if="(roles && roles.length > 0) || loading" />

		<template v-if="loading">
			<VListItem v-for="n in 4" :key="n">
				<VSkeletonLoader type="list-item-icon" />
			</VListItem>
		</template>

		<VItemGroup v-model="openRoles" scope="role-navigation" multiple>
			<NavigationRole
				v-for="role in roleTree"
				:key="role.id"
				:role="role"
				:current-role="currentRole"
				@click="handleClick"
			/>
		</VItemGroup>
	</VList>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--theme--background-accent);
}

.v-divider {
	--v-divider-color: var(--theme--background-accent);
}
</style>
