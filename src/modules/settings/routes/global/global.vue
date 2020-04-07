<template>
	<private-view :title="$t('settings_global')">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon name="public" />
			</v-button>
		</template>

		<template #actions>
			<v-button icon rounded :disabled="noEdits" :loading="saving" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="settings">
			<v-form :initial-values="initialValues" v-model="edits" :fields="fields" />
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import SettingsNavigation from '../../components/navigation/';
import useCollection from '@/compositions/use-collection';
import useSettingsStore from '@/stores/settings';

export default defineComponent({
	components: { SettingsNavigation },
	setup() {
		const settingsStore = useSettingsStore();
		const { fields } = useCollection(ref('directus_settings'));

		const initialValues = settingsStore.formatted;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const edits = ref<{ [key: string]: any }>(null);

		const noEdits = computed<boolean>(
			() => edits.value === null || Object.keys(edits.value).length === 0
		);

		const saving = ref(false);

		return { fields, initialValues, edits, noEdits, saving, save };

		async function save() {
			if (edits.value === null) return;
			saving.value = true;
			await settingsStore.updateSettings(edits.value);
			edits.value = null;
			saving.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
.settings {
	padding: var(--content-padding);
}
</style>
