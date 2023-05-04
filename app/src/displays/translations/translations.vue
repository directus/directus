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
				<v-icon small class="icon" :class="{ active }" name="info" @click.stop="toggle" @focusout="deactivate"></v-icon>
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

<script setup lang="ts">
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { useFieldsStore } from '@/stores/fields';
import { useUserStore } from '@/stores/user';
import type { User } from '@directus/types';
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
		const user = useUserStore();
		item = props.value.find((val) => val?.[langField]?.[langPkField] === (user.currentUser as User)?.language) ?? item;
	}

	return item ?? {};
});

const writableFields = computed(() => {
	if (!relationInfo.value) return [];

	const junctionFields = fieldsStore.getFieldsForCollection(relationInfo.value.junctionCollection.collection);

	return junctionFields.filter(
		(field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false
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

<style lang="scss" scoped>
.v-list {
	width: 300px;
}

.display-translations {
	display: inline-flex;
	max-width: 100%;
	align-items: center;

	.icon {
		color: var(--foreground-subdued);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

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
