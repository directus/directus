<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { useExtensions } from '@/extensions';
import { nanoid } from 'nanoid/non-secure';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ExtensionOptions from '../shared/extension-options.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store/';
import RelationshipConfiguration from './relationship-configuration.vue';

defineProps<{
	row?: number;
}>();

defineEmits(['save', 'toggleAdvanced']);

const fieldDetailStore = useFieldDetailStore();

const { readyToSave, saving, localType } = storeToRefs(fieldDetailStore);

const { t } = useI18n();

const key = syncFieldDetailStoreProperty('field.field');
const type = syncFieldDetailStoreProperty('field.type');
const defaultValue = syncFieldDetailStoreProperty('field.schema.default_value');
const chosenInterface = syncFieldDetailStoreProperty('field.meta.interface');
const required = syncFieldDetailStoreProperty('field.meta.required', false);

const chosenInterfaceConfig = useExtension('interface', chosenInterface);

const typeOptions = computed(() => {
	if (!chosenInterfaceConfig.value) return [];

	return chosenInterfaceConfig.value.types.map((type) => ({
		text: t(type === 'geometry' ? 'geometry.All' : type),
		value: type,
	}));
});

const typeDisabled = computed(() => typeOptions.value.length === 1 || localType.value !== 'standard');

const { interfaces } = useExtensions();

const interfaceIdsToInterface = computed(() => Object.fromEntries(interfaces.value.map((inter) => [inter.id, inter])));

const customOptionsFields = computed(() => {
	if (typeof chosenInterfaceConfig.value?.options === 'function') {
		return chosenInterfaceConfig.value?.options(fieldDetailStore);
	}

	return null;
});

watch(
	chosenInterface,
	(newVal, oldVal) => {
		if (!newVal) return;

		if (interfaceIdsToInterface.value[newVal].autoKey) {
			const simplifiedId = newVal.includes('-') ? newVal.split('-')[1] : newVal;
			key.value = `${simplifiedId}-${nanoid(6).toLowerCase()}`;
		} else if (oldVal && interfaceIdsToInterface.value[oldVal].autoKey) {
			key.value = null;
		}
	},
	{ immediate: true },
);

const options = computed({
	get() {
		return fieldDetailStore.field.meta?.options ?? {};
	},
	set(newOptions: Record<string, any>) {
		fieldDetailStore.update({
			field: {
				meta: {
					options: newOptions,
				},
			},
		});
	},
});
</script>

<template>
	<div class="field-configuration" :style="{ 'grid-row': row }">
		<div class="setup">
			<template v-if="chosenInterface && !chosenInterfaceConfig.autoKey">
				<div class="schema">
					<div class="field half-left">
						<div class="label type-label">
							{{ $t('key') }}
							<v-icon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
						</div>

						<v-input v-model="key" autofocus class="monospace" db-safe :placeholder="$t('a_unique_column_name')" />
					</div>

					<div class="field half-right">
						<div class="label type-label">
							{{ $t('type') }}
						</div>

						<v-select v-model="type" :items="typeOptions" :disabled="typeDisabled" />
					</div>

					<div class="field half-left">
						<div class="label type-label">
							{{ $t('default_value') }}
						</div>

						<v-checkbox v-if="type === 'boolean'" v-model="defaultValue" block :label="$t('enabled')" />
						<v-input v-else v-model="defaultValue" class="monospace" placeholder="NULL" />
					</div>

					<div class="field half-right">
						<div class="label type-label">
							{{ $t('required') }}
						</div>

						<v-checkbox v-model="required" block :label="$t('require_value_to_be_set')" />
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
				{{ $t('save') }}
			</v-button>

			<button class="toggle-advanced" @click="$emit('toggleAdvanced')">
				{{ $t('continue_in_advanced_field_creation_mode') }}
			</button>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins';

.field-configuration {
	--v-button-background-color-disabled: var(--theme--background-normal);
	--columns: 1;

	grid-column: 1 / span var(--columns);
	background-color: var(--theme--background-subdued);
	border-block-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-block-end: var(--theme--border-width) solid var(--theme--form--field--input--border-color);

	@media (min-width: 400px) {
		--columns: 2;
	}

	@media (width > 640px) {
		--columns: 3;
	}

	@media (min-width: 840px) {
		--columns: 4;
	}
}

.setup {
	--theme--form--row-gap: 20px;

	margin: 34px;
}

.schema {
	margin-block-end: 20px;
	@include mixins.form-grid;
}

.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.save {
	margin-block-start: 40px;
}

.v-divider {
	margin: 28px 0;
}

:deep(.v-notice.normal) {
	background-color: var(--foreground-inverted);
}

.toggle-advanced {
	inline-size: 100%;
	margin-block-start: 20px;
	color: var(--theme--foreground-subdued);
	text-align: center;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--primary);
	}
}
</style>
