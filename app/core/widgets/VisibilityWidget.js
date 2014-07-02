define([
  'app',
  'backbone',
  'core/PreferenceModel'
],
function(app, Backbone, PreferenceModel) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('\
    <div class="left snapshotOption" id="saveSnapshotBtn"><span class="icon icon-camera"></span></div> \
    {{#if hasActiveColumn}} \
    <div class="simple-select dark-grey-color simple-gray left"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="visibilitySelect" name="status" class="change-visibility"> \
        <optgroup label="Status"> \
          <option data-status value="1,2">View All</option> \
          <option data-status value="1">View Active</option> \
          <option data-status value="2">View Inactive</option> \
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
          this.collection.setFilter({currentPage: 0, status: value});
        }
      },
      'click #saveSnapshotBtn': 'saveSnapshot',
    },

    saveSnapshot: function() {
      var that = this;
      app.router.openModal({type: 'prompt', text: 'Please enter a name for your Snapshot', callback: function(name ) {
        if(name === null) {
          return;
        }

        var exists = false;
        //Check for Duplicate
        that.options.widgetOptions.snapshots.forEach(function(snapshot) {
          if(name == snapshot) {
            alert('A Snapshot With that name already exists!');
            exists = true;
            return;
          }
        });

        if(exists) {
          return;
        }

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
      return this.options.widgetOptions;
    },

    afterRender: function() {
      if(this.options.widgetOptions.hasActiveColumn) {
        $('#visibilitySelect').val(this.collection.preferences.get('status'));
      }

      // Adjust dropdown width dynamically
      // var sel = this.$el.find('#visibilitySelect');
      // this.$el.find('#templateOption').text( sel.find(":selected").text() );
      // sel.width( this.$el.find('#template').width() * 1.03 + 10 ); // +10 is for arrow on right
    },
    initialize: function() {
      var activeTable = this.collection.table.id;

      this.basePage = this.options.basePage;
      this.options.widgetOptions = {snapshots: []};

      if(this.collection.table.columns.get('status')) {
        this.options.widgetOptions.hasActiveColumn = true;
      }

      if(app.router.loadedPreference) {
        this.defaultId = this.collection.preferences.get('id');
        this.collection.preferences.fetch({newTitle: app.router.loadedPreference});
        if(this.basePage) {
          this.basePage.addHolding(this.cid);
        }
      }

      this.listenTo(this.collection.preferences, 'sync', function() {
        if(this.basePage) {
          this.basePage.removeHolding(this.cid);
        }
        if(this.defaultId) {
          this.collection.preferences.set({title:null, id: this.defaultId});
        }
      });
    }
  });
});