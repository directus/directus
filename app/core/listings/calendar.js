define(['app', 'underscore', 'backbone', 'moment', 'core/t'], function(app, _, Backbone, moment, __t) {

  var viewId = 'calendar';

  return {
    id: viewId,

    icon: 'event',

    dataTypes: ['DATETIME', 'DATE'],

    View: Backbone.Layout.extend({

      template: 'core/listings/calendar',

      attributes: {
        class: 'view-calendar js-listing-view abbrev-items clearfix'
      },

      events: {
        'click .js-next': 'next',
        'click .js-prev': 'prev'
      },

      prev: function() {
        this.state.currentDate = moment(this.state.currentDate).add(-1, 'months');
        this.render();
      },

      next: function() {
        this.state.currentDate = moment(this.state.currentDate).add(1, 'months');
        this.render();
      },

      optionsStructure: function() {
        var options = {
          datetime: {},
          title: {}
        };

        _.each(this.dateColumns(), function(column) {
          options.datetime[column.id] = column.id;
        });

        _.each(this.titleColumns(), function(column) {
          options.title[column.id] = column.id;
        });

        return [
          {
            id: 'date_column',
            type: 'String',
            required: true,
            ui: 'select',
            options: {
              options: options.datetime
            }
          },
          {
            id: 'title_column',
            type: 'String',
            required: true,
            ui: 'select',
            options: {
              options: options.title
            }
          }
        ]
      },

      getAllViewOptions: function(viewId) {
        if (this.state && this.state.malformedOptions) {
          return {};
        }

        var viewOptions = this.collection.preferences.get('list_view_options');
        if (viewOptions) {
          try {
            viewOptions = JSON.parse(viewOptions);
          } catch (err) {
            viewOptions = {};
            this.state.malformedOptions = true;
            console.error(__t('calendar_has_malformed_options_json'));
          }
        }

        if (viewId) {
          viewOptions = viewOptions[viewId] || {};
        }

        return viewOptions;
      },

      getViewOptions: function() {
        return this.getAllViewOptions(viewId);
      },

      serialize: function() {
        // @TODO: Clean this process
        var date = this.state.currentDate;
        var data = {};
        var weeks = [];
        var i;

        data.today = {
          day: parseInt(moment().format('D'), 10),
          month: parseInt(moment().format('M'), 10),
          year: parseInt(moment().format('YYYY'), 10)
        };

        data.day = parseInt(moment(date).format('D'), 10);
        data.monthName = moment(date).format('MMMM');
        data.month = parseInt(moment(date).format('M'), 10);
        data.year = parseInt(moment(date).format('YYYY'), 10);

        var startDate = moment([data.year, data.month - 1]).format();
        var dayOfTheWeek = parseInt(moment(startDate).format('d'), 10);
        var daysInTheMonth = moment(date).daysInMonth();
        var daysInPreviousMonth = moment(date).add(-1, 'months').daysInMonth();
        var weeksInTheMonth = (daysInTheMonth/7)+1;

        for (i=0; i<weeksInTheMonth; i++) {
          weeks[i] = {
            days: []
          };
        }

        // empty calendar cells
        var day = (daysInPreviousMonth-dayOfTheWeek)+1;
        for (i=1; i<=dayOfTheWeek; i++) {
          weeks[0].days.push({
            day: day,
            isToday: false,
            isEmpty: true
          });

          day++;
        }

        var weekIndex;
        i = dayOfTheWeek;
        for (day=1; day <= daysInTheMonth; day++) {
          weekIndex = parseInt(i/7, 10);

          if (!weeks[weekIndex]) {
            weeks[weekIndex] = {
              days: []
            };
          }

          weeks[weekIndex].days.push({
            data: this.getDayData(day),
            day: day,
            isToday: data.today.day === day && data.today.month === data.month,
            isEmpty: false
          });

          i++;
        }

        // fill the rest days
        var lastWeekDays = i = weeks[weekIndex].days.length;
        day = 1;
        if (lastWeekDays < 7) {
          while(i < 7 ) {
            weeks[weekIndex].days.push({
              day: day,
              isToday: false,
              isEmpty: true
            });

            i++;
            day++;
          }
        }

        data.weeks = weeks;

        return data;
      },

      getDateColumn: function() {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.date_column) {
          column = this.collection.structure.get(viewOptions.date_column);
        } else {
          column = _.first(this.dateColumns())
        }

        return column;
      },

      getTitleColumn: function() {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.title_column) {
          column = this.collection.structure.get(viewOptions.title_column);
        } else {
          column = _.first(this.titleColumns())
        }

        return column;
      },

      getDayData: function(day) {
        var dateColumn = this.getDateColumn();
        var titleColumn = this.getTitleColumn();
        var isUsingDateTime = this.state.isUsingDateTime;
        var data = [];

        this.collection.each(function(model) {
          var date = dateColumn ? model.get(dateColumn.id) : null;
          var published = model.get(app.statusMapping.status_name) === app.statusMapping.active_num;

          if (date && parseInt(moment(date).format('D'), 10) === day) {
            data.push({
              title: titleColumn ? model.get(titleColumn.id) : '',
              time: isUsingDateTime ? moment(date).format('h:mm a') : null,
              fullDate: moment(date).format(),
              published: published
            });
          }
        });

        return _.sortBy(data, function(item) {
          return item.fullDate;
        });
      },

      dateColumns: function() {
        return this.collection.structure.filter(function(model) {
          return _.contains(['DATETIME', 'DATE'], model.get('type'));
        });
      },

      titleColumns: function() {
        return this.collection.structure.filter(function(model) {
          return _.contains(['VARCHAR'], model.get('type'));
        });
      },

      savePreferences: function(name, value) {
        var attributes = {};
        var viewOptions = this.getAllViewOptions();
        var options;

        // @TODO: create helper to create value using string key
        // calendar.date_column
        if (!viewOptions[viewId]) {
          viewOptions[viewId] = {};
        }

        if (!viewOptions[viewId][name]) {
          viewOptions[viewId][name] = {};
        }

        viewOptions[viewId][name] = value;

        attributes['list_view_options'] = JSON.stringify(viewOptions);

        var success = _.bind(function() {
          this.state.malformedOptions = false;
          this.state.isUsingDateTime = this.isUsingDateTime();
        }, this);

        options = {
          wait: false,
          success: success
        };

        this.collection.preferences.save(attributes, options);
      },

      isUsingDateTime: function() {
        var column = this.getDateColumn();

        return column.get('type') === 'DATETIME';
      },

      initialize: function(options) {
        var collection = this.collection;
        this.baseView = options.baseView;

        collection.on('sync', this.render, this);
        collection.preferences.on('sync', this.render, this);

        // Right pane options changes
        if (this.baseView) {
          this.baseView.on('rightPane:input:change', function (name, value) {
            this.savePreferences(name, value);
          }, this);
        }

        this.state = {
          malformedOptions: false,
          currentDate: moment().format(),
          isUsingDateTime: this.isUsingDateTime()
        };
      }
    })
  }
});
