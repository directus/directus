<template>
	<private-view class="collections-overview" :title="$tc('collection', 2)">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="box" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<v-table
			v-if="navItems.length > 0"
			:headers="tableHeaders"
			:items="navItems"
			@click:row="navigateToCollection"
		>
			<template #item.icon="{ item }">
				<v-icon class="icon" :name="item.icon" />
			</template>
		</v-table>

		<v-info icon="box" :title="$t('no_collections')" v-else center>
			<template v-if="isAdmin">
				{{ $t('no_collections_copy_admin') }}
			</template>
			<template #append v-if="isAdmin">
				<v-button :to="dataModelLink">{{ $t('create_collection') }}</v-button>
			</template>
			<template v-else>
				{{ $t('no_collections_copy') }}
			</template>
		</v-info>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import CollectionsNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import useNavigation, { NavItem } from '../../composables/use-navigation';
import router from '@/router';
import useUserStore from '@/stores/user';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	name: 'collections-overview',
	components: {
		CollectionsNavigation,
	},
	props: {},
	setup() {
		const userStore = useUserStore();
		const projectsStore = useProjectsStore();

		const tableHeaders = [
			{
				text: '',
				value: 'icon',
				width: 42,
				sortable: false,
			},
			{
				text: i18n.tc('collection', 1),
				value: 'name',
				width: 300,
			},
			{
				text: i18n.t('note'),
				value: 'note',
			},
		];

		const { navItems } = useNavigation();

		const isAdmin = computed(() => userStore.state.currentUser?.role.id === 1);

		const dataModelLink = computed(() => {
			return `/${projectsStore.state.currentProjectKey}/settings/data-model`;
		});

		return { tableHeaders, navItems, navigateToCollection, isAdmin, dataModelLink };

		function navigateToCollection(navItem: NavItem) {
			router.push(navItem.to);
		}
	},
});
</script>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--foreground-subdued);

	::v-deep i {
		vertical-align: unset;
	}
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
