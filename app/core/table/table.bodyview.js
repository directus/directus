define([
  "app",
  "backbone",
  "jquery-ui"
],

function(app, Backbone) {

  var TableBodyView = Backbone.Layout.extend({

    tagName: 'tbody',

    template: 'table-body',

    events: {
      'change td.check > input': 'select',
      'click td.check > input': function() { this.collection.trigger('select'); }
    },

    select: function(e) {
      $target = $(e.target);

      if ($target.attr('checked') !== undefined) {
        $target.closest('tr').addClass('selected');
      } else {
        $target.closest('tr').removeClass('selected');
      }
    },

    serialize: function() {
      var rowIdentifiers, activeState, models, rows;
      var activeColumns = this.collection.getFilter('active') || "1,2";

      rowIdentifiers = this.options.rowIdentifiers;

      activeState = _.map(activeColumns,Number);

      models = this.collection.filter(function(model) {
        if (model.has('active')) {
          return (_.indexOf(activeState, Number(model.get('active'))) > -1);
        } else {
          return true;
        }
      });

      rows = _.map(models, function(model) {
        var classes = _.map(rowIdentifiers, function(columnName) { return 'row-'+columnName+'-'+model.get(columnName); });
        return {model: model, classes: classes};
      });

      return {
        columns: this.collection.getColumns(),
        rows: rows,
        sortable: this.options.sortable,
        selectable: this.options.selectable,
        deleteColumn: this.options.deleteColumn
      };
    },

    drop: function() {
      var collection = this.collection;
      this.$('tr').each(function(i) {
        collection.get($(this).attr('data-id')).set({sort: i},{silent: true});
      });
      collection.save({columns:['id','sort']});
      this.collection.setOrder('sort','ASC',{silent: true});
    },

    initialize: function() {
      this.collection.on('sort', this.render, this);
      //Setup jquery UI sortable
      if (this.options.structure && this.options.structure.get('sort')) {
        this.$el.sortable({
          stop: _.bind(this.drop, this),
          axis: "y",
          containment: "parent",
          handle: '.sort'
        });
      }
    }
  });

  return TableBodyView;

});