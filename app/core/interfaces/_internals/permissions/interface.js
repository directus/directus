/* Component */
define([
  'core/UIView',
  'core/overlays/overlays',
  './table',
  'core/t'
], function (UIView, Overlays, PermissionsTableView, __t) {
  return UIView.extend({
    template: '_internals/permissions/input',

    events: {
      'click .js-toggle-directus-tables': 'onToggleTables'
    },

    onToggleTables: function () {
      this.nestedTableView.toggleSystemTables();
    },

    serialize: function () {
      return {
        isAdmin: this.model.id === 1,
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton, // && this.canEdit,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function () {
      if (this.model.id !== 1) {
        this.setView('.table-container', this.nestedTableView).render();
      }
    },

    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
        this.columnSchema.relationship.get('type') !== 'ONETOMANY') {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'ONETOMANY',
          ui: Component.id
        });
      }

      this.canEdit = !(options.inModal || false);
      this.relatedCollection = this.model.get(this.name);
      this.nestedTableView = new PermissionsTableView({
        model: this.model,
        collection: this.relatedCollection
      });
    }
  });
});
