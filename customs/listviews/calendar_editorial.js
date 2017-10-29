define([
  'app',
  'underscore',
  'core/listings/baseView',
  'core/listings/calendarAbstract',
  'moment',
  'core/t',
  'helpers/date'
], function(app, _, BaseView, CalendarAbstract, moment, __t, DateHelper) {

  return {
    id: 'calendar_editorial',

    icon: CalendarAbstract.icon,

    dataTypes: CalendarAbstract.dataTypes,

    View: BaseView.extend(_.extend(CalendarAbstract.View, {

      template: '../../customs/listviews/calendar_editorial',

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
              id: 'publish_date_column',
              type: 'String',
              required: true,
              ui: 'dropdown',
              options: {
                options: options.datetime
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
       * @method getPublishDateColumn
       *
       * Read the column to be used for the publish date display off of the 
       * viewOptions, to be used as value determining the post status.
       *
       * @return {Column}
       */
      getPublishDateColumn: function () {
        var viewOptions = this.viewOptions();
        var column;

        if (viewOptions.publish_date_column) {
          column = this.collection.structure.get(viewOptions.publish_date_column);
        } else {
          column = _.first(this.dateColumns())
        }

        return column;
      },

      getTotals: function(items) {
        var customers = (items.length - _.where(items, { customer: false }).length);

        return {
          all: items.length,
          pending: _.filter(items, function (item) { return item.status && item.status.pending }).length,
          published: _.filter(items, function (item) { return item.status && item.status.published }).length,
          draft: _.filter(items, function (item) { return item.status && item.status.draft }).length,
          cancelled: _.filter(items, function (item) { return item.status && item.status.cancelled }).length
        }
      },

      getDayData: function(day) {
        var dateColumn = this.getDateColumn();
        var titleColumn = this.getTitleColumn();
        var publishDateColumn = this.getPublishDateColumn();
        var isUsingDateTime = this.state.isUsingDateTime;
        var data = [];

        this.collection.each(function(model) {
          var date = dateColumn ? model.get(dateColumn.id) : null;
          var published = !model.isSubduedInListing();
          var timeFormat = moment.localeData().longDateFormat('LT');
          var publishDate = publishDateColumn ? moment(model.get(publishDateColumn.id)) : null;

          if (date && parseInt(moment(date).format('D'), 10) === day) {
            data.push({
              title: titleColumn ? model.get(titleColumn.id) : '',
              time: isUsingDateTime ? moment(date).format(timeFormat) : null,
              hour: isUsingDateTime ? moment(date).format('H') : null,
              fullDate: moment(date).format(),
              status: {
                published: model.get('active') === 1 && moment().isAfter(publishDate),
                pending: model.get('active') === 1 && moment().isBefore(publishDate),
                draft: model.get('active') === 2,
                cancelled: model.get('active') === 3
              },
              id: model.id,
              avatar: model.get('featured_image').attributes || false,
              model: model
            });
          }
        });

        return _.sortBy(data, function(item) {
          return item.fullDate;
        });
      },

    })
  )}
});
