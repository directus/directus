define([
  'app',
  'underscore',
  'moment',
  'core/t',
  'backbone',
  'core/table/table.view',
  'core/widgets/TableChartWidget',
  'core/listings/baseView'
], function(app, _, moment, __t, Backbone, TableView, TableChartWidget, BaseView) {

  var View = BaseView.extend(TableView.prototype, {});

  return {
    id: 'table',

    icon: 'menu',

    View: View.extend({

      dom: {
        CHART: '#items-chart'
      },

      afterRender: function () {
        View.prototype.afterRender.apply(this, arguments);

        if (this.showChart && this.getViewOptions('chart_enabled') == true) {
          this.setView(this.dom.CHART, this.getChartView(true)).render();
        }
      },

      getChartView: function (force) {
        if (force || !this.chartView) {
          this.chartView = new TableChartWidget({
            parentView: this,
            dateColumn: this.getDateColumnName(),
            numericColumn: this.getViewOptions('y_axis'),
            collection: this.collection.clone().reset()
          });

          this.chartView.on('toggle', this.toggleRightPane, this);
        }

        return this.chartView;
      },

      toggleRightPane: function () {
        this.baseView.toggleRightPane();
      },

      serialize: function () {
        var data = View.prototype.serialize.apply(this, arguments);
        var chartEnabled = this.showChart && this.getViewOptions('chart_enabled');

        data.fixedHead = chartEnabled != true;
        data.showChart = chartEnabled == true;

        return data;
      },

      optionsStructure: function() {
        var options = {
          spacings: {},
          numericColumns: {},
          dateColumns: {}
        };

        _.each(app.config.get('spacings'), function(name) {
          options.spacings[name] = name;
        });

        _.each(this.dateColumns(), function(column) {
          options.dateColumns[column.id] = column.id;
        });

        _.each(this.numericColumns(), function(column) {
          options.numericColumns[column.id] = column.id;
        });

        app.on('beforeCreateInput:fake:views_options_table:chart_enabled', _.bind(function (UI, options) {
          options.canWrite = this.supportsChart();
        }, this));

        return {
          id: 'views_options_table',
          columns: [
            {
              id: 'chart_enabled',
              type: 'Boolean',
              required: false,
              ui: 'checkbox',
              default_value: false
            },
            {
              id: 'y_axis',
              type: 'String',
              required: false,
              ui: 'select',
              comment: 'INT',
              options: {
                allow_null: true,
                options: options.numericColumns
              }
            },
            {
              id: 'x_axis',
              type: 'String',
              required: false,
              ui: 'select',
              comment: 'DATE',
              options: {
                options: options.dateColumns
              }
            },
            {
              id: 'spacing',
              type: 'String',
              required: true,
              ui: 'select',
              options: {
                options: options.spacings
              }
            }
          ]
        }
      },

      supportsChart: function () {
        return Object.keys(this.dateColumns()).length > 0;
      },

      getDateColumn: function () {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.date_column) {
          column = this.collection.structure.get(viewOptions.date_column);
        } else {
          column = _.first(this.dateColumns())
        }

        return column;
      },

      getDateColumnName: function () {
        var column = this.getDateColumn();

        return column ? column.id : null;
      },

      getNumericColumn: function () {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.numeric_column) {
          column = this.collection.structure.get(viewOptions.numeric_column);
        } else {
          column = _.first(this.numericColumns())
        }

        return column;
      },

      dateColumns: function () {
        return this.collection.structure.filter(function(model) {
          return _.contains(['DATETIME', 'DATE'], model.get('type'));
        });
      },

      numericColumns: function () {
        return this.collection.structure.filter(function (model) {
          return _.contains(['INT'], model.get('type')) && !model.get('system');
        });
      },

      isUsingDateTime: function () {
        var column = this.getDateColumn();

        return column.get('type') === 'DATETIME';
      },

      onEnable: function() {
        this.on('preferences:updated', this.updateTableSpacing, this);
      },

      onDisable: function() {
        this.off('preferences:updated', this.updateTableSpacing, this);
      },

      updateTableSpacing: function() {
        var viewOptions = this.getViewOptions();
        this.setSpacing(viewOptions.spacing);
      },

      constructor: function() {
        View.prototype.constructor.apply(this, arguments);
        BaseView.prototype.constructor.apply(this, arguments);

        this.showChart = this.supportsChart();

        this.collection.preferences.on('sync', function () {
          var changed = this.showChart && this.getViewOptions('chart_enabled');
          if (changed) {
            this.render();
          }
        }, this);
      }
    })
  }
});
