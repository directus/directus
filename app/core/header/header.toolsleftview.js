//  header.toolsleftview.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  var HeaderToolsLeftView = Backbone.Layout.extend({

    template: 'header/header-tools-left',

    tagName: 'ul',

    attributes: {
      class: 'tools left'
    },

    serialize: function() {
      var data = {};

      if(this.toolOptions.mode == "list") {
        data.list = true;
        if (this.collection && this.collection.hasPermission('add')) {
          data.showAddButton = {
            title: 'Add Table'
          };
        }

        data.showBookmarkButton = {
          active: this.isBookmarked
        };
      } else if(this.toolOptions.mode == "edit") {
        data.edit = true;
      }

      return data;
    },

    events: {
      'click #btn-top': function() {
        app.router.go('#tables/'+this.collection.table.id+'/new');
        //app.router.setPage(Table.Views.Edit, {model: model});
      },
      'click #bookmark': function(e) {
        var data = {
          title: this.collection.table.id,
          url: Backbone.history.fragment,
          icon_class: 'icon-star',
          user: app.getCurrentUser().get("id")
        };
        if(!this.isBookmarked)
        {
          app.getBookmarks().addNewBookmark(data);
        } else {
          app.getBookmarks().removeBookmark(data);
        }
        $('#bookmark').parent().toggleClass('active');
        this.isBookmarked = !this.isBookmarked;
      }
    },
    initialize: function(options) {
      this.toolOptions = options;
      if(options.mode == "list") {
        if(this.collection) {
          this.isBookmarked = app.getBookmarks().isBookmarked(this.collection.table.id);
        }
      } else if(options.mode == "edit") {

      }
    }
  });

  return HeaderToolsLeftView;
});