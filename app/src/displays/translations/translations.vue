<template>
	<value-null v-if="!junctionCollection.collection" />
	<v-menu v-else show-arrow :disabled="value.length === 0">
		<template #activator="{ toggle }">
			<render-template
				:template="internalTemplate"
				:item="displayItem"
				:collection="junctionCollection.collection"
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
					<render-template :template="internalTemplate" :item="item.item" :collection="junctionCollection.collection" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRefs } from 'vue';
import ValueNull from '@/views/private/components/value-null';
import useRelation from '@/composables/use-m2m';
import { useUserStore } from '@/stores';
import { notEmpty } from '@/utils/is-empty';

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
			type: [Array] as PropType<Record<string, any>[]>,
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
		const { collection, field } = toRefs(props);

		const {
			junctionPrimaryKeyField: primaryKeyField,
			junctionCollection,
			relation,
			junctionFields,
			relationPrimaryKeyField,
		} = useRelation(collection, field);

		const internalTemplate = computed(() => {
			return (
				props.template || junctionCollection.value?.meta?.display_template || `{{ ${primaryKeyField.value!.field} }}`
			);
		});

		const displayItem = computed(() => {
			const langPkField = relationPrimaryKeyField.value?.field;
			if (!langPkField) return {};

			let item =
				props.value.find((val) => val?.[relation.value.field]?.[langPkField] === props.defaultLanguage) ??
				props.value[0];

			if (props.userLanguage) {
				const user = useUserStore();
				item =
					props.value.find((val) => val?.[relation.value.field]?.[langPkField] === user.currentUser?.language) ?? item;
			}
			return item ?? {};
		});

		const writableFields = computed(() =>
			junctionFields.value.filter(
				(field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false
			)
		);

		const translations = computed(() => {
			return props.value.map((item) => {
				const filledFields = writableFields.value.filter((field) => {
					return field.field in item && notEmpty(item?.[field.field]);
				}).length;

				return {
					id: item?.[primaryKeyField.value?.field ?? 'id'],
					lang: item?.[relation.value.field]?.[props.languageField ?? relationPrimaryKeyField.value?.field],
					progress: Math.round((filledFields / writableFields.value.length) * 100),
					item,
				};
			});
		});

		return { primaryKeyField, internalTemplate, junctionCollection, displayItem, translations };
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
