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
  var VIEW_INTERFACE = 'editOptionsView';

  var View = ModalView.extend({

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    template: 'modal/columns-edit',

    events: {
      'click .js-toggle-pane': 'toggle',
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

    toggle: function() {
      if (this.state.currentView === VIEW_INTERFACE) {
        this.state.currentView = VIEW_COLUMN;
      } else {
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
      var modalClass = this.state.currentView === VIEW_COLUMN ? 'column' : 'interface';
      var view = this.getCurrentView();

      if (this.options.focusTo) {
        this.listenToOnce(view, 'afterRender', function () {
          var selector = '[name=' + this.options.focusTo  + ']';
          this.$(selector).focus();
          this.options.focusTo = null;
        });
      }

      this.$el.removeClass('column interface').addClass(modalClass);
      this.setView('.modal-bg', view);
    },

    getEditColumnView: function() {
      if (!this.editColumnView) {
        var collection = app.schemaManager.getColumns('tables', this.model.parent.get('table_name'));
        var model = collection.get(this.model.parent.id);

        this.editColumnView = new ColumnFormView({
          model: model,
          collection: collection,
          hiddenFields: ['column_name'],
          // Do not allow to select any other ui.
          ui_filter: function(ui) {
            return ui.id === model.get('ui');
          }
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
