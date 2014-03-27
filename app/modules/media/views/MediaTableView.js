define([
  'app',
  'backbone',
  'core/modal',
  'core/edit',
  'core/BasePageView',
  'core/table/table.view',
  'modules/media/views/EditMediaView'
],

function(app, Backbone, DirectusModal, DirectusEdit, BasePageView, DirectusTable, EditMediaView) {

  return BasePageView.extend({

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
      var modal = new EditMediaView({model: model, stretch: true, title: title});
      app.router.v.messages.insertView(modal).render();
      if (!model.isNew()) {
        app.router.navigate('#media/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#media');
        });
      }
    },

    serialize: function() {
      return {title: 'Media', upload: true, buttonTitle: 'Add New Media'};
    },

    afterRender: function() {
      this.setView('#page-content', new DirectusTable({collection:this.collection, selectable: true, droppable: true, deleteOnly: true, hideColumnPreferences: true, blacklist: ['storage_adapter']}));
      this.collection.fetch({reset: true});
    }
  });

});