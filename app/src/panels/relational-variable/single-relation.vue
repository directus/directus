<script setup lang="ts">
import useDisplayItems from './use-display-items';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VRemove from '@/components/v-remove.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';
import { computed, toRefs } from 'vue';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {});
/*const emit = */ defineEmits(['input', 'select']);

const { collection, template, value } = toRefs(props);

const { displayItems, displayTemplate, loading } = useDisplayItems(collection, template, value);
const displayItem = computed(() => (displayItems.value.length > 0 ? displayItems.value[0] : null));
</script>

<template>
	<div class="many-to-one">
		<VSkeletonLoader v-if="loading" type="input" />
		<VInput v-else clickable :placeholder="$t('select_an_item')" @click="$emit('select')">
			<template v-if="displayItem" #input>
				<div class="preview">
					<RenderTemplate :collection="collection" :item="displayItem" :template="displayTemplate" />
				</div>
			</template>

			<template #append>
				<div class="item-actions">
					<VRemove v-if="displayItem" deselect @action="$emit('input', undefined)" />

					<VIcon v-else name="expand_more" />
				</div>
			</template>
		</VInput>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.preview {
	flex-grow: 1;
}

.item-actions {
	@include mixins.list-interface-item-actions;
}
</style>
