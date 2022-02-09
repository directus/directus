<template>
	<div class="field-configuration" :style="{ 'grid-row': row }">
		<div class="setup">
			<template v-if="chosenInterface && !interfaceIdsWithHiddenLabel.includes(chosenInterface)">
				<div class="schema">
					<div class="field half-left">
						<div class="label type-label">
							{{ t('key') }}
							<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" />
						</div>

						<v-input v-model="key" autofocus class="monospace" db-safe :placeholder="t('a_unique_column_name')" />
					</div>

					<div class="field half-right">
						<div class="label type-label">
							{{ t('type') }}
						</div>

						<v-select v-model="type" :items="typeOptions" :disabled="typeDisabled" />
					</div>

					<div class="field half-left">
						<div class="label type-label">
							{{ t('default_value') }}
						</div>

						<v-checkbox v-if="type === 'boolean'" v-model="defaultValue" block :label="t('enabled')" />
						<v-input v-else v-model="defaultValue" class="monospace" placeholder="NULL" />
					</div>

					<div class="field half-right">
						<div class="label type-label">
							{{ t('required') }}
						</div>

						<v-checkbox v-model="required" block :label="t('require_value_to_be_set')" />
					</div>
				</div>

				<relationship-configuration :local-type="localType" />

				<v-divider inline />
			</template>

			<extension-options
				v-model="options"
				type="interface"
				:extension="chosenInterface"
				:options="customOptionsFields"
			/>

			<v-button class="save" full-width :disabled="!readyToSave" :loading="saving" @click="$emit('save')">
				{{ t('save') }}
			</v-button>

			<button class="toggle-advanced" @click="$emit('toggleAdvanced')">
				{{ t('continue_in_advanced_field_creation_mode') }}
			</button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from 'vue';
import { getInterface, getInterfaces } from '@/interfaces';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store/';
import { storeToRefs } from 'pinia';
import ExtensionOptions from '../shared/extension-options.vue';
import RelationshipConfiguration from './relationship-configuration.vue';
import { nanoid } from 'nanoid';

export default defineComponent({
	components: { ExtensionOptions, RelationshipConfiguration },
	props: {
		row: {
			type: Number,
			default: null,
		},
		chosenInterface: {
			type: String,
			required: true,
		},
	},
	emits: ['save', 'toggleAdvanced'],
	setup(props) {
		const fieldDetailStore = useFieldDetailStore();

		const { readyToSave, saving, localType } = storeToRefs(fieldDetailStore);

		const { t } = useI18n();

		const chosenInterface = computed(() => getInterface(props.chosenInterface));

		const typeOptions = computed(() => {
			if (!chosenInterface.value) return [];

			return chosenInterface.value.types.map((type) => ({
				text: t(type),
				value: type,
			}));
		});

		const typeDisabled = computed(() => typeOptions.value.length === 1 || localType.value !== 'standard');

		const key = syncFieldDetailStoreProperty('field.field');
		const type = syncFieldDetailStoreProperty('field.type');
		const defaultValue = syncFieldDetailStoreProperty('field.schema.default_value');
		const required = syncFieldDetailStoreProperty('field.meta.required', false);
		const note = syncFieldDetailStoreProperty('field.meta.note');

		const { interfaces } = getInterfaces();

		const interfaceIdsWithHiddenLabel = computed(() =>
			interfaces.value.filter((inter) => inter.hideLabel === true).map((inter) => inter.id)
		);

		const extensionInfo = computed(() => {
			return getInterface(props.chosenInterface);
		});

		const customOptionsFields = computed(() => {
			if (typeof extensionInfo.value?.options === 'function') {
				return extensionInfo.value?.options(fieldDetailStore);
			}

			return null;
		});

		watch(
			chosenInterface,
			(newVal, oldVal) => {
				if (!chosenInterface.value) return;

				if (interfaceIdsWithHiddenLabel.value.includes(chosenInterface.value.id)) {
					const simplifiedId = chosenInterface.value.id.includes('-')
						? chosenInterface.value.id.split('-')[1]
						: chosenInterface.value.id;
					key.value = `${simplifiedId}-${nanoid(6).toLowerCase()}`;
				} else if (oldVal && interfaceIdsWithHiddenLabel.value.includes(oldVal.id)) {
					key.value = null;
				}
			},
			{ immediate: true }
		);

		const options = computed({
			get() {
				return fieldDetailStore.field.meta?.options ?? {};
			},
			set(newOptions: Record<string, any>) {
				fieldDetailStore.$patch((state) => {
					state.field.meta = {
						...(state.field.meta ?? {}),
						options: newOptions,
					};
				});
			},
		});

		return {
			key,
			t,
			type,
			typeDisabled,
			typeOptions,
			defaultValue,
			required,
			note,
			interfaceIdsWithHiddenLabel,
			readyToSave,
			saving,
			localType,
			customOptionsFields,
			options,
		};
	},
});
</script>

<style scoped lang="scss">
@import '@/styles/mixins/form-grid';

.field-configuration {
	--v-button-background-color-disabled: var(--background-normal);
	--columns: 1;

	@media (min-width: 400px) {
		--columns: 2;
	}

	@media (min-width: 600px) {
		--columns: 3;
	}

	@media (min-width: 840px) {
		--columns: 4;
	}

	grid-column: 1 / span var(--columns);
	background-color: var(--background-subdued);
	border-top: var(--border-width) solid var(--border-normal);
	border-bottom: var(--border-width) solid var(--border-normal);
}

.setup {
	--form-vertical-gap: 20px;

	margin: 34px;
}

.schema {
	margin-bottom: 20px;
	@include form-grid;
}

.monospace {
	--v-input-font-family: var(--family-monospace);
}

.save {
	margin-top: 40px;
}

.v-divider {
	margin: 28px 0;
}

:deep(.v-notice.normal) {
	background-color: var(--foreground-inverted);
}

.toggle-advanced {
	width: 100%;
	margin-top: 20px;
	color: var(--foreground-subdued);
	text-align: center;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--primary);
	}
}
</style>
