<script setup lang="ts">
import type { ApiOutput } from '@directus/extensions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { iconMap } from '../constants/icons';

const { t } = useI18n();

defineOptions({
	name: 'ExtensionItem',
});

interface ExtensionItem {
	extension: ApiOutput;
	children: ApiOutput[];
}

const props = defineProps<ExtensionItem>();

const type = computed(() => props.extension.schema?.type);

const icon = computed(() => (type.value ? iconMap[type.value] : 'warning'));
</script>

<template>
	<v-list-item block>
		<v-list-item-icon v-tooltip="t(`extension_${type}`)"><v-icon :name="icon" small /></v-list-item-icon>
		<v-list-item-content class="monospace">{{ extension.name }}</v-list-item-content>
	</v-list-item>

	<v-list v-if="children" class="nested">
		<extension-item v-for="item in children" :key="item.bundle + '__' + item.name" :extension="item" :children="[]" />
	</v-list>
</template>

<style lang="scss" scoped>
.monospace {
	--v-list-item-content-font-family: var(--family-monospace);
}

.nested {
	margin-left: 20px;
}
</style>
