<template>
	<div class="filter-form">
		<v-form class="fixes" :fields="fields" v-model="_filters" />
		<v-button x-small @click="$emit('update:filters', null)" style="margin-top: 12px" :disabled="!filters.length > 0">
			{{ $t('clear_filters') }}
		</v-button>
	</div>
</template>

<script>
export default {
	inject: ['system'],
	props: {
		collection: String,
		filters: {
			type: Array,
			default: () => [],
		},
	},
	data() {
		return {
			fields: [],
			availableFilters: [
				{
					key: 'status',
					field: 'status',
					operator: 'eq',
				},
				{
					key: 'category',
					field: 'category.id',
					operator: 'eq',
				},
			],
		};
	},
	computed: {
		_filters: {
			get() {
				const obj = {};
				this.filters.map((filter) => {
					obj[filter.key] = filter.value;
				});
				return obj;
			},
			set(filters) {
				const newFilters = [];
				for (const key in filters) {
					if (Object.hasOwnProperty.call(filters, key)) {
						const value = filters[key];

						const filter = {
							...this.availableFilters.find((filter) => filter.key === key),
							value,
						};
						newFilters.push(filter);
					}
				}

				console.log(newFilters);

				this.$emit('update:filters', [...(newFilters || [])]);
			},
		},
	},
	async mounted() {
		console.log(this.system);
		const fieldsStore = this.system.useFieldsStore();

		this.availableFilters.map((filter) => {
			const field = fieldsStore.getFieldsForCollection(this.collection).find(({ field }) => field === filter.key);

			if (field.schema?.default_value) field.schema.default_value = null;
			// if (field.meta?.interface.includes('dropdown')) field.meta.options.allowNone = true;

			this.fields.push(field);
		});
	},
};
</script>

<style lang="scss" scoped>
.filter-form {
	margin-left: 32px;
}
</style>
