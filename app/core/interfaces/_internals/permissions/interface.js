define(['core/UIComponent', 'core/UIView', 'core/overlays/overlays', 'core/interfaces/_internals/permissions/table', 'core/t'], function (UIComponent, UIView, Overlays, PermissionsTableView, __t) {
  var Input = UIView.extend({
    template: '_internals/permissions/input',

    events: {
      'click .js-toggle-directus-tables': 'onToggleTables'
    },

    onToggleTables: function () {
      this.showCoreTables = this.nestedTableView.toggleTables();
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

  var Component = UIComponent.extend({
    id: 'directus_permissions',
    dataTypes: ['ONETOMANY'],
    variables: [
      {id: 'visible_columns', type: 'String', ui: 'textinput', char_length: 255, required: true},
      {id: 'result_limit', type: 'Number', ui: 'numeric', char_length: 10, default_value: 100, comment: __t('o2m_result_limit_comment')},
      {id: 'add_button', type: 'Boolean', ui: 'checkbox'},
      {id: 'choose_button', type: 'Boolean', ui: 'checkbox', default_value: true},
      {id: 'remove_button', type: 'Boolean', ui: 'checkbox'},
      {id: 'only_unassigned', type: 'Boolean', ui: 'checkbox', default_value: false}
    ],
    Input: Input,
    validate: function (collection, options) {
      if (options.schema.isRequired() && collection.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function () {
      return 'x';
    }
  });

  return Component;
});
