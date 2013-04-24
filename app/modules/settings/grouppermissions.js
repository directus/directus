//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus',
  'core/panes/pane.saveview'
],

function(app, Directus, PaneSaveView) {

  var Permissions = Backbone.Layout.extend({

    template: 'settings-grouppermissions',

    events: {
      'click .toggleFields': 'expandTableFields',
      'click .togglePermission': 'togglePermission'
    },

    afterRender: function() {
      // this.$el.find('.table-fields').hide();
      app.affix();
    },

    expandTableFields: function(e){
      var $allCarets = this.$el.find('.directus-glyphicon-arrow-right');
      var $clickedCaret = this.$(e.target);
      var tableName = $clickedCaret.parent().parent().data('tableName');

      $clickedCaret.toggleClass('active');
      $allCarets.not($clickedCaret).removeClass('active');
      this.$el.find("[data-table-group='" + tableName + "']").toggleClass('active');
      this.$el.find("[data-table-group]").not("[data-table-group='" + tableName + "']").removeClass('active');
    },

    togglePermission: function(e){
      var $target = this.$(e.target),
          $targetParent = $target.parent(),
          targetIndex = $targetParent.index() + 1,
          tableName = $targetParent.parent().data('tableName');

      if($targetParent.hasClass('mix')) {
        // console.log("if");
        this.$el
          .find("[data-table-name='" + tableName + "']")
          .find("td:nth-child(" + targetIndex + ")").removeClass('mix')
          .addClass('on');

        this.$el
          .find("[data-table-group='" + tableName + "']")
          .find("td:nth-child(" + targetIndex + ")").removeClass('on off')
          .addClass('on');
      }
      else if($targetParent.hasClass('tableNameRow')) {
        // console.log("else if");
        // var targetIndex = $targetParent.index() + 1;
        // var tableName = $targetParent.parent().data('tableName');
        // console.log(targetIndex, tableName);

        $targetParent.toggleClass('on off');
        $targetParent.data('isMix', false);

        this.$el
          .find("[data-table-group='" + tableName + "']")
          .find("td:nth-child(" + targetIndex + ")").toggleClass('on off');
      }
      else {
        // console.log("else");
        var tableName = $targetParent.parent().prevAll('tr[data-table-name]').first().data('tableName');
        // console.log(tableName);
        $targetParent.toggleClass('on off');
        $targetParent.data('isMix', true);

        // console.log($targetParent.parent());

        var $tableNameHeader = this.$el
          .find("[data-table-name='" + tableName + "']")
          .find("td:nth-child(" + targetIndex + ")");

        var $affectedCells = this.$el
          .find("[data-table-group='" + tableName + "']")
          .find("td:nth-child(" + targetIndex + ")");

        var affectedCellsCount = $affectedCells.length;

        var checkerClass = $affectedCells.eq(0).attr('class');

        if ($affectedCells.not('.' + checkerClass).length === 0){
          if ($affectedCells.eq(0).hasClass('on')){
            $tableNameHeader.removeClass('on off mix').addClass('on');
          } else {
            $tableNameHeader.removeClass('on off mix').addClass('off');
          }
        } else {
          $tableNameHeader.removeClass('on off').addClass('mix');
        }

        // console.log(checkerClass);
        // console.log($target);

          // console.log(this.$el.find("[data-table-name='" + tableName + "']"));
          // .toggleClass('on off');
      }

      // HANDLE AJAX LOGIC FOR PERMISSIONS
      // if ($target.hasClass('directus-glyphicon-check')){
      //   // logic to remove permission
      // }
      // else if ($target.hasClass('directus-glyphicon-remove')){
      //   // logic to add permission
      // }
    }

  });

  var GroupPermissions = Backbone.Layout.extend({

    template: 'page',

    serialize: {
      title: 'XXX',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}],
      sidebar: true
    },

    beforeRender: function() {
      this.setView('#page-content', new Permissions({collection: this.collection}));
      //this.insertView('#sidebar', new PaneSaveView({model: this.model, single: this.single}));
    },

    afterRender: function() {
      //this.setView('#sidebar', new)
    }

  });

  return GroupPermissions;
});