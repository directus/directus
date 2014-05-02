define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/EntriesManager',
  'core/widgets/widgets',
],

function(app, Backbone, Directus, BasePageView, EntriesManager, Widgets) {

  var Extension = {
    id: 'batch_image_upload/',
    icon: 'icon-upload',
    title: 'Batch Upload'
  };

  var MediaModelsCollection = Backbone.Collection.extend({});

  var BatchContainerView = Backbone.Layout.extend({
    prefix: 'extensions/batch_upload/templates/',
    template: 'batch-upload',

    afterRender: function() {
      this.setView('#upload-content', this.editView);
      this.editView.render();

      var timer;
      var $dropzone = this.$el.find('.batch-ui-thumbnail');
      var model = this.model;
      var self = this;

      $dropzone.on('dragover', function(e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave', function(e) {
        clearInterval(timer);
        timer = setInterval(function(){
          $dropzone.removeClass('dragover');
          clearInterval(timer);
        },50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = _.bind(function(e) {
        e.stopPropagation();
        e.preventDefault();
        var that = this;

        app.sendFiles(e.dataTransfer.files, function(data) {

          _.each(data, function(item) {
            item.active = 1;
            // Unset the model ID so that a new media record is created
            // (and the old media record isn't replaced w/ this data)
            item.id = undefined;
            item.user = app.users.getCurrentUser().id;

            var collection = EntriesManager.getInstance('directus_media');

            var model = new collection.model(item, {collection:collection});

            that.mediaModels.add(model);
          });

          that.mediaModels.trigger('sync');
        });
        $dropzone.removeClass('dragover');
      }, this);
    },

    serialize: function() {
      var models = [];

      var url;

      this.mediaModels.forEach(function(model) {
        if(model.get('name').split('.').pop() == 'tif') {
          url = app.storageAdapters['TEMP'].url + "THUMB_" + model.get('name').replace(/\.[^/.]+$/, "") + ".jpg";
        } else {
          url = app.storageAdapters['TEMP'].url + "THUMB_" + model.get('name');
        }
        model.set({url:url});
        models.push(model.attributes);
      });

      return {data: models};
    },

    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model, batchIds: [1,2]});
      this.mediaModels = new MediaModelsCollection();
      this.listenTo(this.mediaModels, 'sync', this.render);
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
          successRequestCount = 0,
          itemCount = this.batchView.mediaModels.length;

      // Serialize the entire form
      var data = this.batchView.editView.data();

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

      // Save all batch id's
      this.batchView.mediaModels.each(function(image) {
        var modelToUpdate =  model.getNewInstance({collection: model.collection});
        modelToUpdate.set(_.extend(
          {image: image},
          changedAttributes
        ), {parse: true});

        modelToUpdate.url = model.collection.url;

        modelToUpdate.save({}, {
          success: success,
          error: error,
          wait: true,
          //patch: true,
          includeRelationships: true,
          validate: false
        });
      });
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
      this.model = new collection.model({}, {collection: collection, parse: true});

      this.view = new View({model: this.model});
      app.router.v.main.setView('#content', this.view);
      app.router.v.main.render();
    },

    initialize: function() {
    }

  });


  return Extension;
});