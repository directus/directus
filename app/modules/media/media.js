define([
  'app',
  'backbone',
  'core/modal',
  'core/edit',
  'core/table/table.view'
],

function(app, Backbone, DirectusModal, DirectusEdit, DirectusTable) {

  "use strict";

  var Media = app.module();



  Media.Views.Edit = DirectusModal.extend({

    afterRender: function() {
      this.setView('.modal-body', this.editView);
      if (!this.model.isNew()) {
        this.model.fetch();
      } else {
        this.editView.render();
      }
    },

    save: function() {
      var me = this;
      var data = this.editView.data();
      var isNew = this.model.isNew();

      this.model.save(data, {success:function() {
        if (isNew) me.collection.add(me.model);
        me.close();
      }
      });
    },

    initialize: function() {
      this.editView = new DirectusEdit({model: this.model});
      this.collection = app.media;
      this.options.title = this.options.title || 'Editing Media';
      this.on('close', function() {
        if (this.model.hasChanged()) {
          // @todo evaluate the usefulness of this
          this.model.rollBack();
        }
      }, this);
    }
  });

  Media.Views.List = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click #btn-top': function() {
        var model = new this.collection.model({},{collection: this.collection});
        this.addEditMedia(model, 'Add New Media');
      },
      'fileuploadprogress #fileupload': function(e, data) {
        console.log('progress...', data);
      },
      'fileuploaddone #fileupload': function(e, data) {
        console.log('done');
        this.collection.fetch();
      },
      'fileuploadfail #fileupload': function (e, data) {
        console.log('faiiilll!!!', e, data);
      },
      'click td:not(.check)': function(e) {
        var cid = $(e.target).closest('tr').attr('data-cid');
        var model = this.collection.get(cid);
        this.addEditMedia(model, 'Editing Media');
      }
    },

    addEditMedia: function(model, title) {
      var modal = new Media.Views.Edit({model: model, stretch: true, title: title});
      app.router.v.messages.insertView(modal).render();
      if (!model.isNew()) {
        app.router.navigate('#media/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#media');
        });
      }

      /*
      var view = new Directus.EditView({model: model});
      var modal = app.router.openModal(view, {stretch: true, title: title});
      var isNew = model.isNew();
      if (!isNew) {
        app.router.navigate('#media/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#media');
        });
      }
      var collection = this.collection;
      view.render();
      modal.save = function() {
        var file = $('input[name=file]')[0].files[0];
        var data = view.data();
        if (file !== undefined) {
          data = _.extend(data, {file: file});
        }
        model.save(data, {success:function() {
          if (isNew) {
            collection.add(model);
          }
          modal.close();
        }});
      };
      */
    },

    serialize: function() {
      return {title: 'Media', upload: true, buttonTitle: 'Add New Media'};
    },

    afterRender: function() {
      this.setView('#page-content', new DirectusTable({collection:this.collection, selectable: true, droppable: true, deleteOnly: true, hideColumnPreferences: true}));
      this.collection.fetch({reset: true});
    }
  });

  return Media;
});