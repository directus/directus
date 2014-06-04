define([
  'app',
  'backbone',
  'core/modal',
  'core/edit',
  'core/BasePageView',
  'core/table/table.view',
  'core/widgets/widgets',
  'modules/media/views/EditMediaView',
  'modules/media/views/MediaCardView'
],

function(app, Backbone, DirectusModal, DirectusEdit, BasePageView, DirectusTable, Widgets, EditMediaView, MediaCardView) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: "Files"
      }
    },
    leftToolbar: function() {
      return [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-plus", buttonClass: "add-color-background"}})
      ];
    },
    rightToolbar: function() {
      return [
        //new Widgets.SearchWidget(),
        //new Widgets.ButtonWidget({widgetOptions: {active: this.viewList, buttonId: "listBtn", iconClass: "icon-list"}}),
        //new Widgets.ButtonWidget({widgetOptions: {active: !this.viewList, buttonId: "gridBtn", iconClass: "icon-layout"}})
      ];
    },

    leftSecondaryToolbar: function() {
      if(!this.widgets.filterWidget) {
        this.widgets.filterWidget = new Widgets.FilterWidget({collection: this.collection});
      }

      return [this.widgets.filterWidget];
    },

    events: {
      'click #addBtn': function() {
        app.router.go('#files','new');
      },
      'click #gridBtn': function() {
        if(this.viewList) {
          this.viewList = false;
          $('#listBtn').parent().removeClass('active');
          $('#gridBtn').parent().addClass('active');
          this.table = new MediaCardView({collection:this.collection});
          this.render();
        }
      },
      'click #listBtn': function() {
        if(!this.viewList) {
          this.viewList = true;
          $('#listBtn').parent().addClass('active');
          $('#gridBtn').parent().removeClass('active');
          this.table = new DirectusTable({collection:this.collection, selectable: true, droppable: true, deleteOnly: true, hideColumnPreferences: true, blacklist: ['storage_adapter']});
          this.render();
        }
      },
      'fileuploadprogress #fileupload': function(e, data) {
        console.log('progress...', data);
      },
      'fileuploaddone #fileupload': function(e, data) {
        console.log('done');
        this.collection.fetch();
      },
      'fileuploadfail #fileupload': function (e, data) {
        console.log('faiiilll!!!', e, data);
      },
      'click td:not(.check)': function(e) {
        var cid = $(e.target).closest('tr').attr('data-cid');
        var model = this.collection.get(cid);
        this.addEditMedia(model, 'Editing Media');
      }
    },

    addEditMedia: function(model, title) {
      var modal = new EditMediaView({model: model, stretch: true, title: title});
      app.router.v.messages.insertView(modal).render();
      if (!model.isNew()) {
        app.router.navigate('#files/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#files');
        });
      }
    },
    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch();
    },
    initialize: function() {
      this.viewList = false;
      this.table = new MediaCardView({collection:this.collection});
      this.widgets = [];
    }
  });

});