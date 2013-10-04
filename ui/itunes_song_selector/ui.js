//  Text Input Core UI component
//  Directus 6.0
//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
define(['app', 'backbone'], function (app, Backbone) {

    var Module = {};

    Module.id = 'itunes_song_selector';
    Module.dataTypes = ['VARCHAR', 'INT'];

    Module.variables = [
        {id: 'field_mappings', ui: 'textarea', options: {rows: 4} }
    ];

        var template = '<label>{{{capitalize name}}} <span class="note">{{comment}}</span></label> \
                    <style type="text/css"> \
                    ul.typeahead li.active a, \
          ul.typeahead li.active a:hover { \
                        color: #ffffff; \
                    } \
          ul.typeahead li a img { \
            margin-right: 10px; \
          } \
                    </style> \
                    <input type="hidden" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" /> \
                    <input type="text" value="{{value}}" class="{{size}} for_display_only"/>';

    Module.Input = Backbone.Layout.extend({

        tagName: 'fieldset',

        template: Handlebars.compile(template),

        events: {
            'focus input': function () {
                this.$el.find('.label').show();
            },
            'blur input': function () {
                this.$el.find('.label').hide();
            }
        },
        initialize: function() {
            this.options.settings.set({
                field_mappings_obj: JSON.parse(
                    this.options.settings.get('field_mappings')
                ) 
            });

        },

        afterRender: function () {
            var that = this;
            this.$(".for_display_only").typeahead({
                minLength: 2,
                items: 5,
                source: function (typeahead, query) {
                    var tracks = [];
                    var urlParams = {
                        term: query,
                        limit: 5,
                        media: 'music',
                        entity: 'song'
                    };

                    $.ajax({
                        //url: window.directusData.path + "api/core/proxy.php",
                        url: 'http://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch?' + $.param(urlParams),
                        dataType: 'jsonp',
                        data: {
                            term: query,
                            limit: 5,
                            media: 'music',
                            entity: 'song'
                        },
                        //data: {
                        //    url: 'http://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch?' + $.param(urlParams)
                        //},
                        success: function (data) {
                            console.log("data", data);
                            $.each(data.results, function (i, track) {
                                tracks.push(JSON.stringify(track));
                            });
                            typeahead.process(tracks);
                        }
                    });
                },
                sorter: function (items) {
                    return items;
                },
                highlighter: function (item) {
                        var item = JSON.parse(item);
                    return '<img src="' + item.artworkUrl100 + '" test /> ' + item.artistName + ' - ' + item.trackName;
          // http://a1.mzstatic.com/us/r1000/004/Music/24/32/a7/mzi.hjzwehvk.80x60-75.jpg
                },
                matcher: function (item) {
                    return true;
                },
                updater: function (item) {
                    var item = JSON.parse(item);
                    return item.artistName + ' - ' + item.trackName;
                },
                onselect: function (obj) {

                  var item = JSON.parse(obj);
                  this.$element.val(item.artistName + ' - ' + item.trackName);
                  this.$element.siblings('#' + that.options.name).val(item.trackId);
                  var fieldMappings = that.options.settings.get('field_mappings_obj');
                  for (fieldName in fieldMappings) {
                    this.$element.parents('#directus-form').find('#' + fieldMappings[fieldName]).val(item[fieldName]);
                  }
                }
            });
        },

        serialize: function () {
            var length = this.options.schema.get('char_length');
            var value = this.options.value || '';
            return {
                size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
                value: value,
                name: this.options.name,
                maxLength: length,
                characters: length - value.length
            };
        }
    });

    Module.validate = function (value) {
        //return true;
    };

    Module.list = function (options) {
        return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    };

    return Module;


});