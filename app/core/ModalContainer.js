define(['app', 'backbone', 'underscore'], function(app, Backbone, _) {

  return Backbone.Layout.extend({
    el: '#modal_container',

    events: {
      'click .modal-bg': function(event) {
        event.stopPropagation();
      },

      'click :not(.smoke)': function() {
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

    close: function() {
      var modal = this.$('.modal.active');

      $(document).off('keydown.modal');

      modal.removeClass('active').addClass('slide-down');

      setTimeout(_.bind(function(){
        this.$('.slide-down').removeClass('slide-down');
      }, this), 200);

      this.$el.fadeOut(200, _.bind(function() {
        this.getViews().each(function(view) {
          view.close();
        });
      }, this));
    }
  });
});
