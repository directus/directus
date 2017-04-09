//  Files Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'helpers/file', 'core/UIComponent', 'core/UIView'], function(app, FileHelper, UIComponent, UIView) {

  'use strict';

  var template = '<style type="text/css"> \
                  div.ui-thumbnail { \
                    float: left; \
                    margin-top: 8px; \
                    max-height: 200px; \
                    padding: 10px; \
                    background-color: #ffffff; \
                    border: 1px solid #dddddd; \
                    color: #aaaaaa; \
                    text-align: center; \
                    cursor: pointer; \
                    margin-bottom: 10px; \
                    border-radius: 4px; \
                  } \
                  div.ui-thumbnail.empty { \
                    max-width: 276px; \
                    width: 100%; \
                    height: 140px; \
                    background-color: #ffffff; \
                    border: 2px dashed #dddddd; \
                    padding: 9px; \
                    font-size: 16px; \
                    font-weight: 500; \
                    line-height: 144px; \
                  } \
                  div.ui-thumbnail.empty.dragover, \
                  div.ui-thumbnail.empty:hover { \
                    background-color: #fefefe; \
                    border: 2px dashed #aaaaaa; \
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
                    margin-bottom: 4px; \
                    display: inline-block; \
                  } \
                  .swap-method-btn { \
                    display:block; \
                    clear: both; \
                    padding-top: 5px; \
                    cursor: pointer; \
                  } \
                  </style> \
                  {{#if url}} \
                  <div class="ui-thumbnail has-file"> \
                    {{#if html}} \
                      {{{html}}} \
                    {{else}} \
                      {{#if thumbUrl}} \
                        <div class="thumbnail js-image"> \
                          <a target="_BLANK" href="{{url}}"> \
                            <div class="extension-fallback"> \
                              <div class="type">{{uppercase type}}</div> \
                            </div> \
                            <img src="{{thumbUrl}}"> \
                          </a> \
                        </div> \
                      {{else}} \
                        <div class="default-info"><a target="_BLANK" href="{{url}}">{{type}}</a></div> \
                      {{/if}} \
                    {{/if}} \
                  </div> \
                  <div class="ui-img-details"> \
                    <button class="btn btn-primary btn-small ui-text-hover" data-action="swap" type="button">{{t "directus_files_swap_file"}}</button> \
                  </div> \
                  {{/if}} \
                  <div class="swap-container" {{#if url}}style="display:none"{{/if}}> \
                    <div id="fileDropArea" class="swap-method ui-thumbnail empty ui-thumbnail-dropzone">{{t "directus_files_drop_or_choose_file"}}</div> \
                    <input id="fileAddInput" type="file" class="large hide" /> \
                    <div class="no-value url-import">{{t "directus_files_paste_youtube_vimeo_url"}}:</div> \
                    <input id="urlInput" type="text" class="swap-method medium" placeholder="{{t "example_abbr"}} https://www.youtube.com/watch?v=dQw4w9WgXcQ" /><button class="swap-method btn btn-primary margin-left-small" id="retriveUrlBtn" type="button">{{t "directus_files_retrieve"}}</button> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,

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
      } else if (model.isNew()) {
        data.url = model.get('url') || model.get('data');
        data.thumbUrl = model.get('thumbnailData') || model.get('url') || model.get('data');
      }

      data.name = model.get('name');
      data.orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';

      if(model.has('type')) {
        var type = model.get('type').substring(0, model.get('type').indexOf('/'));
        var subtype = model.getSubType(true);

        //If we shouldnt show thumbnail, set thumbUrl to null
        if(type !== 'image' && type !== 'embed' && subtype !== 'pdf') {
          data.thumbUrl = null;
          data.type = subtype.toUpperCase();
        }

        if (model.get('html')) {
          data.html = $(model.get('html')).css({width: 300, height: 200}).prop('outerHTML');
        }
      }

      return data;
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
          var item = data[0];

          item[app.statusMapping.status_name] = app.statusMapping.active_num;
          // Unset the model ID so that a new file record is created
          // (and the old file record isn't replaced w/ this data)
          item.id = undefined;
          item.user = self.userId;

          model.setData(item);
        });
      },
      'change input[type=file]': function(e) {
        var file = $(e.target)[0].files[0];
        var model = this.model;

        model.setFile(file);
      },
      'click .ui-thumbnail-dropzone': function(e) {
        this.$el.find('#fileAddInput').click();
      },
      'click button[data-action="swap"]': function(e) {
        this.$el.find('.swap-container').toggle();
        this.$el.find('.ui-thumbnail.has-file').toggle();
        var swapText = this.$el.find('.ui-text-hover').html();
        var newSwapText = (swapText === 'Swap file')? 'Cancel' : 'Swap file';
        this.$el.find('.ui-text-hover').html(newSwapText);
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
      $dropzone[0].ondrop = function(e) {
        e.stopPropagation();
        e.preventDefault();

        if (e.dataTransfer.files.length > 1) {
          alert('One file only please');
          return;
        }

        var file = e.dataTransfer.files[0];

        model.setFile(file);

        $dropzone.removeClass('dragover');
      };

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_file',
    system: true,
    Input: Input,
    list: function(options) {
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

      return '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    }
  });

  return Component;
});
