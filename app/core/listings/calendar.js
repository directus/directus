define(['app', 'backbone', 'moment'], function(app, Backbone, moment) {

  return {
    id: 'calendar',
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

        var dayOfTheWeek = parseInt(moment(date).format('d'), 10);
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

      initialize: function() {
        var filter = [{
          datetime: '2017-01-30'
        }];
        this.collection.setFilter('limit', 0);
        this.collection.setFilter('filters', filter);


        this.state = {
          currentDate: moment().format()
        };
      }
    })
  }
});
