<template>
	<private-view class="collections-overview">
		<template #navigation>
			<collections-navigation />
		</template>

		<v-table :headers="tableHeaders" :items="navItems" @click:row="navigateToCollection">
			<template #item.icon="{ item }">
				<v-icon class="icon" :name="item.icon" />
			</template>
		</v-table>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import CollectionsNavigation from '../components/collections-navigation.vue';
import { i18n } from '@/lang';
import useNavigation, { NavItem } from '../compositions/use-navigation';
import router from '@/router';

export default defineComponent({
	components: {
		CollectionsNavigation
	},
	props: {},
	setup() {
		const tableHeaders = [
			{
				text: '',
				value: 'icon',
				width: 42,
				sortable: false
			},
			{
				text: i18n.tc('collection', 1),
				value: 'name',
				width: 300
			},
			{
				text: i18n.t('note'),
				value: 'note'
			}
		];

		const { navItems } = useNavigation();

		return { tableHeaders, navItems, navigateToCollection };

		function navigateToCollection(navItem: NavItem) {
			router.push(navItem.to);
		}
	}
});
</script>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--foreground-color-secondary);
}
</style>
