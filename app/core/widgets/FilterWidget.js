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
      default: '<input type="text" placeholder="Keywords..." name="keywords" id="advKeywords" maxlength="255" class="medium" placeholder="Keywords">',
      date: '<input type="date" style="float: left;width: auto;background-color:#ededed" class="date medium" name="keywords" id="advKeywords">',
    },

    events: {
      'click #addFilterButton': 'addNewFilter',
      'click [data-add-filter-row]': function(e) {
        this.options.filterOptions.addFilter = true;
        this.render();
      },
      'click .filters li': function(e) {
        var index = $(e.target).index();
        this.options.filterOptions.filters.splice(index, 1);
        this.updateFilters();
        this.saveFilterString();
      },
      'keydown input': function(e) {
        if (e.keyCode == 13) { this.addNewFilter(); }
      },
      'click #cancelFilterButton': function(e) {
        this.options.filterOptions.addFilter = false;
        this.render();
      },
      'change .adv-search-col-id': function(e) {
        var selectedVal = $(e.target).val();
        this.updateFilterDataType(selectedVal);
      }
    },

    updateFilterDataType: function(selectedColumn) {
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
        default:
          newInput = this.filterUIMappings.default;
          break;
      }
      this.$el.find('#dataTypeInsert').html(newInput);
    },

    addNewFilter: function() {
      var $filters = $('.advanced-search-fields-row');
      var that = this;

      var searchSettings = $filters.map(function() {
        var $this = $(this);

        var values = {
          id: $this.find('.adv-search-col-id').val(),
          type: $this.find('.adv-search-query-type').val(),
          value: $this.find('#advKeywords').val()
        };

        return {
          id: that.mysql_real_escape_string(values.id),
          type: values.type,
          value: that.mysql_real_escape_string(values.value)
        };
      }).toArray();

      this.options.filterOptions.filters.push(searchSettings[0]);

      this.updateFilters();
      this.saveFilterString();
    },

    updateFilters: function() {
      this.collection.setFilter('adv_search', this.options.filterOptions.filters);
      this.collection.setFilter('currentPage', 0);
      this.collection.fetch();
      this.options.filterOptions.addFilter = false;
      this.render();
    },

    saveFilterString: function() {
      var string = [];
      this.options.filterOptions.filters.forEach(function(search) {
        string.push(search.id.replace(':','\\:') + ":" + search.type.replace(':','\\:') + ":" + search.value.replace(':','\\:').replace(',','\\,'));
      });

      string = encodeURIComponent(string.join());
      this.collection.preferences.save({search_string: string});
    },

    serialize: function() {
      var data = this.options.filterOptions;

      data.tableColumns = this.collection.structure.pluck('id');
      data.tableColumns.sort(function(a, b) {
        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
      });

      if(this.relatedCollection) {
        data.relatedEntries = [];
        var visibleColumn = this.columnModel.options.get('visible_column');
        var displayTemplate = Handlebars.compile(this.columnModel.options.get('visible_column_template'));

        this.relatedCollection.each(function(model) {
          data.relatedEntries.push({visible_column:model.get(visibleColumn), visible_column_template: displayTemplate(model.attributes)});
        });

      }

      return data;
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
      if(this.savedValue) {
        this.$el.find('.adv-search-col-id').val(this.savedValue);
      }

      this.setFilterRow();
      this.updateFilterDataType(this.$el.find('.adv-search-col-id').val());
    },

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
      this.updateFiltersFromPreference();
      this.collection.preferences.on('sync', this.updateFiltersFromPreference, this);
    }
  });
});