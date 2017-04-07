define([
  'app',
  'backbone',
  'underscore',
  'core/t',
  'moment',
  'helpers/date',
  'chart'
],
function(app, Backbone, _, __t, moment, DateHelper, Chart) {

  'use strict';

  return Backbone.View.extend({

    template: 'core/widgets/table-chart',

    el: '#items-chart',

    dom: {
      RIGHT_PANE_TOGGLE: '.js-sidebar-toggle',
      CHART: '.chart'
    },

    events: function () {
      var events = {};

      events['click ' + this.dom.RIGHT_PANE_TOGGLE] = 'onPaneToggle';

      return events;
    },

    onPaneToggle: function () {
      this.trigger('toggle');
    },

    fetchChartData: function () {
      if (!this.hasDateColumn() || this.collection.length || this.fetching === true) {
        var deferred = new $.Deferred();
        deferred.resolve();

        return deferred.promise();
      }

      this.fetching = true;
      var filters = {};
      filters[this.options.dateColumn] = {
        between: moment().subtract(29, 'days').format('YYYY-MM-DD') + ',' + moment().format('YYYY-MM-DD')
      };

      return this.collection.fetch({
        replaceOptions: {
          filters: filters
        },
        success: _.bind(function () {
          this.fetching = false;
        }, this)
      });
    },

    hasDateColumn: function () {
      return this.getDateColumn() != null;
    },

    getDateColumn: function () {
      var column = this.options.dateColumn;

      return this.collection.structure.get(column);
    },

    getNumericColumn: function () {
      var column = this.options.numericColumn;

      return this.collection.structure.get(column);
    },

    getData: function () {
      var data = {
        labels: [],
        values: []
      };

      if (!this.hasDateColumn()) {
        return data;
      }

      var range = DateHelper.rangeUntil(moment(), 30) || [];
      _.each(range, _.bind(function (date) {
        data.labels.push(this.getLabel(date));
        data.values.push(this.getValues(date));
      }, this));

      if (this.hasDateColumn()) {
        // data.values = [24,24,24,23,20,19,16,14,9,7,4,2,1,3, 24,24,24,23,20,19,16,14,9,7,4,10,17,19, 30, 1];
      }

      return data;
    },

    getLabel: function (date) {
      var label = '';

      if (DateHelper.isToday(date)) {
        label = __t('today');
      } else {
        label = date.format('MMM D');
      }

      return label.toUpperCase();
    },

    getValues: function (date) {
      var collectionData = this.collection.toJSON();
      var dateColumn = this.getDateColumn();
      var numericColumn = this.getNumericColumn();
      var value = 0;

      _.each(collectionData, function (data, i) {
        var itemDate = moment(data[dateColumn.id]);
        if (itemDate.isSame(date, 'd')) {
          value += numericColumn ? parseFloat(data[numericColumn.id]) : 1;
        }
      });

      return value;
    },

    serialize: function () {
      var data = {};
      var numericColumn = this.getNumericColumn();
      var dateColumn = this.getDateColumn();

      if (numericColumn && dateColumn) {
        data.chartTitle = __t('widget_table_chart_title_x_x', {
          countColumnName: app.capitalize(numericColumn.get('column_name')),
          dateColumnName: app.capitalize(dateColumn.get('column_name'))
        });
      }

      return data;
    },

    afterRender: function () {
      var pointRadius = 2,
          borderWidth = 2,
          ctx = this.$(this.dom.CHART).get(0);

      if (!ctx) {
        return;
      }

      var data = this.getData();
      var myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Views',
            showLine: true,
            data: data.values,
            pointRadius: pointRadius,
            fill: true,
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: borderWidth,
            pointBorderWidth: 2,
            pointBackgroundColor: '#3498DB',
            pointHoverBackgroundColor: '#3498DB',
            pointHitRadius: 5,
            pointHoverRadius: pointRadius + 2,
            borderColor: '#3498DB'
          }]
        },
        options: {
          animation : false,
          defaultFontSize: 10,
          defaultFontFamily: 'Roboto',
          maintainAspectRatio: false,
          responsive: true,
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltips: {
            enabled: true,
            mode: 'single',
            titleFontSize: 12,
            backgroundColor: '#333333',
            titleFontFamily: 'Roboto',
            titleFontColor: '#ffffff',
            bodyFontFamily: 'Roboto',
            bodyFontColor: '#ffffff',
            caretSize: 4,
            xPadding: 10,
            yPadding: 10
          },
          scales: {
            xAxes: [{
              display: true,
              ticks: {
                fontColor: '#9E9E9E',
                fontFamily: 'Roboto',
                fontStyle: '500',
                fontSize: 10,
                autoSkipPadding: 50,
                maxRotation: 0
              },
              gridLines: {
                color: '#EEEEEE',
                display: false,
                drawBorder: false
              }
            }],
            yAxes: [{
              //type: 'logarithmic', // Comment this out if things look funky (can't handle `0` in data)
              display: true,
              position: "left",
              ticks: {
                fontColor: '#9E9E9E', // #9E9E9E
                fontFamily: 'Roboto',
                fontStyle: '500',
                fontSize: 10,
                padding: 20,
                // labelOffset: 100
              },
              gridLines: {
                color: '#EEEEEE',
                drawBorder: false,
                display: true
              }
            }]
          }
        }
      });
    }
  });
});
