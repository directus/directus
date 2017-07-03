define(['app', 'backbone', 'underscore'], function(app, Backbone, _) {

  return Backbone.Layout.extend({

    el: '#modal_container',

    // Prevents the container view from being removed
    // from its parent view when it's re-rendered
    keep: true,

    events: {
      'click .modal-bg': function(event) {
        event.stopPropagation();
      },

      'click .modal': function() {
        if (this.canCloseOnBackground()) {
          this.close();
        }
      },

      'click .js-close-modal': 'onClose'
    },

    _can: function (attr) {
      var can = true;

      this.getViews().each(function (view) {
        can = this._canView(view, attr, can)
      }, this);

      return can;
    },

    _canView: function (view, attr, defaultValue) {
      var can = defaultValue === undefined ? true : defaultValue;

      if (view[attr] === false) {
        can = false;
      }

      return can;
    },

    canCloseOnKey: function () {
      return this._can('closeOnKey');
    },

    canCloseOnBackground: function () {
      return this._can('closeOnBackground');
    },

    canCloseOnButton: function (view) {
      var attr = 'closeOnButton';
      var can;

      if (view) {
        can = this._canView(view, attr)
      } else {
        can = this._can(attr);
      }

      return can;
    },

    onClose: function (event) {
      if (this.canCloseOnButton()) {
        this.close();
      } else {
        event.stopPropagation();
      }
    },

    onKeyDown: function (event) {
      var key = event.keyCode || event.which;

      // enter
      // avoid save on enter when saveOnEnter is true
      if (this.options.saveOnEnter !== false && key === 13) {
        this.save();
      }

      // esc
      if (this.canCloseOnKey() && key === 27) {
        this.close();
      }
    },

    isOpen: function () {
      return this.$('.modal').length > 0;
    },

    show: function (view) {
      $(document).on('keydown.modal', _.bind(this.onKeyDown, this));
      view.setContainer(this);

      this.$el.fadeIn(200, _.bind(function() {
        this.insertView(view).render();
      }, this));

      if (!this.canCloseOnButton(view)) {
        this.$('.js-close-modal').hide();
      } else {
        this.$('.js-close-modal').show();
      }
    },

    save: function () {
      var view = this.getViews().last().value();
      view.save();
    },

    close: function (hard) {
      var modal = this.$('.modal.active');
      var closeViews = _.bind(function () {
        this.getViews().each(function (view) {
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
