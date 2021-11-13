<template>
	<value-null v-if="!relatedCollection.info.value?.collection" />
	<v-menu v-else show-arrow :disabled="value.length === 0">
		<template #activator="{ toggle }">
			<render-template
				v-if="!displayItem.length"
				:template="internalTemplate"
				:item="displayItem"
				:collection="relatedCollection.info.value?.collection"
				@click.stop="toggle"
			/>
			<render-template-list
				v-else
				:template="internalTemplate"
				:items="displayItem"
				:collection="relatedCollection.info.value?.collection"
				@click.stop="toggle"
			/>
		</template>

		<v-list class="links">
			<v-list-item v-for="item in translations" :key="item.id">
				<v-list-item-content>
					<div class="header">
						<div class="lang">
							<v-icon name="translate" small />
							{{ item.lang }}
						</div>
						<v-progress-linear v-tooltip="`${item.progress}%`" :value="item.progress" colorful />
					</div>
					<render-template
						v-if="!item.item.length"
						:template="internalTemplate"
						:item="item.item"
						:collection="relatedCollection.info.value?.collection"
					/>
					<render-template-list
						v-else
						:template="internalTemplate"
						:items="item.item"
						:collection="relatedCollection.info.value?.collection"
					/>
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from 'vue';
import { useCollection } from '@directus/shared/composables';
import { useUserStore } from '@/stores';
import getRelatedCollection from '@/utils/get-related-collection';
import useTranslationsValue from '@/composables/use-translations-value';
import ValueNull from '@/views/private/components/value-null';
import RenderTemplateList from '@/views/private/components/render-template-list';

export default defineComponent({
	components: { ValueNull, RenderTemplateList },
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
			type: [Array, Object] as PropType<Record<string, any>[] | Record<string, any>>,
			default: null,
		},
		template: {
			type: String,
			default: null,
		},
		userLanguage: {
			type: Boolean,
			default: false,
		},
		defaultLanguage: {
			type: String,
			default: null,
		},
		languageField: {
			type: String,
			default: null,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const defaultLang = props.userLanguage
			? useUserStore().currentUser?.language ?? 'en'
			: props.defaultLanguage || 'en';
		const relatedCollection = useCollection(getRelatedCollection(props.collection, props.field));
		const primaryKeyField = ref(relatedCollection?.primaryKeyField);

		const translations = useTranslationsValue(
			props.value,
			props.field,
			props.collection,
			props.languageField,
			props.defaultLanguage,
			defaultLang
		);
		const internalTemplate = computed(() => {
			return (
				props.template ||
				relatedCollection.info.value?.meta?.display_template ||
				`{{ ${primaryKeyField.value!.field} }}`
			);
		});
		const displayItem = computed(() => {
			let item = translations.value.find((val) => val.lang === defaultLang);
			if (props.userLanguage && !item) {
				// fix match lang between (eg: 'en' - 'en-US')
				item = translations.value.find((val) => val.lang.startsWith(defaultLang) || defaultLang.startsWith(val.lang));
			}
			return item?.item ?? translations.value[0].item ?? {};
		});
		return { internalTemplate, relatedCollection, displayItem, translations };
	},
});
</script>

<style lang="scss" scoped>
.v-list {
	width: 300px;
}

.header {
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: space-between;
	color: var(--foreground-subdued);
	font-size: 12px;

	.lang {
		font-weight: 600;
	}

	.v-icon {
		margin-right: 4px;
	}

	.v-progress-linear {
		flex: 1;
		width: unset;
		max-width: 100px;
		border-radius: 4px;
	}
}

.v-list-item-content {
	padding-top: 4px;
	padding-bottom: 2px;
}

.v-list-item:not(:first-child) {
	.header {
		padding-top: 8px;
		border-top: var(--border-width) solid var(--border-subdued);
	}
}
</style>
