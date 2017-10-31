define([
  'app',
  'underscore',
  'backbone',
  'handlebars',
  'helpers/schema',
  'core/edit',
  'core/Modal',
  'modules/settings/views/modals/columns/info',
  'modules/settings/views/modals/columns/options'
], function(app, _, Backbone, Handlebars, SchemaHelper, EditView, ModalView, ColumnInfoView, ColumnOptionsView) {

  var VIEW_COLUMN_ID = 'column';
  var VIEW_INTERFACE_ID = 'interface';

  var View = ModalView.extend({

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    template: Handlebars.compile('<div class="modal-bg crop"></div>'),

    events: {
      'change select, input, textarea': 'onInputChange',
      'input input, textarea': 'onInputChange',
      'click .js-pane': 'toggle',
      'click .js-cancel': '_close',
      'click .js-save': 'save'
    },

    onInputChange: function (event) {
      var $target = $(event.currentTarget);

      this.update($target.attr('name'), $target.val());
    },

    update: function (name, value) {
      var model = this.state.activeModel;

      if (model) {
        model.set(name, value);
      }
    },

    _close: function () {
      // change Modal.close to Modal._close
      // change this._close to this.close
      // closing the modal should close it from their container
      this.container.close();
    },

    save: function () {
      var columnModel = this.model.parent;
      var infoView = this.getColumnView();
      var optionsView = this.getOptionsView();
      var isOptionsView;

      if (!infoView.model.isNew()) {
				// strip first and last character from buttons
				if(optionsView.model.attributes.buttons&&optionsView.model.attributes.buttons[0]===','){
					optionsView.model.attributes.buttons = optionsView.model.attributes.buttons.substr(1);
				}
				if(optionsView.model.attributes.buttons&&optionsView.model.attributes.buttons[optionsView.model.attributes.buttons.length-1]===','){
					optionsView.model.attributes.buttons = optionsView.model.attributes.buttons.slice(0, -1);
				}
        infoView.model.set('options', JSON.stringify(optionsView.model.toJSON()));
      } else {
        var sort = 0;
        var lastColumnModel = infoView.model.collection.last();

        if (lastColumnModel) {
          sort = lastColumnModel.get('sort') + 1;
        }

        infoView.model.set('sort', sort);
      }

      // TODO: Improve saving payload
      // sending the new values and if there's not info value to be save, only save the options
      if (infoView.save()) {
        isOptionsView = this.state.currentView === VIEW_INTERFACE_ID;
        if (!isOptionsView && SchemaHelper.isMissingRequiredOptions(columnModel)) {
          this.changeTo(VIEW_INTERFACE_ID);
        } else {
          this._close();
        }
      }
    },

    toggle: function (event) {
      var $toggle = $(event.currentTarget);
      event.preventDefault();

      this.changeTo($toggle.data('pane'));
    },

    changeTo: function (viewName) {
      if (viewName == this.state.currentView) {
        return;
      }

      this.state.currentView = viewName;
      this.state.activeModel = this.getActiveViewModel();

      this.render();
    },

    getCurrentView: function () {
      if (this.state.currentView === VIEW_COLUMN_ID) {
        return this.getColumnView();
      } else {
        return this.getOptionsView();
      }
    },

    beforeRender: function() {
      var modalClass = this.state.currentView;
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

      this.$el.removeClass(VIEW_COLUMN_ID).removeClass(VIEW_INTERFACE_ID).addClass(modalClass);
      this.setView('.modal-bg', view);
    },

    getColumnView: function () {
      if (!this.columnView) {
        var collection = app.schemaManager.getColumns('tables', this.model.parent.get('table_name'));

        this.columnView = new ColumnInfoView({
          model: this.model.parent,
          collection: collection,
          hiddenFields: !this.model.parent.isNew() ? ['column_name'] : []
        });
      }

      return this.columnView;
    },

    getOptionsView: function () {
      // if is a new column or the column change interface
      // create a new options view based on the new interface options
      if (this.model.parent.isNew() || this.model.parent.get('ui') !== this.model.id) {
        var columnModel = this.model.parent;
        var newInterfaceId = columnModel.get('ui');

        this.model.structure = app.schemaManager.getColumns('ui', newInterfaceId, true);

        columnModel.set('options', this.model);

        this.model.clear();
        this.model.set('id', this.model.parent.get('ui'));

        if (this.optionsView) {
          this.optionsView.remove();
          this.optionsView = null;
        }
      }

      if (!this.optionsView) {
        this.optionsView = new ColumnOptionsView({
          model: this.model
        });
      }

      return this.optionsView;
    },

    cleanup: function () {
      this.model.parent.resetAttributes();
      this.model.parent.stopTracking();
      this.model.stopTracking();
    },

    getActiveViewModel: function () {
      var model;

      switch (this.state.currentView) {
        case VIEW_COLUMN_ID:
          model = this.model.parent;
          break;
        case VIEW_INTERFACE_ID:
        default:
          model = this.model;
      }

      return model;
    },

    initialize: function() {
      this.state = {
        activeModel: null,
        currentView: this.options.currentView || VIEW_COLUMN_ID
      };

      // TODO: Use the column model as main model instead of column options
      this.state.activeModel = this.getActiveViewModel();
      this.optionsView = this.getOptionsView();
      this.model.parent.startTracking();
      this.model.startTracking();
    }
  });

  View.VIEW_INTERFACE_ID = VIEW_INTERFACE_ID;
  View.VIEW_COLUMN_ID = VIEW_COLUMN_ID;

  return View;
});
