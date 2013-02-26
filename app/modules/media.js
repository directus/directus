define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Backbone, Directus) {

  var Media = app.module();



  Media.Views.Edit = Directus.Modal.extend({

    afterRender: function() {
      this.setView('.modal-body', this.editView);
      this.editView.render();
    },

    save: function() {
      var me = this;
      var file = $('input[name=file]')[0].files[0];
      var data = this.editView.data();
      var isNew = this.model.isNew();

      if (file !== undefined) {
        data = _.extend(data, {file: file});
      }

      this.model.save(data, {success:function() {
        if (isNew) me.collection.add(this.model);
        me.close();
      }
      });
    },

    initialize: function() {
      this.editView = new Directus.EditView({model: this.model});
      this.collection = app.media;
      this.options.title = this.options.title || 'Editing Media';
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
      return {title: this.collection.table.get('title'), upload: true, buttonTitle: 'Add New Media'};
    },

    afterRender: function() {
      this.setView('#page-content', new Directus.Table({collection:this.collection, selectable: true, droppable: true, deleteOnly: true}));
      this.collection.fetch();
    }
  });

  return Media;
});