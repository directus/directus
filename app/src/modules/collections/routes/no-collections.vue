<template>
	<private-view class="collections-overview" :title="t('collections')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="box" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<v-info icon="box" :title="t('no_collections')" center>
			<template v-if="isAdmin">
				{{ t('no_collections_copy_admin') }}
			</template>

			<template v-else>
				{{ t('no_collections_copy') }}
			</template>

			<template v-if="isAdmin" #append>
				<v-button to="/settings/data-model/+">{{ t('create_collection') }}</v-button>
			</template>
		</v-info>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_collections_overview')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import CollectionsNavigation from '../components/navigation.vue';
import { useUserStore } from '@/stores';

export default defineComponent({
	name: 'CollectionsOverview',
	components: {
		CollectionsNavigation,
	},
	props: {},
	setup() {
		const { t } = useI18n();

		const userStore = useUserStore();

		const isAdmin = computed(() => userStore.currentUser?.role.admin_access === true);

		return { t, isAdmin };
	},
});
</script>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--foreground-subdued);

	:deep(i) {
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
