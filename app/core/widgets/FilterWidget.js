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
      'click .removeFilterClass':function(e) {
        var index = $(e.target).parent().index();
        var title = $(e.target).parent().find('.filterColumnName').attr('data-filter-id');
        this.options.filters.splice(index, 1);

        this.updateFilters();
        this.collection.fetch();
        this.saveFilterString();
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
          id: this.mysql_real_escape_string($(e.target).closest('li').find('.filterColumnName').attr('data-filter-id')),
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
        this.options.filters[$(e.target).closest('li').index()].filterData = data;
        this.updateFilters();
        this.collection.fetch();
        this.saveFilterString();
      }
    },

    getFilterDataType: function(selectedColumn) {
      if(!selectedColumn || !this.collection.structure.get(selectedColumn)) {
        return;
      }

      var columnModel = this.collection.structure.get(selectedColumn);
      var columnModelType = columnModel.get('type');
      var newInput;

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

      if(this.collection.structure.get(selectedColumn).get('ui') == "many_to_one") {
        var columnModel = this.collection.structure.get(selectedColumn);
        //Get Related Column Collection
        data.columnModel = columnModel;
        data.relatedCollection = app.getEntries(columnModel.relationship.get('table_related'));

        data.relatedCollection.fetch({includeFilters: false, data: {active:1}});
        this.listenTo(data.relatedCollection, 'sync', this.render);
      } else {
        data.filter_ui = this.getFilterDataType(selectedColumn);
      }
      this.options.filters.push(data);
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
      _.each(this.options.filters, function(item) {
        if(item.relatedCollection) {
          data.filters[i].relatedEntries = [];
          var visibleColumn = item.columnModel.options.get('visible_column');
          var displayTemplate = Handlebars.compile(item.columnModel.options.get('visible_column_template'));
          item.relatedCollection.each(function(model) {
            data.filters[i].relatedEntries.push({visible_column:model.get(visibleColumn), visible_column_template: displayTemplate(model.attributes)});
          });

          data.filters[i].relatedEntries = _.sortBy(data.filters[i].relatedEntries, 'visible_column_template');
        } else {
          var template = Handlebars.compile(that.getFilterDataType(data.filters[i].columnName));
          if(item.filterData) {
            data.filters[i].filter_ui = template({value: item.filterData.value});
          } else {
            data.filters[i].filter_ui = template({});
          }
        }

        i++;
      });

      return data;
    },

    afterRender: function() {
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
      var filters = this.options.filters.map(function(item) {
        return item.filterData;
      });

      this.collection.setFilter('adv_search', filters);
      this.collection.setFilter('currentPage', 0);
      //this.render();
    },

    saveFilterString: function() {
      var string = [];

      var filters = this.options.filters.map(function(item) {
        return item.filterData;
      });

      filters.forEach(function(search) {
        string.push(search.id.replace(':','\\:') + ":" + search.type.replace(':','\\:') + ":" + search.value.replace(':','\\:').replace(',','\\,'));
      });

      string = encodeURIComponent(string.join());
      console.log(string);
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
      this.options.filters = [];
      var search = this.collection.preferences.get('search_string');

      if(search !== null && search !== undefined) {
        search = decodeURIComponent(search).replace('\\,', '%21').split(",");
        var that = this;
        search.forEach(function(filter) {
          filter = filter.replace('\\:', '%20');
          filter = filter.split(':');

          if(filter.length == 3) {
            var data = {};
            var selectedColumn = filter[0].replace('%20',':');

            data.columnName = selectedColumn;

            if(that.collection.structure.get(selectedColumn).get('ui') == "many_to_one") {
              var columnModel = that.collection.structure.get(selectedColumn);
              //Get Related Column Collection
              data.columnModel = columnModel;
              data.relatedCollection = app.getEntries(columnModel.relationship.get('table_related'));

              data.relatedCollection.fetch({includeFilters: false, data: {active:1}});
              that.listenTo(data.relatedCollection, 'sync', that.render);
            } else {
              data.filter_ui = that.getFilterDataType(selectedColumn);
            }

            data.filterData = {id: selectedColumn, type: filter[1].replace('%20',':'), value: filter[2].replace('%20',':').replace('%21',',')};

            that.options.filters.push(data);
          }
        });
      }
      this.updateFilters();
      this.render();
    },

    initialize: function() {
      this.options.filters = [];
      this.updateFiltersFromPreference();
      //this.collection.preferences.on('sync', function() {this.updateFiltersFromPreference(); /*this.collection.fetch();*/}, this);
    }
  });
});