<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #navigation>
			<navigation />
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('dx.clear')" kind="danger" icon rounded @click="clear">
				<v-icon name="delete" />
			</v-button>
		</template>

		<div class="main">
			<div class="component">
				<component :is="`display-${id}`" v-if="loaded" v-bind="bindings" />
			</div>

			<v-divider>{{ t('options') }}</v-divider>

			<div class="options">
				<extension-options
					v-model="bindings"
					type="display"
					:extension="id"
					show-advanced
					:options="customOptionsFields"
				/>
			</div>

			<v-divider>{{ t('dx.props') }}</v-divider>

			<div class="props">
				<v-form v-model="bindings" :fields="fields" />
			</div>

			<v-divider>{{ t('dx.optionsOptions') }}</v-divider>

			<div class="option-options">
				<interface-input-code :value="fieldOptions" language="json" @input="fieldOptions = $event" />
			</div>
		</div>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DisplayConfig, ExtensionOptionsContext, Field } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import { getDisplay } from '@/displays';
import { getDefaultValue, typeToString } from '../utils/getDefaultValue';
import { merge } from 'lodash';
import { getFieldDefaults } from '../utils/getFieldDefaults';
import { getComponent } from '../utils/getComponent';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import ExtensionOptions from '@/modules/settings/routes/data-model/field-detail/shared/extension-options.vue';

interface Props {
	id: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const displayInfo = computed(() => getDisplay(props.id));

const bindings = ref<Record<string, any>>({});
const loaded = ref(false);

const { customOptionsFields, defaultFieldOptions, fieldOptions } = useFieldOptions();

watch(
	displayInfo,
	(value) => {
		load();
		updateDefaults(value);
		updateField(value);
	},
	{ immediate: true }
);

onBeforeRouteLeave(save);
onBeforeRouteUpdate(save);

async function updateDefaults(value?: DisplayConfig) {
	if (value) {
		if (localStorage.getItem(`display-${props.id}`)) {
			loaded.value = true;
			return;
		}

		loaded.value = false;
		bindings.value = {};
		let propInfo = (await getComponent(value.component)).props;
		if (!propInfo) return;

		const fieldDefaults = getFieldDefaults('display', props.id);

		for (const [key, value] of Object.entries(propInfo)) {
			bindings.value[key] = fieldDefaults[key]?.default ?? getDefaultValue(value);
		}

		loaded.value = true;
	} else {
		loaded.value = false;
	}
}

const fields = ref<Field[]>([]);

async function updateField(value?: DisplayConfig) {
	if (!value) return [];
	const propInfo = (await getComponent(value.component)).props;

	if (!propInfo) return [];

	const fieldDefaults = getFieldDefaults('display', props.id);

	const keys = new Set([...Object.keys(propInfo), ...Object.keys(fieldDefaults)]);

	fields.value = [...keys].map((key) => {
		return merge(
			{
				field: key,
				meta: {
					width: 'half',
					required: propInfo[key].required ?? false,
				},
				name: formatTitle(key),
				type: typeToString(propInfo[key].type),
			} as Field,
			fieldDefaults[key] ?? {}
		);
	});
}

function useFieldOptions() {
	const defaultFieldOptions: ExtensionOptionsContext = {
		collection: 'my_collection',
		collections: {
			junction: undefined,
			related: undefined,
		},
		relations: {
			o2m: undefined,
			m2o: undefined,
			m2a: undefined,
		},
		field: {
			field: 'my_field',
			type: 'string',
			meta: {},
			schema: {},
		},
		fields: {
			corresponding: undefined,
			junctionCurrent: undefined,
			junctionRelated: undefined,
			sort: undefined,
		},
		autoGenerateJunctionRelation: false,
		editing: 'interface',
		items: {},
		localType: 'standard',
		saving: false,
	};

	const fieldOptions = ref<ExtensionOptionsContext>(defaultFieldOptions);

	const customOptionsFields = computed(() => {
		if (typeof displayInfo.value?.options === 'function') {
			return displayInfo.value?.options(fieldOptions.value);
		}

		return undefined;
	});

	return { fieldOptions, defaultFieldOptions, customOptionsFields };
}

const title = computed(() => {
	return `Displays / ${displayInfo.value?.name}`;
});

function save() {
	localStorage.setItem(
		`display-${props.id}`,
		JSON.stringify({ binding: bindings.value, fieldOptions: fieldOptions.value })
	);
}

function load() {
	const savedItem = localStorage.getItem(`display-${props.id}`);
	if (savedItem) {
		const saved = JSON.parse(savedItem);
		bindings.value = saved.binding;
		fieldOptions.value = saved.fieldOptions;
	}
}

function clear() {
	localStorage.removeItem(`display-${props.id}`);
	updateDefaults(displayInfo.value);
	fieldOptions.value = defaultFieldOptions;
}
</script>

<style lang="scss" scoped>
.main {
	padding: var(--content-padding);

	.v-divider {
		margin: 40px 0;
	}
}

.event {
	width: 100%;
	margin: 5px 0;
	cursor: pointer;

	&:hover::before {
		z-index: -1;
		position: absolute;
		content: '';
		top: -5px;
		bottom: -5px;
		left: -5px;
		right: -5px;
		background-color: var(--background-normal-alt);
		border-radius: var(--border-radius);
	}

	.title {
		display: flex;
		justify-content: space-between;

		.date {
			color: var(--foreground-subdued);
		}
	}

	.value {
		color: var(--primary);
	}
}
</style>
