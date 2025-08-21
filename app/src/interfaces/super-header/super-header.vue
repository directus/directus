<style scoped lang="scss">
.page-header {
	position: relative;
	display: block;
	inline-size: 100%;
}

.header-content {
	container-type: inline-size;
	inline-size: 100%;
	display: flex;
	gap: calc(var(--theme--form--column-gap) / 2);
	padding-block-end: 8px;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
	color: var(--header-color, var(--theme--foreground));
	align-items: flex-start;
	justify-content: space-between;
	min-inline-size: 0;
}

.text-container {
	flex: 1;
	display: flex;
	gap: 8px;
	min-inline-size: 0;

	.v-icon {
		--v-icon-color: var(--header-color);
		margin-block-start: 2px;
		flex-shrink: 0;
	}

	.text-content {
		min-inline-size: 0;
		flex: 1;

		.text-title {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-size: 20px;
			font-weight: 600;
		}

		.text-subtitle {
			margin-block-start: 4px;
			font-size: 14px;
			color: color-mix(in srgb, var(--theme--foreground), var(--theme--background) 25%);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
}

.actions-wrapper {
	flex-shrink: 0;
}

.actions-container {
	display: flex;
	gap: 12px;
	align-items: center;

	.v-button {
		inline-size: 100%;
		justify-content: center;
		position: relative;
	}

	.full-button {
		display: block;
		position: relative;
	}

	.icon-button {
		display: none;
		position: relative;
	}

	@container (max-width: 600px) {
		align-items: stretch;
		inline-size: 100%;

		.full-button {
			display: none;
			position: relative;
		}

		.icon-button {
			display: block;
			position: relative;
		}
	}
}

.help-text {
	padding-block: 16px;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);

	:deep(.helper-text) {
		padding: var(--v-card-padding, 16px);
		padding-block-start: 0;
		max-inline-size: 100%;
		overflow-x: auto;
	}
}

.collapse-button-container {
	display: flex;
	justify-content: flex-end;
}

.confirm-form {
	--theme--form--column-gap: 24px;
	--theme--form--row-gap: 24px;

	margin-block-start: var(--v-card-padding, 16px);

	:deep(.type-label) {
		font-size: 1rem;
	}
}

.help-modal {
	position: relative;

	--theme--form--row-gap: 16px;

	.close-button {
		position: absolute;
		inset-block-start: 16px;
		inset-inline-end: 16px;
	}
}
</style>
