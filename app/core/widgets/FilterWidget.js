define([
  'app',
  'backbone',
  'handlebars'
],
function(app, Backbone, Handlebars) {

  "use strict";

  return Backbone.Layout.extend({

    template: 'core/widgets/filter-widget',

    tagName: 'div',

    attributes: {
      class: 'tool'
    },

    filterUIMappings: {
      default: '<div class="filter-background"><input type="text" value="{{value}}" placeholder="{{t "widget_filter_value_placeholder"}}" name="keywords" maxlength="100" class="filter_ui"></div>',
      date: '<div class="filter-background"><input type="date" value="{{value}}" class="date filter_ui" name="keywords" id="advKeywords"></div>',
      checkbox: '<div class="filter-background"><input type="checkbox" {{#if value}}checked{{/if}} class="filter_ui" name="keywords" id="advKeywords"></div>'
    },

    events: {
      'click .removeFilterClass':function(e) {
        var index = $(e.target).parent().index();
        var title = $(e.target).parent().find('.filterColumnName').attr('data-filter-id');

        var value = this.options.filters[index].filterData.value;
        this.options.filters.splice(index, 1);

        this.updateFilters();
        if(value) {
          this.collection.fetch();
        }
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
        this.processFilterChange(e);
      }
    },

    processFilterChange: function(e) {
      var type = 'like';
      if($(e.target).prop('tagName') == 'SELECT') {
        type = '=';
      }
      var data = {
        id: this.mysql_real_escape_string($(e.target).closest('li').find('.filterColumnName').attr('data-filter-id')),
        type: type,
        value: this.mysql_real_escape_string($(e.target).val())
      };

      if($(e.target).is(':checkbox')) {
        if($(e.target).prop('checked')) {
          data.value = 1;
        } else {
          data.value = 0;
        }
      }
      this.selfChanged = true;
      this.options.filters[$(e.target).closest('li').index()].filterData = data;
      this.updateFilters();
      this.collection.fetch();
      this.saveFilterString();
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
        case 'TIMESTAMP':
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

      if(this.collection.structure.get(selectedColumn).get('ui') == "many_to_one" || that.collection.structure.get(selectedColumn).get('ui') == "many_to_many" || that.collection.structure.get(selectedColumn).get('ui') == "one_to_many") {
        var columnModel = this.collection.structure.get(selectedColumn);

        if(columnModel.options.has('filter_type') && columnModel.options.get('filter_type') == "dropdown") {
          //Get Related Column Collection
          data.columnModel = columnModel;
          data.relatedCollection = app.getEntries(columnModel.relationship.get('table_related'));

          var name = {};
          name[app.statusMapping.status_name] = app.statusMapping.active_num;
          data.relatedCollection.fetch({includeFilters: false, data: name});
          this.listenTo(data.relatedCollection, 'sync', this.render);
        } else {
          data.filter_ui = this.getFilterDataType(selectedColumn);
        }
      } else if(this.collection.structure.get(selectedColumn).get('type') == "ENUM") {
        var columnModel = this.collection.structure.get(selectedColumn);
        var vals = columnModel.get('column_type').substring(5, columnModel.get('column_type').length-1);
        vals = vals.replace(/\'/g, "").split(',');
        data.dropdownValues = vals;
      } else if(that.collection.structure.get(selectedColumn).get('ui') === "multi_select") {
        var columnModel = that.collection.structure.get(selectedColumn);
        var keys = [];
        for(var k in JSON.parse(columnModel.options.get('options'))) keys.push(k);
        data.dropdownValues = keys;
      } else {
        data.filter_ui = this.getFilterDataType(selectedColumn);
      }
      data.filter_type = this.collection.structure.get(selectedColumn).get('type');
      data.filterData = {id: selectedColumn, type: 'like', value:''};
      this.options.filters.push(data);
      this.render();
    },

    serialize: function() {
      var data = {};
      data.filters = this.options.filters;
      data.tableColumns = this.collection.structure.pluck('id');
      if(this.collection.table.get('filter_column_blacklist')) {
        data.tableColumns = _.difference(data.tableColumns, this.collection.table.get('filter_column_blacklist').split(','));
      }
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
          if(item.columnModel.options.has('filter_column')) {
            var visibleColumn = item.columnModel.options.get('filter_column');
          } else {
            var visibleColumn = item.columnModel.options.get('visible_column');
          }
          var displayTemplate = Handlebars.compile(item.columnModel.options.get('visible_column_template'));
          item.relatedCollection.each(function(model) {
            data.filters[i].relatedEntries.push({visible_column:model.get('id'), visible_column_template: displayTemplate(model.attributes)});
          });

          data.filters[i].relatedEntries = _.sortBy(data.filters[i].relatedEntries, 'visible_column_template');
        } else if(item.dropdownValues) {
          data.filters[i].relatedEntries = [];
          _.each(item.dropdownValues, function(model) {
            data.filters[i].relatedEntries.push({visible_column:model, visible_column_template: model});
          });
        } else {
          var template = Handlebars.compile(that.getFilterDataType(data.filters[i].columnName));
          if(item.filterData) {
            //Used for Checkboxes since they return 0 string
            if(item.filterData.value == "0") {
              item.filterData = 0;
            }
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
      var that = this;
      _.each(this.options.filters, function(item) {
        var columnModel = that.collection.structure.get(item.columnName);

        var table = columnModel.collection.table.id;
        var columns = columnModel.id;
        var visibleTemplate = '<div>{{'+columnModel.id+'}}</div>';

        if(columnModel.relationship) {
          table = columnModel.relationship.get('table_related');
          columns = columnModel.options.get('visible_columns');

          visibleTemplate = '<div>'+columnModel.options.get('visible_column_template')+'</div>';
        }

        if(item.relatedCollection || item.dropdownValues) {
          if(item.filterData) {
            that.$el.find('span[data-filter-id=' + item.columnName + ']').parent().find('.filter_ui').val(item.filterData.value);
          }
        }

        if(['DATETIME', 'DATE', 'TIMESTAMP'].indexOf(item.filter_type) !== -1) {
          return;
        }

        if(!columns) {
          return;
        }

        var bloodHoundOptions = {
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          remote: app.API_URL + 'tables/' + table + '/typeahead/?columns=' + columns + '&q=%QUERY'
        };

        var fetchItems = new Bloodhound(bloodHoundOptions);
        fetchItems.initialize();

        var typeaheadSelector = that.$(".filter-form[data-filter-id-master=" + columnModel.id + "] > .filter-ui > input");

        typeaheadSelector.typeahead({
          minLength: 1,
          items: 5,
          valueKey: columns,
          template: Handlebars.compile(visibleTemplate)
        },
        {
          name: 'related-items',
          displayKey: 'value',
          source: fetchItems.ttAdapter()
        });

        typeaheadSelector.on('typeahead:selected', function(e, datum) {
          that.processFilterChange(e);
        });
      });

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

    updateFilters: function(bInit) {
      var filters = this.options.filters.map(function(item) {
        return item.filterData;
      });

      this.collection.setFilter('adv_search', filters);
      if(!bInit) {
        this.collection.setFilter('currentPage', 0);
      }

      if(app.router.loadedPreference) {
        if(this.basePage) {
          this.basePage.removeHolding(this.cid);
        }
      }
      //this.render();
    },

    saveFilterString: function() {
      var string = [];

      var filters = this.options.filters.map(function(item) {
        return item.filterData;
      });

      filters.forEach(function(search) {
        if(search) {
          string.push(search.id.replace(':','\\:') + ":" + search.type.replace(':','\\:') + ":" + String(search.value).replace(':','\\:').replace(',','\\,'));
        }
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
            if(!that.collection.structure.get(selectedColumn)) {
              return;
            }
            if(that.collection.structure.get(selectedColumn).get('ui') == "many_to_one" || that.collection.structure.get(selectedColumn).get('ui') == "many_to_many" || that.collection.structure.get(selectedColumn).get('ui') == "one_to_many") {
              var columnModel = that.collection.structure.get(selectedColumn);
              if(columnModel.options.has('filter_type') && columnModel.options.get('filter_type') == "dropdown") {
                //Get Related Column Collection
                data.columnModel = columnModel;
                data.relatedCollection = app.getEntries(columnModel.relationship.get('table_related'));

                var name = {};
                name[app.statusMapping.status_name] = app.statusMapping.active_num;
                data.relatedCollection.fetch({includeFilters: false, data: name});
                that.listenTo(data.relatedCollection, 'sync', that.render);
              } else{
                data.filter_ui = that.getFilterDataType(selectedColumn);
              }
            } else if(that.collection.structure.get(selectedColumn).get('type') == "ENUM") {
              var columnModel = that.collection.structure.get(selectedColumn);
              var vals = columnModel.get('column_type').substring(5, columnModel.get('column_type').length-1);
              vals = vals.replace(/\'/g, "").split(',');
              data.dropdownValues = vals;
            } else if(that.collection.structure.get(selectedColumn).get('ui') == "many_to_many") {
              data.filter_ui = that.getFilterDataType(selectedColumn);
            }else if(that.collection.structure.get(selectedColumn).get('ui') === "multi_select") {
              var columnModel = that.collection.structure.get(selectedColumn);
              var keys = [];
              for(var k in JSON.parse(columnModel.options.get('options'))) keys.push(k);
              data.dropdownValues = keys;
            }
            data.filter_type = that.collection.structure.get(selectedColumn).get('type');

            data.filterData = {id: selectedColumn, type: filter[1].replace('%20',':'), value: filter[2].replace('%20',':').replace('%21',',')};

            that.options.filters.push(data);
          }
        });
      }
      this.updateFilters(true);
      //this.collection.fetch();
      this.render();
    },

    initialize: function() {
      this.options.filters = [];
      this.listenTo(this.collection.preferences, 'change sync', function() {
        this.updateFiltersFromPreference();
      });
      this.basePage = this.options.basePage;
      if(app.router.loadedPreference) {
        if(this.basePage) {
          this.basePage.addHolding(this.cid);
        }
      } else {
        this.updateFiltersFromPreference();
      }
    }
  });
});
