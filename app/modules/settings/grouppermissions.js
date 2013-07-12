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
      // 'click .toggleAllPermissionsRowSingle': 'toggleAllPermissionsRowSingle',
      'click .toggleAllPermissionsCol': 'toggleAllPermissionsCol',
      'click .togglePermission': 'togglePermission'
    },

    afterRender: function() {
      // this.$el.find('.table-fields').hide();
      app.affix();
    },

    expandTableFields: function(e){
      e.stopPropagation();
      e.preventDefault();
      var $allCarets = this.$el.find('.directus-glyphicon-arrow-right');
      var $clickedCaret = this.$(e.target);
      var tableName = $clickedCaret.parent().parent().data('tableName');

      $clickedCaret.toggleClass('active');
      $allCarets.not($clickedCaret).removeClass('active');
      this.$el.find("[data-table-group='" + tableName + "']").toggleClass('active');
      this.$el.find("[data-table-group]").not("[data-table-group='" + tableName + "']").removeClass('active');
    },

    toggleAllPermissionsRowSingle: function(e){
      // var self = this,
      //     $target = this.$(e.target),
      //     targetIndex = $target.index() + 1,
      //     $allCols = $target.nextUntil('tr');

      // if ($target.hasClass('off') || $target.hasClass('on')){
      //   console.log('if');

      //   if($target.hasClass('off')){
      //     $target.toggleClass('on off');
      //     $allCols.each(function(){
      //       var $this = $(this);

      //       if(!$this.hasClass('disabled')){
      //         self.toggleAllPermissionsRowSingleHelper($this);
      //         $this.removeClass('on off mix').addClass('on');
      //       }
      //     });
      //   } else {
      //     $target.toggleClass('on off');
      //     $allCols.each(function(){
      //       var $this = $(this);

      //       if(!$this.hasClass('disabled')){
      //         self.toggleAllPermissionsRowSingleHelper($this);
      //         $this.removeClass('on off mix').addClass('off');
      //       }
      //     });
      //   }
      // }
      // else { // this exectutes only on FIRST CLICK of table name
      //   console.log('else');
      //   $target.addClass('off');
      //   $allCols.each(function(){
      //     var $this = $(this);

      //     if(!$this.hasClass('disabled')){
      //       self.toggleAllPermissionsRowSingleHelper($this);
      //       $this.removeClass('on off mix').addClass('off');
      //     }
      //   });
      // }
    },

    toggleAllPermissionsRowSingleHelper: function($fieldCol){
      // console.log($fieldCol.parent()[0]);
      // Check if rows ABOVE AND BELOW are all equal,
      // and update Table Name's column into X or CHECK,
      // while remoing the "mix" class....

      // var fieldColIndex = $fieldCol.index() + 1,
      //     tableName = $fieldCol.parent().data('tableGroup'),
      //     $tableSiblings = $fieldCol.parent().siblings('[data-table-group=' + tableName + ']');
      //     console.log($tableSiblings.find('td:nth-child('+ fieldColIndex +')')[0]);
    },

    toggleAllPermissionsCol: function(e){
      console.log('works?');
      var $target = this.$(e.target),
          targetIndex = $target.index() + 1;

      var $allRows = this.$el.find("td:nth-child(" + targetIndex + ")");

      if ($target.hasClass('off') || $target.hasClass('on')){
        console.log('if');

        $target.toggleClass('on off');

        if ($target.hasClass('on')){
          $allRows.removeClass('on off mix').addClass('on');
          console.log("all on");
        } else if($target.hasClass('off')){
          $allRows.removeClass('on off mix').addClass('off');
          console.log("all off");
        }
      } else {
        console.log('else');
        $target.removeClass('on off').addClass('off');
        $allRows.removeClass('on off mix').addClass('off');
      }
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
        tableName = $targetParent.parent().prevAll('tr[data-table-name]').first().data('tableName');
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