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

  var CHART_Y_AXIS_NAME = 'chart_y_axis';
  var CHART_X_AXIS_NAME = 'chart_x_axis';

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

        if (this.showChart && this.isChartEnabled()) {
          this.addChart();
        }
      },

      // chart is enabled if it has both x and y axis seleted
      isChartEnabled: function () {
        return !!this.getXAxis() && !!this.getYAxis();
      },

      // date column
      getXAxis: function () {
        return this.getViewOptions(CHART_X_AXIS_NAME) || this.getDateColumnName();
      },

      // numeric column
      getYAxis: function () {
        return this.getViewOptions(CHART_Y_AXIS_NAME);
      },

      addChart: function () {
          var chartView = this.getChartView(true);

          this.setView(this.dom.CHART, chartView);
          chartView.fetchChartData().then(function () {
            chartView.render();
          });
      },

      getChartView: function (force) {
        if (force || !this.chartView) {
          this.chartView = new TableChartWidget({
            parentView: this,
            dateColumn: this.getXAxis(),
            numericColumn: this.getYAxis(),
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
        var chartEnabled = this.showChart && this.isChartEnabled();

        data.fixedHead = chartEnabled != true;
        data.showChart = chartEnabled == true;

        return data;
      },

      fetchData: function () {
        var xhr = this.collection.fetch();
        var self = this;

        return xhr.done(function () {
          self.updateSystemColumns().then(function () {
            self.render();
          });
        });
      },

      optionsStructure: function() {
        var options = {
          spacings: {},
          numericColumns: {},
          dateColumns: {}
        };

        _.each(app.config.get('spacings'), function(name) {
          options.spacings[name] = app.capitalize(__t(name));
        });

        _.each(this.dateColumns(), function(column) {
          options.dateColumns[column.id] = app.capitalize(column.id);
        });

        _.each(this.numericColumns(), function(column) {
          options.numericColumns[column.id] = app.capitalize(column.id);
        });

        // app.on('beforeCreateInput:fake:views_options_table:chart_enabled', _.bind(function (UI, options) {
        //   options.canWrite = this.supportsChart();
        // }, this));

        return {
          id: 'views_options_table',
          columns: [
            // {
            //   id: 'chart_enabled',
            //   type: 'Boolean',
            //   required: false,
            //   ui: 'checkbox',
            //   default_value: false
            // },
            {
              id: CHART_Y_AXIS_NAME,
              type: 'String',
              required: false,
              ui: 'select',
              options: {
                allow_null: true,
                options: options.numericColumns
              }
            },
            {
              id: CHART_X_AXIS_NAME,
              type: 'String',
              required: false,
              ui: 'select',
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

      updateTableSpacing: function() {
        var viewOptions = this.getViewOptions();
        this.setSpacing(viewOptions.spacing);
      },

      getCommentCollection: function () {
        var Directus = require('core/directus');

        if (!this.comments) {
          this.comments = new Directus.EntriesCollection({}, {
            table: app.messages.table,
            structure: app.messages.structure
          });
        }

        return this.comments;
      },

      getActivityCollection: function () {
        if (!this.activity) {
          this.activity = app.activity.clone().reset();
        }

        return this.activity;
      },

      getUpdatesCollection: function () {
        if (!this.updates) {
          this.updates = app.activity.clone().reset();
        }

        return this.updates;
      },

      updateSystemColumns: function () {
        if (this.getViewOptions('item_numbers') != this.options.showItemNumbers) {
          this.options.showItemNumbers = !this.options.showItemNumbers;
        }

        if (this.getViewOptions('show_footer') != this.options.showFooter) {
          this.$('tfoot').toggleClass('footer-open');
          this.options.showFooter = !this.options.showFooter;
        }

        var self = this;
        return this.fetchComments().then(function () {
          return self.fetchRevisions();
        }).then(function () {
          return self.fetchUpdates();
        });
      },

      updateSystemColumnsAndRender: function () {
        var self = this;
        this.updateSystemColumns().then(function () {
          self.render();
        });
      },

      fetchComments: function () {
        var showCommentsCount = this.getViewOptions('comments_count');

        if (this.options.systemCollection.length <= 0) {
          var deferred = new $.Deferred();
          deferred.resolve();

          return deferred.promise();
        }

        if (showCommentsCount) {
          var commentsCollection = this.getCommentCollection();
          commentsCollection.setFilter({
            filters: {
              comment_metadata: {like: this.collection.table.id + ':'}
            }
          });

          return commentsCollection.fetch().then(_.bind(function () {
            var systemCollection = this.options.systemCollection;
            var comments = [];
            this.comments.each(function (model) {
              var metadata = (model.get('comment_metadata') || '').split(':');

              if (!comments[metadata[1]]) {
                comments[metadata[1]] = {
                  id: metadata[1],
                  count: 0
                };
              }

              comments[metadata[1]].count++;
            });

            _.each(comments, function (comment) {
              var model = systemCollection.get(comment.id);
              // if the collection are filtered some models may not be
              if (model) {
                model.set('_comments', comment.count);
              }
            });
          }, this));
        }
      },

      fetchRevisions: function () {
        var showRevisionsCount;
        var activityCollection;

        if (this.options.systemCollection.length <= 0) {
          var deferred = new $.Deferred();
          deferred.resolve();

          return deferred.promise();
        }

        showRevisionsCount = this.getViewOptions('revisions_count');
        if (!showRevisionsCount) {
          return;
        }

        activityCollection = this.getActivityCollection();
        activityCollection.setFilter({
          filters: {
            table_name: this.collection.table.id
          }
        });

        return activityCollection.fetch().then(_.bind(function () {
          var systemCollection = this.options.systemCollection;
          var revisions = [];
          this.activity.each(function (model) {
            var rowId = model.get('row_id');

            if (!revisions[rowId]) {
              revisions[rowId] = {
                id: rowId,
                count: 0
              };
            }

            revisions[rowId].count++;
          });

          _.each(revisions, function (revision) {
            var model = systemCollection.get(revision.id);
            // if the collection are filtered some models may not be
            if (model) {
              model.set('_revisions', revision.count);
            }
          });
        }, this));
      },

      fetchUpdates: function () {
        var showLastUpdate;
        var collection;

        if (this.options.systemCollection.length <= 0) {
          var deferred = new $.Deferred();
          deferred.resolve();

          return deferred.promise();
        }

        showLastUpdate = this.getViewOptions('last_updated');
        if (!showLastUpdate) {
          return;
        }

        collection = this.getUpdatesCollection();

        var lastUpdated = {};
        lastUpdated[this.collection.table.id] = collection.map(function (model) {
          return model.id;
        });

        collection.setFilter({
          last_updated: lastUpdated
        });

        return collection.fetch().then(_.bind(function () {
          var systemCollection = this.options.systemCollection;
          this.updates.each(function (model) {
            var rowId = model.get('row_id');
            var rowModel = systemCollection.get(rowId);

            if (rowModel) {
              rowModel.set('_last_updated', moment(model.get('datetime')).fromNow());
            }
          });
        }, this));
      },

      getTableColumns: function () {
        var columns = TableView.prototype.getTableColumns.apply(this, arguments);
        var prependColumns = this.getPrependColumns() || [];
        var appendColumns = this.getAppendColumns() || [];

        return prependColumns.concat(columns).concat(appendColumns);
      },

      getPrependColumns: function () {
        return [];
      },

      getAppendColumns: function () {
        var columns = [];

        if (this.getViewOptions('comments_count')) {
          columns.push('_comments');
        }

        if (this.getViewOptions('revisions_count')) {
          columns.push('_revisions');
        }

        if (this.getViewOptions('last_updated')) {
          columns.push('_last_updated');
        }

        return columns;
      },

      initialize: function () {
        TableView.prototype.initialize.apply(this, arguments);

        this.options.footer = true;
        this.options.showFooter = this.getViewOptions('show_footer');
        this.on('afterRender', function () {
          if (this.options.showFooter) {
            this.$('tfoot').addClass('footer-open');
          }
        }, this);
      },

      onShowMore: function () {
        this.trigger('toggleRightPane');
      },

      bindEvents: function () {
        this.on('preferences:updated', this.updateTableSpacing, this);

        if (this.options.system === true) {
          this.collection.preferences.on('sync', this.updateSystemColumnsAndRender, this);
          this.listenTo(this, 'onShowMore', this.onShowMore);
        }
      },

      unbindEvents: function () {
        this.off('preferences:updated', this.updateTableSpacing, this);

        if (this.options.system === true) {
          this.collection.preferences.off('sync', this.updateSystemColumnsAndRender, this);
          this.stopListening(this, 'onShowMore', this.onShowMore);
        }
      },

      constructor: function (options) {
        BaseView.prototype.constructor.apply(this, arguments);
        TableView.prototype._configureTable.call(this, options);

        this.showChart = this.supportsChart();
      }
    })
  }
});
