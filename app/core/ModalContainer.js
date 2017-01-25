define(['app', 'backbone', 'underscore', 'core/Modal'], function(app, Backbone, _, ModalView) {

  return Backbone.Layout.extend({
    el: '#modal_container',

    events: {
      'click .modal-bg': function(event) {
        event.stopPropagation();
      },

      'click .modal': function() {
        this.close();
      },

      'click .js-close-modal': 'close'
    },

    onKeyDown: function(e) {
      var key = e.keyCode || e.which;

      // enter
      if (key === 13) {
        this.save();
      }

      // esc
      if (key === 27) {
        this.close();
      }
    },

    isOpen: function() {
      return this.$('.modal').length > 0;
    },

    show: function(view) {
      $(document).on('keydown.modal', _.bind(this.onKeyDown, this));
      view.setContainer(this);

      this.$el.fadeIn(200, _.bind(function() {
        this.insertView(view).render();
      }, this));
    },

    save: function() {
      var view = this.getViews().last().value();
      view.save();
    },

    close: function(hard) {
      var modal = this.$('.modal.active');
      var closeViews = _.bind(function() {
        this.getViews().each(function(view) {
          view.close();
        });

        this.$('.slide-down').removeClass('slide-down');
      }, this);

      $(document).off('keydown.modal');

      if (hard === true) {
        return closeViews();
      }

      modal.removeClass('active').addClass('slide-down');

      this.$el.fadeOut(200, closeViews);
    }
  });
});
