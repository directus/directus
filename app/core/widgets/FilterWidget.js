define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
        <div class="secondary-row row-plain filter-options"> \
          <ul class="tools left"> \
            {{#unless singleFilter}} \
            <li><span class="action" data-add-filter-row>Add Filter</span> \
            {{/unless}} \
              {{#if hasFilters}} \
                <span class="text-spacer">or</span> \
                <span class="action">Save Search</span> \
              {{/if}} \
            </li> \
          </ul> \
          {{#if showFilters}} \
          <ul style="float:left" id="advancedFilterList" class="filter-list advanced-search-fields"> \
            <li class="advanced-search-fields-row filter-form"> \
              <span class="simple-select"> \
                <span class="icon icon-triangle-down"></span> \
                <select name="" id="" class="medium adv-search-col-id"> \
                  {{#tableColumns}} \
                  <option value="{{this}}">{{this}}</option> \
                  {{/tableColumns}} \
                </select> \
              </span> \
              <span class="simple-select"> \
                <span class="icon icon-triangle-down"></span> \
                <select name="" id="" class="small adv-search-query-type"> \
                  <option value="=">==</option> \
                  <option value="<=">&lt;=</option> \
                  <option value=">=">&gt;=</option> \
                  <option value="like">like</option> \
                </select> \
              </span> \
              <input type="text" placeh older="Keywords..." name="keywords" id="advKeywords" maxlength="255" class="medium"> \
              <span id="addFilterButton" class="action" >Add</span> \
            </li> \
          </ul> \
          {{/if}} \
          <div class="vertical-center right pagination-number"></div> \
        </div>'),

    tagName: 'span',

    attributes: {
      style: "float:left"
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

        var queryString = "";

        this.collection.setFilter('adv_search', searchSettings);
        this.collection.setFilter('currentPage', 0);
        this.collection.fetch();
        //this.collection.trigger('adv_search', "id == 336");
      },
      'click [data-add-filter-row]': function(e) {
        var $filterRow = this.getFilterRow;
        $filterRow.clone(true).appendTo(".advanced-search-fields");
      }
    },


    serialize: function() {
      var data = {};
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
  });
});