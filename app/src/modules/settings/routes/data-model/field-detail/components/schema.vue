<template>
	<div>
		<h2 class="type-title">{{ $t('schema_setup_title') }}</h2>

		<div class="form">
			<div class="field">
				<div class="label type-label">{{ $t('key') }}</div>
				<v-input :disabled="isExisting" autofocus class="monospace" v-model="fieldData.field" db-safe />
			</div>

			<div class="field">
				<div class="label type-label">{{ $t('type') }}</div>
				<v-input v-if="!fieldData.schema" :value="$t('alias')" disabled />
				<v-select
					v-else
					:disabled="typeDisabled || isExisting"
					:value="fieldData.type"
					@input="setType"
					:items="typesWithLabels"
					:placeholder="typePlaceholder"
				/>
			</div>

			<div class="field full">
				<div class="label type-label">{{ $t('note') }}</div>
				<v-input v-model="fieldData.meta.note" :placeholder="$t('add_note')" />
			</div>

			<!-- @todo base default value field type on selected type -->
			<div class="field" v-if="fieldData.schema">
				<div class="label type-label">{{ $t('default_value') }}</div>
				<v-input
					class="monospace"
					v-model="fieldData.schema.default_value"
					:placeholder="$t('add_a_default_value')"
				/>
			</div>

			<div class="field" v-if="fieldData.schema">
				<div class="label type-label">{{ $t('length') }}</div>
				<v-input
					type="number"
					:placeholder="fieldData.type !== 'string' ? $t('not_available_for_type') : '255'"
					:disabled="isExisting || fieldData.type !== 'string'"
					v-model="fieldData.schema.max_length"
				/>
			</div>

			<div class="field" v-if="fieldData.schema">
				<div class="label type-label">{{ $t('allow_null') }}</div>
				<v-checkbox v-model="fieldData.schema.is_nullable" :label="$t('allow_null_label')" block />
			</div>

			<!--
			@todo add unique when the API supports it

			<div class="field">
				<div class="label type-label">{{ $t('unique') }}</div>
				<v-input v-model="fieldData.schema.unique" />
			</div> -->
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync';
import { types } from '@/types';
import i18n from '@/lang';
import { state } from '../store';

export default defineComponent({
	props: {
		isExisting: {
			type: Boolean,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const typesWithLabels = computed(() =>
			types
				.filter((type) => {
					// Only allow primary key types in m2o fields
					if (props.type === 'm2o') {
						return ['integer', 'string', 'uuid'].includes(type);
					}

					// Remove alias and unknown, as those aren't real column types you can use
					return ['alias', 'unknown'].includes(type) === false;
				})
				.map((type) => {
					return {
						value: type,
						text: i18n.t(type),
					};
				})
		);

		const typeDisabled = computed(() => {
			return ['file', 'files', 'o2m', 'm2m', 'm2o'].includes(props.type);
		});

		const typePlaceholder = computed(() => {
			if (props.type === 'm2o') {
				return i18n.t('determined_by_relationship');
			}

			return i18n.t('choose_a_type');
		});

		return { fieldData: state.fieldData, typesWithLabels, setType, typeDisabled, typePlaceholder };

		function setType(value: typeof types[number]) {
			if (value === 'uuid') {
				state.fieldData.meta.special = 'uuid';
			} else {
				state.fieldData.meta.special = null;
			}

			// We'll reset the interface/display as they most likely won't work for the newly selected
			// type
			state.fieldData.meta.interface = null;
			state.fieldData.meta.options = null;
			state.fieldData.meta.display = null;
			state.fieldData.meta.display_options = null;
			state.fieldData.type = value;
		}
	},
});
</script>

<style lang="scss" scoped>
.type-title {
	margin-bottom: 32px;
}

.form {
	display: grid;
	grid-gap: 32px;
	grid-template-columns: 1fr 1fr;
}

.full {
	grid-column: 1 / span 2;
}

.label {
	margin-bottom: 8px;
}

.monospace {
	--v-input-font-family: var(--family-monospace);
}
</style>
