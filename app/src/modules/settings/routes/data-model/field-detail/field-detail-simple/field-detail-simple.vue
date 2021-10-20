<template>
	<v-drawer
		:model-value="isOpen"
		:title="title"
		persistent
		@cancel="$emit('cancel')"
		@update:model-value="$emit('cancel')"
	>
		<div class="content">
			<div v-for="group of groups" :key="group.key" class="group">
				<h2>{{ group.name }}</h2>

				<div class="grid">
					<button
						v-for="inter of group.interfaces"
						:key="inter.id"
						class="interface"
						:class="{ active: chosenInterface === inter.id }"
						@click="chosenInterface = chosenInterface === inter.id ? null : inter.id"
					>
						<div class="preview">
							<template v-if="inter.preview">
								<span v-if="isSVG(inter.preview)" v-html="inter.preview" />
								<img v-else :src="inter.preview" alt="" />
							</template>

							<v-icon v-else large :name="inter.icon" />
						</div>
						<v-text-overflow :text="inter.name" class="name" />
					</button>

					<transition-expand>
						<field-configuration
							v-if="chosenInterface && !!group.interfaces.some((inter) => inter.id === chosenInterface)"
							:row="configRow"
							:interface="chosenInterface"
							@save="$emit('save')"
						/>
					</transition-expand>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs, watch } from 'vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { Collection } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { getInterfaces } from '@/interfaces';
import { orderBy } from 'lodash';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { syncRefProperty } from '@/utils/sync-ref-property';
import FieldConfiguration from './field-configuration.vue';

export default defineComponent({
	components: { FieldConfiguration },
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
	},
	emits: ['cancel', 'save'],
	setup(props) {
		const { collection } = toRefs(props);

		const { t } = useI18n();
		const isOpen = useDialogRoute();

		const fieldDetail = useFieldDetailStore();
		watch(collection, () => fieldDetail.update({ collection: collection.value.collection }), { immediate: true });

		const { interfaces } = getInterfaces();

		const interfacesSorted = computed(() => {
			return orderBy(
				interfaces.value.filter((inter) => !inter.system),
				['order']
			);
		});

		const groups = computed(() => [
			{
				key: 'standard',
				name: t('interface_group_text_and_numbers'),
				interfaces: interfacesSorted.value.filter((inter) => inter.group === 'standard'),
			},
			{
				key: 'selection',
				name: t('interface_group_selection'),
				interfaces: interfacesSorted.value.filter((inter) => inter.group === 'selection'),
			},
			{
				key: 'relational',
				name: t('interface_group_relational'),
				interfaces: interfacesSorted.value.filter((inter) => inter.group === 'relational'),
			},
			{
				key: 'presentation',
				name: t('interface_group_presentation'),
				interfaces: interfacesSorted.value.filter((inter) => inter.group === 'presentation'),
			},
			{
				key: 'group',
				name: t('interface_group_groups'),
				interfaces: interfacesSorted.value.filter((inter) => inter.group === 'group'),
			},
			{
				key: 'other',
				name: t('interface_group_other'),
				interfaces: interfacesSorted.value.filter((inter) => inter.group === 'other'),
			},
		]);

		const chosenInterface = syncFieldDetailStoreProperty('field.meta.interface');

		const configRow = computed(() => {
			if (!chosenInterface.value) return null;

			let indexInGroup: number | null = null;

			groups.value.forEach((group) => {
				const index = group.interfaces.findIndex((inter) => inter.id === chosenInterface.value);
				if (index !== -1) indexInGroup = index;
			});

			if (indexInGroup === null) return null;

			// TODO different amounts responsively
			return Math.ceil((indexInGroup + 1) / 4) + 1;
		});

		return { isOpen, t, interfaces, groups, isSVG, syncRefProperty, chosenInterface, configRow };

		function isSVG(path: string) {
			return path.startsWith('<svg');
		}
	},
});
</script>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}

.group h2 {
	margin-bottom: 40px;
	padding-bottom: 2px;
	font-weight: 700;
	border-bottom: var(--border-width) solid var(--border-subdued);
}

.group + .group {
	margin-top: 80px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 32px;
}

.interface {
	min-height: 100px;
	overflow: hidden;
	text-align: left;
}

.preview {
	--v-icon-color: var(--background-page);

	display: flex;
	align-items: center;
	justify-content: center;
	width: 160px;
	height: 100px;
	margin-bottom: 8px;
	border: var(--border-width) solid var(--border-subdued);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: background-color, border-color;
}

.preview img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.preview span {
	display: contents;
}

.preview :deep(svg) {
	width: 100%;
	height: 100%;
}

.preview :deep(svg) .glow {
	filter: drop-shadow(0 0 8px var(--primary-50));
}

.preview .v-icon {
	text-shadow: 4px 0px 8px var(--primary-25), -4px 0px 8px var(--primary-25), 0px 4px 8px var(--primary-25),
		0px -4px 8px var(--primary-25);
}

.interface:hover .preview {
	border-color: var(--border-normal);
}

.interface.active .preview {
	border-color: var(--primary);
	background-color: var(--primary-alt);
}
</style>
