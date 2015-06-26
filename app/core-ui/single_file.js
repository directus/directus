//  Single Files core UI component
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
/*jshint multistr: true */


define(['app', 'backbone', 'core/table/table.view', 'core/overlays/overlays'], function(app, Backbone, TableView, Overlays) {

  "use strict";

  var Module = {};

  Module.id = 'single_file';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'allowed_filetypes', ui: 'textinput', char_length:200}
  ];

  //{{capitalize fileModel.title}}

  var template =  '<style type="text/css"> \
                  .ui-file-container:after { \
                    clear: both; \
                    content: ""; \
                    display: block; \
                    width: 100%; \
                  } \
                  div.single-image-thumbnail { \
                    float: left; \
                    max-height: 200px; \
                    background-color: #ffffff; \
                    color: #ededed; \
                    text-align: center; \
                    cursor: pointer; \
                    height: 160px; \
                  } \
                  div.single-image-thumbnail.empty { \
                    width: 156px; \
                    height: 156px; \
                    background-color: #ffffff; \
                    border: 2px dashed #bbbbbb; \
                    font-size: 12px; \
                    font-weight: 600; \
                    line-height: 14px; \
                    color: #bbbbbb; \
                  } \
                  div.single-image-thumbnail.empty span { \
                    margin-top: 0; \
                    display: inline-block; \
                    line-height: 18px; \
                  } \
                  div.single-image-thumbnail.empty span div.icon { \
                    display: block; \
                    font-size: 100px; \
                    line-height: 90px; \
                  } \
                  div.single-image-thumbnail.empty.dragover, \
                  div.single-image-thumbnail.empty:hover { \
                    background-color: #BBBBBB; \
                    color: #ffffff; \
                    cursor: pointer; \
                  } \
                  div.single-image-thumbnail img { \
                    max-width: 160px; \
                    display: block; \
                  } \
                  div.ui-img-details.single_file { \
                    height: 120px; \
                    width: 220px; \
                    float: left; \
                    position: relative; \
                    line-height: 18px; \
                    padding:20px; \
                    background-color: #ececec; \
                  } \
                  div.ui-img-details.single_file .btn { \
                    position: absolute; \
                    bottom: 20px; \
                    left: 20px; \
                  } \
                  div.ui-img-details a.title { \
                    font-size: 16px; \
                    height: 20px; \
                    overflow: hidden; \
                    display: block; \
                    text-overflow: ellipsis; \
                    white-space: nowrap; \
                  } \
                  div.ui-img-details div { \
                    display: inline; \
                  } \
                  div.ui-img-details i { \
                    font-weight: 400; \
                    font-style: italic; \
                    color: #ccc; \
                    margin-top: 5px; \
                    display: block; \
                  } \
                  button.btn-right { \
                    margin-top: 8px; \
                    margin-right: 10px; \
                  } \
                  .swap-method-btn { \
                    display:block; \
                    clear: both; \
                    padding-top: 5px; \
                    cursor: pointer; \
                  } \
                  .single-image-actions { \
                    margin: 10px 0 0 0; \
                    display: block; \
                    font-size: 12px; \
                  } \
                  .single-image-actions span:hover { \
                    color: #333333; \
                    cursor: pointer; \
                  } \
                  </style> \
                  <div class="ui-file-container"> \
                    {{#if url}} \
                    <div class="single-image-thumbnail has-file"> \
                      {{#if fileModel.youtube}}<iframe width="280" height="160" src="http://www.youtube.com/embed/{{fileModel.youtube}}?showinfo=0&controls=0" frameborder="0" allowfullscreen></iframe> \
                      {{else}} \
                        {{#if fileModel.vimeo}} <iframe src="//player.vimeo.com/video/{{fileModel.vimeo}}?title=0&amp;byline=0&amp;portrait=0&amp;color=7AC943" width="280" height="160" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> \
                        {{else}}<a href="{{link}}" class="title" target="single_file"><img src="{{thumbUrl}}"></a>{{/if}} \
                      {{/if}} \
                    </div> \
                    <div class="ui-img-details single_file"> \
                      <a href="{{link}}" class="title" target="single_file" title="{{fileModel.title}}">{{fileModel.title}}</a> \
                      <!--Uploaded by {{userName fileModel.user}} {{contextualDate fileModel.date_uploaded}}<br> --> \
                      <i>{{#if isImage}}{{fileModel.width}} &times; {{fileModel.height}} –{{/if}} {{fileModel.size}} - {{fileModel.type}}</i><br> \
                      <button class="btn btn-primary" data-action="remove-single-file" type="button">Remove File</button> \
                    </div> \
                    {{else}} \
                    <div class="swap-method single-image-thumbnail empty ui-thumbnail-dropzone"><span><div class="icon icon-picture"></div>Drag and drop<br>file here</span></div> \
                    <input id="urlInput" type="text" class="hide swap-method medium" /><button class="hide swap-method btn btn-small btn-primary margin-left-small" id="retriveUrlBtn" type="button">Retrieve</button> \
                    <!--<div class="swap-method swap-method-btn secondary-info">Or use a URL – for embedded videos like YouTube</div><div class="hide swap-method swap-method-btn secondary-info">Or Use a File</div>--> \
                    {{/if}} \
                    <input style="display:none" id="fileAddInput" type="file" class="large" /> \
                  </div> \
                  <div class="single-image-actions"> \
                    <span data-action="computer">Upload</span>, \
                    <span data-action="url">URL Import</span>, or \
                    <span data-action="swap">Directus Files</span> \
                  </div>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'click button[data-action="remove-single-file"]': 'removeFile',
      'click span[data-action="swap"],.ui-thumbnail-dropzone': 'swap',
      'click .has-file': 'edit',
      'click .swap-method-btn': function() {
        this.$el.find('.swap-method').toggleClass('hide');

        if(this.$el.find('#urlInput').is(':visible')) {
          this.$el.find('#urlInput').focus();
        }
      },
      'click #retriveUrlBtn': function(e) {
        var url = this.$el.find('#urlInput').val();
        var model = this.fileModel;
        app.sendLink(url, function(data) {
          _.each(data, function(item) {
            item[app.statusMapping.status_name] = app.statusMapping.active_num;
            // Unset the model ID so that a new file record is created
            // (and the old file record isn't replaced w/ this data)
            item.id = undefined;
            item.user = self.userId;

            //console.log()

            model.set(item);
          });
        });
      },
      'change input[type=file]': function(e) {
        var file = $(e.target)[0].files[0];
        var model = this.fileModel;
        
        if (!this.verifyFile(file)) {
          return false;
        }
        
        app.sendFiles(file, function(data) {
          model.set(data[0]);
          model.trigger('sync');
        });
      },
      'click span[data-action="computer"]': function(e) {
        this.$el.find('#fileAddInput').click();
      },
      'click span[data-action="url"]': function(e) {
        var that = this;
        app.router.openModal({type: 'prompt', text: 'Enter the URL to a file:', callback: function(url) {
          if(!url) {
            return;
          }

          var model = that.fileModel;
          app.sendLink(url, function(data) {
            _.each(data, function(item) {
              if (!that.verifyFile(item)) {
                return false;
              }
              
              item[app.statusMapping.status_name] = app.statusMapping.active_num;
              // Unset the model ID so that a new file record is created
              // (and the old file record isn't replaced w/ this data)
              item.id = undefined;
              item.user = self.userId;

              //console.log()

              model.set(item);
            });
          });
        }});
      },
    },

    removeFile: function(e) {
      this.fileModel.clear();
      this.fileModel.set({id: null});
    },

    swap: function() {
      var collection = app.files;
      var model;
      var fileModel = this.fileModel;
      var view = new Overlays.ListSelect({collection: collection, selectable: true});
      app.router.overlayPage(view);

      collection.fetch();

      //please proxy this instead
      var me = this;

      view.itemClicked = function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        model = collection.get(id);
        if (!me.verifyFile(model)) {
          return false;
        }
        fileModel.clear({silent: true});
        fileModel.set(model.toJSON());
        app.router.removeOverlayPage(this);
      };
    },

    edit: function() {
      var EditView = require("modules/tables/views/EditView");
      var model = this.fileModel;
      var view = new EditView({model: model});
      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function() {
          this.save();
        },
        'click #removeOverlay': function() {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function() {
        model.set(model.diff(view.editView.data()));
        app.router.removeOverlayPage(this);
      };

      // Fetch first time to get the nested tables
      model.fetch();
    },
    
    verifyFile: function(file) {
      var allowed_types, allowed = true;
      
      if (this.options.settings.has('allowed_filetypes')) {
        allowed_types = this.options.settings.get('allowed_filetypes');
        var file_type = file.type || '';
        var allowed = allowed_types.split('|').some(function(item){
          return file_type.indexOf(item)>-1;
        });
      }
      
      if (!allowed) {
        app.router.openModal({type: 'alert', text: 'This type of file is not allowed'});
      }
      
      return allowed;
    },

    afterRender: function() {
      var timer;
      var $dropzone = this.$el.find('.single-image-thumbnail');
      var model = this.fileModel;
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
            item[app.statusMapping.status_name] = app.statusMapping.active_num;
            // Unset the model ID so that a new file record is created
            // (and the old file record isn't replaced w/ this data)
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
      var url = this.fileModel.has('name') ? this.fileModel.makeFileUrl(true) : null;
      var link = this.fileModel.has('name') ? this.fileModel.makeFileUrl() : null;
      var data = this.fileModel.toJSON();
      var type = this.fileModel.has('type') ? this.fileModel.get('type').substring(0, this.fileModel.get('type').indexOf('/')) : '';
      var subtype = this.fileModel.has('type') ? this.fileModel.get('type').split('/').pop() : '';

      var isImage = _.contains(['image', 'embed'], type) || _.contains(['pdf'], subtype);
      var thumbUrl = isImage ? url : app.PATH + 'assets/img/document.png';

      if(data.type) {
        if(data.type == 'embed/youtube') {
          data.youtube = data.url;
          data.size = app.seconds_convert(data.size);
        } else if(data.type == 'embed/vimeo') {
          data.vimeo = data.url;
          data.size = app.seconds_convert(data.size);
        } else {
          data.size = app.bytesToSize(data.size, 0);
        }
      } else {
        data.size = app.bytesToSize(data.size, 0);
      }
      data = {
        isImage: isImage,
        name: this.options.name,
        url: url,
        thumbUrl: thumbUrl,
        comment: this.options.schema.get('comment'),
        allowed_filetypes: (this.options.settings && this.options.settings.has('allowed_filetypes')) ? this.options.settings.get('allowed_filetypes') : '0',
        fileModel: data,
        link: link
      };
      return data;
    },

    initialize: function() {

      this.userId = app.users.getCurrentUser().id;

      this.fileModel = this.options.value;
      this.fileModel.on('change', this.render, this);
      //this.collection = app.getEntries('directus_files');
      //this.collection.fetch();
      if(this.collection) {
        this.listenTo(this.collection, 'reset', this.render);
      }
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value.attributes)) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    var model = options.model;
    //@TODO: Have this not be hardcoded
    if(!model.get('type') && model.get(options.schema.id) instanceof Backbone.Model) {
      model = model.get(options.schema.id);
    }
    var orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';
    var type = (model.get('type')) ? model.get('type').substring(0, model.get('type').indexOf('/')) : '';
    var subtype = (model.get('type')) ? model.get('type').split('/').pop() : '';

    var isImage = _.contains(['image', 'embed'], type) || _.contains(['pdf'], subtype);
    var thumbUrl = isImage ? model.makeFileUrl(true) : app.PATH + 'assets/img/document.png';

    var img = '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';

    return img;
  };

  return Module;

});