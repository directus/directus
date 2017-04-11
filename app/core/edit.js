define(function(require, exports, module) {

  'use strict';

  var app         = require('app');
  var _           = require('underscore');
  var StringHelper= require('helpers/string');
  var Backbone    = require('backbone');
  var Handlebars  = require('handlebars');
  var UIManager   = require('./UIManager');

  var UIContainer = Backbone.Layout.extend({

    tagName: 'div',

    dom: {
      BATCH_EDIT: 'batch-edit'
    },

    attributes: function () {
      var classes = ['field'];

      if (this.options.batchEdit) {
        classes.push(this.dom.BATCH_EDIT);
      }

      return {
        class: classes.join(' ')
      };
    },

    template: 'interface-container',

    events: {
      'click .js-button-accept': 'acceptBatchEdit',
      'click .js-button-cancel': 'cancelBatchEdit'
    },

    state: {
      batchEnabled: false
    },

    acceptBatchEdit: function () {
      if (!this.state.batchEnabled) {
        this.changeBatchEdit(true);
      }
    },

    cancelBatchEdit: function () {
      if (this.state.batchEnabled) {
        this.changeBatchEdit(false);
      }
    },

    changeBatchEdit: function (enabled) {
      if (!this.options.batchEdit) {
        return;
      }

      enabled = !!enabled;

      var $input = this.$('input[name=batch_edit_' + this.column.id + ']').first();
      this.$el.toggleClass(this.dom.BATCH_EDIT);

      $input.val(enabled ? 1 : 0);
      this.state.batchEnabled = !!enabled;
    },

    serialize: function() {
      // editing UIs settings does not have a specified table assigned to it.
      var tableInfo = this.column.collection.table;
      var tableName, comment;

      if (tableInfo) {
        tableName = tableInfo.id
      }

      return {
        id: this.column.id,
        uiName: app.capitalize(this.column.get('ui')),
        name: app.capitalize(this.column.id),
        comment: new Handlebars.SafeString(StringHelper.parse(this.column.get('comment'))),
        batchEdit: this.options.batchEdit,
        hideLabel: _.result(this.view, 'hideLabel'),
        required: this.column.get('required'),
        // Let assume for now that all tables that start with directus_ are core tables
        // TODO: we should store all our core tables names
        isCoreTable: tableName ? tableName.indexOf('directus_') === 0 : false,
        table: tableName
      };
    },

    beforeRender: function() {
      var fieldClass = _.result(this.view, 'fieldClass');

      if (fieldClass) {
        this.$el.addClass(fieldClass);
      }
    },

    afterRender: function() {
      var obj = this.view || this.column;
      if (obj.isRequired()) {
        this.$el.addClass('required');
      }
    },

    initialize: function(options) {
      this.view = options.view;
      this.column = options.column;
    }
  });

  var EditView = module.exports = Backbone.Layout.extend({

    hiddenFields: [],

    tagName: 'form',

    template: 'edit',

    beforeRender: function() {
      var views = {};
      var isBatchEdit = this.options.isBatchEdit;
      var model = this.model;
      var table = model.table;
      var statusName = table ? table.getStatusColumnName() : app.statusMapping.get('*').get('status_name');

      this.structure.each(function(column) {

        // Skip ID
        // if('id' === column.id) {
        if (column.get('key') === 'PRI' && column.get('omit_input') !== false && !model.isNew()) {
          return;
        }

        // This column interface won't be rendered
        // or submitted
        if (column.get('omit_input') === true) {
          return;
        }

        if (model.isReadBlacklisted && model.isReadBlacklisted(column.id)) {
          return false;
        }

        // Skip magic owner column if we dont have bigedit
        if (table && table.get('user_create_column') === column.id && !model.collection.hasPermission('bigedit')) {
          return;
        }

        if (column.isStatusColumn()) {
          var collection = this.model.collection;
          var canAdd = this.model.isNew() && collection.canAdd();
          var canEdit = !this.model.isNew() && collection.canEdit();
          if (!canAdd && !canEdit) {
            return;
          }

          if (this.options.collectionAdd) {
            this.model.set(statusName, app.statusMapping.get(table.id).get('default_value'));
          }

          if (model.isNew()) {
            var tableStatusColumn = model.structure.get(statusName);

            if (tableStatusColumn) {
              model.set(statusName, tableStatusColumn.get('default_value'));
            }

            // if (tableStatusColumn && tableStatusColumn.get('default_value')) {
            //   model.set(statusName, tableStatusColumn.get('default_value'));
            // } else {
            //   model.set(statusName, app.statusMapping.active_num);
            // }
          }

          // Set this to be first field in edit table by modifiying groupings.
          if (table && table.get('column_groupings')) {
            var columnGrouping = table.get('column_groupings');
            table.set({'column_groupings': statusName + '^' + columnGrouping});
          }
        }

        var inputOptions = {
          structure: this.structure,
          inModal: this.inModal
        };

        if (column.get('key') === 'PRI') {
          inputOptions.canWrite = false;
        }

        var view = UIManager.getInputInstance(model, column.id, inputOptions);
        if (model.addInput) {
          model.addInput(column.id, view);
        }

        //
        // if (column.isStatusColumn()) {
        //   model.on('change:' + statusName, function (model, value) {
        //     view.$('input[name=' + statusName + ']').val(value);
        //   });
        // }

        // Display:none; hidden fields
        var isHidden = _.contains(this.hiddenFields, column.id);
        if (isHidden) {
          view.$el.css({'display':'none'});
        }

        if (view.isRequired()) {
          view.$el.addClass('required');
          column.set('required', true);
        }

        if (!isHidden) {
          var uiContainer = new UIContainer({
            model: model,
            column: column,
            batchEdit: isBatchEdit,
            view: view
          });
          uiContainer.insertView('.interface', view);
          views[column.id] = uiContainer;
        } else {
          this.insertView('.fields',view);
        }
      }, this);

      var self = this;
      if (table && table.get('column_groupings')) {
        // Does this honor user field permissions? Should switch to JSON with Settings interface
        // Format:
        // Section 1:title,key_image^Section 2:address,date_published
        var grouping = table.get('column_groupings');
        var i = 1;
        grouping.split('^').forEach(function (group) {
          var title = '';
          if (group.indexOf(':') !== -1) {
            title = group.substring(0, group.indexOf(':'));
            group = group.substring(group.indexOf(':') + 1);
          }
          var compileString = '<div class="section-header"><span class="big-label-text">' + title + '</span></div><div class="grouping-view"></div>';
          self.insertView('.fields', new Backbone.Layout({attributes: {class:'gutter-bottom-big', id:'grouping_' + i}, template: Handlebars.compile(compileString)}));
          group.split(',').forEach(function(subgroup) {
            if (views[subgroup] !== undefined) {
              self.insertView('#grouping_' + i + ' div.grouping-view', views[subgroup]);
            }
          });
          i++;
        });
      } else {
        if (views[statusName]) {
          this.insertView('.fields', new Backbone.Layout({attributes: {class:'gutter-bottom-big', id:'grouping_0'}}));
          this.insertView('#grouping_0', views[statusName]);
          delete views[statusName];
        }

        this.insertView('.fields', new Backbone.Layout({attributes: {class:'gutter-bottom-big', id:'grouping_1'}}));
        for (var key in views) {
          self.insertView('#grouping_1', views[key]);
        }
      }
    },

    constructor: function (options) {
      Backbone.Layout.__super__.constructor.call(this, options);
      this.$el.addClass('two-column-form');
      this.options.isBatchEdit = this.options.batchIds !== undefined;
    },

    getHiddenSystemColumns: function () {
      var columns = [];
      // hide system columns
      var table = this.model ? this.model.table : null;

      if (table) {
        var primaryColumnName = table.getPrimaryColumnName();
        var sortColumnName = table.getSortColumnName();
        var statusColumnName = table.getStatusColumnName();

        if (table.columns.get(primaryColumnName).get('omit_input') !== false) {
          columns.push(primaryColumnName);
        }

        if (primaryColumnName !== sortColumnName) {
          columns.push(sortColumnName);
        }

        if (statusColumnName) {
          columns.push(statusColumnName);
        }
      }

      return columns;
    },

    // Focus on first input
    afterRender: function() {
      if (this.options.focusOnFirst !== false) {
        var $first = this.$el.find(':input:first:visible');
        $first.focus();
        $first.val($first.val());
      }

      // If this is a nested collection (to-Many) "Add" modal, preset & hide the parent foreign key.
      if(this.options.collectionAdd && !_.isEmpty(this.options.parentField)) {
        this.model.set(this.options.parentField.name, this.options.parentField.value);
        var $select = this.$el.find('[name=' + this.options.parentField.name + ']');
        $select.closest('fieldset').hide();
      }

    },

    data: function() {
      var data = this.$el.serializeObject();
      var whiteListedData = _.pick(data, this.visibleFields);
      if(this.model.getWriteFieldBlacklist) {
        whiteListedData = _.omit(whiteListedData, this.model.getWriteFieldBlacklist());
      }
      // check if any of the listed data has multiple values, then serialize it to string
      _.each(whiteListedData, function(value, key, obj) {
        if (_.isArray(value)) {
          obj[key] = value.join(',');
        }
      });

      return whiteListedData;
    },

    initialize: function(options) {

      var structureHiddenFields,
          optionsHiddenFields = options.hiddenFields || [];

      this.inModal = options.inModal || false;
      this.structure = options.structure || this.model.getStructure() || this.structure;

      if (this.structure === undefined) {
        throw new Error('The edit view will not work without a valid model schema');
      }

      // Hide fields defined as hidden in the schema
      structureHiddenFields = this.structure.chain()
        .filter(function(column) { return column.get('hidden_input'); })
        .pluck('id')
        .value();

      this.hiddenFields = this.getHiddenSystemColumns().concat(this.hiddenFields || []);

      this.hiddenFields = _.union(optionsHiddenFields, structureHiddenFields, this.hiddenFields);
      this.visibleFields = _.difference(this.structure.pluck('id'), this.hiddenFields);


      // @todo rewrite this!
      this.model.on('invalid', function(model, errors) {
        //Get rid of all errors
        this.$el.find('.error-color').remove();
        this.$el.find('.error').removeClass('error');
        _.each(errors, function(item) {
          var $fieldset = $('#edit_field_' + item.attr);
          $fieldset.addClass('error');
          if ($fieldset.find('.error-color').length < 1) {
            $fieldset.append('<span class="error-color validation-error">'+item.message+'</span>');
          }
        });
      }, this);

      this.model.once('sync', function(e) {
        this.model.changed = {};
        this.render();
      }, this);
    }
  });

});
