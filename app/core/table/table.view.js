define([
  "app",
  "backbone",
  "core/table/table.toolbarview",
  "core/table/table.headview",
  "core/table/table.bodyview",
  "core/table/table.footerview",
  "jquery-ui"
],

function(app, Backbone, Toolbar, TableHead, TableBody, TableFooter) {

  var TableView = Backbone.Layout.extend({

    tagname: 'div',
    attributes: {'class':'directus-table-container'},
    template: 'table',

    serialize: function() {
      return {
        columns: this.collection.getColumns(), 
        id: this.collection.table.id, 
        selectable: this.options.selectable, 
        sortable: this.options.sortable, 
        hasData: this.collection.length 
      };
    },

    events: {
      'click tbody td:not(.check):not(.status):not(.sort)' : function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        if (this.options.navigate) {
          //this.collection.off(null, null, this);
          this.collection.off();
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
        this.insertView('table', new TableHead(this.options));
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

      if (this.collection.length > 0 && this.collection.table.get('footer') && this.options.footer !== false) {
        this.insertView('table', new TableFooter(this.options));
      }
    },

    afterRender: function() {
      var now = new Date().getTime();
      console.log('rendered table ' + this.collection.table.id + ' in '+ (now-this.startRenderTime)+' ms');
      app.router.hideAlert();
    },

    cleanup: function() {
      app.router.hideAlert();
    },

    initializeDrop: function() {
      //Cache a reference to the this.$el
      var $el = this.$el;
      var collection = this.collection;
      var saveAfterDrop = this.saveAfterDrop;

      // This timer prevent's the overlay to flicker when dragleave leaves for
      // a child item that triggers dragenter again.
      var timer;

      // If collection supports dnd
      // Since dragenter sux, this is how we do...
      $el.on('dragover', function(e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $el.addClass('dragover');
      });

      $el.on('dragleave', function(e) {
          clearInterval(timer);
          timer = setInterval(function(){
            $el.removeClass('dragover');
            console.log('leave');
            clearInterval(timer);
          },50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      this.el.ondrop = _.bind(function(e) {
        e.stopPropagation();
        e.preventDefault();

        app.sendFiles(e.dataTransfer.files, function(data) {
          console.log(data);
          _.each(data, function(item) {
            item.user = 1;
            item.active = 1;
            //item.title = app.capitalize(item.name);

            if (saveAfterDrop) {
              console.log('CREATE');
              collection.create(item, {silent: true});
            } else {
              console.log('ADD');
              collection.add(item, {nest: true, parse: true});
            }
          });
        });
        $el.removeClass('dragover');
      }, this);
    },

    initialize: function(options) {
      var collection = this.collection;

      collection.on('fetch',  function() {
        app.router.showAlert();
      }, this);

      // this one used to listen to remove.
      collection.on('sync visibility', function() {
        app.router.hideAlert();
        this.render();
      }, this);

      collection.on('all', function() {
        //console.log(arguments);
      });

      // Default values
      if (this.options.toolbar === undefined) {
        this.options.toolbar = true;
      }
      if (this.options.tableHead !== false) {
        this.tableHead = true;
      }
      if (this.options.sortable === undefined) {
        this.options.sortable = (collection.structure.get('sort')) || false;
      }
      if (this.options.selectable === undefined) {
        this.options.selectable = (collection.structure.get('active')) || false;
      }

      this.saveAfterDrop = (options.saveAfterDrop !== undefined) ?  options.saveAfterDrop : true;

      if (this.options.droppable || collection.droppable) {
        this.initializeDrop();
      }

    },

    constructor: function (options) {
      // Add events from child
      if (this.events) {
        this.events = _.defaults(this.events, TableView.prototype.events);
      }
      Backbone.Layout.__super__.constructor.call(this, options);
    }
  });

  return TableView;

});
