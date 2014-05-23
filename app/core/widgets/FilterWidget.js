define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({

    template: 'core/widgets/filter-widget',

    tagName: 'div',

    attributes: {
      class: 'tool'
    },

    filterUIMappings: {
      default: '<input type="text" value="{{value}}" placeholder="Filter..." name="keywords" maxlength="100" class="filter_ui">',
      date: '<input type="date" value="{{value}}" class="date filter_ui" name="keywords" id="advKeywords">',
      checkbox: '<input type="checkbox" {{#if value}}checked{{/if}} class="filter_ui" name="keywords" id="advKeywords">'
    },

    events: {
      'click .filters li': function(e) {
        /*var index = $(e.target).index();
        this.options.filterOptions.filters.splice(index, 1);
        this.updateFilters();
        this.collection.fetch();
        this.saveFilterString();*/
      },
      'click .removeFilterClass':function(e) {
        var index = $(e.target).parent().index();
        var title = $(e.target).parent().find('.filterColumnName').attr('data-filter-id');
        this.options.filters.splice(index, 1);
        this.options.filterOptions.filters.splice(index, 1);

        this.updateFilters();
        this.collection.fetch();
        //this.saveFilterString();
        this.render();
      },
      'change .adv-search-col-id': function(e) {
        var selectedVal = $(e.target).val();

        if(selectedVal != "") {
          this.addNewFilter(selectedVal);
        }
      },
      'change .filter_ui': function(e) {
        var data = {
          id: this.mysql_real_escape_string($(e.target).parent().parent().find('.filterColumnName').attr('data-filter-id')),
          type: 'like',
          value: this.mysql_real_escape_string($(e.target).val())
        };

        if($(e.target).is(':checkbox')) {
          if($(e.target).prop('checked')) {
            data.value = 1;
          } else {
            data.value = 0;
          }
        }

        this.options.filterOptions.filters[$(e.target).parent().parent().index()] = data;
        this.updateFilters();
        this.collection.fetch();
        //this.saveFilterString();
      }
    },

    getFilterDataType: function(selectedColumn) {
      if(!selectedColumn || !this.collection.structure.get(selectedColumn)) {
        return;
      }

      var columnModel = this.collection.structure.get(selectedColumn);
      this.columnModel = columnModel;
      var columnModelType = columnModel.get('type');
      var newInput;
      //Special Handling for Relationship
      if(this.collection.structure.get(selectedColumn).get('ui') == "many_to_one") {
        //If we already are up to date with the model then return
        if(this.relatedCollection && this.relatedCollection.table.id == columnModel.relationship.get('table_related')) {
          return;
        }

        this.savedValue = selectedColumn;

        //Get Related Column Collection
        this.relatedCollection = app.getEntries(columnModel.relationship.get('table_related'));

        this.relatedCollection.fetch({includeFilters: false, data: {active:1}});
        this.listenTo(this.relatedCollection, 'sync', this.render);
        return;
      } else {
        this.relatedCollection = null;
        this.savedValue = null;
      }

      switch(columnModelType) {
        case 'DATE':
        case 'DATETIME':
          newInput = this.filterUIMappings.date;
          break;
        case 'TINYINT':
          newInput = this.filterUIMappings.checkbox;
          break;
        default:
          newInput = this.filterUIMappings.default;
          break;
      }

      return newInput;
    },

    addNewFilter: function(selectedColumn) {
      var $filters = $('.advanced-search-fields-row');
      var that = this;
      var data = {};

      data.columnName = selectedColumn;
      data.filter_ui = this.getFilterDataType(selectedColumn);

      this.options.filters.push(data);
      this.options.filterOptions.filters.push({});
      this.render();
    },

    serialize: function() {
      var data = {};
      data.filters = this.options.filters;

      data.tableColumns = this.collection.structure.pluck('id');
      data.tableColumns.sort(function(a, b) {
        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
      });
      var that = this;
      var i=0;
      _.each(this.options.filterOptions.filters, function(item) {
        var template = Handlebars.compile(that.getFilterDataType(data.filters[i].columnName));
        data.filters[i].filter_ui = template({value: item.value});
        i++;
      });

/*
      if(this.relatedCollection) {
        data.relatedEntries = [];
        var visibleColumn = this.columnModel.options.get('visible_column');
        var displayTemplate = Handlebars.compile(this.columnModel.options.get('visible_column_template'));

        this.relatedCollection.each(function(model) {
          data.relatedEntries.push({visible_column:model.get(visibleColumn), visible_column_template: displayTemplate(model.attributes)});
        });

        data.relatedEntries = _.sortBy(data.relatedEntries, 'visible_column_template');
      }
*/

      return data;
    },

    afterRender: function() {
      console.log($('.filter-ui'));
      $('.filter-ui').last().find('input').focus();

    /*  if(this.savedValue) {
        this.$el.find('.adv-search-col-id').val(this.savedValue);
      }

      this.setFilterRow();
      //this.updateFilterDataType(this.$el.find('.adv-search-col-id').val());*/
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

    updateFilters: function() {
      console.log(this.options.filterOptions.filters);
      this.collection.setFilter('adv_search', this.options.filterOptions.filters);
      this.collection.setFilter('currentPage', 0);
      //this.render();
    },

    saveFilterString: function() {
      var string = [];
      this.options.filterOptions.filters.forEach(function(search) {
        string.push(search.id.replace(':','\\:') + ":" + search.type.replace(':','\\:') + ":" + search.value.replace(':','\\:').replace(',','\\,'));
      });

      string = encodeURIComponent(string.join());
      this.collection.preferences.save({search_string: string});
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

    updateFiltersFromPreference: function() {
      this.options.filterOptions.filters = [];

      var search = this.collection.preferences.get('search_string');

      if(search !== null && search !== undefined) {
        search = decodeURIComponent(search).replace('\\,', '%21').split(",");
        var that = this;
        search.forEach(function(filter) {
          filter = filter.replace('\\:', '%20');
          filter = filter.split(':');
          if(filter.length == 3) {
            that.options.filterOptions.filters.push({id: filter[0].replace('%20',':'), type: filter[1].replace('%20',':'), value: filter[2].replace('%20',':').replace('%21',',')});
          }
        });
      }
      this.updateFilters();
    },

    initialize: function() {
      this.options.filterOptions = {filters:[]};
      this.options.filters = [];
      //this.updateFiltersFromPreference();
      //this.collection.preferences.on('sync', function() {this.updateFiltersFromPreference(); /*this.collection.fetch();*/}, this);
    }
  });
});