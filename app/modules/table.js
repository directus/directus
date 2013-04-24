//  table.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Backbone, Directus) {

  var Table = app.module();

  Table.Views = {};

  Table.Views.Tables = Backbone.Layout.extend({

    template: "page",

    serialize: { title: 'Tables' },

    beforeRender: function() {
      this.setView('#page-content', new Directus.TableSimple({collection: this.collection, template: 'tables'}));
      //this.setView('#page-content', new Directus.Table({collection: this.options.list, columns: ['title'], filter: {hidden: false, is_junction_table: false}, navigate: true, toolbar: false}));
    }

  });

  var SaveModule = Backbone.Layout.extend({
    template: 'module-save',
    attributes: {'class': 'directus-module'},
    serialize: function() {
      var data = {
        isActive: (this.model.get('active') === 1),
        isInactive: (this.model.get('active') === 2 || !this.model.has('id')),
        isDeleted: (this.model.get('active') === 0),
        showDelete: !this.options.single && (this.model.get('active') !== 0) && (this.model.id !== undefined),
        showActive: !this.options.single && this.model.collection.structure.get('active') !== undefined,
        showDropdown: !this.options.single,
        showSaveAsCopy: !this.model.isNew()
      };
      return data;
    },
    initialize: function() {
      this.model.on('sync', this.render, this);
    }
  });

  var RevisionsModule = Backbone.Layout.extend({

    template: 'module-revisions',

    attributes: {'class': 'directus-module'},

    events: {
      'click .directus-module-header': function() { this.$el.find('.directus-module-section').toggleClass('collapsed'); }

    },

    serialize: function() {
      var items = this.collection.map(function(model) {
        var data = model.toJSON();
        data.pastTense = app.actionMap[data.action];
        return data;
      });
      return {items: items, length: this.collection.length};
    },

    initialize: function(options) {
      this.collection = new Backbone.Collection();
      this.collection.url = options.baseURL + '/revisions';
      this.collection.fetch();
      this.collection.on('reset', this.render, this);
    }

  });

  Table.Views.Edit = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click #save-form': 'save',
      'click #save-form-stay': 'save',
      'click #save-form-add': 'save',
      'click #save-form-copy': 'save',
      'click #delete-form': 'deleteItem',
      'keydown' : function(e) {
        if (e.keyCode === 83 && e.metaKey) {
          this.save();
        }
      },
      'click #save-form-cancel': function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      }
    },

    deleteItem: function(e) {
      if (!this.model.has('active')){
        this.model.destroy();
        return;
      }

      var success = function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      };
      this.model.save({active: 0}, {success: success});
    },

    save: function(e) {
      var action = (e !== undefined) ? e.target.id : 'save-form-stay';
      var active = $('input[name=active]:checked').val();
      var data = this.editView.data();
      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

      if (action === 'save-form-stay') {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          route.push(model.get('id'));
          app.router.go(route);
        };
      } else {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          if (action === 'save-form-add') {
            // Trick the router to refresh this page when we are dealing with new items
            if (isNew) app.router.navigate("#", {trigger: false, replace: true});
            route.push('new');
          }
          app.router.go(route);
        };
      }

      if (action === 'save-form-copy') {
        console.log('cloning...');
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
        console.log(model);
      }

      if (active !== undefined) {
        data.active = active;
      }

      //console.log('circular data?','data',data,'mode',model);

      model.save(model.diff(data), {
        success: success,
        patch: true,
        error: function() {
          console.log('ERROR', arguments);
        }
      });
    },

    serialize: function() {
      var breadcrumbs = [{ title: 'Tables', anchor: '#tables'}];
      var title = (this.model.id) ? 'Editing Item' : 'Creating New Item';

      if (this.single) {
        title = this.model.collection.table.id;
      } else {
        breadcrumbs.push({ title: this.model.collection.table.id, anchor: '#tables/' + this.model.collection.table.id });
      }
      return {
        breadcrumbs: breadcrumbs,
        title: title,
        sidebar: true
      };
    },

    beforeRender: function() {
      this.insertView('#sidebar', new SaveModule({model: this.model, single: this.single}));
    },

    afterRender: function() {
      this.setView('#page-content', this.editView);
      //Don't fetch if the model is new!
      if (this.model.has('id')) {
        this.model.fetch({dontTrackChanges: true});
      } else {
        this.editView.render();
      }

      if (this.model.id !== undefined) {
        this.insertView('#sidebar', new RevisionsModule({baseURL: this.model.url()}));
        this.insertView('#sidebar', new Backbone.Layout({template: 'module-messages', attributes: {'class': 'directus-module'}}));
      }

      this.affix();
    },

    affix: function() {
      var sidebarOffset = $('.container-sidebar').offset();
      var navbarHeight = $('.navbar').height();
      var stickyHeight = parseInt(sidebarOffset.top) - parseInt(navbarHeight) - 20;
      var stuck = false;
      $(window).scroll(function(e){
        var scrollTop = $(window).scrollTop();
        if(!stuck && scrollTop >= stickyHeight){
          //console.log("stuck");
          stuck = true;
          $(".container-sidebar").addClass('affix-sidebar');
        } else if(stuck && scrollTop < stickyHeight){
          //console.log("unstuck");
          stuck = false;
          $(".container-sidebar").removeClass('affix-sidebar');
        }
      });
    },

    initialize: function() {
      this.single = this.model.collection.table.get('single');
      this.editView = new Directus.EditView({model: this.model, ui: this.options.ui});
    }
  });

  //This should probably be DRY:er. Add pattern to core?
  Table.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      var data = {
        title: this.collection.table.id,
        breadcrumbs: [{title: 'Tables', anchor: '#tables'}],
        buttonTitle: 'Add New Item'
      };
      return data;
    },

    events: {
      'click #btn-top': function() {
        app.router.go('#tables/'+this.collection.table.id+'/new');
        //app.router.setPage(Table.Views.Edit, {model: model});
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.table = new Directus.Table({collection: this.collection, navigate: true});
    }

  });

  return Table;
});