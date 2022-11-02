<template>
	<div class="many-to-one">
		<v-skeleton-loader v-if="loading" type="input" />
		<v-input v-else clickable :placeholder="t('select_an_item')" @click="$emit('select')">
			<template v-if="displayItem" #input>
				<div class="preview">
					<render-template :collection="collection" :item="displayItem" :template="displayTemplate" />
				</div>
			</template>

			<template #append>
				<template v-if="displayItem">
					<v-icon v-tooltip="t('deselect')" name="close" class="deselect" @click.stop="$emit('input', undefined)" />
				</template>
				<template v-else>
					<v-icon class="expand" name="expand_more" />
				</template>
			</template>
		</v-input>
	</div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useDisplayItems from './use-display-items';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {});
/*const emit = */ defineEmits(['input', 'select']);

const { t } = useI18n();
const { collection, template, value } = toRefs(props);

const { displayItems, displayTemplate, loading } = useDisplayItems(collection, template, value);
const displayItem = computed(() => (displayItems.value.length > 0 ? displayItems.value[0] : null));
</script>

<style lang="scss" scoped>
.preview {
	flex-grow: 1;
}
</style>
