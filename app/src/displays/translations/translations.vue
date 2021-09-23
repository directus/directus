<template>
	<value-null v-if="!junctionCollection.collection" />
	<v-menu
		show-arrow
		:disabled="value.length === 0"
	>
		<template #activator="{ toggle }">
			<span class="toggle" @click.stop="toggle">
				<span class="label">
					<render-template :template="internalTemplate" :item="displayItem" :collection="junctionCollection.collection" />
				</span>
			</span>
		</template>

		<v-list class="links">
			<v-list-item v-for="item in value" :key="item[primaryKeyField.field]">
				<v-list-item-content>
					<render-template :template="internalTemplate" :item="item" :collection="junctionCollection.collection" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch, toRef, toRefs } from 'vue';
import ValueNull from '@/views/private/components/value-null';
import useRelation from '@/composables/use-m2m';
import { useUserStore } from '@/stores';

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
			default: null
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const {collection, field} = toRefs(props)

		const {junctionPrimaryKeyField: primaryKeyField, junctionCollection, relation} = useRelation(collection, field)

		const internalTemplate = computed(() => {
			return props.template || junctionCollection.value?.meta?.display_template || `{{ ${primaryKeyField.value!.field} }}`;
		});

		const displayItem = computed(() => {
			let item = props.value.find(val => val[relation.value.field] === props.defaultLanguage) ?? props.value[0]

			if(props.userLanguage) {
				const user = useUserStore()
				item = props.value.find(val => val[relation.value.field] === user.currentUser?.language) ?? item
			}
			return item ?? {}
		})

		return { primaryKeyField, internalTemplate, junctionCollection, displayItem };
	},
});
</script>

<style lang="scss" scoped>

</style>
