<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ContentNavigation from '../components/navigation.vue';

const { t } = useI18n();

const userStore = useUserStore();

const isAdmin = computed(() => userStore.currentUser?.role.admin_access === true);
</script>

<template>
	<private-view class="content-overview" :title="t('content')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="box" />
			</v-button>
		</template>

		<template #navigation>
			<content-navigation />
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
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_collections_overview')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--theme--foreground-subdued);

	:deep(i) {
		vertical-align: unset;
	}
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}

.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
