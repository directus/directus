define([
  "app",
  "backbone",
  "jquery-ui"
],

function(app, Backbone) {

  var TableHeadView = Backbone.Layout.extend({

    template: 'table-head',

    tagName: 'thead',

    events: {
      'click th.check > input': function(e) {
        $('td.check > input').attr('checked', ($(e.target).attr('checked') !== undefined)).trigger('change');
        this.collection.trigger('select');
      },
      'click th:not(.check)': function(e) {
        var column = $(e.target).attr('data-id');
        var order = this.collection.getOrder();

        //Flip direction if the same column is clicked twice.
        if (order.sort === column) {
          if (order.sort_order === 'ASC') {
            this.collection.setOrder(column, 'DESC');
          }
          else if (order.sort_order === 'DESC') {
            this.collection.setOrder();
          }
        } else {
          this.collection.setOrder(column, 'ASC');
        }
      },

      'click #set-visible-columns': function() {
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
            }
          },

          disableNonSelected: function() {
            this.$el.find('input:not(:checked)').each(function(i, el) {
              $(el).prop('disabled', true);
            });
          },

          enableNonSelected: function() {
            this.$el.find('input:disabled').each(function(i, el) {
              $el = $(el);
              if (!$el.attr('data-foreign')) {
                $el.prop('disabled', false);
              }
            });
          },

          template: 'table-set-columns',

          serialize: function() {
            return this.options.data;
          }

        });

        view = new View({data: data});



        modal = app.router.openModal(view, {title: 'Set visible columns'});

        modal.save = function() {
          var data = this.$el.find('form').serializeObject();
          var string = _.isArray(data.columns_visible) ? data.columns_visible.join(',') : data.columns_visible;
          preferences.save({'columns_visible': string},{
            success: function() {
              collection.trigger('visibility');
              modal.close();
            }
          });
        };

        view.render();
      }
    },

    serialize: function() {
      var order = this.collection.getOrder();
      var columns = _.map(this.collection.getColumns(), function(column) {
        return {name: column, orderBy: column === order.sort, desc: order.sort_order === 'DESC'};
      });

      return {selectable: this.options.selectable, sortable: this.options.sort, columns: columns, deleteColumn: this.options.deleteColumn, hideColumnPreferences: this.options.hideColumnPreferences};
    },

    initialize: function() {
      this.maxColumns = this.options.maxColumns || 8;
      this.collection.on('sort', this.render, this);
    }

  });

  return TableHeadView;

});