<script setup lang="ts">
import type { ExtensionInfo } from '@directus/extensions';
import { iconMap } from '../constants/icons';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineOptions({
	name: 'ExtensionItem',
});

interface ExtensionItem {
	name: ExtensionInfo['name'];
	type: ExtensionInfo['type'];
	entries?: ExtensionItem[];
}

const props = defineProps<ExtensionItem>();

const icon = computed(() => iconMap[props.type]);
</script>

<template>
	<v-list-item block>
		<v-list-item-icon v-tooltip="t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content class="monospace">{{ name }}</v-list-item-content>
	</v-list-item>

	<v-list v-if="entries" class="nested">
		<ExtensionItem v-for="item in entries" :key="name + '__' + item.name" :name="item.name" :type="item.type" />
	</v-list>
</template>

<style lang="scss" scoped>
.monospace {
	--v-list-item-content-font-family: var(--theme--font-family-monospace);
}

.nested {
	margin-left: 20px;
}
</style>
