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


define([
    'app',
    'underscore',
    'backbone',
    'core/t',
    'core/UIComponent',
    'core/UIView',
    'core/table/table.view',
    'core/overlays/overlays'
  ],
  function(app, _, Backbone, __t, UIComponent, UIView, TableView, Overlays) {

  'use strict';

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
                    margin-top: 28px; \
                    text-align: center; \
                    display: inline-block; \
                    line-height: 18px; \
                    padding: 0 30px 0 30px; \
                  } \
                  div.single-image-thumbnail.empty span i.material-icons { \
                    display: block; \
                    font-size: 60px; \
                    width: auto; \
                    margin-bottom: 5px; \
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
                  .choose-method-btn { \
                    display:block; \
                    clear: both; \
                    padding-top: 5px; \
                    cursor: pointer; \
                  } \
                  .single-image-actions { \
                    margin: 20px 0 0 0; \
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
                      {{#if html}}\
                        {{{html}}}\
                      {{else}} \
                        <a href="#" class="title"><img src="{{thumbUrl}}"></a> \
                      {{/if}} \
                    </div> \
                    <div class="ui-img-details single_file"> \
                      <a href="#" class="title" title="{{fileModel.title}}">{{fileModel.title}}</a> \
                      <!--Uploaded by {{userName fileModel.user}} {{contextualDate fileModel.date_uploaded}}<br> --> \
                      <i>{{#if isImage}}{{fileModel.width}} &times; {{fileModel.height}} –{{/if}} {{fileModel.size}} - {{fileModel.type}}</i><br> \
                      <button class="btn btn-primary" data-action="remove-single-file" type="button">{{t "remove_file"}}</button> \
                    </div> \
                    {{else}} \
                    <div class="choose-method single-image-thumbnail empty ui-thumbnail-dropzone"><span><i class="material-icons">collections</i>{{t "directus_files_drop_or_choose_file"}}</span></div> \
                    <input id="urlInput" type="text" class="hide choose-method medium" /><button class="hide choose-method btn btn-small btn-primary margin-left-small" id="retriveUrlBtn" type="button">Retrieve</button> \
                    {{/if}} \
                    <input style="display:none" id="fileAddInput" type="file" class="large" /> \
                  </div> \
                  <div class="single-image-actions"> \
                    <button class="btn btn-primary btn-small margin-right-small" data-action="computer" type="button">{{t "file_upload"}}</button> \
                    <button class="btn btn-primary btn-small margin-right-small" data-action="url" type="button">{{t "url_import"}}</button> \
                    <button class="btn btn-primary btn-small" data-action="choose" type="button">{{t "directus_files"}}</button> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'click button[data-action="remove-single-file"]': 'removeFile',
      'click button[data-action="choose"]': 'choose',
      'click .ui-img-details .title': 'edit',
      'click .choose-method-btn': function() {
        this.$el.find('.choose-method').toggleClass('hide');

        if(this.$el.find('#urlInput').is(':visible')) {
          this.$el.find('#urlInput').focus();
        }
      },
      'click #retriveUrlBtn': function(e) {
        var url = this.$el.find('#urlInput').val();
        var model = this.fileModel;
        model.setLink(url);
      },
      'change input[type=file]': function(event) {
        var target = $(event.target);
        var file = target[0].files[0];
        var model = this.fileModel;
        model.setFile(file);
      },
      'click button[data-action="computer"], .ui-thumbnail-dropzone, .single-image-thumbnail img': function(e) {
        this.$el.find('#fileAddInput').click();
      },
      'click button[data-action="url"]': function(e) {
        var that = this;
        app.router.openModal({type: 'prompt', text: __t('enter_the_url_to_a_file'), callback: function(url) {
          that.getLinkData(url);
        }});
      },
    },

    getLinkData: function(url) {
      if(!url) {
        return;
      }

      var model = this.fileModel;
      model.setLink(url);
    },

    removeFile: function(e) {
      this.fileModel.clear();
      this.fileModel.set({id: null});
    },

    choose: function() {
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
        if (!app.settings.isFileAllowed(model)) {
          return false;
        }
        fileModel.clear({silent: true});
        fileModel.set(_.clone(model.attributes));
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
          alert(__t('one_file_only_please'));
          return;
        }

        var file = e.dataTransfer.files[0];
        model.setFile(file);
        $dropzone.removeClass('dragover');
      }, this);

    },

    serialize: function() {
      var url, link;
      if (this.fileModel.has('name')) {
        if (this.fileModel.isNew()) {
          link = '#';
          url = this.fileModel.get('thumbnailData') || this.fileModel.get('url');
        } else {
          link = this.fileModel.makeFileUrl();
          url = this.fileModel.makeFileUrl(true) || link;
        }
      }

      var data = this.fileModel.toJSON();
      var type = this.fileModel.has('type') ? this.fileModel.get('type').substring(0, this.fileModel.get('type').indexOf('/')) : '';
      var isImage = _.contains(['image', 'embed'], type);
      var thumbUrl = isImage ? url : app.PATH + 'assets/img/document.png';

      if(data.type) {
        if(data.type === 'embed/youtube') {
          data.size = app.seconds_convert(data.size);
        } else if(data.type === 'embed/vimeo') {
          data.size = app.seconds_convert(data.size);
        } else {
          data.size = app.bytesToSize(data.size, 0);
        }
      } else {
        data.size = app.bytesToSize(data.size, 0);
      }
      var html = this.fileModel.get('html');
      if (html) {
        html = $(html).css({width: 280, height: 160}).prop('outerHTML');
      }

      data = {
        isImage: isImage,
        name: this.options.name,
        url: url,
        html: html,
        thumbUrl: thumbUrl,
        comment: this.options.schema.get('comment'),
        allowed_filetypes: this.options.settings.get('allowed_filetypes'),
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

  var Component = UIComponent.extend({
    id: 'single_file',
    dataTypes: ['INT'],
    variables: [
      {id: 'allowed_filetypes', type: 'String', default_value:'', ui: 'textinput', char_length:200}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value.attributes)) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
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

      return '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    }
  });

  return Component;
});
