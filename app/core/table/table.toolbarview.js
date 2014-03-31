define([
  "app",
  "backbone",
  "jquery-ui"
],

function(app, Backbone) {

  "use strict";

  var FilterModel = Backbone.Model.extend({

    hasFilters: function() {
      return this.get('filterCount') > 0;
    },

    addFilter: function(id, type, value) {
      var filters = this.filters,
          filterCount = this.filterCount;

      filters['id_'+_.uniqueId()] = {
        id: id,
        type: type,
        value: value
      };

      this.set({
        filters: filters,
        filterCount: filterCount + 1
      });
    },

    removeFilter: function(uniqueId) {
      var filters = this.filters,
          filterCount = this.filterCount;

      if(filters['id_'+uniqueId]) {
        delete filters['id_'+uniqueId];
        this.set({
          filters: filters,
          filterCount: filterCount - 1
        });
      }
    },

    initialize: function() {
      this.filterCount = 0;
      this.filters = {};
    }

  });

  var TableToolbarView = Backbone.Layout.extend({

    template: 'tables/table-toolbar',

    events: {

      'click #set-visibility > button': function(e) {
        var value = $(e.target).closest('button').attr('data-value');
        var collection = this.collection;

        var $checked = $('.select-row:checked');
        var expectedResponses = $checked.length;

        var success = function() {
          expectedResponses--;
          if (expectedResponses === 0) {
            collection.trigger('visibility');
          }
        };

        $checked.each(function() {
          var id = this.value;
          console.log(id);
          var model = collection.get(id);
          model.save({active: value}, {silent: true, patch:true, validate:false, success: success});
        });

      },

      'click #visibility .dropdown-menu li > a': function(e) {
        var value = $(e.target).attr('data-value');
        this.collection.setFilter({currentPage: 0, active: value});
        this.collection.fetch();
        this.options.preferences.save({active: value});
      },

      'keydown': function(e) {
        if (e.keyCode === 39 && (this.collection.getFilter('currentPage') + 1 < (this.collection.total / this.collection.getFilter('perPage')))) {
          this.collection.setFilter('currentPage', this.collection.filters.currentPage + 1);
          this.collection.fetch();
        }
        if (e.keyCode === 37 && this.collection.getFilter('currentPage') > 0) {
          this.collection.setFilter('currentPage', this.collection.getFilter('currentPage') - 1);
          this.collection.fetch();
        }
      },

      'keypress #table-filter': function(e) {
        if (e.which == 13) {
          var text = $('#table-filter').val();
          this.collection.setFilter('search', text);
          this.collection.setFilter('currentPage', 0);
          this.collection.fetch();
          this.collection.trigger('search', text);
        }
      },

      'click [data-add-filter-row]': function(e) {
        var $filterRow = this.getFilterRow;
        $filterRow.clone(true).appendTo(".advanced-search-fields");
      },

      'click #batch-edit': function(e) {
        var $checked = $('.select-row:checked');
        var ids = $checked.map(function() {
          return this.value;
        }).toArray().join();

        var route = Backbone.history.fragment.split('/');
        route.push(ids);
        app.router.go(route);
      },

      'click #addFilterButton': function(e) {
        var $filters = $('.advanced-search-fields-row');
        var that = this;

        var searchSettings = $filters.map(function() {
          var $this = $(this);
          var values = {
            id: $this.find('.adv-search-col-id').val(),
            type: $this.find('.adv-search-query-type').val(),
            value: $this.find('input').val()
          };

          // @DAX Uncoment this once toolbar has been moved to header
          //that.filterModel.addFilter(values.id, values.type, values.value);
          //$('#advancedFilterList').append('<li>' + values.id + ' ' + values.type + ' ' + values.value + '</li>');

          return {
            id: that.mysql_real_escape_string(values.id),
            type: values.type,
            value: that.mysql_real_escape_string(values.value)
          };
        }).toArray();

        var queryString = "";

        this.collection.setFilter('adv_search', searchSettings);
        this.collection.setFilter('currentPage', 0);
        this.collection.fetch();
        //this.collection.trigger('adv_search', "id == 336");
      }
    },

    serialize: function() {
      //@TODO: Cleanup with non-hacks
      var table = this.options.collection.table;
      var options = {};

      options.lBound = Math.min(this.collection.getFilter('currentPage') * this.collection.getFilter('perPage') + 1, options.totalCount);
      options.uBound = Math.min(options.totalCount, options.lBound + this.collection.getFilter('perPage') - 1);

      options.actionButtons = (this.actionButtons && this.active); //(this.options.table.selection.length > 0);
      options.batchEdit = this.batchEdit;

      if (this.active) {
        options.visibility = _.map([
          {text:'All', value: '1,2', count: table.get('total')},
          {text:'Active', value: '1', count: table.get('active')},
          {text:'Inactive', value: '2', count: table.get('inactive')},
          {text:'Trash', value: '0', count: table.get('trash')}], function(obj) {
            if (this.collection.getFilter('active') == obj.value) { obj.active = true; }
            return obj;
        }, this);
      }

      // @DAX Uncoment this once toolbar has been moved to header
      //options.hasFilters = this.filterModel.hasFilters();
      options.filterText = this.collection.getFilter('search');
      options.filter = true;
      options.tableColumns = this.options.collection.structure.pluck('id');
      options.advSearchData = this.collection.getFilter('adv_search');
      options.deleteOnly = this.options.deleteOnly && this.actionButtons;

      options.visibilityButtons = options.actionButtons || options.deleteOnly;

      return options;
    },

    mysql_real_escape_string: function(str) {
      if(!str) {return "";}
      return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
          switch (char) {
              case "\0":
                  return "\\0";
              case "\x08":
                  return "\\b";
              case "\x09":
                  return "\\t";
              case "\x1a":
                  return "\\z";
              case "\n":
                  return "\\n";
              case "\r":
                  return "\\r";
              case "\"":
              case "'":
              case "\\":
              case "%":
                  return "\\"+char; // prepends a backslash to backslash, percent,
                                    // and double/single quotes
          }
      });
    },

    setFilterRow: function(){
      var $advSearchFieldRow = $(".advanced-search-fields-row");
      var $advSearchFields = $(".advanced-search-fields");
          $advSearchFields.on("click", ".remove-adv-row", function(e){
            $(this).parent().remove();
          });
      this.getFilterRow = $advSearchFieldRow;
    },

    getFilterRow: "adv search fields row object",

    afterRender: function() {
      var $filter = $('#table-filter');
      if ($filter[0]) {
        $filter.val($filter.val());
      }

      this.setFilterRow();
    },

    initialize: function() {
      //Does the table have the active column?
      this.active = this.options.structure && this.options.structure.get('active') && !this.options.deleteOnly;
      //Show action buttons if there are selected models
      this.collection.on('select', function() {
        this.actionButtons = Boolean($('.select-row:checked').length);
        this.batchEdit = $('.select-row:checked').length > 1;
        this.render();
      }, this);

      this.filterModel = new FilterModel();

      // @DAX Uncoment this once toolbar has been moved to header
      //this.filterModel.on('change', function() {
      //  this.render();
      //}, this);

      //this.collection.on('visibility', this.render, this);
    }
  });

  return TableToolbarView;

});