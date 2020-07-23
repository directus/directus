<template>
	<div>
		<h2 class="type-title">{{ $t('schema_setup_title') }}</h2>

		<div class="form">
			<div class="field">
				<div class="label type-label">{{ $t('key') }}</div>
				<v-input autofocus class="monospace" v-model="_field.field" db-safe />
			</div>

			<div class="field">
				<div class="label type-label">{{ $t('type') }}</div>
				<v-input v-if="!_field.database" :value="$t('alias')" disabled />
				<v-select
					v-else
					:disabled="typeDisabled"
					:value="_field.database.type"
					@input="setType"
					:items="typesWithLabels"
				/>
			</div>

			<div class="field full">
				<div class="label type-label">{{ $t('note') }}</div>
				<v-input v-model="_field.system.comment" :placeholder="$t('add_note')" />
			</div>

			<!-- @todo base default value field type on selected type -->
			<div class="field" v-if="_field.database">
				<div class="label type-label">{{ $t('default_value') }}</div>
				<v-input
					class="monospace"
					v-model="_field.database.default_value"
					:placeholder="$t('add_a_default_value')"
				/>
			</div>

			<div class="field" v-if="_field.database">
				<div class="label type-label">{{ $t('length') }}</div>
				<v-input
					type="number"
					:placeholder="_field.database.type !== 'string' ? $t('not_available_for_type') : '255'"
					:disabled="_field.database.type !== 'string'"
					v-model="_field.database.max_length"
				/>
			</div>

			<div class="field" v-if="_field.database">
				<div class="label type-label">{{ $t('allow_null') }}</div>
				<v-checkbox v-model="_field.database.is_nullable" :label="$t('allow_null_label')" block />
			</div>

			<!--
			@todo add unique when the API supports it

			<div class="field">
				<div class="label type-label">{{ $t('unique') }}</div>
				<v-input v-model="_field.database.unique" />
			</div> -->
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync';
import { types } from '@/stores/fields/types';
import i18n from '@/lang';

export default defineComponent({
	props: {
		fieldData: {
			type: Object,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _field = useSync(props, 'fieldData', emit);

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
			return ['file', 'files', 'o2m', 'm2m'].includes(props.type);
		});

		return { _field, typesWithLabels, setType, typeDisabled };

		function setType(value: typeof types[number]) {
			if (value === 'uuid') {
				_field.value.system.special = 'uuid';
			} else {
				_field.value.system.special = null;
			}

			// We'll reset the interface/display as they most likely won't work for the newly selected
			// type
			_field.value.system.interface = null;
			_field.value.system.options = null;
			_field.value.system.display = null;
			_field.value.system.display_options = null;

			_field.value.database.type = value;
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
