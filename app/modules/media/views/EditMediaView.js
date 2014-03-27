define([
  'app',
  'backbone',
  'core/modal',
  'core/edit'
],

function(app, Backbone, DirectusModal, DirectusEdit) {

  return DirectusModal.extend({

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

});