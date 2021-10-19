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
					<div v-for="inter of group.interfaces" :key="inter.id" class="interface">
						<div class="preview">
							<template v-if="inter.preview">
								<span v-if="isSVG(inter.preview)" v-html="inter.preview" />
								<img v-else :src="inter.preview" alt="" />
							</template>

							<v-icon v-else large :name="inter.icon" />
						</div>
						<v-text-overflow :text="inter.name" class="name" />
					</div>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { Collection } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { getInterfaces } from '@/interfaces';
import { orderBy } from 'lodash';

export default defineComponent({
	emits: ['cancel'],
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
	setup() {
		const { t } = useI18n();
		const isOpen = useDialogRoute();

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

		return { isOpen, t, interfaces, groups, isSVG };

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

.preview .v-icon {
	text-shadow: 4px 0px 8px var(--primary-25), -4px 0px 8px var(--primary-25), 0px 4px 8px var(--primary-25),
		0px -4px 8px var(--primary-25);
}
</style>
