define([
  'app',
  'underscore',
  'backbone',
  'core/edit',
  'core/Modal',
  'modules/settings/views/NewColumnView'
], function(app, _, Backbone, EditView, ModalView, NewColumnView) {

  return ModalView.extend({

    attributes: {
      'id': 'modal',
      'class': 'modal interface'
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
      if (this.state.currentView === 'editOptionsView') {
        this.model.save(view.data());
        this._close();
      } else {
        // Edit Column view is a modal so it will save itself
        // view.save();
      }
    },

    toggle: function() {
      var view;

      if (this.state.currentView === 'editOptionsView') {
        this.state.currentView = 'editColumnView';
        view = this.getEditColumnView();
      } else {
        this.state.currentView = 'editOptionsView';
        view = this.editOptionsView;
      }

      this.setView('#form-columns-edit', view);
    },

    getCurrentView: function() {
      if (this.state.currentView === 'editColumnView') {
        return this.getEditColumnView();
      } else {
        return this.getEditOptionsView();
      }
    },

    beforeRender: function() {
      this.setView('#form-columns-edit', this.editOptionsView);
    },

    getEditColumnView: function() {
      if (!this.editColumnView) {
        var collection = app.schemaManager.getColumns('tables', this.model.parent.get('table_name'));
        var model = collection.get(this.model.parent.id);

        this.editColumnView = new NewColumnView({
          model: model,
          collection: collection,
          hiddenFields: ['column_name'],
          // Do not allow to select any other ui.
          ui_filter: function(ui) {
            return ui.id === model.get('ui');
          }
        });

        this.editColumnView.setContainer(this.container);
      }

      return this.editColumnView;
    },

    getEditOptionsView: function() {
      if (!this.editOptionsView) {
        this.editOptionsView = new EditView({
          model: this.model,
          structure: this.options.schema
        });
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
