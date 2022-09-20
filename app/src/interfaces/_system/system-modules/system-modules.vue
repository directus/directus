<template>
	<div class="system-modules">
		<v-list class="list">
			<draggable
				v-model="valuesWithData"
				:force-fallback="true"
				:set-data="hideDragImage"
				item-key="id"
				handle=".drag-handle"
				:animation="150"
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
						<v-icon v-else-if="element.type === 'link'" name="clear" @click.stop="remove(element.id)" />
						<v-icon
							v-else
							:name="element.enabled ? 'check_box' : 'check_box_outline_blank'"
							clickable
							@click.stop="updateItem(element, { enabled: !element.enabled })"
						/>
					</v-list-item>
				</template>
			</draggable>
		</v-list>

		<v-button @click="edit('+')">{{ t('add_link') }}</v-button>

		<v-drawer
			:title="t('custom_link')"
			:model-value="!!editing"
			icon="link"
			@update:model-value="editing = null"
			@cancel="editing = null"
		>
			<template #actions>
				<v-button v-tooltip.bottom="t('save')" icon rounded @click="save">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-content">
				<v-form v-model="values" :initial-values="initialValues" :fields="linkFields" />
			</div>
		</v-drawer>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { Settings, SettingsModuleBarModule, SettingsModuleBarLink } from '@directus/shared/types';
import { hideDragImage } from '@/utils/hide-drag-image';
import Draggable from 'vuedraggable';
import { assign } from 'lodash';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import { Field, DeepPartial } from '@directus/shared/types';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { useExtensions } from '@/extensions';

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

export default defineComponent({
	name: 'SystemModules',
	components: { Draggable },
	props: {
		value: {
			type: Array as PropType<Settings['module_bar']>,
			default: () => MODULE_BAR_DEFAULT,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

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
					})
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
						(availableModuleAsBarModule) => savedModules.includes(availableModuleAsBarModule.id) === false
					),
				]);
			},
			set(previewValue: PreviewValue[]) {
				emit('input', previewToValue(previewValue));
			},
		});

		return {
			t,
			editing,
			valuesWithData,
			hideDragImage,
			updateItem,
			edit,
			linkFields,
			save,
			values,
			remove,
			initialValues,
		};

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
							name: part.name,
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
			if (editing.value === '+') {
				emit('input', [...(props.value ?? MODULE_BAR_DEFAULT), values.value]);
			} else {
				emit(
					'input',
					(props.value ?? MODULE_BAR_DEFAULT).map((val) => (val.id === editing.value ? values.value : val))
				);
			}

			values.value = null;
			editing.value = null;
		}

		function remove(id: string) {
			emit(
				'input',
				(props.value ?? MODULE_BAR_DEFAULT).filter((val) => val.id !== id)
			);
		}
	},
});
</script>

<style scoped>
.icon {
	margin: 0 12px;
}

.v-list-item.enabled {
	--v-list-item-border-color: var(--primary);
	--v-list-item-color: var(--primary-125);
	--v-list-item-background-color: var(--primary-10);
	--v-list-item-border-color-hover: var(--primary-150);
	--v-list-item-color-hover: var(--primary-125);
	--v-list-item-background-color-hover: var(--primary-10);
	--v-icon-color: var(--primary);
	--v-icon-color-hover: var(--foreground-normal);
}

.to {
	color: var(--foreground-subdued);
	font-family: var(--family-monospace);
}

.enabled .to {
	color: var(--primary-50);
}

.drawer-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.list {
	margin-bottom: 8px;
	padding: 0;
}
</style>
