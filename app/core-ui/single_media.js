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


define(['app', 'backbone', 'core/directus', 'modules/media'], function(app, Backbone, Directus, Media) {

  var Module = {};

  Module.id = 'single_media';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'allowed_filetypes', ui: 'textinput', char_length:200}
  ];

  //{{capitalize mediaModel.title}}

  var template =  '<label>{{ capitalize name }} <span class="note">{{comment}}</span></label> \
                  <style type="text/css"> \
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
                    <img src="{{url}}"> \
                  </div> \
                  <div class="ui-img-details"> \
                    <a href="{{link}}" class="title" target="single_media">{{mediaModel.title}}</a><br> \
                    Uploaded by {{userName user}} {{contextualDate mediaModel.date_uploaded}}<br> \
                    <i>{{mediaModel.width}} &times; {{mediaModel.height}} – {{bytesToSize mediaModel.size}}</i><br> \
                    <button class="btn btn-small btn-primary btn-right" data-action="swap" type="button">Choose media</button> \
                    <button class="btn btn-small btn-primary btn-right" data-action="remove-single-media" type="button">Remove media</button> \
                  </div> \
                  {{else}} \
                  <div class="ui-thumbnail empty ui-thumbnail-dropzone">Drag media here, or click for existing</div> \
                  {{/if}}';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

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
      var view = new Directus.Table({collection: collection, selectable: false, footer: false, navigate: true});
      view.navigate = function(id) {
        model = collection.get(id);
        mediaModel.clear({silent: true});
        mediaModel.set(model.toJSON());
        modal.close();
      };
      var modal = app.router.openModal(view, {stretch: true, title: 'Insert Media'});
      collection.fetch();
    },

    edit: function() {
      var model = this.mediaModel;
      var view = new Directus.EditView({model: model});
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
            model.set(item);
          });
        });
        $dropzone.removeClass('dragover');
      }, this);

    },

    serialize: function() {
      var url = this.mediaModel.has('name') ? app.makeMediaUrl(this.mediaModel, true) : null;
      var link = this.mediaModel.has('name') ? app.makeMediaUrl(this.mediaModel) : null;
      var data = this.mediaModel.toJSON();
      data.date_uploaded = new Date(data.date_uploaded);
      var data = {
        name: this.options.name,
        url: url,
        comment: this.options.schema.get('comment'),
        allowed_filetypes: (this.options.settings && this.options.settings.has('allowed_filetypes')) ? this.options.settings.get('allowed_filetypes') : '0',
        mediaModel: data,
        link: link
      };
      return data;
    },

    initialize: function() {
      this.mediaModel = this.options.value;
      this.mediaModel.on('change', this.render, this);
      //this.collection = app.getEntries['directus_media'];
      //this.collection.fetch();
      this.collection.on('reset', this.render, this);
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value.attributes)) {
      return 'The field is required';
    };
  };

  Module.list = function(options) {
    if (options.value !== undefined && options.value.has('name')) {
      var url = app.makeMediaUrl(options.value, true);
      var orientation = (parseInt(options.value.get('width'),10) > parseInt(options.value.get('height'),10)) ? 'landscape' : 'portrait';
      return '<img src="'+url+'" class="'+orientation+' directus-thumbnail"/>';
    } else {
      return 'No file';
    }
  };

  return Module;

});