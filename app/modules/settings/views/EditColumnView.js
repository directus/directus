define([
  'app',
  'underscore',
  'backbone',
  'core/edit',
  'core/Modal',
  'modules/settings/views/ColumnFormView',
  'modules/settings/views/ColumnOptionsView'
], function(app, _, Backbone, EditView, ModalView, ColumnFormView, ColumnOptionsView) {

  return ModalView.extend({

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
      if (this.state.currentView === 'editOptionsView') {
        this.state.currentView = 'editColumnView';
      } else {
        this.state.currentView = 'editOptionsView';
      }

      this.render();
    },

    getCurrentView: function() {
      if (this.state.currentView === 'editColumnView') {
        return this.getEditColumnView();
      } else {
        return this.getEditOptionsView();
      }
    },

    beforeRender: function() {
      var modalClass = this.state.currentView === 'editColumnView' ? 'column' : 'interface';
      this.$el.removeClass('column interface').addClass(modalClass);
      this.setView('.modal-bg', this.getCurrentView());
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
        currentView: 'editOptionsView'
      };

      this.editOptionsView = this.getEditOptionsView();
    }
  });
});
