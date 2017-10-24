define([
  'app',
  'core/t',
  'backbone',
  'underscore',
  'utils',
  'helpers/sort',
  'handlebars'
], function (app, __t, Backbone, _, Utils, SortHelper, Handlebars) {

  'use strict';

  return Backbone.View.extend({

    template: 'core/widgets/filter-widget',

    tagName: 'div',

    attributes: {
      'class': 'filter help',
      'data-help': 'The filter area is used to find specific items within large datasets.'
    },

    filterUIMappings: {
      default: '<input type="text" value="{{value}}" placeholder="{{t "widget_filter_value_placeholder"}}" name="keywords" maxlength="100" class="filter_ui">',
      date: '<input type="date" value="{{value}}" class="date filter_ui" name="keywords" id="advKeywords">',
      checkbox: '<input type="checkbox" {{#if value}}checked{{/if}} class="filter_ui" name="keywords" id="advKeywords">'
    },

    events: {
      'keyup .js-search': 'onKeyUp',

      'click .js-search-clear': 'clearFilters',

      'click .js-toggle': function (event) {
        this.$el.toggleClass('filter-dropdown-open');
      },

      'click input.js-status-check': function (event) {
        var self = this;
        var collection = this.collection;
        var $checksChecked = this.$el.find('input.js-status-check:checked');
        var status = [];

        $checksChecked.each(function (i, el) {
          status.push($(el).val());
        });

        var fetch = function (save) {
          var options = {};

          if (save === false) {
            options.success = function () {
              self.redirect();
            };
          }

          collection.setFilter({status: status.join(',')});

          return collection.fetch(options);
        };

        this.confirmBookmarkAction()
          .done(function () {
            fetch(true);
          })
          .fail(function () {
            fetch(false);
          });
      },

      'click input.js-state-check': 'onClickState',

      'click .js-remove': function (event) {
        var index = $(event.target).parent().index();
        var value = this.options.filters[index].filterData.value;
        var hasSearch = false;

        _.each(this.options.filters, function (filter) {
          var filterData = filter.filterData;
          if (filterData && filterData.id === 'q' && !filterData.type) {
            hasSearch = true;
          }
        });

        if (hasSearch) {
          index++;
        }

        this.options.filters.splice(index, 1);

        this.updateFilters();
        if (value) {
          this.collection.fetch();
        }

        this.saveFilterString();
        this.render();
      },

      'change .adv-search-col-id': function (event) {
        var selectedVal = $(event.target).val();

        if (selectedVal !== '') {
          this.addNewFilter(selectedVal);
        }
      },

      'change .filter_ui': function (event) {
        this.processFilterChange(event);
      }
    },

    confirmBookmarkAction: function () {
      var collection = this.collection;
      var tableName = collection.table.id;
      var deferred = new $.Deferred();

      var onSuccess = function () {
        deferred.resolve();
      };

      var onCancel = function () {
        var bookmarkPreferences = collection.preferences;
        var tablePreferences = app.schemaManager.getPreferences(tableName);

        tablePreferences.set(_.pick(bookmarkPreferences.toJSON(), 'search_string', 'status'));
        collection.preferences = tablePreferences;
        deferred.reject();
      };

      if (this.collection.preferences.get('title')) {
        app.router.openModal({
          type: 'confirm',
          text: __t('widget_filter_confirm_bookmark_changes'),
          callback: onSuccess,
          cancelCallback: onCancel
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise();
    },

    onKeyUp: function (event) {
      var self = this;
      var $element = $(event.currentTarget);
      var searchString = $element.val();
      var doSearch = this.searchString !== searchString;

      var callSearch = function () {
        // if the new search string is different than the current search string
        if (!doSearch) {
          return;
        }

        var $input = self.$('#search-input');
        var input = $input.get(0);
        var selectionStart = input.selectionStart;
        var selectionEnd = input.selectionEnd;

        self.search(searchString).done(function () {
          $input = self.$('#search-input');
          input = $input.get(0);

          // Focus the input after the search
          $input.focus();
          // Keep previous selection range;
          input.setSelectionRange(selectionStart, selectionEnd);
        });
      };

      if (event.which == 13) {
        this.clearSearchTimeout();
        callSearch();

        return;
      }

      this.clearSearchTimeout();

      this.searchTimeOut = setTimeout(callSearch, 1000);
    },

    clearSearchTimeout: function () {
      if (this.searchTimeOut) {
        clearTimeout(this.searchTimeOut);
        this.searchTimeOut = null;
      }
    },

    search: function (searchString) {
      var filterIndex = -1;

      this.searchString = searchString;

      _.each(this.options.filters, function (item, index) {
        if (item.filterData.id === 'q') {
          filterIndex = index;
        }
      });

      if (filterIndex >= 0) {
        this.options.filters[filterIndex].filterData.value = searchString;
      } else {
        this.options.filters.push({
          filterData: {
            id: 'q',
            value: searchString
          }
        });
      }

      this.updateFilters();
      this.saveFilterString();

      return this.collection.fetch();
    },

    clearFilters: function () {
      this.searchString = '';
      this.$('.js-search').val(this.searchString);

      var filterIndex = -1;
      var key;
      _.each(this.options.filters, function (item, index) {
        if (item.filterData.id === 'q') {
          key = item.filterData.id;
          filterIndex = index;
        }
      });

      if (filterIndex >= 0) {
        this.options.filters.splice(filterIndex, 1);
      }

      // NOTE: search string is a global filter and it needs to be directly removed
      // updateFilters(); only update current `filters` key or set new ones
      if (key) {
        this.collection.removeFilter(key);
      }

      this.options.filters = [];
      this.updateFilters();
      this.saveFilterString();
      this.collection.fetch();
    },

    processFilterChange: function (event) {
      var $element = $(event.target);
      var $filter = $(event.target).closest('.column-filter');
      var type = 'like';
      var hasSearch = false;
      var index = $filter.index();
      var column = this.mysql_real_escape_string($filter.data('filter-id-master'));
      var columnModel = this.collection.structure.get(column);
      var columnOptions = columnModel.options;
      var relatedFilterColumn = columnOptions.get('filter_column');
      var isDropdown = $(event.target).prop('tagName') === 'SELECT';

      if (!columnModel.isToMany() && isDropdown) {
        type = '=';
      }

      if (isDropdown) {
        if (!columnModel.isToMany()) {
          type = '=';
        } else {
          var table = app.schemaManager.getTable(columnModel.getRelatedTableName());

          relatedFilterColumn = table.getPrimaryColumnName();
        }
      }

      if (relatedFilterColumn) {
        column += '.' + relatedFilterColumn;
      }

      var data = {
        id: column,
        type: type,
        value: this.mysql_real_escape_string($element.val())
      };

      if ($element.is(':checkbox')) {
        if($element.prop('checked')) {
          data.value = 1;
        } else {
          data.value = 0;
        }
      }

      _.each(this.options.filters, function (filter) {
        var filterData = filter.filterData;
        if (filterData && filterData.id === 'q' && !filterData.type) {
          hasSearch = true;
        }
      });

      if (hasSearch) {
        index++;
      }

      this.options.filters[index].filterData = data;
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

      if (this.collection.structure.get(selectedColumn).get('ui') === "many_to_one" || that.collection.structure.get(selectedColumn).get('ui') === "many_to_many" || that.collection.structure.get(selectedColumn).get('ui') === "one_to_many") {
        var columnModel = this.collection.structure.get(selectedColumn);
        var filterType = columnModel.options.has('filter_type');

        if (filterType && columnModel.options.get('filter_type') === 'dropdown') {
          //Get Related Column Collection
          data.columnModel = columnModel;
          data.relatedCollection = app.getEntries(columnModel.relationship.get('related_table'));

          var name = {};
          name[app.statusMapping.status_name] = app.statusMapping.active_num;
          data.relatedCollection.fetch({includeFilters: false, data: name});
          this.listenTo(data.relatedCollection, 'sync', this.render);
        } else {
          data.filter_ui = this.getFilterDataType(selectedColumn);
        }
      } else if(this.collection.structure.get(selectedColumn).get('type') === "ENUM") {
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

    onClickState: function (event) {
      if (this.options.onClickState) {
        var $checksChecked = this.$el.find('input.js-state-check:checked');

        this.options.onClickState.apply(this, [$checksChecked, event]);
      }
    },

    serialize: function () {
      var data = {resultCount: this.collection.length};
      var structure = this.collection.structure;
      var table = this.collection.getTable();
      var statusColumnName = table.getStatusColumnName();
      var statusSelected = Utils.parseCSV(this.collection.getFilter('status')) || [1, 2];

      statusSelected = _.map(statusSelected, function(value) {
        return Number(value);
      });

      data.statusColumn = structure.get(statusColumnName);
      data.statuses = [];

      // NOTE: This is a hotfix to include radio button for messages filtering
      // switching from inbox to archived messages
      data.stateName = this.options.stateName;
      data.states = this.options.states;

      _.each(this.collection.getStatusVisible(), function (status) {
        data.statuses.push({
          name: status.get('name'),
          value: status.get('id'),
          selected: _.indexOf(statusSelected, status.get('id')) >= 0
        });
      });

      // data.statusColumn = structure.get(app.statusMapping.status_name);
      data.filters = (this.options.filters || []).slice();
      data.tableColumns = _.difference(structure.pluck('id'), [app.statusMapping.status_name]);
      if (this.collection.table.get('filter_column_blacklist')) {
        // TODO: Add filter column blacklist method on table model
        data.tableColumns = _.difference(
          data.tableColumns,
          Utils.parseCSV(this.collection.table.get('filter_column_blacklist'))
        );
      }

      data.tableColumns.sort(SortHelper.arraySort);

      var that = this;
      _.each(this.options.filters, function (item, i) {
        if (item.relatedCollection) {
          data.filters[i].relatedEntries = [];

          var displayTemplate = Handlebars.compile(item.columnModel.options.get('visible_column_template'));
          item.relatedCollection.each(function (model) {
            data.filters[i].relatedEntries.push({
              selected: item.filterData.value == model.id,
              visible_column: model.id,
              visible_column_template: displayTemplate(model.attributes)
            });
          });

          data.filters[i].relatedEntries = _.sortBy(data.filters[i].relatedEntries, 'visible_column_template');
        } else if (item.dropdownValues) {
          data.filters[i].relatedEntries = [];
          _.each(item.dropdownValues, function(model) {
            data.filters[i].relatedEntries.push({
              visible_column:model,
              visible_column_template: model
            });
          });
        } else {
          // Global filters doesn't have a columnName property
          // ex. ?q=word
          if (!data.filters[i].columnName) {
            // mark as null to delete later
            // prevent reindexing of filters array
            data.filters[i] = null;
            return;
          }
          var template = Handlebars.compile(that.getFilterDataType(data.filters[i].columnName));
          if(item.filterData) {
            //Used for Checkboxes since they return 0 string
            if(item.filterData.value === "0") {
              item.filterData = 0;
            }
            data.filters[i].filter_ui = template({value: item.filterData.value});
          } else {
            data.filters[i].filter_ui = template({});
          }
        }
      });

      data.filters = _.compact(data.filters);
      data.searchString = this.searchString;
      data.hasFilters = this.options.filters.length > 0;

      return data;
    },

    afterRender: function() {
      $('.filter-ui').last().find('input').focus();
      var that = this;
      _.each(this.options.filters, function(item) {
        if (!item.columnName) {
          return;
        }

        var columnModel = that.collection.structure.get(item.columnName);

        var table = columnModel.collection.table.id;
        var columns = columnModel.id;
        var visibleTemplate = '<div>{{'+columnModel.id+'}}</div>';

        if(columnModel.relationship) {
          table = columnModel.relationship.get('related_table');
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

      // this.collection.setFilter('adv_search', filters);
      var filtersParams = {};
      var globalParams = {};
      _.each(filters, function(filter) {
        if (filter.type) {
          filtersParams[filter.id] = {};
          filtersParams[filter.id][filter.type] = filter.value;
        } else {
          globalParams[filter.id] = filter.value;
        }
      });

      this.collection.setFilter('filters', filtersParams);
      this.collection.setFilter(globalParams);
      if (!bInit) {
        this.collection.setFilter('currentPage', 0);
      }

      if (app.router.loadedPreference) {
        if(this.basePage) {
          this.basePage.removeHolding(this.cid);
        }
      }
      //this.render();
    },

    saveFilterString: function () {
      var self = this;
      var options = this.options;
      var syncFilters = this.options.syncFilters !== false;
      var save = function (sync) {
        var string = [];
        var method = 'save';
        var preferences = self.collection.preferences;
        var filters = options.filters.map(function (item) {
          return item.filterData;
        });

        filters.forEach(function (search) {
          if (!search) {
            return false;
          }

          if (search.type) {
            string.push(search.id.replace(':','\\:') + ":" + search.type.replace(':','\\:') + ":" + String(search.value).replace(':','\\:').replace(',','\\,'));
          } else {
            string.push(search.id.replace(':','\\:') + ":" + String(search.value).replace(':','\\:').replace(',','\\,'));
          }
        });

        string = encodeURIComponent(string.join());
        if (sync === false) {
          method = 'set';
        }

        return preferences[method]({search_string: string}, {silent: true});
      };


      this.confirmBookmarkAction()
        .done(function () {
          save(syncFilters);
        })
        .fail(function () {
          save(false);
          self.redirect();
        });
    },

    redirect: function () {
      var tableName = this.collection.table.id;
      var route = 'tables/' + tableName;

      this.collection.preferences.save({}, {
        silent: true,
        wait: false
      });

      app.router.navigate(route, false);
      app.router.getBookmarkView().setActive(route);
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

      if (this.collection.getFilter('q')) {
        var searchString = this.collection.getFilter('q');
        if (searchString) {
          this.searchString = searchString;
          this.options.filters.push({
            filterData: {
              id: 'q',
              value: searchString
            }
          });
        }
      }

      if (search !== null && search !== undefined) {
        search = decodeURIComponent(search).replace('\\,', '%21').split(',');

        var that = this;
        search.forEach(function (filter) {
          var data = {};

          filter = filter.replace('\\:', '%20');
          filter = filter.split(':');

          if (filter.length === 2) {
            data = {};
            data.filterData = {
              id: filter[0].replace('%20',':').split('.').shift(),
              value: filter[1].replace('%20',':').replace('%21',',')
            };

            // Do not add global search filter into the filters list
            if (data.filterData && data.filterData.id === 'q') {
              return false;
            }

            that.options.filters.push(data);
          } else if (filter.length === 3) {
            data = {};
            var filterColumn = filter[0].replace('%20',':');
            var selectedColumn = filterColumn.split('.').shift();

            data.columnName = selectedColumn;
            if(!that.collection.structure.get(selectedColumn)) {
              return;
            }
            if(that.collection.structure.get(selectedColumn).get('ui') === "many_to_one" || that.collection.structure.get(selectedColumn).get('ui') === "many_to_many" || that.collection.structure.get(selectedColumn).get('ui') === "one_to_many") {
              var columnModel = that.collection.structure.get(selectedColumn);
              if(columnModel.options.has('filter_type') && columnModel.options.get('filter_type') === "dropdown") {
                //Get Related Column Collection
                data.columnModel = columnModel;
                data.relatedCollection = app.getEntries(columnModel.relationship.get('related_table'));

                var name = {};
                name[app.statusMapping.status_name] = app.statusMapping.active_num;
                data.relatedCollection.fetch({includeFilters: false, data: name});
                that.listenTo(data.relatedCollection, 'sync', that.render);
              } else{
                data.filter_ui = that.getFilterDataType(selectedColumn);
              }
            } else if(that.collection.structure.get(selectedColumn).get('type') === "ENUM") {
              var columnModel = that.collection.structure.get(selectedColumn);
              var vals = columnModel.get('column_type').substring(5, columnModel.get('column_type').length-1);
              vals = vals.replace(/\'/g, "").split(',');
              data.dropdownValues = vals;
            } else if(that.collection.structure.get(selectedColumn).get('ui') === "many_to_many") {
              data.filter_ui = that.getFilterDataType(selectedColumn);
            }else if(that.collection.structure.get(selectedColumn).get('ui') === "multi_select") {
              var columnModel = that.collection.structure.get(selectedColumn);
              var keys = [];
              for(var k in JSON.parse(columnModel.options.get('options'))) keys.push(k);
              data.dropdownValues = keys;
            }
            data.filter_type = that.collection.structure.get(selectedColumn).get('type');

            data.filterData = {id: filterColumn, type: filter[1].replace('%20',':'), value: filter[2].replace('%20',':').replace('%21',',')};

            that.options.filters.push(data);
          }
        });
      }

      this.updateFilters(true);
      this.render();
    },

    initialize: function() {
      this.options.filters = [];

      if (this.options.syncFilters === false) {
        this.collection.preferences = this.collection.preferences.clone();
      }

      this.listenTo(this.collection.preferences, 'change sync', function (collection, model, options) {
        if (options === undefined) {
          options = model;
        }

        if (options.silent !== true) {
          this.updateFiltersFromPreference();
        }
      });

      this.listenTo(this.collection, 'sync', this.render);

      this.basePage = this.options.basePage;
      if (app.router.loadedPreference) {
        if (this.basePage) {
          this.basePage.addHolding(this.cid);
        }
      } else {
        this.updateFiltersFromPreference();
      }
    }
  });
});
