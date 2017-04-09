//  Single Files core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'underscore',
  'core/t',
  'utils',
  'helpers/file',
  'core/UIView',
  'core/table/table.view',
  'core/overlays/overlays'
],
function (app, _, __t, Utils, FileHelper, UIView, TableView, Overlays) {

  'use strict';

  return UIView.extend({
    // Interface template file
    // the template path is relative to UIs directory
    template: 'single_file/interface',

    events: {
      'click .js-from-computer': 'chooseFromComputer',
      'click .js-from-system': 'chooseFromSystem',
      'click .js-from-url': 'chooseFromUrl',
      'click .js-remove': 'removeFile',
      'click .js-title': 'edit',
      'change input[type=file]': 'onInputChange'
    },

    chooseFromComputer: function() {
      this.$('#fileInput').click();
    },

    chooseFromUrl: function() {
      app.router.openModal({
        type: 'prompt',
        text: __t('enter_the_url_to_a_file'),
        callback: _.bind(function (url) {
          this.getLinkData(url);
        }, this)
      });
    },

    removeFile: function () {
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

    chooseFromSystem: function () {
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
      var EditView = require("modules/tables/views/EditView");
      var model = this.fileModel;
      var view = new EditView({model: model});
      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function () {
          this.save();
        },
        'click #removeOverlay': function () {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function () {
        model.set(model.diff(view.editView.data()));
        app.router.removeOverlayPage(this);
      };

      // Fetch first time to get the nested tables
      if (!model.isNew()) {
        model.fetch();
      }
    },

    onInputChange: function (event) {
      var target = $(event.currentTarget);
      var file = target[0].files[0];
      var model = this.fileModel;
      var allowed = model.setFile(file, this.options.settings.get('allowed_filetypes'));

      if (allowed === false) {
        Utils.clearElement(target);
      }
    },

    afterRender: function () {
      var timer;
      var $dropzone = this.$('.dropzone');
      var model = this.fileModel;

      if (!$dropzone.length) {
        return;
      }

      $dropzone.on('dragover', function (e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave', function (e) {
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
          alert(__t('one_file_only_please'));
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

      data = {
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

    initialize: function () {
      this.userId = app.users.getCurrentUser().id;
      this.fileModel = this.options.value;
      this.fileModel.on('change', this.render, this);
      this.listenTo(this.fileModel, 'change', this.render);

      if (this.collection) {
        this.listenTo(this.collection, 'reset', this.render);
      }
    }
  });
});
