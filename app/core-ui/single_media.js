//  Single Media core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name


define(['app', 'backbone', 'core/table/table.view', 'core/overlays/overlays'], function(app, Backbone, TableView, Overlays) {

  "use strict";

  var Module = {};

  Module.id = 'single_media';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'allowed_filetypes', ui: 'textinput', char_length:200}
  ];

  //{{capitalize mediaModel.title}}

  var template =  '<style type="text/css"> \
                  div.ui-thumbnail { \
                    float: left; \
                    margin-top: 8px; \
                    max-height: 200px; \
                    padding: 10px; \
                    background-color: #ffffff; \
                    border: 1px solid #ededed; \
                    -webkit-border-radius:3px; \
                    -moz-border-radius:3px; \
                    border-radius:3px; \
                    color: #ededed; \
                    text-align: center; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail.empty { \
                    width: 300px; \
                    height: 100px; \
                    background-color: #ffffff; \
                    border: 2px dashed #ededed; \
                    padding: 9px; \
                    font-size: 16px; \
                    font-weight: 600; \
                    line-height: 100px; \
                  } \
                  div.ui-thumbnail.empty:hover { \
                    background-color: #fefefe; \
                    border: 2px dashed #cccccc; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail img { \
                    max-height: 200px; \
                  } \
                  div.ui-img-details { \
                    float: left; \
                    position: relative; \
                    margin-top: 15px; \
                    margin-left: 10px; \
                    line-height: 18px; \
                  } \
                  div.ui-img-details a.title { \
                    font-size: 18px; \
                  } \
                  div.ui-img-details div { \
                    display: inline; \
                  } \
                  div.ui-img-details i { \
                    font-weight: 400; \
                    font-style: italic; \
                    color: #ccc; \
                  } \
                  button.btn-right { \
                    margin-top: 8px; \
                    margin-right: 10px; \
                  } \
                  </style> \
                  {{#if url}} \
                  <div class="ui-thumbnail has-media"> \
                    <img src="{{thumbUrl}}"> \
                  </div> \
                  <div class="ui-img-details"> \
                    <a href="{{link}}" class="title" target="single_media">{{mediaModel.title}}</a><br> \
                    Uploaded by {{userName user}} {{contextualDate mediaModel.date_uploaded}}<br> \
                    <i>{{#if isImage}}{{mediaModel.width}} &times; {{mediaModel.height}} –{{/if}} {{bytesToSize mediaModel.size}}</i><br> \
                    <button class="btn btn-small btn-primary btn-right" data-action="swap" type="button">Choose media</button> \
                    <button class="btn btn-small btn-primary btn-right" data-action="remove-single-media" type="button">Remove media</button> \
                  </div> \
                  {{else}} \
                  <div class="ui-thumbnail empty ui-thumbnail-dropzone">Drag media here, or click for existing</div> \
                  {{/if}}';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'click button[data-action="remove-single-media"]': 'removeMedia',
      'click button[data-action="swap"],.ui-thumbnail-dropzone': 'swap',
      'click .has-media': 'edit'
    },

    removeMedia: function(e) {
      this.mediaModel.clear();
    },

    swap: function() {
      var collection = app.media;
      var model;
      var mediaModel = this.mediaModel;

      var view = new Overlays.ListSelect({collection: collection, selectable: false});
      app.router.overlayPage(view);
      //please proxy this instead
      var me = this;

      view.itemClicked = function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        model = collection.get(id);
        mediaModel.clear({silent: true});
        mediaModel.set(model.toJSON());
        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    edit: function() {
      var EditView = require("core/edit");
      var model = this.mediaModel;
      var view = new EditView({model: model});
      var modal = app.router.openModal(view, {stretch: true, title: 'Edit'});
      view.render();

      modal.save = function() {
        var data = view.data();
        model.set(data);
        modal.close();
      };
    },

    afterRender: function() {
      var timer;
      var $dropzone = this.$el.find('.ui-thumbnail');
      var model = this.mediaModel;
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
        if (e.dataTransfer.files.length > 1) {
          alert('One file only please');
          return;
        }
        app.sendFiles(e.dataTransfer.files, function(data) {
          _.each(data, function(item) {
            item.active = 1;
            // Unset the model ID so that a new media record is created
            // (and the old media record isn't replaced w/ this data)
            item.id = undefined;
            item.user = self.userId;

            //console.log()

            model.set(item);
          });
        });
        $dropzone.removeClass('dragover');
      }, this);

    },

    serialize: function() {
      var url = this.mediaModel.has('name') ? this.mediaModel.makeMediaUrl(true) : null;
      var link = this.mediaModel.has('name') ? this.mediaModel.makeMediaUrl() : null;
      var data = this.mediaModel.toJSON();
      var isImage = _.contains(['image/jpeg','image/png'], this.mediaModel.get('type'));

      data.date_uploaded = new Date(data.date_uploaded, this.mediaModel);

      var thumbUrl = isImage ? url : app.PATH + 'assets/img/document.png';

      data = {
        isImage: isImage,
        name: this.options.name,
        url: url,
        thumbUrl: thumbUrl,
        comment: this.options.schema.get('comment'),
        allowed_filetypes: (this.options.settings && this.options.settings.has('allowed_filetypes')) ? this.options.settings.get('allowed_filetypes') : '0',
        mediaModel: data,
        link: link
      };
      return data;
    },

    initialize: function() {

      this.userId = app.users.getCurrentUser().id;

      this.mediaModel = this.options.value;
      this.mediaModel.on('change', this.render, this);
      //this.collection = app.getEntries('directus_media');
      //this.collection.fetch();
      this.collection.on('reset', this.render, this);
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value.attributes)) {
      return 'The field is required';
    }
  };

  Module.list = function(options) {
    var model = options.model;
    //@TODO: Have this not be hardcoded
    if(!model.get('type') && model.get(options.schema.id) instanceof Backbone.Model) {
      model = model.get(options.schema.id);
    }
    console.log(model);
    var orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';
    var isImage = _.contains(['image/jpeg','image/png'], model.get('type'));
    var thumbUrl = isImage ? model.makeMediaUrl(true) : app.PATH + 'assets/img/document-100x120.png';

    var img = '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';

    return img;
  };

  return Module;

});