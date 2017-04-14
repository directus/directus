define([
  'app',
  'underscore',
  'backbone',
  'core/edit',
  'core/Modal',
  'modules/settings/views/ColumnFormView',
  'modules/settings/views/ColumnOptionsView'
], function(app, _, Backbone, EditView, ModalView, ColumnFormView, ColumnOptionsView) {

  var VIEW_COLUMN = 'editColumnView';
  var VIEW_COLUMN_NAME = 'column';
  var VIEW_INTERFACE = 'editOptionsView';
  var VIEW_INTERFACE_NAME = 'interface';

  var View = ModalView.extend({

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    template: 'modal/columns-edit',

    events: {
      'click .js-pane': 'toggle',
      'click .js-cancel': '_close',
      'click .js-save': 'save'
    },

    _close: function() {
      // change Modal.close to Modal._close
      // change this._close to this.close
      // closing the modal should close it from their container
      this.container.close();
    },

    save: function() {
      var view = this.getCurrentView();

      view.save();
      this._close();
    },

    toggle: function (event) {
      event.preventDefault();

      var $toggle = $(event.currentTarget);
      var viewName = $toggle.data('pane');

      debugger;
      if (viewName == this.state.currentView) {
        return;
      }

      switch (viewName) {
        case VIEW_COLUMN_NAME:
          this.state.currentView = VIEW_COLUMN;
          break;
        case VIEW_INTERFACE_NAME:
        default:
          this.state.currentView = VIEW_INTERFACE;
      }

      this.render();
    },

    getCurrentView: function() {
      if (this.state.currentView === VIEW_COLUMN) {
        return this.getEditColumnView();
      } else {
        return this.getEditOptionsView();
      }
    },

    beforeRender: function() {
      var modalClass = this.state.currentView === VIEW_COLUMN ? VIEW_COLUMN_NAME : VIEW_INTERFACE_NAME;
      var view = this.getCurrentView();

      if (this.options.focusTo) {
        this.listenToOnce(view, 'afterRender', function () {
          var selector = '[name=' + this.options.focusTo  + ']';
          this.$(selector).focus();
          this.options.focusTo = null;
        });
      }

      if (this.options.scrollTo) {
        this.listenToOnce(view, 'afterRender', function () {
          var $el = view.$(this.options.scrollTo);
          if ($el.length) {
            this.$('.modal-bg').scrollTop($el.offset().top);
          }
        });
      }

      this.$el.removeClass(VIEW_COLUMN_NAME).removeClass(VIEW_INTERFACE_NAME).addClass(modalClass);
      this.setView('.modal-bg', view);
    },

    getEditColumnView: function() {
      if (!this.editColumnView) {
        var collection = app.schemaManager.getColumns('tables', this.model.parent.get('table_name'));
        var model = collection.get(this.model.parent.id);

        this.editColumnView = new ColumnFormView({
          model: model,
          collection: collection,
          hiddenFields: ['column_name']
        });
      }

      return this.editColumnView;
    },

    getEditOptionsView: function() {
      if (!this.editOptionsView) {
        this.editOptionsView = new ColumnOptionsView(this.options);
      }

      return this.editOptionsView;
    },

    initialize: function() {
      this.state = {
        currentView: this.options.currentView || VIEW_INTERFACE
      };

      this.editOptionsView = this.getEditOptionsView();
    }
  });

  View.VIEW_INTERFACE = VIEW_INTERFACE;
  View.VIEW_COLUMN = VIEW_COLUMN;

  return View;
});
