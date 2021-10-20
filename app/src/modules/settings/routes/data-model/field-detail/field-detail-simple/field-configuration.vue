<template>
	<div class="field-configuration" :style="{ 'grid-row': row }">
		<div class="setup">
			<div class="schema">
				<div class="field half-left">
					<div class="label type-label">
						{{ t('key') }}
					</div>

					<v-input v-model="key" autofocus class="monospace" db-safe :placeholder="t('a_unique_column_name')" />
				</div>

				<div class="field half-right">
					<div class="label type-label">
						{{ t('type') }}
					</div>

					<v-select v-model="type" :items="typeOptions" :disabled="typeOptions.length === 1" />
				</div>

				<div class="field half-left">
					<div class="label type-label">
						{{ t('default_value') }}
					</div>

					<v-input class="monospace" v-model="defaultValue" placeholder="NULL" />
				</div>

				<div class="field half-right">
					<div class="label type-label">
						{{ t('required') }}
					</div>

					<v-checkbox block v-model="required" :label="t('require_value_to_be_set')" />
				</div>

				<div class="field full">
					<div class="label type-label">
						{{ t('note') }}
					</div>

					<v-input v-model="note" :placeholder="t('add_note')" />
				</div>
			</div>

			<v-button class="save" full-width :disabled="!readyToSave" @click="$emit('save')" :loading="saving">
				{{ t('save') }}
			</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs } from 'vue';
import { getInterfaces } from '@/interfaces';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';

export default defineComponent({
	props: {
		row: {
			type: Number,
			default: null,
		},
		interface: {
			type: String,
			required: true,
		},
	},
	emits: ['save'],
	setup(props) {
		const fieldDetail = useFieldDetailStore();

		const { readyToSave, saving } = storeToRefs(fieldDetail);

		const { t } = useI18n();

		const { interfaces } = getInterfaces();

		const chosenInterface = computed(() => interfaces.value.find((inter) => inter.id === props.interface));

		const typeOptions = computed(() => {
			if (!chosenInterface.value) return [];

			return chosenInterface.value.types.map((type) => ({
				text: t(type),
				value: type,
			}));
		});

		const key = syncFieldDetailStoreProperty('field.field');
		const type = syncFieldDetailStoreProperty('field.type');
		const defaultValue = syncFieldDetailStoreProperty('field.schema.default_value');
		const required = syncFieldDetailStoreProperty('field.meta.required');
		const note = syncFieldDetailStoreProperty('field.meta.note');

		return { key, t, type, typeOptions, defaultValue, required, note, readyToSave, saving };
	},
});
</script>

<style scoped lang="scss">
@import '@/styles/mixins/form-grid';

.field-configuration {
	background-color: var(--background-normal);
	grid-column: 1 / span 4;
	border-top: var(--border-width) solid var(--border-normal);
	border-bottom: var(--border-width) solid var(--border-normal);
}

// Extra bouding box ensures transition animation behaves properly
.setup {
	margin: 34px;
}

.schema {
	--form-vertical-gap: 20px;

	@include form-grid;
}

.monospace {
	--v-input-font-family: var(--family-monospace);
}

.save {
	margin-top: 40px;
}
</style>
