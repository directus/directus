<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { useExtensions } from '@/extensions';
import { hideDragImage } from '@/utils/hide-drag-image';
import { translate } from '@/utils/translate-object-values';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { DeepPartial, Field, Settings, SettingsModuleBarLink, SettingsModuleBarModule } from '@directus/types';
import { assign } from 'lodash';
import { nanoid } from 'nanoid';
import { computed, ref } from 'vue';
import Draggable from 'vuedraggable';

type PreviewExtra = {
	to: string;
	name: string;
	icon: string;
};

type PreviewValue = (SettingsModuleBarLink & PreviewExtra) | (SettingsModuleBarModule & PreviewExtra);

const linkFields: DeepPartial<Field>[] = [
	{
		field: 'name',
		name: '$t:name',
		meta: {
			required: true,
			interface: 'input',
			width: 'half-left',
			options: {
				placeholder: '$t:enter_a_name',
			},
		},
	},
	{
		field: 'icon',
		name: '$t:icon',
		meta: {
			required: true,
			interface: 'select-icon',
			width: 'half-right',
		},
	},
	{
		field: 'url',
		name: '$t:url',
		meta: {
			required: true,
			interface: 'input',
			options: {
				placeholder: 'https://example.com',
			},
		},
	},
];

const props = withDefaults(
	defineProps<{
		value?: Settings['module_bar'];
	}>(),
	{
		value: () => MODULE_BAR_DEFAULT as Settings['module_bar'],
	},
);

const emit = defineEmits<{
	(e: 'input', value: Settings['module_bar']): void;
}>();

const editing = ref<string | null>();
const values = ref<SettingsModuleBarLink | null>();
const initialValues = ref<SettingsModuleBarLink | null>();

const { modules: registeredModules } = useExtensions();

const availableModulesAsBarModule = computed<SettingsModuleBarModule[]>(() => {
	return registeredModules.value
		.filter((module) => module.hidden !== true)
		.map(
			(module): SettingsModuleBarModule => ({
				type: 'module',
				id: module.id,
				enabled: false,
			}),
		);
});

const valuesWithData = computed<PreviewValue[]>({
	get() {
		const savedModules = (
			(props.value ?? MODULE_BAR_DEFAULT).filter((value) => value.type === 'module') as SettingsModuleBarModule[]
		).map((value) => value.id);

		return valueToPreview([
			...(props.value ?? MODULE_BAR_DEFAULT),
			...availableModulesAsBarModule.value.filter(
				(availableModuleAsBarModule) => savedModules.includes(availableModuleAsBarModule.id) === false,
			),
		]);
	},
	set(previewValue: PreviewValue[]) {
		emit('input', previewToValue(previewValue));
	},
});

const isSaveDisabled = computed(() => {
	for (const field of linkFields) {
		if (field.meta?.required && field.field) {
			const fieldValue = (values.value as Record<string, any>)[field.field];
			if (fieldValue === null || fieldValue === undefined || fieldValue === '') return true;
		}
	}

	return false;
});

function valueToPreview(value: Settings['module_bar']): PreviewValue[] {
	return value
		.filter((part) => {
			if (part.type === 'link') return true;
			return !!registeredModules.value.find((module) => module.id === part.id);
		})
		.map((part) => {
			if (part.type === 'link') {
				return {
					...part,
					to: part.url,
					icon: part.icon,
					name: translate(part.name),
				};
			}

			const module = registeredModules.value.find((module) => module.id === part.id)!;

			return {
				...part,
				to: `/${module.id}`,
				name: module.name,
				icon: module.icon,
			};
		});
}

function previewToValue(preview: PreviewValue[]): Settings['module_bar'] {
	return preview.map((previewValue) => {
		if (previewValue.type === 'link') {
			const { type, id, name, url, icon, enabled, locked } = previewValue;
			return { type, id, name, url, icon, enabled, locked };
		}

		const { type, id, enabled, locked } = previewValue;
		return { type, id, enabled, locked };
	});
}

function updateItem(item: PreviewValue, updates: Partial<PreviewValue>): void {
	valuesWithData.value = valuesWithData.value.map((previewValue) => {
		if (previewValue === item) {
			return assign({}, item, updates);
		}

		return previewValue;
	});
}

function edit(id: string) {
	editing.value = id;

	let value: SettingsModuleBarLink;

	if (id !== '+') {
		value = (props.value ?? MODULE_BAR_DEFAULT).find((val) => val.id === id) as SettingsModuleBarLink;
	} else {
		value = {
			id: nanoid(),
			type: 'link',
			enabled: true,
			url: '',
			name: '',
			icon: '',
		};
	}

	values.value = value;
	initialValues.value = value;
}

function save() {
	if (isSaveDisabled.value) return;

	if (editing.value === '+') {
		emit('input', [...(props.value ?? MODULE_BAR_DEFAULT), values.value!]);
	} else {
		emit(
			'input',
			(props.value ?? MODULE_BAR_DEFAULT).map((val) => (val.id === editing.value ? values.value! : val)),
		);
	}

	values.value = null;
	editing.value = null;
}

function remove(id: string) {
	emit(
		'input',
		(props.value ?? MODULE_BAR_DEFAULT).filter((val) => val.id !== id),
	);
}
</script>

<template>
	<div class="system-modules">
		<draggable
			v-model="valuesWithData"
			tag="v-list"
			class="list"
			:set-data="hideDragImage"
			item-key="id"
			handle=".drag-handle"
			:animation="150"
			v-bind="{ 'force-fallback': true }"
		>
			<template #item="{ element }">
				<v-list-item
					block
					:class="{ enabled: element.enabled }"
					:clickable="element.type === 'link'"
					@click="element.type === 'link' ? edit(element.id) : undefined"
				>
					<v-icon class="drag-handle" name="drag_handle" />
					<v-icon class="icon" :name="element.icon" />
					<div class="info">
						<div class="name">{{ element.name }}</div>
						<div class="to">{{ element.to }}</div>
					</div>
					<div class="spacer" />
					<v-icon v-if="element.locked === true" name="lock" />
					<v-icon v-else-if="element.type === 'link'" name="clear" clickable @click.stop="remove(element.id)" />
					<v-icon
						v-else
						:name="element.enabled ? 'check_box' : 'check_box_outline_blank'"
						clickable
						@click.stop="updateItem(element, { enabled: !element.enabled })"
					/>
				</v-list-item>
			</template>
		</draggable>

		<v-button @click="edit('+')">{{ $t('add_link') }}</v-button>

		<v-drawer
			:title="$t('custom_link')"
			:model-value="!!editing"
			icon="link"
			@update:model-value="editing = null"
			@cancel="editing = null"
			@apply="save"
		>
			<template #actions>
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('save')"
					:disabled="isSaveDisabled"
					icon="check"
					@click="save"
				/>
			</template>

			<div class="drawer-content">
				<v-form v-model="values" :initial-values="initialValues" :fields="linkFields" />
			</div>
		</v-drawer>
	</div>
</template>

<style scoped lang="scss">
.icon {
	margin: 0 12px;
}

.system-modules {
	--v-list-item-color: var(--theme--form--field--input--foreground-subdued);

	.enabled {
		--v-list-item-color: var(--theme--form--field--input--foreground);
	}
}

.drag-handle {
	--v-icon-color: var(--theme--form--field--input--foreground-subdued);
}

.to {
	font-family: var(--theme--fonts--monospace--font-family);
}

.drawer-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.list {
	margin-block-end: 8px;
	padding: 0;
}
</style>
