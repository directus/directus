define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/EntriesManager',
  'core/widgets/widgets'
],

function(app, Backbone, Directus, BasePageView, EntriesManager, Widgets) {

  var Extension = {
    id: 'batch_image_upload/',
    icon: 'icon-upload',
    title: 'Batch Upload'
  };

  var BatchContainerView = Backbone.Layout.extend({
    prefix: 'extensions/batch_upload/templates/',
    template: 'batch-upload',

    afterRender: function() {
      this.setView('#upload-content', this.editView);
      this.editView.render();
    },
    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model, batchIds: [1,2]});
    }
  });

  var View = BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Batch Image Upload',
      },
      leftToolbar: true,
      rightToolbar: true
    },

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: true}});
      this.saveWidget.setSaved(false);
      return [
        this.saveWidget
      ];
    },

    events: {
      'click .saved-success': 'save'
    },

    save: function() {
      var model = this.model,
          failRequestCount = 0,
          successRequestCount = 0;

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
          alert(successRequestCount + " items have been updated. " + failRequestCount + " items failed to update");
          app.router.go('/');
        }
      };

      var success = function() {
        successRequestCount++;
        checkIfDone();
      };

      var error = function() {
        failRequestCount++;
        checkIfDone();
      };

/*
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
      });*/

      console.log(changedAttributes);
    },
    afterRender: function() {
      this.setView('#page-content', this.batchView);
      this.batchView.render();
    },
    initialize: function(options) {
      this.batchView = new BatchContainerView({model: this.model});
    }
  });

  Extension.Router = Directus.SubRoute.extend({
    routes: {
      "(/)":         "index"
    },

    index: function() {
      var collection = EntriesManager.getInstance('images');
      var model = new collection.model({}, {collection: collection, parse: true});

      var view = new View({model: model});
      app.router.v.main.setView('#content', view);
      app.router.v.main.render();
    },

    initialize: function() {
    }

  });


  return Extension;
});