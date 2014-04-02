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

    events: {
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

        this.options.filterOptions.filters.push(searchSettings[0]);

        this.updateFilters();
        this.saveFilterString();
      },
      'click [data-add-filter-row]': function(e) {
        this.options.filterOptions.addFilter = true;
        this.render();
      }
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
      this.setFilterRow();
    },

    initialize: function() {
      this.options.filterOptions = {filters:[]};

      this.collection.preferences.on('sync', function() {
        this.options.filterOptions.filters = [];

        var search = this.collection.preferences.get('search_string');

        if(search !== null && search !== undefined) {
          search = decodeURIComponent(search).replace('\\,', '%21').split(",");
          var that = this;
          search.forEach(function(filter) {
            filter = filter.replace('\\:', '%20');
            filter = filter.split(':');
            that.options.filterOptions.filters.push({id: filter[0].replace('%20',':'), type: filter[1].replace('%20',':'), value: filter[2].replace('%20',':').replace('%21',',')});
          });
        }
        this.updateFilters();
      }, this);
    }
  });
});