define([
  'app',
  'backbone',
  'core/PreferenceModel'
],
function(app, Backbone, PreferenceModel) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('\
    <div class="left snapshotOption" id="saveSnapshotBtn" title="Save Page as Bookmark"><span class="icon icon-bookmark"></span></div> \
    {{#if hasActiveColumn}} \
    <div class="simple-select dark-grey-color simple-gray left" title="Choose which items are displayed"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="visibilitySelect" name="status" class="change-visibility"> \
        <optgroup label="Status"> \
          <option data-status value="{{allKeys}}">View All</option> \
          {{#mapping}} \
            <option data-status value="{{id}}">View {{capitalize name}}</option> \
          {{/mapping}} \
        </optgroup> \
      </select> \
      <select id="template" style="display:none;width:auto;"><option id="templateOption"></option></select> \
    </div> \
    {{/if}}'),

    tagName: 'div',
    attributes: {
      'class': 'tool'
    },

    events: {
      'change #visibilitySelect': function(e) {
        var $target = $(e.target).find(":selected");
        if($target.attr('data-status') !== undefined && $target.attr('data-status') !== false) {
          var value = $(e.target).val();
          var name = {currentPage: 0};
          name[app.statusMapping.status_name] = value;
          this.collection.setFilter(name);

          this.listenToOnce(this.collection.preferences, 'sync', function() {
            if(this.basePage) {
              this.basePage.removeHolding(this.cid);
            }
            if(this.defaultId) {
              this.collection.preferences.set({title:null, id: this.defaultId});
            }
          });
        }
      },
      'click #saveSnapshotBtn': 'saveSnapshot',
    },

    saveSnapshot: function() {
      var that = this;
      app.router.openModal({type: 'prompt', text: 'What would you like to name this bookmark?', callback: function(name ) {
        if(name === null || name === "") {
          alert('Please Fill In a Valid Name');
          return;
        }

        //Save id so it can be reset after render
        that.defaultId = that.collection.preferences.get('id');
        //Unset Id so that it creates new Preference
        that.collection.preferences.unset('id');
        that.collection.preferences.set({title: name});
        that.collection.preferences.save();
        that.pinSnapshot(name);

        that.listenToOnce(that.collection.preferences, 'sync', function() {
          if(this.basePage) {
            that.basePage.removeHolding(this.cid);
          }
          if(this.defaultId) {
            that.collection.preferences.set({title:null, id: that.defaultId});
          }
        });
      }});
    },

    pinSnapshot: function(title) {
      var data = {
        title: title,
        url: Backbone.history.fragment + "/pref/" + title,
        icon_class: 'icon-search',
        user: app.users.getCurrentUser().get("id"),
        section: 'search'
      };
      if(!app.getBookmarks().isBookmarked(data.title)) {
        app.getBookmarks().addNewBookmark(data);
      }
    },

    serialize: function() {
      var data = {hasActiveColumn: this.options.hasActiveColumn, mapping: []};
      var mapping = app.statusMapping.mapping;

      var keys = [];
      for(var key in mapping) {
        //Do not show option for deleted status
        if(key != app.statusMapping.deleted_num) {
          data.mapping.push({id: key, name: mapping[key].name, sort: mapping[key].sort});
          keys.push(key);
        }
      }

      data.mapping.sort(function(a, b) {
        if(a.sort < b.sort) {
          return -1;
        }
        if(a.sort > b.sort) {
          return 1;
        }
        return 0;
      });

      data.allKeys = keys.join(',');
      return data;
    },

    afterRender: function() {
      if(this.options.hasActiveColumn) {
        $('#visibilitySelect').val(this.collection.preferences.get(app.statusMapping.status_name));
      }

      // Adjust dropdown width dynamically
      // var sel = this.$el.find('#visibilitySelect');
      // this.$el.find('#templateOption').text( sel.find(":selected").text() );
      // sel.width( this.$el.find('#template').width() * 1.03 + 10 ); // +10 is for arrow on right
    },
    initialize: function() {
      var activeTable = this.collection.table.id;

      this.basePage = this.options.basePage;

      if(this.collection.table.columns.get(app.statusMapping.status_name)) {
        this.options.hasActiveColumn = true;
      }

      if(app.router.loadedPreference) {
        this.defaultId = this.collection.preferences.get('id');
        this.collection.preferences.fetch({newTitle: app.router.loadedPreference});
        if(this.basePage) {
          this.basePage.addHolding(this.cid);
        }

        this.listenToOnce(this.collection.preferences, 'sync', function() {
          if(this.basePage) {
            this.basePage.removeHolding(this.cid);
          }
          if(this.defaultId) {
            this.collection.preferences.set({title:null, id: this.defaultId});
          }
        });
      }
    }
  });
});