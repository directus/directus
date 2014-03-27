//  table.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/directus',
  'core/panes/pane.revisionsview',
  'core/panes/pane.saveview',
  'core/ListViewManager'
],

function(app, Backbone, Directus, RevisionsModule, SaveModule, ListViewManager) {

  "use strict";

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

  Table.Views.BatchEdit = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click #save-form': 'save'
    },

    save: function() {
      var model = this.model,
          itemCount = this.batchIds.length,
          failRequestCount = 0,
          successRequestCount = 0;

      if (!confirm('This will affect ' + itemCount + ' records. Continue?')) {
        return;
      }

      // Serialize the entire form
      var data = this.editView.data();
      
      // Get an attribute whitelist based on the checkboxes
      var attrWhitelist = $("input[name='batchedit']:checked").map(function() {
        return $(this).data('attr');
      }).toArray();

      // Set data to model inorder to include relationships etc
      model.set(this.model.diff(data));

      // Changed attributes based on whitelist
      var changedAttributes = _.pick(model.toJSON(), attrWhitelist);

      var checkIfDone = function() {
        var totalRequest = successRequestCount + failRequestCount;
        if (totalRequest === itemCount) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          alert(successRequestCount + " items have been updated. " + failRequestCount + " items failed to update");
          app.router.go(route);
        }
      }

      var success = function() {
        successRequestCount++;
        checkIfDone();
      }

      var error = function() {
        failRequestCount++;
        checkIfDone(); 
      }

      // Save all batch id's
      _.each(this.batchIds, function(id) {
        var modelToUpdate = model.getNewInstance({collection: model.collection});
        modelToUpdate.set(_.extend(
          {id: id}, 
          changedAttributes
        ), {parse: true});

        modelToUpdate.save({}, {
          success: success,
          error: error,
          wait: true,
          //patch: true,
          includeRelationships: true,
          validate: false
        });
      });

      console.log(changedAttributes);
    },

    serialize: function() {
      var breadcrumbs = [{ title: 'Tables', anchor: '#tables'}],
          title = 'Batch Edit ('+this.batchIds.length+')';
      
      breadcrumbs.push({ title: this.model.collection.table.id, anchor: '#tables/' + this.model.collection.table.id });
      
      return {
        breadcrumbs: breadcrumbs,
        title: title,
        sidebar: true
      };
    },    

    beforeRender: function() {
      this.insertView('#sidebar', new SaveModule({model: this.model, single: this.single, showDropDown: false}));
    },

    afterRender: function() {
      this.setView('#page-content', this.editView);
      this.editView.render();
    },

    initialize: function(options) {
      this.batchIds = options.batchIds;
      this.editView = new Directus.EditView({model: this.model, batchIds: options.batchIds});
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
      'keydown': function(e) {
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
      var success = function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      };

      // hard-destroy model if there is no active column
      if (!this.model.has('active')){
        throw "This table does not have an active column and can therefore not be deleted";
        return;
      }

      this.model.save({active: 0}, {success: success, patch: true, wait: true, validate: false});

      //this.model.set({active: 0});
      //this.model.save({success: success});
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


      // patch only the changed values
      model.save(model.diff(data), {
        success: success,
        error: function(model, xhr, options) {
          console.log('err');
          //app.trigger('alert:error', 'Failed to Save', xhr.responseText);
        },
        wait: true,
        patch: true,
        includeRelationships: true
      });


    },

    serialize: function() {
      var breadcrumbs = [{ title: 'Tables', anchor: '#tables'}];
      var title;

      if (this.model.id) {
        title = 'Editing Item';
      } else {
        if (this.options.batchIds !== undefined) {
          title = 'Batch Edit';
        } else {
          title = 'Creating New Item'; 
        }        
      }

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
      var showDropDown = !this.single && !this.isBatchEdit;
      this.insertView('#sidebar', new SaveModule({model: this.model, single: this.single, showDropDown: showDropDown}));
    },

    afterRender: function() {
      this.setView('#page-content', this.editView);
      //Don't fetch if the model is new!
      if (this.model.has('id')) {

        //@todo what is going on here?
        this.model.fetch({
          dontTrackChanges: true,
          error: function(model, XMLHttpRequest) {
            if(404 === XMLHttpRequest.status) {
              var route = Backbone.history.fragment;
              // if(route.charAt(route.length-1) == "/") {
              //     route = route.slice(0, -1)
              // }
              route = route.split('/');
              if(route.slice(-2)[0] !== "tables") {
                route.pop();
              }
              route.push('new');
              app.router.go(route);
            }
          }
        });
      } else {
        this.editView.render();
      }

      if (this.model.id !== undefined) {
        this.insertView('#sidebar', new RevisionsModule({baseURL: this.model.url()}));
        this.insertView('#sidebar', new Backbone.Layout({template: 'module-messages', attributes: {'class': 'directus-module'}}));
      }

      app.affix();
    },

    initialize: function(options) {
      this.isBatchEdit = options.batchIds !== undefined;
      this.single = this.model.collection.table.get('single');
      this.editView = new Directus.EditView({model: this.model, ui: this.options.ui, batchIds: options.batchIds});
    }
  });

  //This should probably be DRY:er. Add pattern to core?
  Table.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      var data = {
        title: this.collection.table.id,
        breadcrumbs: [{title: 'Tables', anchor: '#tables'}]
      };

      if (this.collection.hasPermission('add')) {
        data.buttonTitle = 'Add New Item';
      }

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
      this.collection.fetch({reset: true});
    },

    initialize: function() {
      //this.table = new Directus.Table({collection: this.collection, navigate: true, maxColumns: 8});
      //ListViewManager
      this.table = ListViewManager.getInstance({collection: this.collection, navigate: true, maxColumns: 8});
      //this.table = new Directus.Table({collection: this.collection, navigate: true, maxColumns: 8});
    }

  });

  return Table;
});