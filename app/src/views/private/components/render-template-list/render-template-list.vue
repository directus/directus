<template>
	<div class="render-template-list">
		<template v-for="(item, index) in items" :key="index">
			<render-template :template="template" :item="item" :fields="fields" :collection="collection" />
			<span v-if="index < items.length - 1" class="separator">{{ separator }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		collection: {
			type: String,
			default: null,
		},
		fields: {
			type: Array as PropType<Field[]>,
			default: null,
		},
		items: {
			type: Array as PropType<Array<Record<string, any>>>,
			default: null,
		},
		template: {
			type: String,
			required: true,
		},
		separator: {
			type: String,
			required: false,
			default: ',',
		},
	},
});
</script>

<style lang="scss" scoped>
.render-template-list {
	display: flex;
	flex-wrap: wrap;

	> * {
		margin: 0;
		padding: 0;
	}
}

.separator {
	padding-right: 4px;
	padding-left: 4px;
}
</style>
