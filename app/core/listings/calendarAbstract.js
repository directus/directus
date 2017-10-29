define([
  'app',
  'underscore',
  'core/listings/baseView',
  'moment',
  'core/t',
  'helpers/date',
  'helpers/storage'
], function(app, _, BaseView, moment, __t, DateHelper, StorageHelper) {

  return {
    icon: 'event',

    dataTypes: ['DATETIME', 'DATE'],

    View: {
      /**
       * @prop template
       *
       * Handlebars template to render the view
       *
       * @return {str}
       */
      template: 'core/listings/calendar',

      /**
       * @prop attributes
       *
       * Attributes to render to this View's top-level DOM element
       *
       * @return {str}
       */
      attributes: {
        class: 'view-calendar js-listing-view abbrev-items clearfix'
      },

      /**
       * @prop events
       *
       * Event listeners and the function they call
       *
       * @return {obj}
       */
      events: {
        'click .js-dateItem': 'onDateItemClick',
        'click .js-item': 'onItemClick',
        'click .js-next': 'next',
        'click .js-prev': 'prev'
      },

      /**
       * @method viewOptions
       *
       * Get the options for a view, used to render the preferences in the
       * sidebar
       *
       * @param {str} id the viewId
       *
       * @return {obj} view options for the current view
       */
      viewOptions: function (id = this.id) {
        return this.getViewOptions()[id]
      },

      /**
       * @method onItemClick
       *
       * Event handler for clicking on single item. Currently only opens the edit view.
       *
       * @param {event}
       *
       * @return {void}
       */
      onItemClick: function (event) {
        var id = $(event.currentTarget).data('id');

        this.navigate(id);
      },

      /**
       * @method onDateItemClick
       *
       * Event handler for clicking on a calendar day. Switches the calendar to the day view.
       *
       * @param {event}
       *
       * @return {void}
       */
      onDateItemClick: function (event) {
        var id = $(event.currentTarget).data('id');
        var self = this;
        var state = this.state

        // update state
        state.focusDate = moment(state.focusDate).set('date', id);
        StorageHelper.save(this.id+'.focusDate', state.focusDate);
        state.currentView = 'day';

        // save preferences
        this.baseView.trigger('rightPane:view', 'view_range', state.currentView);

        // update view
        this.fetchData(state.focusDate, state.currentView)
          .then(function () {
            self.render();
          });
      },

      /**
       * @method prev
       *
       * Navigate to the previous increment in the current range (i.e., a day, or a week)
       *
       * @return {void}
       */
      prev: function() {
        var self = this;
        var state = this.state

        // update state
        var range = state.currentView || this.viewOptions().view_range;
        state.focusDate = moment(state.focusDate).add(-1, range);
        StorageHelper.save(this.id+'.focusDate', state.focusDate);
        state.currentView = range;

        // update view
        this.fetchData(state.focusDate, state.currentView).then(function () {
          self.render();
        });
      },

      /**
       * @method next
       *
       * Navigate to the next increment in the current range (i.e., a day, or a week)
       *
       * @return {void}
       */
      next: function() {
        var self = this;
        var state = this.state

        // update state
        var range = state.currentView || this.viewOptions().view_range;
        state.focusDate = moment(state.focusDate).add(1, range);
        StorageHelper.save(this.id+'.focusDate', state.focusDate);
        state.currentView = range;

        // update view
        this.fetchData(state.focusDate, state.currentView).then(function () {
          self.render();
        });
      },

      /**
       * @method fetchData
       *
       * Asynchronously fetch items in the current range, after optionally
       * updating the range parameters.
       *
       * @param {str|obj|Moment?} date
       * @param {str} view
       *
       * @return {Promise}
       */
      fetchData: function(date = false, view = false) {
        if (!view) view = this.state.currentView;
        // if (!date) date = this.state.currentDate
        this.updateDateRangeFilter(date, view);

        var xhr = this.collection.fetch(this.fetchOptions);
        var self = this;

        xhr.done(function () {
          self.render();
        });

        return xhr;
      },

      /**
       * @method optionsStructure
       *
       * Return the options to populate the preferences UI in the sidebar
       *
       * @return {obj}
       */
      optionsStructure: function() {
        var options = {
          views: {
            day: 'Day',
            week: 'Week',
            month: 'Month'
          },
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
          id: 'views_options_' + this.id,
          columns: [
            {
              id: 'view_range',
              type: 'String',
              required: true,
              ui: 'dropdown',
              default_value: 'month',
              options: {
                options: options.views
              }
            },
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

      /**
       * @method serialize
       *
       * Compile the data object to create the view, using the current range,
       * state, options and possibly custom methods to massage the items.
       * The result is sent to the Handlebars template for rendering.
       *
       * @return {obj}
       */
      serialize: function() {
        // state
        var state = this.state
        var range = state.currentView || this.viewOptions().view_range
        var date = state.focusDate;

        var hours = this.getHours();

        // setup the container that holds the items
        var data = {};
        var container = [];
        var weekIndex = 0;
        var i;
        if (!container[weekIndex]) {
          container[weekIndex] = {
            days: []
          };
        }

        // default data to return to the view
        data.today = {
          day: parseInt(moment().format('D'), 10),
          month: parseInt(moment().format('M'), 10),
          year: parseInt(moment().format('YYYY'), 10)
        };

        // range specific
        switch (range) {
          case 'day':
            data.isDayView = true;
            data.view = 'day';

            data = _.extend(this.getDefaultDateKeys(date), data);

            container = {};
            hours.forEach(function(hour) {
              container[hour] = [];
            })

            this.getDayData(data.day).forEach(function(item) {
              var current = moment(item.fullDate).toObject();
              // safeguard
              if (!container[current.hours+':00']) {
                container[current.hours+':00'] = []
              };

              container[current.hours+':00'].push({
                // @TODO: make sure is for this month and year
                data: item,
                hour: current.hours,
                day: current.date,
                isNow: data.today.hour === current.hour,
                isEmpty: false
              });
            }, this);

            break;
          case 'week':
            data.view = 'week';
            data.isWeekView = true;

            var currentWeek = DateHelper.weekDateRange(moment(date), true);
            data.startDate = moment(currentWeek.start).toObject();
            data.endDate = moment(currentWeek.end).toObject();
            data.toNextMonth = (data.endDate.date < data.startDate.date);

            data = _.extend(this.getDefaultDateKeys(moment(currentWeek.start)), data);

            this.getDateRange(data.startDate, data.endDate).forEach(function(day) {
              var current = moment(day).toObject()
              var items = this.getDayData(current.date);

              container[weekIndex].days.push({
                // @TODO: make sure is for this month and year
                data: items,
                totals: this.getTotals(items),
                day: current.date,
                isToday: data.today.day === current.date && data.today.month === data.month,
                isEmpty: false
              });
            }, this);

            break;
          default:
            data.view = 'month';
            data.isMonthView = true;

            data = _.extend(this.getDefaultDateKeys(date), data);

            var startDate = moment([data.year, data.month - 1]).format();
            var dayOfTheWeek = parseInt(moment(startDate).format('d'), 10);
            var daysInTheMonth = moment(date).daysInMonth();
            var daysInPreviousMonth = moment(date).add(-1, 'months').daysInMonth();
            var weeksInTheMonth = (daysInTheMonth/7)+1;

            for (i=0; i<weeksInTheMonth; i++) {
              container[i] = {
                days: []
              };
            }

            // empty calendar cells
            var day = (daysInPreviousMonth-dayOfTheWeek)+1;
            for (i=1; i<=dayOfTheWeek; i++) {
              container[0].days.push({
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

              if (!container[weekIndex]) {
                container[weekIndex] = {
                  days: []
                };
              }

              var items = this.getDayData(day);

              container[weekIndex].days.push({
                // @TODO: make sure is for this month and year
                data: items,
                totals: this.getTotals(items),
                day: day,
                isToday: data.today.day === day && data.today.month === data.month,
                isEmpty: false
              });

              i++;
            }

            // fill the rest days
            var lastWeekDays = i = container[weekIndex].days.length;
            day = 1;
            if (lastWeekDays < 7) {
              while(i < 7 ) {
                container[weekIndex].days.push({
                  day: day,
                  isToday: false,
                  isEmpty: true
                });

                i++;
                day++;
              }
            }

            break;
        }

        data.weeks = container;
        return data;
      },

      /**
       * @method getDefaultDateKeys
       *
       * @param {str|obj|Moment} date
       * @return {obj}
       */
      getDefaultDateKeys: function (date = DEFAULT_FULL_SCHEMA) {
        var data = {};

        if (date) {
          data.day = parseInt(moment(date).format('D'), 10);
          data.dayName = moment(date).format('dddd');
          data.week = parseInt(moment(date).format('W'), 10);
          data.monthName = moment(date).format('MMMM');
          data.month = parseInt(moment(date).format('M'), 10);
          data.year = parseInt(moment(date).format('YYYY'), 10);
          data.nextMonthName = moment([data.year, (data.month < 12 && data.month || 0)]).format('MMMM');
          data.daysName = moment.weekdaysShort();
          data.isMonthView = false;
          data.isWeekView = false;
          data.isDayView = false;
        }

        return data
      },

      /**
       * @method getTotals
       * @memberOf serialize
       *
       * Compile statistics for display in the template, as well as conditionally
       * rendering template partials. Extend this method to fit the present use
       * case.
       *
       * @param {arr} items
       *
       * @return {obj}
       */
      getTotals: function(items) {
        return {
          all: items.length
        }
      },

      /**
       * @method getDateColumn
       *
       * Read the column to be used for the date display off of the viewOptions,
       * to be used as value for the corresponding preference widget, and to sort
       * the items for the view.
       *
       * @return {Column}
       */
      getDateColumn: function() {
        var viewOptions = this.viewOptions();
        var column;

        if (viewOptions.date_column) {
          column = this.collection.structure.get(viewOptions.date_column);
        } else {
          column = _.first(this.dateColumns())
        }

        return column;
      },


      /**
       * @method getTitleColumn
       *
       * Read the column to be used for the date display off of the viewOptions,
       * to be used as value for the corresponding preference widget, and to
       * display in the view.
       *
       * @return {Column}
       */
      getTitleColumn: function() {
        var viewOptions = this.viewOptions();
        var column;

        if (viewOptions.title_column) {
          column = this.collection.structure.get(viewOptions.title_column);
        } else {
          column = _.first(this.titleColumns())
        }

        return column;
      },

      /**
       * @method getDayData
       * @memberOf serialize
       *
       * Compile the item object for display in the template, and sort the
       * resulting array by date. Extend this method to fit the present use case.
       *
       * @param {obj|Moment} day
       *
       * @return {arr}
       */
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
              published: published,
              title: titleColumn ? model.get(titleColumn.id) : '',
              time: isUsingDateTime ? moment(date).format(timeFormat) : null,
              hour: isUsingDateTime ? moment(date).format('H') : null,
              fullDate: moment(date).format(),
              id: model.id,
              model: model
            });
          }
        });

        return _.sortBy(data, function(item) {
          return item.fullDate;
        });
      },

      /**
       * @method getDateRange
       *
       * @param {obj|str} startDate
       * @param {obj|str} endDate
       *
       * @return {arr}
       */
      getDateRange: function (startDate, endDate) {
          var dateArray = [];
          var currentDate = moment(startDate);
          var endDate = moment(endDate);
          while (currentDate <= endDate) {
              dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
              currentDate = moment(currentDate).add(1, 'days');
          }
          return dateArray;
      },

      /**
       * @method getHours
       * @memberOf serialize
       *
       * The selection of hours to include in the day view. Either culled from
       * the global config, or extended for the present use case.
       *
       * @return {arr}
       */
      getHours: function () {
        return app.config.get('calendar').hours || []
      },

      /**
       * @method dateColumns
       *
       * Return the Collection's columns eligible to function as date fields.
       *
       * @return {arr}
       */
      dateColumns: function() {
        return this.collection.structure.filter(function(model) {
          return _.contains(['DATETIME', 'DATE'], model.get('type'));
        });
      },

      /**
       * @method titleColumns
       *
       * Return the Collection's columns eligible to function as title fields.
       *
       * @return {arr}
       */
      titleColumns: function() {
        return this.collection.structure.filter(function(model) {
          return _.contains(['VARCHAR'], model.get('type'));
        });
      },

      /**
       * @method isUsingDateTime
       *
       * Sanity check to allow working with Moment objects
       *
       * @return {bool}
       */
      isUsingDateTime: function() {
        var column = this.getDateColumn();

        return column.get('type') === 'DATETIME';
      },

      /**
       * @method onPreferenceUpdated
       *
       * Event handler that refreshes and re-renders the view whenever a
       * preference is updated.
       *
       * @return {void}
       */
      onPreferencesUpdated: function() {
        this.state.isUsingDateTime = this.isUsingDateTime();
        this.state.currentView = this.viewOptions().view_range;
        this.getAllViewOptions(this.id);
        this.fetchData();
      },

      /**
       * @method onEnable
       *
       * Resets the fetchOptions to default
       *
       * @return {void}
       */
      onEnable: function () {
        this.fetchOptions = {};
      },

      /**
       * @method bindEvents
       *
       * Subscribe to changes in the Collection, or its preferences
       *
       * @return {void}
       */
      bindEvents: function() {
        this.collection.on('sync', this.render, this);
        this.collection.preferences.on('sync', this.onPreferencesUpdated, this);
      },

      /**
       * @method unbindEvents
       *
       * Unsubscribe from changes in the Collection, or its preferences
       *
       * @return {void}
       */
      unbindEvents: function() {
        this.collection.off('sync', this.render, this);
        this.collection.preferences.off('sync', this.onPreferencesUpdated, this);
      },

      /**
       * @method updateDateRangeFilter
       *
       * Update the date range according to the state of the view, or parameters
       * passed to the method. Verifies the input and subsequently
       *
       * @param {str|obj|Moment} date
       * @param {str?} view
       *
       * @return {void}
       */
      updateDateRangeFilter: function(date, view = false) {
        var momentDate = moment(date || this.state.focusDate);
        var viewOptions = this.viewOptions();
        if (!view) view = viewOptions.view_range;
        // hook range into the boom
        var range
        switch (view) {
          case 'day':
            range = DateHelper.dayDateRange(momentDate, true);
            break;
          case 'week':
            range = DateHelper.weekDateRange(momentDate, true);
            break;
          default: //month
            range = DateHelper.monthDateRange(momentDate, true);
            break;
        }

        var filters = {};
        filters[this.getDateColumn().id] = {between: range.start + ',' + range.end};

        var options = {
          replaceOptions: {
            filters: filters,
            depth: 2
          }
        };

        this.fetchOptions = _.extend(this.fetchOptions || {}, options);
      },

      /**
       * @method initialize
       *
       * Sets the state, and updates the date range for the view
       *
       * @return {void}
       */
      initialize: function() {
        var currentDate =  this.state.currentDate || moment().format();
        var focusDate = StorageHelper.read(this.id +'.focusDate') || false;
        focusDate = (focusDate && new Date(focusDate).toISOString()) || currentDate;

        this.state = _.extend(this.state, {
          // add a prop focusDate to save to the localStorage?
          focusDate: moment(focusDate),
          currentDate: moment(currentDate),
          isUsingDateTime: this.isUsingDateTime()
        });

        this.updateDateRangeFilter(this.state.focusDate);
      }
    }
  }
});