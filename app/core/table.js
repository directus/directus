define([
  "app",
  "backbone",
  "jquery-ui"
],

function(app, Backbone) {

  var Toolbar = Backbone.Layout.extend({

    template: 'table-toolbar',

    events: {

      'click #set-visibility > button': function(e) {
        var value = $(e.target).attr('data-value');
        var collection = this.collection;
        $('td.check > input:checked').each(function() {
          var id = this.value;
          collection.get(id).set({active: value}, {silent: true});
        });
        collection.save({columns: ['id','active']});
      },

      'click #visibility .dropdown-menu li > a': function(e) {
        var value = $(e.target).attr('data-value');
        this.collection.setFilter({currentPage: 0, active: value});
        this.collection.fetch();
        //this.options.preferences.save({status: value});
      },
      'keypress #table-filter': function(e) {
        if (e.which == 13) {
          var text = $('#table-filter').val();
          this.collection.setFilter('search', text);
          this.collection.fetch();
        }
        //this.collection.trigger('search', text);
      },
      'click a.pag-next:not(.disabled)': function() {
        this.collection.filters.setFilter('currentPage', this.collection.getFilter('currentPage') + 1);
        this.collection.fetch();
      },
      'click a.pag-prev:not(.disabled)': function() {
        this.collection.filters.setFilter('currentPage', this.collection.getFilter('currentPage') - 1);
        this.collection.fetch();
      },
      'keydown': function(e) {
        if (e.keyCode === 39 && (this.collection.getFilter('currentPage') + 1 < (this.collection.total / this.collection.getFilter('perPage')))) {
          this.collection.setFilter('currentPage', this.collection.filters.currentPage + 1);
          this.collection.fetch();
        }
        if (e.keyCode === 37 && this.collection.getFilter('currentPage') > 0) {
          this.collection.setFilter('currentPage', this.collection.getFilter('currentPage') - 1);
          this.collection.fetch();
        }
      }
    },

    serialize: function() {

      var options = {};

      options.totalCount = this.collection.length;
      options.lBound = Math.min(1, options.totalCount);
      options.uBound = options.totalCount;


      options.totalCount = this.options.collection.total;
      options.lBound = Math.min(this.collection.getFilter('currentPage') * this.collection.getFilter('perPage') + 1, options.totalCount);
      options.uBound = Math.min(options.totalCount, options.lBound + this.collection.getFilter('perPage') - 1);
      options.pageNext = (this.collection.getFilter('currentPage') + 1 < (options.totalCount / this.collection.getFilter('perPage') ) );
      options.pagePrev = (this.collection.getFilter('currentPage') !== 0);

      options.actionButtons = (this.actionButtons && this.active); //(this.options.table.selection.length > 0);

      if (this.active) {
        options.visibility = _.map([
          {text:'All', value: '1,2', count: this.collection.total},
          {text:'Active', value: '1', count: this.collection.active},
          {text:'Inactive', value: '2', count: this.collection.inactive},
          {text:'Trash', value: '0', count: this.collection.trash}], function(obj) {
            if (this.collection.getFilter('active') == obj.value) { obj.active = true; }
            return obj;
        }, this);
      }

      options.filterText = this.collection.getFilter('search');
      options.filter = true;
      options.paginator = (options.pageNext || options.pagePrev);
      options.deleteOnly = this.options.deleteOnly && this.actionButtons;

      return options;
    },

    afterRender: function() {
      $filter = $('#table-filter');
      if ($filter[0]) {
        $('#table-filter').focus();
        $filter.val($filter.val());
      }
    },

    initialize: function() {
      //Does the table have the active column?
      this.active = this.options.structure && this.options.structure.get('active') && !this.options.deleteOnly;
      //Show action buttons if there are selected models
      this.collection.on('select', function() {
        this.actionButtons = Boolean($('td.check > input:checked').length);
        this.render();
      }, this);

      this.collection.on('remove', this.render, this);
    }
  });

  var TableBody = Backbone.Layout.extend({

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
      var rowIdentifiers = this.options.rowIdentifiers;
      var rows = _.map(this.collection.getModels(), function(model) {
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
    },

    initialize: function() {
      this.collection.on('sort', this.render, this);
      //Setup jquery UI sortable
      if (this.options.structure && this.options.structure.get('sort')) {
        this.collection.setOrder('sort','ASC',{silent: true});
        this.$el.sortable({
          stop: _.bind(this.drop, this),
          axis: "y",
          containment: "parent",
          handle: '.sort'
        });
      }
    }
  });

  var TableHead = Backbone.Layout.extend({

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

  var TableFooter = Backbone.Layout.extend({
    tagName: 'tfoot',
    template: 'table-foot',

    events: {
      'change select': function(e) {
        var $target = $(e.target);
        var operation = $target.find(":selected").val().toLowerCase();
        var column = $(e.target).attr('data-id');
        var set = this.collection.pluck(column);

        var value = this.calculate(set, operation);

        $target.next('p').html(value);
        console.log(set, value);
      }
    },

    calculate: function(set, operation) {
      var sum = _.reduce(set, function(memo, num){ return memo + num; }, 0);
      switch(operation) {
        case 'max':
          return _.max(set);
        case 'min':
          return _.min(set);
        case 'average':
          return Math.round(10000 * sum / set.length) / 10000;
        case 'sum':
          return sum;
      }
    },

    serialize: function() {
      var columns = _.map(this.collection.getColumns(), function(value) {
        var col = {
          title: value,
          isNumeric: (["FLOAT", "INT", "SMALLINT", "DECIMAL", "DOUBLE"].indexOf(this.collection.structure.get(value).get('type')) > -1),
        }
        if (col.isNumeric) col.value = this.calculate(this.collection.pluck(value), 'sum');
        return col;
      }, this);
      return {columns: columns, selectable: this.options.selectable, sortable: this.options.sortable,};
    }
  });

  var Table = Backbone.Layout.extend({

    tagname: 'div',

    template: 'table',

    serialize: function() {
      var id = (this.collection.table) ? this.collection.table.id : undefined;
      return {columns: this.collection.getColumns(), id: id, selectable: this.options.selectable, sortable: this.options.sortable, hasData: this.collection.length };
    },

    events: {
      'click td:not(.check):not(.status):not(.sort)' : function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        if (this.options.navigate) {
          this.collection.off(null, null, this);
          this.navigate(id);
        }
      }
    },

    navigate: function(id) {
      var route = Backbone.history.fragment.split('/');
      route.push(id);
      app.router.go(route);
    },

    selection: function() {
      var selection = [];
      $('td.check > input:checked').each(function() { selection.push(parseInt(this.value,10)); });
      return selection;
    },

    beforeRender: function() {
      this.startRenderTime = new Date().getTime();

      if (this.options.toolbar) {
        this.setView('.directus-toolbar', new Toolbar({
          collection: this.collection,
          structure: this.options.structure || this.collection.structure,
          table: this.options.table || this.collection.table,
          preferences: this.options.preferences || this.collection.preferences,
          deleteOnly: this.options.deleteOnly
        }));
      }

      if (this.tableHead) {
        this.insertView('table', new TableHead({
          collection: this.collection,
          selectable: this.options.selectable,
          sortable: this.options.sortable,
          deleteColumn: this.options.deleteColumn
        }));
      }

      if (this.collection.length > 0) {
        this.insertView('table', new TableBody({
          collection: this.collection,
          selectable: this.options.selectable,
          filter: this.options.filter,
          TableRow: this.options.tableRow,
          preferences: this.options.preferences || this.collection.preferences,
          structure: this.options.structure || this.collection.structure,
          sortable: this.options.sortable,
          deleteColumn: this.options.deleteColumn,
          rowIdentifiers: this.options.rowIdentifiers
        }));
      }

      if (this.collection.length > 0 && this.collection.table.get('footer')) {
        this.insertView('table', new TableFooter({
          collection: this.collection,
          sortable: this.options.sortable,
          selectable: this.options.selectable
        }));
      }
    },

    afterRender: function() {
      var now = new Date().getTime();
      console.log('rendered table in '+ (now-this.startRenderTime)+' ms');
      app.router.hideAlert();
    },

    cleanup: function() {
      app.router.hideAlert();
    },

    initialize: function() {

      if (this.options.tableHead !== false) this.tableHead = true;

      this.collection.on('fetch',  function() {
        app.router.showAlert();
      }, this);

      this.collection.on('reset nocontent add remove change', function() {
        app.router.hideAlert();
        this.render();
      }, this);

      this.collection.on('add', function() {
        console.log(arguments);
      });

      if (this.options.sortable === undefined) {
        this.options.sortable = (this.collection.structure && this.collection.structure.get('sort')) || false;
      }

      if (this.options.selectable === undefined) {
        this.options.selectable = (this.collection.structure && this.collection.structure.get('active')) || false;
      }

      if (this.options.droppable) {
        //Cache a reference to the this.$el
        var $el = this.$el;

        // If collection supports dnd
        // Since dragenter sux, this is how we do...
        $el.on('dragover', function(e) {
          e.stopPropagation();
          e.preventDefault();
          $el.addClass('dragover');
        });

        $el.on('dragleave', function(e) {
          $el.removeClass('dragover');
        });

        // Since data transfer is not supported by jquery...
        // XHR2, FormData
        this.el.ondrop = _.bind(function(e) {
          e.stopPropagation();
          e.preventDefault();

          var files = e.dataTransfer.files;
          var formData = new FormData();

          _.each(files, function(file) {
            this.collection.create({file: file, date_uploaded: Date.now(), size: file.size, name: file.name, title: file.name, type: file.type, user: 1, active: 1});
            console.log(this.collection);
          }, this);

          $el.removeClass('dragover');
        }, this);
      }
    },

    constructor: function (options) {

      // Add events from child
      if (this.events) {
        this.events = _.defaults(this.events, Table.prototype.events);
      }

      if (options.toolbar === undefined) { options.toolbar = true; }

      Backbone.Layout.__super__.constructor.call(this, options);
    }
  });

  return Table;

});