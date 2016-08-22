define([
  'app',
  'backbone',
  'handlebars',
  'core/directus',
  'modules/activity/chart',
  "modules/files/files",
  'core/BasePageView',
  'moment'
],

function(app, Backbone, Handlebars, Directus, Chart, Files, BasePageView, moment) {

  "use strict";

  var Dashboard = app.module();

  var ListView = Backbone.Layout.extend({

    tagName: "ul",

    attributes: {
      class: "group-list"
    },

    template: "modules/activity/activity-list",

    events: {
      'click tr': function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        app.router.go('#messages', id);
      }
    },

    serialize: function() {
      var tables = app.schemaManager.getTables();

      var data = this.collection.map(function(model) {
        var data = {
          "table": model.get('table_name'),
          'time': moment(model.get('datetime')).fromNow(),
          "timestamp": model.get('datetime'),
          "user_avatar": model.get('user')
        };

        switch(model.get('action')) {
          case 'LOGIN':
            data.action_login = true;
            break;
          case 'UPDATE':
            data.action_edit = true;
            break;
          case 'ADD':
            data.action_add = true;
            break;
          case 'DELETE':
            data.action_delete = true;
            break;
          case 'REPLY':
            data.action_add = true;
            break;
        }

        if(data.action_login) {
          data.table = "login";
          data.user = model.get('user');
        }

        if(model.get('row_id') > 0) {
          data.link = "tables/" + data.table + "/" + model.get('row_id');
        }

        //If table is files set to clip
        if(data.table === "directus_files") {
          data.is_file = true;
          data.title = JSON.parse(model.get('data'))['name'];
        }

        //If table is files set to clip
        if(data.table === "directus_ui") {
          data.is_system = true;
          data.title = model.get('identifier').substring(0, model.get('identifier').indexOf(','));
        }

        //If table is Messages set to message
        if(data.table === "directus_messages") {
          if(JSON.parse(model.get('data')).response_to) {
            data.is_reply = true;
            data.link = "messages/" + JSON.parse(model.get('data')).response_to;
          } else {
            if(model.get('type') === "MESSAGE") {
              if(!app.messages.get(model.get('row_id'))) {
                data.hidden = true;
              } else {
                data.link = "messages/" + model.get('row_id');
              }
            } else {
              data.is_comment = true;
              data.link = false;
              if(JSON.parse(model.get('data')).comment_metadata) {
                var metadata = JSON.parse(model.get('data')).comment_metadata.split(':');
                if(metadata) {
                  var itemId = metadata.pop();
                  var table = metadata.pop();

                  data.link = "tables/" + table + "/" + itemId;
                  data.title = table;
                }
              }
            }
          }

          data.is_message = true;
          if(!data.title) {
            data.title = model.get('identifier');
          }
          if(model.get('action') === "ADD") {
            data.isNew = true;
          }
        }

        if(tables.get(model.get('table_name'))) {
          var primary_column = tables.get(model.get('table_name')).get('primary_column');
          if(primary_column) {
            var modelData = JSON.parse(model.get('data'));

            var template = Handlebars.compile(primary_column);
            data.title = template(modelData);
          }
        }
        return data;
      });

      //Filter out data that is set to hidden
      data = _.filter(data, function(item) {
        return !item.hidden;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -moment(item.timestamp);
      });

      var groupedData = [];

      data.forEach(function(group) {
        var date = moment(group.timestamp).format('MMMM-D-YYYY');
        if(!groupedData[date]) {
          //If Today Have it say Today
          if(date === moment().format('MMMM-D-YYYY')) {
            groupedData[date] = {title: "Today", data: []};
          } else {
            groupedData[date] = {title: moment(group.timestamp).format('MMMM D, YYYY'), data: []};
          }
        }
        groupedData[date].data.push(group);
      });
      data = [];

      for(var group in groupedData) {
        data.push(groupedData[group]);
      }

      return {activities: data};
    },

    initialize: function() {
      this.collection.setFilter({adv_search:''});
      this.collection.on('sync', this.render, this);
    }

  });

  Dashboard.Views.List = BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Activity'
      }
    },

    events: {
      'click a[data-action=file]': function(e) {
        var id = parseInt($(e.target).attr('data-id'),10);
        var model = new app.files.model({id: id}, {collection: app.files});
        var modal = new Files.Views.Edit({model: model, stretch: true});
        app.router.v.messages.insertView(modal).render();
        app.router.navigate('#files/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#activity');
        });
      }
    },

    serialize: function() {
      return {title: 'Activity'};
    },

    afterRender: function() {
      this.insertView('#page-content', this.chart);
      this.insertView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.chart = new Chart({collection: this.collection});
      this.table = new ListView({collection: this.collection});
    }

  });

  return Dashboard;
});
