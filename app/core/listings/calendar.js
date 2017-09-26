define([
  'app',
  'underscore',
  'core/listings/baseView',
  'moment',
  'core/t',
  'helpers/date'
], function(app, _, BaseView, moment, __t, DateHelper) {

  var viewId = 'calendar';

  return {
    id: viewId,

    icon: 'event',

    dataTypes: ['DATETIME', 'DATE'],

    View: BaseView.extend({

      template: 'core/listings/calendar',

      attributes: {
        class: 'view-calendar js-listing-view abbrev-items clearfix'
      },

      events: {
        'click .js-item': 'onItemClick',
        'click .js-next': 'next',
        'click .js-prev': 'prev'
      },

      onItemClick: function (event) {
        var id = $(event.currentTarget).data('id');

        this.navigate(id);
      },

      prev: function() {
        var self = this;
        this.state.currentDate = moment(this.state.currentDate).add(-1, 'months');
        this.updateCalendar().then(function () {
          self.render();
        });
      },

      next: function() {
        var self = this;
        this.state.currentDate = moment(this.state.currentDate).add(1, 'months');
        this.updateCalendar().then(function () {
          self.render();
        });
      },

      updateCalendar: function() {
        this.updateDateRangeFilter();

        var xhr = this.collection.fetch(this.fetchOptions);
        var self = this;

        xhr.done(function () {
          self.render();
        });

        return xhr;
      },

      fetchData: function () {
        return this.updateCalendar();
      },

      optionsStructure: function() {
        var options = {
          datetime: {},
          title: {}
        };

        _.each(this.dateColumns(), function(column) {
          options.datetime[column.id] = app.capitalize(column.id);
        });

        _.each(this.titleColumns(), function(column) {
          options.title[column.id] = app.capitalize(column.id);
        });

        return {
          id: 'views_options_calendar',
          columns: [
            {
              id: 'date_column',
              type: 'String',
              required: true,
              ui: 'dropdown',
              options: {
                options: options.datetime
              }
            },
            {
              id: 'title_column',
              type: 'String',
              required: true,
              ui: 'dropdown',
              options: {
                options: options.title
              }
            }
          ]
        }
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
        data.daysName = moment.weekdaysShort();

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
            // @TODO: make sure is for this month and year
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
          var published = !model.isSubduedInListing();
          var timeFormat = moment.localeData().longDateFormat('LT');

          if (date && parseInt(moment(date).format('D'), 10) === day) {
            data.push({
              title: titleColumn ? model.get(titleColumn.id) : '',
              time: isUsingDateTime ? moment(date).format(timeFormat) : null,
              fullDate: moment(date).format(),
              published: published,
              id: model.id,
              model: model
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

      isUsingDateTime: function() {
        var column = this.getDateColumn();

        return column.get('type') === 'DATETIME';
      },

      onPreferencesUpdated: function() {
        this.state.isUsingDateTime = this.isUsingDateTime();
        this.render();
      },

      onEnable: function () {
        this.fetchOptions = {};
      },

      bindEvents: function() {
        this.collection.on('sync', this.render, this);
        this.collection.preferences.on('sync', this.onPreferencesUpdated, this);
      },

      unbindEvents: function() {
        this.collection.off('sync', this.render, this);
        this.collection.preferences.off('sync', this.onPreferencesUpdated, this);
      },

      updateDateRangeFilter: function(date) {
        var momentDate = moment(date || this.state.currentDate);
        var range = DateHelper.monthDateRange(momentDate, true);
        var filters = {};
        filters[this.getDateColumn().id] = {between: range.start + ',' + range.end};

        var options = {
          replaceOptions: {
            filters: filters
          }
        };

        this.fetchOptions = _.extend(this.fetchOptions || {}, options);
      },

      initialize: function() {
        this.state = _.extend(this.state, {
          // @TODO: change this date to be a moment object
          currentDate: moment().format(),
          isUsingDateTime: this.isUsingDateTime()
        });

        this.updateDateRangeFilter(moment(this.state.currentDate));
      }
    })
  }
});
