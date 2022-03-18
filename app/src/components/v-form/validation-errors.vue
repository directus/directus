<template>
	<v-notice type="danger" class="full">
		<div>
			<p>{{ t('validation_errors_notice') }}</p>
			<ul class="validation-errors-list">
				<li v-for="(validationError, index) of validationErrors" :key="index">
					<strong class="field" @click="$emit('scroll-to-field', validationError.group || validationError.field)">
						<template v-if="validationError.field && validationError.hidden && validationError.group">
							{{
								`${formatTitle(validationError.field)} (${t('hidden_in_group', {
									group: formatTitle(validationError.group),
								})})`
							}}
						</template>
						<template v-else-if="validationError.field && validationError.hidden">
							{{ `${formatTitle(validationError.field)} (${t('hidden')})` }}
						</template>
						<template v-else-if="validationError.field">{{ formatTitle(validationError.field) }}</template>
					</strong>
					<span>:&nbsp;</span>
					<template v-if="validationError.code === 'RECORD_NOT_UNIQUE'">
						{{ t('validationError.unique', validationError) }}
					</template>
					<template v-else>
						{{ t(`validationError.${validationError.type}`, validationError) }}
					</template>
				</li>
			</ul>
		</div>
	</v-notice>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { ValidationError } from '@directus/shared/types';
import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			required: true,
		},
	},
	emits: ['scroll-to-field'],
	setup() {
		const { t } = useI18n();

		return { t, formatTitle };
	},
});
</script>

<style lang="scss" scoped>
.validation-errors-list {
	margin-top: 4px;
	padding-left: 28px;

	.field {
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}

	li:not(:last-child) {
		margin-bottom: 4px;
	}
}
</style>
