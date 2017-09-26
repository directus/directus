define([
  'app',
  'backbone',
  'handlebars',
  'core/directus',
  "core/EntriesManager"
],

function(app, Backbone, Handlebars, Directus, EntriesManager) {

  return Backbone.Layout.extend({
    template: 'modules/tables/translation',
    events: {
      'change #activeLanguageSelect': function (event) {
        var languageId = $(event.currentTarget).val();

        this.saveTranslation(this.activeLanguageId);
        this.initializeTranslateView(languageId);
      }
    },
    saveTranslation: function() {
      this.translateModel.set(this.translateSettings.left_column_name, this.activeLanguageId);
      if (!this.translateCollection.contains(this.translateModel)) {
        this.translateCollection.add(this.translateModel, {nest: true});
      }
    },
    afterRender: function() {
      if (this.editView) {
        var newTranslation = this.translateModel && this.translateModel.isNew();
        this.insertView('#translateEditFormEntry', this.editView);

        // If the translation table has relational data, fetch them
        if (!this.model.isNew() && !newTranslation && this.editView.model.structure.hasRelationalColumns()) {
          this.editView.model.fetch();
        } else {
          this.editView.render();
        }
      }
    },
    initialize: function(options) {
      this.translateId = options.translateId;
      this.translateSettings = options.translateSettings;
      this.translateRelationship = options.translateRelationship;

      if (!this.model.isNew()) {
        this.listenToOnce(this.model, 'sync', this.updateTranslateConnection);
      } else {
        this.updateTranslateConnection();
      }
    },

    updateTranslateConnection: function() {
      this.translateCollection = this.model.get(this.translateId);
      var tracking = function(model) {
        model.startTracking();
      };

      this.translateCollection.each(tracking);
      this.translateCollection.on('add', tracking);

      this.languageCollection = EntriesManager.getInstance(this.translateSettings.languages_table);
      this.listenTo(this.languageCollection, 'sync', function() {this.initializeTranslateView();});
      this.languageCollection.fetch();
    },

    initializeTranslateView: function(language) {
      if(language === undefined) {
        this.activeLanguageId = this.translateSettings.default_language_id;
      } else {
        this.activeLanguageId = language;
      }

      var that = this;
      this.translateModel = null;

      this.translateCollection.forEach(function(model) {
        // TODO: fix language id is returned as string
        // avoid strict comparison
        if(model.get(that.translateSettings.left_column_name) == that.activeLanguageId) {
          that.translateModel = model;
        }
      });

      if(!this.translateModel) {
        var data = {};
        data[this.translateSettings.left_column_name] = this.activeLanguageId;
        data[this.translateRelationship.junction_key_right] = this.model.id;

        this.translateModel = new this.translateCollection.model(data, {
          collection: this.translateCollection,
          parse: true
        });

        this.translateCollection.add(this.translateModel);
      }

      if (!this.translateModel.isTracking()) {
        this.translateModel.startTracking();
      }

      this.editView = new Directus.EditView({
        model: this.translateModel,
        forceVisibleFields: [this.translateModel.table.getStatusColumnName()],
        hiddenFields: [this.translateSettings.left_column_name, this.translateRelationship.junction_key_right],
      });

      this.render();
    },
    serialize: function() {
      var data = {};
      data.translateField = app.capitalize(this.translateId);

      var that = this;

      if(this.languageCollection) {
        data.languages = this.languageCollection.map(function(item) {
          return {val: item.id, name: item.get(that.translateSettings.languages_name_column), active: (item.id == that.activeLanguageId)};
        });
      }

      return data;
    }
  });
});
