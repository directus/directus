<template>
	<v-list>
		<draggable
			v-model="valuesWithData"
			:force-fallback="true"
			:set-data="hideDragImage"
			item-key="id"
			handle=".drag-handle"
			:animation="150"
		>
			<template #item="{ element }">
				<v-list-item block :class="{ enabled: element.enabled }">
					<v-icon class="drag-handle" name="drag_handle" />
					<v-icon class="icon" :name="element.icon" />
					<div class="info">
						<div class="name">{{ element.name }}</div>
						<div class="to">{{ element.to }}</div>
					</div>
					<div class="spacer" />
					<v-icon v-if="element.locked === true" name="lock" />
					<v-icon v-else-if="element.type === 'link'" name="clear" />
					<v-icon
						v-else
						:name="element.enabled ? 'check_box' : 'check_box_outline_blank'"
						clickable
						@click="updateItem(element, { enabled: !element.enabled })"
					/>
				</v-list-item>
			</template>
		</draggable>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { getModules } from '@/modules';
import { Settings, SettingsModuleBarModule, SettingsModuleBarLink } from '@directus/shared/types';
import { hideDragImage } from '@/utils/hide-drag-image';
import Draggable from 'vuedraggable';
import { assign } from 'lodash';

type PreviewExtra = {
	to: string;
	name: string;
	icon: string;
};

type PreviewValue = (SettingsModuleBarLink & PreviewExtra) | (SettingsModuleBarModule & PreviewExtra);

export default defineComponent({
	name: 'SystemModules',
	components: { Draggable },
	props: {
		value: {
			type: Array as PropType<Settings['module_bar']>,
			default: () => [],
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { modules: registeredModules } = getModules();

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
				const savedModules = (props.value.filter((value) => value.type === 'module') as SettingsModuleBarModule[]).map(
					(value) => value.id
				);

				return valueToPreview([
					...props.value,
					...availableModulesAsBarModule.value.filter(
						(availableModuleAsBarModule) => savedModules.includes(availableModuleAsBarModule.id) === false
					),
				]);
			},
			set(previewValue: PreviewValue[]) {
				emit('input', previewToValue(previewValue));
			},
		});

		return { valuesWithData, hideDragImage, updateItem };

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
						to: module.link === undefined ? `/${module.id}` : '',
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
	},
});
</script>

<style scoped>
.icon {
	margin: 0 12px;
}

.v-list-item.enabled {
	--v-list-item-border-color: var(--primary);
	--v-list-item-color: var(--primary);
	--v-list-item-background-color: var(--primary-10);
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
</style>
