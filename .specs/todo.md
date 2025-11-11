# useI18n Refactoring Guide

## Objective
Refactor Vue components to use the global `$t` function in templates instead of importing and using `useI18n` composable.

## Instructions

### When to Refactor
A component is a candidate for refactoring if:
1. It imports `useI18n` from `vue-i18n`
2. It only uses the `t` function from `useI18n` in the template (e.g., `{{ t('key') }}`)
3. It does NOT use `t` in script logic (computed properties, methods, etc.)

### Refactoring Steps

1. **Remove the import**
   - Delete the line: `import { useI18n } from 'vue-i18n';`
   - If importing other items like `TranslateResult`, evaluate if they're still needed

2. **Remove the composable call**
   - Delete the line: `const { t } = useI18n();`

3. **Update template usage**
   - Replace `{{ t('translation_key') }}` with `{{ $t('translation_key') }}`
   - Replace `:prop="t('translation_key')"` with `:prop="$t('translation_key')"`
   - Replace `v-tooltip="t('translation_key')"` with `v-tooltip="$t('translation_key')"`

4. **Test the component**
   - Verify that there are no new typescript errors related to missing definitions for function t()

### Example

**Before:**
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div>
    <h1>{{ t('my_title') }}</h1>
    <button :aria-label="t('close')">X</button>
  </div>
</template>
```

**After:**
```vue
<script setup lang="ts">
// useI18n import removed
</script>

<template>
  <div>
    <h1>{{ $t('my_title') }}</h1>
    <button :aria-label="$t('close')">X</button>
  </div>
</template>
```

### Important Notes

- **DO NOT refactor** if `t` is used in the `<script>` section for:
  - Computed properties
  - Method logic
  - Reactive refs/values
  - Any JavaScript/TypeScript code
  
- **Only refactor** when `t` is used exclusively in the template

- The global `$t` function is available in all Vue component templates by default

## Components to Refactor (298 total)

### Root Level
- [x] app.vue

### Components
- [x] components/v-collection-field-template.vue
- [ ] ~~components/v-date-picker.vue~~ (uses t in script)
- [x] components/v-drawer.vue
- [x] components/v-error.vue
- [x] components/v-field-list/v-field-list-item.vue
- [x] components/v-field-list/v-field-list.vue
- [x] components/v-form/form-field-interface.vue
- [ ] ~~components/v-form/form-field-label.vue~~ (uses t in script function)
- [x] components/v-form/form-field-menu.vue
- [x] components/v-form/form-field-raw-editor.vue
- [ ] ~~components/v-form/form-field.vue~~ (uses t in script computed)
- [x] components/v-form/v-form.vue
- [x] components/v-form/validation-errors.vue
- [ ] ~~components/v-input.vue~~ (uses t in script computed)
- [ ] ~~components/v-remove.vue~~ (uses t in script computed)
- [ ] ~~components/v-select/v-select.vue~~ (uses t in script computed)
- [x] components/v-table/table-header.vue
- [x] components/v-upload.vue
- [x] components/v-workspace-tile.vue

### Displays
- [x] displays/formatted-json-value/formatted-json-value.vue
- [ ] ~~displays/formatted-value/formatted-value.vue~~ (uses t in script)
- [ ] ~~displays/related-values/related-values.vue~~ (uses t/te in script)

### Interfaces - System
- [x] interfaces/_system/system-collection/system-collection.vue
- [x] interfaces/_system/system-collections/system-collections.vue
- [x] interfaces/_system/system-display-options/system-display-options.vue
- [x] interfaces/_system/system-display-template/system-display-template.vue
- [x] interfaces/_system/system-display/system-display.vue
- [x] interfaces/_system/system-field-tree/system-field-tree.vue
- [x] interfaces/_system/system-field/system-field.vue
- [ ] ~~interfaces/_system/system-fields/system-fields.vue~~ (uses t in script computed)
- [x] interfaces/_system/system-filter/input-component.vue
- [x] interfaces/_system/system-filter/input-group.vue
- [ ] ~~interfaces/_system/system-filter/nodes.vue~~ (uses t in script)
- [x] interfaces/_system/system-filter/system-filter.vue
- [ ] ~~interfaces/_system/system-folder/folder.vue~~ (uses t in script computed)
- [ ] ~~interfaces/_system/system-inline-fields/system-inline-fields.vue~~ (uses t in script computed)
- [x] interfaces/_system/system-input-password/input-password.vue
- [x] interfaces/_system/system-input-translated-string/custom-translations-tooltip.vue
- [x] interfaces/_system/system-input-translated-string/input-translated-string.vue
- [x] interfaces/_system/system-interface-options/system-interface-options.vue
- [x] interfaces/_system/system-interface/system-interface.vue
- [ ] ~~interfaces/_system/system-language/system-language.vue~~ (uses t in script)
- [ ] ~~interfaces/_system/system-mcp-prompts-collection-validation/system-mcp-prompts-collection-generate-dialog.vue~~ (uses t in script)
- [x] interfaces/_system/system-mcp-prompts-collection-validation/system-mcp-prompts-collection-validation-existing.vue
- [x] interfaces/_system/system-mcp-prompts-collection-validation/system-mcp-prompts-collection-validation-new.vue
- [x] interfaces/_system/system-mfa-setup/system-mfa-setup.vue
- [x] interfaces/_system/system-modules/system-modules.vue
- [x] interfaces/_system/system-owner/system-owner.vue
- [ ] interfaces/_system/system-permissions/add-collection.vue
- [ ] interfaces/_system/system-permissions/detail/components/actions.vue
- [ ] interfaces/_system/system-permissions/detail/components/app-minimal.vue
- [ ] interfaces/_system/system-permissions/detail/components/fields.vue
- [ ] interfaces/_system/system-permissions/detail/components/permissions.vue
- [ ] interfaces/_system/system-permissions/detail/components/presets.vue
- [ ] interfaces/_system/system-permissions/detail/components/validation.vue
- [ ] interfaces/_system/system-permissions/detail/permissions-detail.vue
- [ ] interfaces/_system/system-permissions/permissions-header.vue
- [ ] interfaces/_system/system-permissions/permissions-row.vue
- [ ] interfaces/_system/system-permissions/permissions-toggle.vue
- [ ] interfaces/_system/system-permissions/system-permissions.vue
- [ ] interfaces/_system/system-raw-editor/system-raw-editor.vue
- [ ] interfaces/_system/system-scope/system-scope.vue
- [ ] interfaces/_system/system-theme/system-theme.vue
- [ ] interfaces/_system/system-token/system-token.vue

### Interfaces - Regular
- [ ] interfaces/collection-item-dropdown/collection-item-dropdown.vue
- [ ] interfaces/file-image/file-image.vue
- [ ] interfaces/file/file.vue
- [ ] interfaces/files/files.vue
- [ ] interfaces/group-accordion/accordion-section.vue
- [ ] interfaces/group-detail/group-detail.vue
- [ ] interfaces/input-autocomplete-api/input-autocomplete-api.vue
- [ ] interfaces/input-block-editor/input-block-editor.vue
- [ ] interfaces/input-code/input-code.vue
- [ ] interfaces/input-hash/input-hash.vue
- [ ] interfaces/input-rich-text-html/input-rich-text-html.vue
- [ ] interfaces/input-rich-text-md/input-rich-text-md.vue
- [ ] interfaces/list-m2a/list-m2a.vue
- [ ] interfaces/list-m2m/list-m2m.vue
- [ ] interfaces/list-o2m-tree-view/item-preview.vue
- [ ] interfaces/list-o2m-tree-view/list-o2m-tree-view.vue
- [ ] interfaces/list-o2m-tree-view/nested-draggable.vue
- [ ] interfaces/list-o2m/list-o2m.vue
- [ ] interfaces/list/list.vue
- [ ] interfaces/list/options.vue
- [ ] interfaces/map/map.vue
- [ ] interfaces/map/options.vue
- [ ] interfaces/presentation-notice/presentation-notice.vue
- [ ] interfaces/select-color/select-color.vue
- [ ] interfaces/select-dropdown-m2o/select-dropdown-m2o.vue
- [ ] interfaces/select-icon/select-icon.vue
- [ ] interfaces/select-multiple-checkbox-tree/select-multiple-checkbox-tree.vue
- [ ] interfaces/select-multiple-checkbox/select-multiple-checkbox.vue
- [ ] interfaces/select-radio/select-radio.vue
- [ ] interfaces/tags/tags.vue
- [ ] interfaces/translations/translation-form.vue
- [ ] interfaces/translations/translations.vue

### Layouts
- [ ] layouts/calendar/calendar.vue
- [ ] layouts/calendar/options.vue
- [ ] layouts/cards/cards.vue
- [ ] layouts/cards/components/header.vue
- [ ] layouts/cards/options.vue
- [ ] layouts/kanban/kanban.vue
- [ ] layouts/kanban/options.vue
- [ ] layouts/map/components/map.vue
- [ ] layouts/map/map.vue
- [ ] layouts/map/options.vue
- [ ] layouts/tabular/options.vue
- [ ] layouts/tabular/tabular.vue

### Modules - Activity
- [ ] modules/activity/components/navigation.vue
- [ ] modules/activity/routes/collection.vue
- [ ] modules/activity/routes/item.vue

### Modules - Content
- [ ] modules/content/components/navigation-bookmark.vue
- [ ] modules/content/components/navigation-item.vue
- [ ] modules/content/components/navigation.vue
- [ ] modules/content/components/version-menu.vue
- [ ] modules/content/routes/collection.vue
- [ ] modules/content/routes/item.vue
- [ ] modules/content/routes/no-collections.vue
- [ ] modules/content/routes/not-found.vue

### Modules - Files
- [ ] modules/files/components/add-folder.vue
- [ ] modules/files/components/file-info-sidebar-detail.vue
- [ ] modules/files/routes/add-new.vue
- [ ] modules/files/routes/collection.vue
- [ ] modules/files/routes/item.vue
- [ ] modules/files/routes/not-found.vue

### Modules - Insights
- [ ] modules/insights/components/dashboard-dialog.vue
- [ ] modules/insights/components/navigation.vue
- [ ] modules/insights/routes/dashboard.vue
- [ ] modules/insights/routes/not-found.vue
- [ ] modules/insights/routes/overview.vue
- [ ] modules/insights/routes/panel-configuration.vue

### Modules - Settings
- [ ] modules/settings/components/navigation.vue
- [ ] modules/settings/routes/ai/components/ai-info-sidebar-detail.vue
- [ ] modules/settings/routes/ai/overview.vue
- [ ] modules/settings/routes/appearance/components/theming-info-sidebar-detail.vue
- [ ] modules/settings/routes/appearance/item.vue
- [ ] modules/settings/routes/data-model/collections/collections.vue
- [ ] modules/settings/routes/data-model/collections/components/collection-dialog.vue
- [ ] modules/settings/routes/data-model/collections/components/collection-item.vue
- [ ] modules/settings/routes/data-model/collections/components/collection-options.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-actions.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-conditions.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-display.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-field.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-interface.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-relationship-m2a.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-relationship-m2m.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-relationship-m2o.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-relationship-o2m.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-relationship-translations.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-schema.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-tabs.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-advanced/field-detail-advanced-validation.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-simple/field-configuration.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-simple/field-detail-simple.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail-simple/relationship-configuration.vue
- [ ] modules/settings/routes/data-model/field-detail/field-detail.vue
- [ ] modules/settings/routes/data-model/field-detail/shared/extension-options.vue
- [ ] modules/settings/routes/data-model/field-detail/shared/related-collection-select.vue
- [ ] modules/settings/routes/data-model/field-detail/shared/related-field-select.vue
- [ ] modules/settings/routes/data-model/fields/components/field-select-menu.vue
- [ ] modules/settings/routes/data-model/fields/components/field-select.vue
- [ ] modules/settings/routes/data-model/fields/components/fields-management.vue
- [ ] modules/settings/routes/data-model/fields/fields.vue
- [ ] modules/settings/routes/data-model/new-collection.vue
- [ ] modules/settings/routes/extensions/components/extension-group-divider.vue
- [ ] modules/settings/routes/extensions/components/extension-item-options.vue
- [ ] modules/settings/routes/extensions/components/extension-item.vue
- [ ] modules/settings/routes/extensions/components/extensions-info-sidebar-detail.vue
- [ ] modules/settings/routes/extensions/extensions.vue
- [ ] modules/settings/routes/flows/components/logs-drawer.vue
- [ ] modules/settings/routes/flows/components/logs-sidebar-detail.vue
- [ ] modules/settings/routes/flows/components/operation-detail.vue
- [ ] modules/settings/routes/flows/components/operation.vue
- [ ] modules/settings/routes/flows/components/options-overview.vue
- [ ] modules/settings/routes/flows/components/trigger-detail.vue
- [ ] modules/settings/routes/flows/flow-drawer.vue
- [ ] modules/settings/routes/flows/flow.vue
- [ ] modules/settings/routes/flows/overview.vue
- [ ] modules/settings/routes/marketplace/components/extension-list-item.vue
- [ ] modules/settings/routes/marketplace/routes/account/account.vue
- [ ] modules/settings/routes/marketplace/routes/account/components/account-info-sidebar-detail.vue
- [ ] modules/settings/routes/marketplace/routes/account/components/account-metadata.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-banner.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-info-sidebar-detail.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-install.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata-author.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata-compatibility.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata-date.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata-downloads.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata-license.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata-size.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-metadata.vue
- [ ] modules/settings/routes/marketplace/routes/extension/components/extension-readme.vue
- [ ] modules/settings/routes/marketplace/routes/extension/extension.vue
- [ ] modules/settings/routes/marketplace/routes/registry/components/inline-filter.vue
- [ ] modules/settings/routes/marketplace/routes/registry/components/registry-info-sidebar-detail.vue
- [ ] modules/settings/routes/marketplace/routes/registry/registry.vue
- [ ] modules/settings/routes/not-found.vue
- [ ] modules/settings/routes/policies/add-new.vue
- [ ] modules/settings/routes/policies/collection.vue
- [ ] modules/settings/routes/policies/item.vue
- [ ] modules/settings/routes/policies/policy-info-sidebar-detail.vue
- [ ] modules/settings/routes/presets/collection/collection.vue
- [ ] modules/settings/routes/presets/collection/components/presets-info-sidebar-detail.vue
- [ ] modules/settings/routes/presets/item.vue
- [ ] modules/settings/routes/project/components/project-info-sidebar-detail.vue
- [ ] modules/settings/routes/project/project.vue
- [ ] modules/settings/routes/roles/add-new.vue
- [ ] modules/settings/routes/roles/collection.vue
- [ ] modules/settings/routes/roles/item.vue
- [ ] modules/settings/routes/roles/public-item.vue
- [ ] modules/settings/routes/roles/role-info-sidebar-detail.vue
- [ ] modules/settings/routes/system-logs/components/inline-filter.vue
- [ ] modules/settings/routes/system-logs/components/logs-display.vue
- [ ] modules/settings/routes/system-logs/components/system-logs-sidebar-detail.vue
- [ ] modules/settings/routes/system-logs/logs.vue
- [ ] modules/settings/routes/translations/collection.vue
- [ ] modules/settings/routes/translations/item.vue
- [ ] modules/settings/routes/webhooks/collection.vue
- [ ] modules/settings/routes/webhooks/item.vue

### Modules - Users
- [ ] modules/users/components/navigation-role.vue
- [ ] modules/users/components/navigation.vue
- [ ] modules/users/components/user-info-sidebar-detail.vue
- [ ] modules/users/routes/collection.vue
- [ ] modules/users/routes/item.vue

### Modules - Visual
- [ ] modules/visual/components/editing-layer.vue
- [ ] modules/visual/routes/visual-editor.vue

### Panels
- [ ] panels/bar-chart/panel-bar-chart.vue
- [ ] panels/line-chart/panel-line-chart.vue
- [ ] panels/meter/panel-meter.vue
- [ ] panels/metric-list/panel-metric-list.vue
- [ ] panels/metric/panel-metric.vue
- [ ] panels/pie-chart/panel-pie-chart.vue
- [ ] panels/relational-variable/multiple-relation.vue
- [ ] panels/relational-variable/panel-relational-variable.vue
- [ ] panels/relational-variable/single-relation.vue
- [ ] panels/time-series/panel-time-series.vue

### Routes
- [ ] routes/accept-invite.vue
- [ ] routes/login/components/continue-as.vue
- [ ] routes/login/components/login-form/ldap-form.vue
- [ ] routes/login/components/login-form/login-form.vue
- [ ] routes/login/components/sso-links.vue
- [ ] routes/login/login.vue
- [ ] routes/private-not-found.vue
- [ ] routes/register/register-form.vue
- [ ] routes/register/register.vue
- [ ] routes/reset-password/request.vue
- [ ] routes/reset-password/reset-password.vue
- [ ] routes/reset-password/reset.vue
- [ ] routes/setup/form.vue
- [ ] routes/setup/setup.vue
- [ ] routes/shared/shared.vue
- [ ] routes/tfa-setup.vue

### Views - Private
- [ ] views/private/components/archive-sidebar-detail.vue
- [ ] views/private/components/basic-import-sidebar-detail.vue
- [ ] views/private/components/bookmark-add.vue
- [ ] views/private/components/comment-input.vue
- [ ] views/private/components/comment-item-header.vue
- [ ] views/private/components/comments-sidebar-detail.vue
- [ ] views/private/components/comparison/comparison-header.vue
- [ ] views/private/components/comparison/comparison-modal.vue
- [ ] views/private/components/drawer-batch.vue
- [ ] views/private/components/drawer-collection.vue
- [ ] views/private/components/drawer-files.vue
- [ ] views/private/components/export-sidebar-detail.vue
- [ ] views/private/components/file-preview-replace.vue
- [ ] views/private/components/files-navigation-folder.vue
- [ ] views/private/components/files-navigation.vue
- [ ] views/private/components/flow-sidebar-detail.vue
- [ ] views/private/components/folder-picker.vue
- [ ] views/private/components/image-editor.vue
- [ ] views/private/components/import-error-dialog.vue
- [ ] views/private/components/latency-indicator.vue
- [ ] views/private/components/layout-sidebar-detail.vue
- [ ] views/private/components/license-banner.vue
- [ ] views/private/components/live-preview.vue
- [ ] views/private/components/module-bar-avatar.vue
- [ ] views/private/components/module-bar-logo.vue
- [ ] views/private/components/notification-dialogs.vue
- [ ] views/private/components/notifications-drawer.vue
- [ ] views/private/components/notifications-preview.vue
- [ ] views/private/components/overlay-item-content.vue
- [ ] views/private/components/overlay-item.vue
- [ ] views/private/components/refresh-sidebar-detail.vue
- [ ] views/private/components/revision-item.vue
- [ ] views/private/components/revisions-sidebar-detail.vue
- [ ] views/private/components/save-options.vue
- [ ] views/private/components/search-input.vue
- [ ] views/private/components/share-item.vue
- [ ] views/private/components/shares-sidebar-detail.vue
- [ ] views/private/components/skip-menu.vue
- [ ] views/private/components/user-popover.vue
- [ ] views/private/components/users-invite.vue
- [ ] views/private/private-view.vue

### Views - Public & Shared
- [ ] views/public/public-view.vue
- [ ] views/shared/shared-view.vue

---

## Progress Tracking
- **Total Components**: 298
- **Completed**: 16
- **Skipped (uses t in script)**: 5
- **Remaining**: 277
- **Progress**: 5%

---

**Note**: This list was generated on November 11, 2025. Some components may have already been refactored or new components may have been added since this list was created. Please verify the current state of each component before starting work.
