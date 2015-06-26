//  Files Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'directus_file';
  Module.system = true;

    var template = '<style type="text/css"> \
                  div.ui-thumbnail { \
                    float: left; \
                    margin-top: 8px; \
                    max-height: 200px; \
                    padding: 10px; \
                    background-color: #ffffff; \
                    border: 1px solid #ededed; \
                    color: #ededed; \
                    text-align: center; \
                    cursor: pointer; \
                    margin-bottom: 10px; \
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
                  div.ui-thumbnail.empty.dragover, \
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
                    width: 100%; \
                    margin-top: 0; \
                    margin-left: 0; \
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
                  .url-import { \
                    width: 100%; \
                    margin-top: 10px; \
                    display: inline-block; \
                  } \
                  .swap-method-btn { \
                    display:block; \
                    clear: both; \
                    padding-top: 5px; \
                    cursor: pointer; \
                  } \
                  .ui-text-hover:hover { \
                    color: #333333; \
                    cursor: pointer; \
                  } \
                  </style> \
                  {{#if url}} \
                  <a target="_BLANK" href="{{url}}"> \
                  <div class="ui-thumbnail has-file"> \
                    {{#if thumbUrl}} \
                      {{#if youtube}} \
                        <iframe width="300" height="200" src="http://www.youtube.com/embed/{{youtube}}" frameborder="0" allowfullscreen></iframe> \
                      {{else}} \
                        {{#if vimeo}} \
                          <iframe src="//player.vimeo.com/video/{{vimeo}}?title=0&amp;byline=0&amp;portrait=0&amp;color=7AC943" width="300" height="200" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> \
                        {{else}} \
                          <img src="{{thumbUrl}}"> \
                        {{/if}} \
                      {{/if}} \
                    {{else}} \
                      <div class="default-info">{{type}}</div> \
                    {{/if}} \
                  </div> \
                  </a> \
                  <div class="ui-img-details"> \
                    <span class="ui-text-hover" data-action="swap">Swap file</span> \
                  </div> \
                  {{/if}} \
                  <div class="swap-container" {{#if url}}style="display:none"{{/if}}> \
                    <div id="fileDropArea" class="swap-method ui-thumbnail empty ui-thumbnail-dropzone">Drag file here, or click to upload</div> \
                    <input id="fileAddInput" type="file" class="large hide" /> \
                    <div class="secondary-info url-import">Or paste in a YouTube, Vimeo, or file link:</div> \
                    <input id="urlInput" type="text" class="swap-method medium" placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" /><button class="swap-method btn btn-small btn-primary margin-left-small" id="retriveUrlBtn" type="button">Retrieve</button> \
                  </div>';

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    serialize: function() {

      var data = {},
          userId,
          model = this.model,
          authenticatedUser = app.users.getCurrentUser();

      data = model.toJSON();
      if (!model.has('id')) {
        userId = authenticatedUser.id;
        data.isNew = true;
      } else {
        userId = model.get('user');
      }

      var user = app.users.get(userId);

      data.link = undefined;
      data.thumbUrl = undefined;

      var storageAdapter = model.get('storage_adapter');

      if(storageAdapter !== null &&
         storageAdapter !== undefined &&
         storageAdapter !== '') {
          data.url = model.makeFileUrl(false);
          data.thumbUrl = model.makeFileUrl(true);
      }

      data.name = model.get('name');
      data.orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';

      if(model.has('type')) {
        var type = model.get('type').substring(0, model.get('type').indexOf('/'));
        var subtype = model.get('type').split('/').pop();

        //If we shouldnt show thumbnail, set thumbUrl to null
        if(type != 'image' && type != 'embed' && subtype != "pdf") {
          data.thumbUrl = null;
          data.type = subtype.toUpperCase();
        }

        if(model.get('type') == 'embed/youtube') {
          data.youtube = model.get('url');
        } else if(model.get('type') == 'embed/vimeo') {
          data.vimeo = model.get('url');
        }
      }

      return data;
    },

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    events: {
      'click a[data-action=toggle-form]': function() {
        //$('.upload-form').toggleClass('hide');
      },
      'click li[data-action=swap]': function() {
        //this.$el.find('#swap-file').toggleClass('hide');
      },
      'click .swap-method-btn': function() {
        this.$el.find('.swap-method').toggleClass('hide');

        if(this.$el.find('#urlInput').is(':visible')) {
          this.$el.find('#urlInput').focus();
        }
      },
      'click #retriveUrlBtn': function(e) {
        var url = this.$el.find('#urlInput').val();
        var model = this.model;

        app.sendLink(url, function(data) {
          model.set(data[0]);
          model.trigger('sync');
        });
      },
      'change input[type=file]': function(e) {
        var file = $(e.target)[0].files[0];
        var model = this.model;
        app.sendFiles(file, function(data) {
          model.set(data[0]);
          model.trigger('sync');
        });
      },
      'click .ui-thumbnail-dropzone': function(e) {
        this.$el.find('#fileAddInput').click();
      },
      'click span[data-action="swap"]': function(e) {
        this.$el.find('.swap-container').toggle();
        this.$el.find('.ui-thumbnail.has-file').toggle();
        var swapText = this.$el.find('.ui-text-hover').text();
        var newSwapText = (swapText == 'Swap file')? 'Cancel' : 'Swap file';
        this.$el.find('.ui-text-hover').text(newSwapText);
      }
    },

    initialize: function() {
      var FilesModel = require('modules/files/FilesModel');
      if(!(this.model instanceof FilesModel)) {
        this.model = new FilesModel(this.model.attributes, {collection: this.collection});
      }
      this.listenTo(this.model, 'change', this.render);
    },
    afterRender: function() {
      var timer;
      var $dropzone = this.$el.find('.ui-thumbnail');
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
        if (e.dataTransfer.files.length > 1) {
          alert('One file only please');
          return;
        }
        app.sendFiles(e.dataTransfer.files, function(data) {
          model.set(data[0]);
          model.trigger('sync');
        });
        $dropzone.removeClass('dragover');
      }, this);

    },
  });

  Module.list = function(options) {
    var model = options.model;

    //Force model To be a Files Model
    var FileModel = require('modules/files/FilesModel');
    if(!(model instanceof FileModel)) {
      model = new FileModel(model.attributes, {collection: model.collection});
    }

    var orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';
    var url = model.makeFileUrl(true);
    var isImage = _.contains(['image/jpeg','image/png', 'embed/youtube', 'embed/vimeo'], model.get('type'));
    var thumbUrl = isImage ? url : app.PATH + 'assets/img/document.png';

    var img = '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    return img;
  };

  return Module;
});