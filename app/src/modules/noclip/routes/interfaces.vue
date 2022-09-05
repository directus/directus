<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('dx.clear')" kind="danger" icon rounded @click="clear">
				<v-icon name="delete" />
			</v-button>
		</template>

		<template #navigation>
			<navigation />
		</template>

		<div class="main">
			<div class="component">
				<component :is="`interface-${id}`" v-if="loaded" v-bind="bindings" v-on="listeners" />
			</div>

			<v-divider>{{ t('options') }}</v-divider>

			<div class="options">
				<extension-options
					v-model="bindings"
					type="interface"
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

		<template #sidebar>
			<SidebarDetail :title="t('dx.emits')" icon="notifications" :badge="emitted.length">
				<v-list>
					<v-list-item v-for="(emit, index) in emitted" :key="index">
						<div class="event" @click="openEmit(index)">
							<div class="title">
								{{ formatTitle(emit.key) }}
								<span class="date">
									{{ padStart(String(emit.date.getMinutes()), 2, '0') }}:{{
										padStart(String(emit.date.getSeconds()), 2, '0')
									}}
								</span>
							</div>
							<div class="value"><v-text-overflow :text="JSON.stringify(emit.value)" /></div>
						</div>
					</v-list-item>
				</v-list>
			</SidebarDetail>
		</template>

		<v-drawer
			:model-value="emitOpen !== null"
			:title="formatTitle(emitted[emitOpen ?? 0]?.key ?? '')"
			@cancel="emitOpen = null"
		>
			<div class="content">
				<interface-input-code
					v-if="emitOpen !== null"
					:value="JSON.stringify(emitted[emitOpen].value, null, 4)"
					language="json"
				/>
			</div>
		</v-drawer>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInterface } from '@/interfaces';
import { ExtensionOptionsContext, Field, InterfaceConfig } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
import { merge, padStart } from 'lodash';
import { getFieldDefaults } from '../utils/getFieldDefaults';
import { getDefaultValue, typeToString } from '../utils/getDefaultValue';
import { getComponent } from '../utils/getComponent';
import ExtensionOptions from '@/modules/settings/routes/data-model/field-detail/shared/extension-options.vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

interface Props {
	id: string;
}

interface EmittedInfo {
	key: string;
	value: any;
	date: Date;
}

const props = defineProps<Props>();

const { t } = useI18n();

const interfaceInfo = computed(() => getInterface(props.id));

const bindings = ref<Record<string, any>>({});
const loaded = ref(false);

const emitted = ref<EmittedInfo[]>([]);
const emitOpen = ref<number | null>(null);

const { customOptionsFields, defaultFieldOptions, fieldOptions } = useFieldOptions();

watch(
	interfaceInfo,
	(value) => {
		load();
		updateDefaults(value);
		updateField(value);
		updateListeners(value);
	},
	{ immediate: true }
);

onBeforeRouteLeave(save);
onBeforeRouteUpdate(save);

async function updateDefaults(value?: InterfaceConfig) {
	if (value) {
		if (localStorage.getItem(`interface-${props.id}`)) {
			loaded.value = true;
			return;
		}

		emitted.value = [];
		loaded.value = false;
		bindings.value = {};
		let propInfo = (await getComponent(value.component)).props;
		if (!propInfo) return;

		const fieldDefaults = getFieldDefaults('interface', props.id);

		for (const [key, value] of Object.entries(propInfo)) {
			bindings.value[key] = fieldDefaults[key]?.default ?? getDefaultValue(value);
		}

		loaded.value = true;
	} else {
		loaded.value = false;
	}
}

const fields = ref<Field[]>([]);

async function updateField(value?: InterfaceConfig) {
	if (!value) return [];
	const propInfo = (await getComponent(value.component)).props;

	if (!propInfo) return [];

	const fieldDefaults = getFieldDefaults('interface', props.id);

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
			fieldDefaults[key]
		);
	});
}

const listeners = ref<Record<string, (value: any) => void>>({});

async function updateListeners(value?: InterfaceConfig) {
	if (!value) return {};
	const emitInfo = (await getComponent(value.component)).emits;

	if (!emitInfo) return {};

	listeners.value = emitInfo.reduce<Record<string, (value: any) => void>>((acc, event) => {
		acc[event] = (value) => {
			emitted.value.splice(0, 0, {
				key: event,
				value,
				date: new Date(),
			});

			if (event === 'input') {
				bindings.value.value = value;
			}
		};
		return acc;
	}, {});
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
		if (typeof interfaceInfo.value?.options === 'function') {
			return interfaceInfo.value?.options(fieldOptions.value);
		}

		return undefined;
	});

	return { defaultFieldOptions, fieldOptions, customOptionsFields };
}

function openEmit(index: number) {
	emitOpen.value = index;
}

const title = computed(() => {
	return `Interfaces / ${interfaceInfo.value?.name}`;
});

function save() {
	localStorage.setItem(
		`interface-${props.id}`,
		JSON.stringify({ binding: bindings.value, fieldOptions: fieldOptions.value })
	);
}

function load() {
	const savedItem = localStorage.getItem(`interface-${props.id}`);
	if (savedItem) {
		const saved = JSON.parse(savedItem);
		bindings.value = saved.binding;
		fieldOptions.value = saved.fieldOptions;
	}
}

function clear() {
	localStorage.removeItem(`interface-${props.id}`);
	updateDefaults(interfaceInfo.value);
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

.content {
	padding: var(--content-padding);
}
</style>
