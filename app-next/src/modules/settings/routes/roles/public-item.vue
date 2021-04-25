<template>
	<private-view :title="$t('public')">
		<template #headline>{{ $t('settings_permissions') }}</template>
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
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import SettingsNavigation from '../../components/navigation.vue';
import PermissionsOverview from './item/components/permissions-overview.vue';

export default defineComponent({
	name: 'roles-item',
	components: { SettingsNavigation, PermissionsOverview },
	props: {
		permissionKey: {
			type: String,
			default: null,
		},
	},
});
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.roles {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
