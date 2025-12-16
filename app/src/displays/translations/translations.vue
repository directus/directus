<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { useFieldsStore } from '@/stores/fields';
import { useUserStore } from '@/stores/user';
import RenderTemplate from '@/views/private/components/render-template.vue';
import ValueNull from '@/views/private/components/value-null.vue';
import { isNil } from 'lodash';
import { computed, toRefs } from 'vue';

interface Props {
	collection: string;
	field: string;
	type: string;
	value?: Record<string, any>[];
	template?: string;
	userLanguage?: boolean;
	defaultLanguage?: string;
	languageField?: string;
}

const props = withDefaults(defineProps<Props>(), {
	value: () => [],
	template: undefined,
	userLanguage: false,
	defaultLanguage: undefined,
	languageField: undefined,
});

const { collection, field } = toRefs(props);
const fieldsStore = useFieldsStore();
const userStore = useUserStore();

const { relationInfo } = useRelationM2M(collection, field);

const internalTemplate = computed(() => {
	if (!relationInfo.value) return '';

	const primaryKeyField = relationInfo.value.junctionPrimaryKeyField.field;
	const collectionDisplayTemplate = relationInfo.value.junctionCollection?.meta?.display_template;

	return props.template || collectionDisplayTemplate || `{{ ${primaryKeyField} }}`;
});

const displayItem = computed(() => {
	if (!relationInfo.value) return {};

	const langPkField = relationInfo.value.relatedPrimaryKeyField.field;
	const langField = relationInfo.value.junctionField.field;

	let item = props.value.find((val) => val?.[langField]?.[langPkField] === props.defaultLanguage) ?? props.value[0];

	if (props.userLanguage) {
		const lang = userStore.language;
		item = props.value.find((val) => val?.[langField]?.[langPkField] === lang) ?? item;
	}

	return item ?? {};
});

const writableFields = computed(() => {
	if (!relationInfo.value) return [];

	const junctionFields = fieldsStore.getFieldsForCollection(relationInfo.value.junctionCollection.collection);

	return junctionFields.filter(
		(field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false,
	);
});

const translations = computed(() => {
	if (!relationInfo.value) return [];

	const primaryKeyField = relationInfo.value.junctionPrimaryKeyField.field;
	const langPkField = relationInfo.value.relatedPrimaryKeyField.field;
	const langField = relationInfo.value.junctionField.field;

	return props.value.map((item) => {
		const filledFields = writableFields.value.filter((field) => {
			return field.field in item && !isNil(item?.[field.field]);
		}).length;

		return {
			id: item?.[primaryKeyField ?? 'id'],
			lang: item?.[langField]?.[props.languageField ?? langPkField],
			progress: Math.round((filledFields / writableFields.value.length) * 100),
			item,
		};
	});
});
</script>

<template>
	<value-null v-if="!relationInfo?.junctionCollection?.collection" />
	<div v-else class="display-translations">
		<render-template
			:template="internalTemplate"
			:item="displayItem"
			:collection="relationInfo.junctionCollection.collection"
		/>
		<v-menu class="menu" show-arrow :disabled="value.length === 0">
			<template #activator="{ toggle, deactivate, active }">
				<v-icon
					small
					class="icon"
					:class="{ active }"
					name="info"
					clickable
					@click.stop="toggle"
					@focusout="deactivate"
				></v-icon>
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
							:template="internalTemplate"
							:item="item.item"
							:collection="relationInfo.junctionCollection.collection"
						/>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.v-list {
	inline-size: 300px;
}

.display-translations {
	display: inline-flex;
	max-inline-size: 100%;
	align-items: center;

	.icon {
		--focus-ring-offset: 0;

		color: var(--theme--foreground-subdued);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	.icon:focus-visible,
	&:hover .icon,
	.icon.active {
		opacity: 1;
	}
}

.header {
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: space-between;
	color: var(--theme--foreground-subdued);
	font-size: 12px;

	.lang {
		font-weight: 600;
	}

	.v-icon {
		margin-inline-end: 4px;
	}

	.v-progress-linear {
		flex: 1;
		inline-size: unset;
		max-inline-size: 100px;
		border-radius: 4px;
	}
}

.v-list-item-content {
	padding-block: 4px 2px;
}

.v-list-item:not(:first-child) {
	.header {
		padding-block-start: 8px;
		border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}
</style>
