define([
  'app',
  'backbone',
  'core/panes/pane.saveview',
  'core/panes/pane.revisionsview',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, SaveModule, RevisionsModule, Directus, BasePageView, Widgets) {

  var HistoryView = Backbone.Layout.extend({
    tagName: "ul",

    attributes: {
      class: "group-list"
    },

    template: "modules/activity/activity-history",

    events: {
      'click #messages-response-button': function(e) {
        var model = new app.messages.model({from: app.authenticatedUserId.id}, {collection: this.comments, parse: true});
        var subject = "Item " + this.model.get('id') + " from " + app.capitalize(this.model.collection.table.id);
        if(this.model.collection.table.get('primary_column') && this.model.has(this.model.collection.table.get('primary_column'))) {
          subject = this.model.get(this.model.collection.table.get('primary_column'));
        }
        var date = new Date();
        model.set({datetime: date, subject: subject, message:this.$el.find('#commentTextarea').val(), comment_metadata: this.model.collection.table.id + ":" + this.model.get('id')})
        model.unset("responses");

        this.listenToOnce(model, 'sync', function(e) {
          console.log(e);
          this.comments.add(model);
          this.render();
        });
        this.$el.find('#messages-response-button').prop('disabled', true);
        model.save();
      },
      'click .view-entire-history': function(e) {
        $('.history-container li.hide').removeClass('hide');
        $('.view-entire-history').remove();
        //$(e.target).remove();
      }
    },

    initialize: function(options) {
      //Get Activity
      this.model = options.model;
      this.activity = app.activity;
      this.comments = new Directus.EntriesCollection({}, {table: app.messages.table, structure: app.messages.structure});

      if(!this.model.isNew()) {
        this.activity.setFilter({adv_search: 'table_name = "' + this.model.collection.table.id + '" AND row_id = ' + this.model.get('id')});
        this.activity.fetch();
        this.comments.setFilter({adv_where: 'comment_metadata = "' + this.model.collection.table.id + ":" + this.model.get('id') + '"'});
        this.comments.fetch();
      }

      var otherFetched = false;

      this.listenTo(this.activity, 'sync', function() {
        if(otherFetched) {
          this.render();
        }
        otherFetched = true;
      });

      this.listenTo(this.comments, 'sync', function() {
        if(otherFetched) {
          this.render();
        }
        otherFetched = true;
      });
    },
    serialize: function() {
      var data = this.activity.map(function(model) {
        var data = {
          "table": model.get('table_name'),
          'time': moment(model.get('datetime')).fromNow(),
          "timestamp": model.get('datetime'),
          "user_avatar": model.get('user')
        };

        switch(model.get('action')) {
          case 'UPDATE':
            data.icon = "icon-pencil";
            break;
          case 'ADD':
            data.add = true;
            data.icon = "icon-check";
            break;
        }
        return data;
      });

      var comments = this.comments.map(function(model) {
        var date = new Date(model.get('datetime') + ' UTC');

        var data = {
          "table": "Comment",
          "timestamp": date,
          "time": moment(date).fromNow(),
          "user_avatar": model.get('from')
        };

        data.isComment = true;
        data.title = model.get("message");

        return data;
      });

      data = data.concat(comments);
      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -moment(item.timestamp);
      });

      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          data[key].hidden = (key >= 5)? 'hide' : 'preview';
        }
      }

      var preview = (data.length > 5)? true : false;
      var additionalCount = data.length - 5;

      return {activities: data, preview: preview, additionalCount: additionalCount, current_user: app.authenticatedUserId};
    }
  });

  var EditView = Backbone.Layout.extend({
    template: Handlebars.compile('<div id="editFormEntry"></div><div id="historyFormEntry"></div>'),
    afterRender: function() {
      this.insertView("#editFormEntry", this.editView);
      this.insertView("#historyFormEntry", this.historyView);

      if(this.model.isNew()) {
        this.editView.render();
      }
    },
    data: function() {
      return this.editView.data();
    },
    initialize: function(options) {
      this.editView = new Directus.EditView(options);
      this.historyView = new HistoryView(options);
    },
    serialize: function() {
      return {};
    }
  });

  return BasePageView.extend({
    events: {
      'change input, select, textarea': 'checkDiff',
      'keyup input, textarea': 'checkDiff',
      'click .saved-success > span > .tool-item, .saved-success > span > .simple-select': 'save',
      'change #saveSelect': 'save'
    },

    getHeaderOptions: function() {
      return {
        route: {
          title: 'Editing Item',
          isOverlay: false
        }
      };
    },

    checkDiff: function(e) {
      var diff = this.model.diff(this.editView.data());
      delete diff.id;

      //this.saveWidget.setSaved(_.isEmpty(diff));
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
      }

      this.model.save({active: 0}, {success: success, patch: true, wait: true, validate: false});
    },

    save: function(e) {
      var action = 'save-form-leave';
      if(e.target.options !== undefined) {
        action = $(e.target.options[e.target.selectedIndex]).val();
      }
      var data = this.editView.data();
      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;
      if (action === 'save-form-stay') {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          if(!model.table.get('single')) {
            route.pop();
            route.push(model.get('id'));
            app.router.go(route);
          }
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
      this.$el.find('#saveSelect').val('');
    },

    afterRender: function() {
      this.setView('#page-content', this.editView);

      //Fetch Model if Exists
      if (this.model.has('id')) {
        this.model.fetch({
          dontTrackChanges: true,
          error: function(model, XMLHttpRequest) {
            //If Cant Find Model Then Open New Entry Page
            if(404 === XMLHttpRequest.status) {
              var route = Backbone.history.fragment;

              route = route.split('/');
              if(route.slice(-2)[0] !== "tables") {
                route.pop();
              }
              route.push('new');
              app.router.go(route);
            }
          }
        });
      }
      this.editView.render();
    },

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: this.headerOptions.basicSave}});
      this.saveWidget.setSaved(false);
      return [
        this.saveWidget
      ];
    },

    initialize: function(options) {
      this.headerOptions = this.getHeaderOptions();
      this.isBatchEdit = options.batchIds !== undefined;
      this.single = this.model.collection.table.get('single');
      this.editView = new EditView(options);
      this.headerOptions.route.isOverlay = false;
      this.headerOptions.basicSave = false;
      if(this.single) {
        this.headerOptions.route.title = 'Editing ' + this.model.collection.table.id;
        this.headerOptions.route.breadcrumbs = [{ title: 'Tables', anchor: '#tables'}];
      } else {
        this.headerOptions.route.title = this.model.get('id') ? 'Editing Item' : 'Creating New Item';
        this.headerOptions.route.breadcrumbs = [{ title: 'Tables', anchor: '#tables'}, {title: this.model.collection.table.id, anchor: "#tables/" + this.model.collection.table.id}];
      }
    }
  });
});