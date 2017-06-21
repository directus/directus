define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/BasePageView',
  'core/ListViewManager',
  'core/widgets/widgets'
], function (app, _, Backbone, __t, BasePageView, ListViewManager, Widgets) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Table View',
        isOverlay: true
      }
    },

    leftToolbar: function () {
      return [
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'check',
            buttonClass: 'primary',
            buttonText: __t('choose')
          },
          onClick: _.bind(function () {
            this.save();
          }, this)
        }),
        new Widgets.InfoButtonWidget({
          enable: false
        })
      ];
    },

    rightToolbar: function () {
      return [
        new Widgets.FilterWidget({
          syncFilters: false,
          collection: this.collection,
          basePage: this
        })
      ];

      // return [
      //   new Widgets.PaginatorWidget({
      //     collection: this.collection
      //   })
      // ];
    },

    leftSecondaryToolbar: function() {
      return [
        // NOTE: remove visibility widget not in used
        // also prevent from fetching the results a second time
        // when it's being fetch from whoever calls it
        // new Widgets.VisibilityWidget({
        //   collection: this.collection,
        //   basePage: this
        // }),
        new Widgets.FilterWidget({
          collection: this.collection,
          basePage: this
        })
      ];
    },

    rightSecondaryToolbar: function () {
      return [
        new Widgets.PaginationCountWidget({
          collection: this.collection
        })
      ];
    },

    events: {
      'click #addBtn': function () {
        this.save();
      }
    },

    save: function () {
      console.log("Save");
    },

    afterRender: function () {
      this.setView('#page-content', this.table);
    },

    itemClicked: function (event) {
      var $target = $(event.currentTarget);
      var $checkbox = $target.find('input');

      if ($checkbox.prop('checked')) {
        $checkbox.prop('checked', false);
      } else {
        $checkbox.prop('checked', true);
      }
    },

    initialize: function (options) {
      options || (options = {});

      // Default to true
      if (options.selectable === undefined) {
        options.selectable = true;
      }

      this.table = ListViewManager.getInstance({
        flex: true,
        collection: this.collection,
        selectable: options.selectable,
        isModelSelectable: options.isModelSelectable
      });

      var that = this;

      this.table.events = {
        'click td.js-check': function (event) {
          that.itemClicked(event);
        }
      };

      this.headerOptions.route.title = this.collection.table.id;
    }
  });
});
