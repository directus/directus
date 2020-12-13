<template>
	<value-null v-if="!relatedCollection" />
	<render-template v-else :template="template" :item="matchingTranslation" :collection="relatedCollection" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType, Ref } from '@vue/composition-api';
import getRelatedCollection from '@/utils/get-related-collection';
import useCollection from '@/composables/use-collection';
import ValueNull from '@/views/private/components/value-null';
import useLanguagesCodeField from './use-languages-code-field';
import { i18n } from '@/lang';

export default defineComponent({
	components: { ValueNull },
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		value: {
			type: [Array, Object] as PropType<any | any[]>,
			default: null,
		},
		template: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const relatedCollection = computed(() => {
			return getRelatedCollection(props.collection, props.field);
		});

		const languagesCodeField = useLanguagesCodeField(props.collection, props.field);

		const matchingTranslation = computed(() => {
			if (languagesCodeField.value && props.value && props.value.length) {
				return (
					props.value.find((translation: any) => translation[languagesCodeField.value] === i18n.locale) ||
					props.value[0] ||
					null
				);
			}
			return null;
		});

		return { relatedCollection, matchingTranslation };
	},
});
</script>
