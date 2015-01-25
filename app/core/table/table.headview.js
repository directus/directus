define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var TableHeadView = Backbone.Layout.extend({

    template: 'tables/table-head',

    tagName: 'thead',

    events: {

      'click th.check > input': function(e) {
        $('td.check > input').prop('checked', $('#check-all:checked').prop('checked') !== undefined).trigger('changed');
        this.collection.trigger('select');
      },

      'click th:not(.check, .visible-columns-cell)': function(e) {
        var column = $(e.target).closest('th').attr('data-id'); // .closet() accounts for event return children (icon) elements instead
        var order = this.collection.getOrder();
        var isDefaultSorting = (order.sort === column && order.sort_order == 'DESC');
        var defaultSortColumn = this.collection.structure.where({column_name: 'sort'}).length ? 'sort' : 'id';

        if(isDefaultSorting) {
          this.collection.setOrder(defaultSortColumn, 'ASC');
          return;
        }

        //Flip direction if the same column is clicked twice.
        if (order.sort === column) {
          if (order.sort_order === 'ASC') {
            this.collection.setOrder(column, 'DESC');
          }
          else if (order.sort_order === 'DESC') {
            this.collection.setOrder(order.sort, order.sort_order);
          }
        } else {
          this.collection.setOrder(column, 'ASC');
        }
      },

      'click #set-visible-columns': function() {
        if(this.visibleColumnsView) {
          this.visibleColumnsView = null;
          this.removeView('#visible_columns_entry');
          return;
        }

        var structure = this.options.collection.structure;
        var preferences = this.collection.preferences;
        var collection = this.collection;
        var visibleColumns = preferences.get('columns_visible').split(',');
        var data = {};
        var view, modal;
        var totalSelected = 0;

        data.columns = structure.chain()
          .filter(function(model) {
            return !model.get('system') && !model.get('hidden_list');
          })
          .map(function(model) {
            var isVisible = _.contains(visibleColumns, model.id);
            var isForeign = _.contains(['MANYTOMANY', 'ONETOMANY'],
                                       model.getRelationshipType());

            if (isVisible) {
              totalSelected++;
            }

            return {
              name: model.id,
              visible: isVisible,
              disabled: isForeign,
              isForeign: isForeign
            };
          }, this)
          .value();

        if (totalSelected >= this.maxColumns) {
          data.columns = _.map(data.columns, function(column) {
            if (!column.visible) {
              column.disabled = true;
            }
            return column;
          });
        }

        data.maxColumns = this.maxColumns;

        var View = Backbone.Layout.extend({

          events: {
            'click input': function() {
              var checkedInputs = this.$el.find('input:checked'),
                  maxColumns = this.options.data.maxColumns;

              if (checkedInputs.length >= maxColumns) {
                this.disableNonSelected();
              } else {
                this.enableNonSelected();
              }
            },
            'click #saveVisibleColumnsBtn': function() {
              this.save();
            },
            'click #cancelVisibleColumnsBtn': function() {
              this.cancelSelection();
            }
          },

          disableNonSelected: function() {
            this.$el.find('input:not(:checked)').each(function(i, el) {
              $(el).prop('disabled', true);
            });
          },

          enableNonSelected: function() {
            this.$el.find('input:disabled').each(function(i, el) {
              var $el = $(el);
              if (!$el.attr('data-foreign')) {
                $el.prop('disabled', false);
              }
            });
          },

          template: 'tables/table-set-columns',

          serialize: function() {
            return this.options.data;
          }

        });

        this.visibleColumnsView = new View({data: data});

        var that = this;

        this.visibleColumnsView.cancelSelection = function() {
          that.visibleColumnsView = null;
          this.remove();
        };

        this.visibleColumnsView.save = function() {
          var data = this.$el.find('form').serializeObject();
          var string = _.isArray(data.columns_visible) ? data.columns_visible.join(',') : data.columns_visible;
          var that2 = this;

          preferences.save({'columns_visible': string},{
            success: function() {
              collection.trigger('visibility');
              that2.cancelSelection();
            }
          });

          that.collection.filters.columns_visible = data.columns_visible;
          that.collection.fetch();
        };

        this.render();
      },
      'click .sortableHeader': function(e) {
        if(this.parentView.sortableWidget.options.sort)
        {
          this.$el.closest('table').addClass('disable-sorting');
          this.parentView.sortableWidget.options.sort = false;
          noty({text: "<b>Sorting Disabled</b><br><i>Drag-and-drop sorting is now disabled</i>", type: 'information', timeout: 3000, theme: 'directus'});
        } else {
          this.$el.closest('table').removeClass('disable-sorting');
          this.parentView.sortableWidget.options.sort = true;
          noty({text: "<b>Sorting Enabled</b><br><i>You can now sort items with drag-and-drop</i>", type: 'information', timeout: 3000, theme: 'directus'});
        }
      },
      'click th:not(.sortableHeader)': function(e) {
        if(this.parentView.sortableWidget && this.parentView.sortableWidget.options.sort)
        {
          this.$el.closest('table').addClass('disable-sorting');
          this.parentView.sortableWidget.options.sort = false;
          noty({text: "<b>Sorting Disabled</b><br><i>Drag-and-drop sorting is now disabled</i>", type: 'information', timeout: 3000, theme: 'directus'});
        }
      }
    },

    beforeRender: function() {
      if(this.visibleColumnsView) {
        this.setView('#visible_columns_entry', this.visibleColumnsView);
      }
    },

    serialize: function() {
      var order = this.collection.getOrder();
      var blacklist = this.options.blacklist || [];
      var columns = _.map(this.collection.getColumns(), function(column) {
        return {name: column, orderBy: column === order.sort, desc: order.sort_order === 'DESC'};
      });

      columns = _.filter(columns, function(col) {
        return !_.contains(blacklist, col.name);
      });

      return {selectable: this.options.selectable, sortable: this.options.sort, columns: columns, deleteColumn: this.options.deleteColumn, hideColumnPreferences: this.options.hideColumnPreferences};
    },

    initialize: function(options) {
      this.parentView = options.parentView;

      this.maxColumns = this.options.maxColumns || 8;
      var that = this;
      if(this.collection.preferences) {
        this.collection.filters.columns_visible = [];
        this.collection.preferences.get('columns_visible').split(',').forEach(function(column) {
          //Only add columns that actually exist
          if(that.collection.structure.get(column) !== undefined) {
            that.collection.filters.columns_visible.push(column);
          }
        });
      }

      this.collection.on('sort', this.render, this);
    }

  });

  return TableHeadView;

});