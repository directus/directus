<template>
	<private-view :title="$t('settings_permissions')">
		<template #navigation>
			<settings-navigation />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import SettingsNavigation from '../../components/navigation/';

export default defineComponent({
	components: { SettingsNavigation },
});
</script>
