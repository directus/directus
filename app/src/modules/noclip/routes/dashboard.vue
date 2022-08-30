<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #navigation>
			<navigation />
		</template>

		<div class="info">
			<div>{{ t('dx.loaded_interfaces') }}: {{ interfaceCount }}</div>
			<div>{{ t('dx.loaded_displays') }}: {{ displayCount }}</div>
			<div>{{ t('dx.loaded_panels') }}: {{ panelCount }}</div>
		</div>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInterfaces } from '@/interfaces';
import { getPanels } from '@/panels';
import { getDisplays } from '@/displays';

const { t } = useI18n();

const title = computed(() => {
	return t('dashboard');
});

const interfaceCount = computed(() => getInterfaces().interfaces.value.length);
const displayCount = computed(() => getDisplays().displays.value.length);
const panelCount = computed(() => getPanels().panels.value.length);
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.info {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	font-size: 20px;
	font-weight: 600;

	div {
		margin-bottom: 10px;
	}
}
</style>
