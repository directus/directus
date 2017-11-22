/* global $ */
define([
  'app',
  'underscore',
  'core/t',
  'utils',
  'helpers/file',
  'core/UIView',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/notification'
], function (app, _, __t, Utils, FileHelper, UIView, TableView, Overlays, Notification) {
  'use strict';

  return UIView.extend({
    // Interface template file
    // the template path is relative to UIs directory
    template: 'single_file/interface',

    events: {
      'click .js-modal': 'openModal',
      'click .js-from-computer': 'chooseFromComputer',
      'click .js-from-system': 'chooseFromSystem',
      'click .js-from-url': 'chooseFromUrl',
      'click .js-remove': 'removeFile',
      'click .js-title': 'edit',
      'change input[type=file]': 'onInputChange'
    },

    openModal: function () {
      app.router.openFileModal(this.fileModel.id);
    },

    chooseFromComputer: function () {
      this.$('#fileInput').click();
    },

    chooseFromUrl: function (event) {
      // Prevent this button from submitting the form
      event.preventDefault();
      app.router.openModal({
        type: 'prompt',
        text: __t('enter_the_url_to_a_file'),
        callback: _.bind(function (url) {
          this.getLinkData(url);
        }, this)
      });
    },

    removeFile: function (event) {
      // stop the event from bubbling and open the modal window
      event.stopPropagation();

      this.fileModel.clear();
      this.fileModel.set({id: null});
    },

    getLinkData: function (url) {
      if (!url) {
        return;
      }

      var model = this.fileModel;
      model.setLink(url, this.options.settings.get('allowed_filetypes'));
    },

    chooseFromSystem: function (event) {
      // Prevent this button from submitting the form
      event.preventDefault();

      var collection = app.files;
      var model;
      var fileModel = this.fileModel;

      var view = new Overlays.ListSelect({collection: collection, selectable: true});
      app.router.overlayPage(view);

      collection.fetch();
      view.itemClicked = _.bind(function (e) {
        var id = $(e.target).closest('tr').attr('data-id');
        model = collection.get(id);

        if (model.isAllowed(this.options.settings.get('allowed_filetypes'))) {
          fileModel.clear({silent: true});
          fileModel.set(_.clone(model.attributes));
        }

        app.router.removeOverlayPage(view);
      }, this);
    },

    edit: function () {
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var model = this.fileModel;

      var view = new OverlayEditView({
        model: model,
        onSave: function () {
          model.set(model.diff(view.editView.data()));
          app.router.removeOverlayPage(this);
        }
      });

     app.router.overlayPage(view);

      // Fetch first time to get the nested tables
      if (!model.isNew()) {
        model.fetch();
      }
    },

    onInputChange: function (event) {
      var target = $(event.currentTarget);
      var file = target[0].files[0];
      var model = this.fileModel;
      var allowed;

      this.uploading = true;
      this.render();

      allowed = model.setFile(file, this.options.settings.get('allowed_filetypes'));

      if (allowed === false) {
        this.uploading = false;
        this.render();
        Utils.clearElement(target);
      }
    },

    afterRender: function () {
      var timer;
      var $dropzone = this.$('.dropzone');
      var model = this.fileModel;

      if ($dropzone.length === 0) {
        return;
      }

      $dropzone.on('dragover', function (e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave', function () {
        clearInterval(timer);
        timer = setInterval(function () {
          $dropzone.removeClass('dragover');
          clearInterval(timer);
        }, 50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = _.bind(function (e) {
        e.stopPropagation();
        e.preventDefault();

        if (e.dataTransfer.files.length > 1) {
          Notification.error('Single File', __t('one_file_only_please'));
          return;
        }

        var file = e.dataTransfer.files[0];
        model.setFile(file, this.options.settings.get('allowed_filetypes'));
        $dropzone.removeClass('dragover');
      }, this);

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    },

    serialize: function () {
      var url;
      var link;

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
      // TODO: Fix this path
      var thumbUrl = isImage ? url : app.PATH + 'assets/imgs/missing-thumbnail.svg';

      switch (data.type) {
        case 'embed/youtube':
        case 'embed/vimeo':
          data.size = app.seconds_convert(data.size);
          break;
        default:
          data.size = app.bytesToSize(data.size, 0);
      }

      var html = this.fileModel.get('html');
      if (html) {
        html = $(html).css({width: 280, height: 160}).prop('outerHTML');
      }

      data.type = this.fileModel.getSubType(true);
      data.cid = this.fileModel.cid;

      data = {
        uploading: this.uploading,
        isImage: isImage,
        name: this.options.name,
        url: url,
        html: html,
        thumbUrl: thumbUrl,
        comment: this.options.schema.get('comment'),
        allowed_filetypes: this.options.settings.get('allowed_filetypes'),
        model: data,
        link: link
      };

      return data;
    },

    onModelChange: function () {
      this.uploading = false;
      this.render();
    },

    initialize: function () {
      var FilesModel = require('modules/files/FilesModel'); // eslint-disable-line import/no-unresolved
      var parentModel = this.options.model;

      this.uploading = false;
      this.userId = app.user.id;
      if (!(this.options.value instanceof FilesModel)) {
        // Add the files table privileges, preferences and structure
        // the method isNew need the structure
        // See EntriesModel.isNew
        // See https://github.com/directus/directus/issues/1961
        this.options.value = new FilesModel(this.options.value || {}, app.schemaManager.getFullSchema('directus_files'));
        parentModel.set(this.name, this.options.value);
      }

      this.fileModel = this.options.value;

      if (parentModel.isTracking() && !this.fileModel.isTracking()) {
        this.fileModel.startTracking();
      }

      this.listenTo(this.fileModel, 'change', this.onModelChange);

      if (this.collection) {
        this.listenTo(this.collection, 'reset', this.render);
      }
    }
  });
});
