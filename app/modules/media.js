define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Backbone, Directus) {

  var Media = app.module();


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
      },
    },

    addEditMedia: function(model, title) {
      var view = new Directus.EditView({model: model});
      var modal = app.router.openModal(view, {stretch: true, title: title});
      var isNew = model.isNew();
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
      }
    },

    serialize: function() {
      return {title: this.collection.table.title, upload: true, buttonTitle: 'Add New Media'};
    },

    afterRender: function() {
      this.setView('#page-content', new Directus.Table({collection:this.collection, selectable: true, droppable: true, deleteOnly: true}));
      this.collection.fetch();
    }
  });

  return Media;
});