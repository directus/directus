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
        var visibleColumns = preferences.get('columns_visible').split(',');
        var data = {};
        var view, modal;

        data.columns = structure.chain()
          .filter(function(model) { return !model.get('system') && !model.get('hidden_list'); } )
          .map(function(model) { return {name: model.id, visible: (visibleColumns.indexOf(model.id) > -1)}; })
          .value();

        view = new Backbone.Layout({template: 'table-set-columns', serialize: data});
        modal = app.router.openModal(view, {title: 'Set visible columns'});

        modal.save = function() {
          var data = this.$el.find('form').serializeObject();
          var string = _.isArray(data.columns_visible) ? data.columns_visible.join(',') : data.columns_visible;
          preferences.save({'columns_visible': string},{
            success: function() { modal.close(); }
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

      return {selectable: this.options.selectable, sortable: this.options.sortable, columns: columns, deleteColumn: this.options.deleteColumn};
    },

    initialize: function() {
      this.collection.on('sort', this.render, this);
    }

  });

  return TableHeadView;

});