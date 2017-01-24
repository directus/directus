//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/table/table.view', 'core/overlays/overlays', 'core/t'], function(app, UIComponent, UIView, TableView, Overlays, __t) {

  'use strict';

  var template = '<div class="related-table table-container"></div> \
                  <div class="button-group"> \
                    <div class="button js-button">\
                      <i class="material-icons">add</i> Add New Column\
                    </div> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,
    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click .js-button': 'addRow'
    },

    editRow: function(e) {
      if (!this.canEdit) {
        return;
      }

      var id = $(e.target).closest('tr').data('id');
      var collection = app.schemaManager.getTable(this.model.id).columns;
      var columnModel = collection.get(id, true);
      var EditColumnView = require('modules/settings/views/EditColumnView');
      var optionsModel = columnModel.options;
      optionsModel.set({id: columnModel.get('ui')});

      var schema = app.schemaManager.getColumns('ui', optionsModel.id);
      optionsModel.structure = schema;
      var view = new EditColumnView({
        model: optionsModel,
        schema: schema
      });

      view.save = function() {
        optionsModel.save(view.editView.data(), {success: function() {
        }});

        view._close();
      };

      app.router.openViewInModal(view);
    },

    addRow: function() {
      alert('adding new column');
    },

    serialize: function() {
      return {
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function() {
      this.setView('.related-table', this.nestedTableView).render();
    },

    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
        'ONETOMANY' !== this.columnSchema.relationship.get('type')) {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'ONETOMANY',
          ui: Component.id
        });
      }

      this.canEdit = !(options.inModal || false);

      var columns = this.model.get(this.name);
      var relatedCollection = columns.structure;
      var joinColumn = this.columnSchema.relationship.get('junction_key_right');
      var ids = relatedCollection.pluck('id');

      if (ids.length > 0) {
        // Make sure column we are joining on is respected
        var filters = columns.filters || {};
        if (filters.columns_visible.length === 0) {
          filters.columns_visible = relatedCollection.structure.at(0).get('id');
        }

        //Pass this filter to select only where column = val
        filters.related_table_filter = {column: joinColumn, val: this.model.id};

        if(this.columnSchema.options.get('result_limit') !== undefined) {
          filters.perPage = this.columnSchema.options.get('result_limit');
        }

        relatedCollection.fetch({includeFilters: false, data: filters});
      }

      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;

      this.nestedTableView = new TableView({
        collection: columns,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: true,
        deleteColumn: this.canEdit && this.showRemoveButton,
        hideColumnPreferences: true,
        hideEmptyMessage: true,
        tableHead: false,
        fixedHead: false,
        filters: {
          booleanOperator: '&&',
          expressions: [
            //@todo, make sure that this can also nest
            {column: joinColumn, operator: '===', value: this.model.id}
          ]
        }
      });

      if (columns.structure.get('sort')) {
        columns.setOrder('sort','ASC',{silent: true});
      }

      this.listenTo(columns, 'add change', function() {
        // Check if any rendered objects in collection to show or hide header
        var filterCb = function(d) {
          return d.get(app.statusMapping.status_name) !== app.statusMapping.deleted_num;
        };

        this.nestedTableView.tableHead = this.relatedCollection.filter(filterCb).length > 0;
        this.nestedTableView.render();
      }, this);

      this.listenTo(columns, 'remove', function() {
        this.nestedTableView.render();
      }, this);

      this.relatedCollection = columns;
    }
  });

  var Component = UIComponent.extend({
    id: 'columns',
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
    validate: function(collection, options) {
      if (options.schema.isRequired() && collection.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function() {
      return 'x';
    }
  });

  return Component;
});
