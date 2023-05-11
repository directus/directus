<template>
	<private-view :title="t('public_label')">
		<template #headline>{{ t('settings_permissions') }}</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/roles/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="roles">
			<permissions-overview :role="null" :permission="permissionKey" />
		</div>

		<template #sidebar>
			<role-info-sidebar-detail :role="null" />
		</template>
	</private-view>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import PermissionsOverview from './item/components/permissions-overview.vue';
import RoleInfoSidebarDetail from './item/components/role-info-sidebar-detail.vue';

defineProps<{
	permissionKey?: string;
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}

.roles {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
