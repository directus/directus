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
                    <style type="text/css">\
                    #edit_field_{{name}} .twitter-typeahead {\
                    width:100%;\
                    }\
                         #edit_field_{{name}} .tt-dropdown-menu { \
    padding: 3px 0; \
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); \
    -webkit-border-radius: 2px; \
    -moz-border-radius: 2px; \
    border-radius: 2px; \
    background-color: #fff; \
} \
#edit_field_{{name}} .tt-suggestions { \
    margin-right: 0 !important; \
} \
\
#edit_field_{{name}} .tt-suggestion { \
    display: block; \
    padding: 3px 20px; \
    clear: both; \
    font-weight: normal; \
    white-space: nowrap; \
    font-size: 12px; \
    margin-right: 0 !important; \
} \
\
#edit_field_{{name}} .tt-is-under-cursor { \
    color: white; \
    background-color: black; \
}\
</style>\
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
                valueKey: 'trackName',
                template: Handlebars.compile('<div><img src="{{artworkUrl60}}" />  {{artistName}} - {{trackName}}</div>'),
                remote: {
                    dataType: 'jsonp',
                    url: 'http://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch?limit=5&media=music&entity=song&term=%QUERY',
                    filter: function(resp) {
                        return resp.results;
                    }
                }
            })

            this.$('.for_display_only').on('typeahead:selected', function(object, datum) {
                var item = datum;
                console.log(object);
                var $el = $(object.currentTarget);
               // that.$element.val(item.artistName + ' - ' + item.trackName);

                $el.parents('#directus-form').find('#' + that.options.name).val(item.trackId);
                var fieldMappings = that.options.settings.get('field_mappings_obj');
                for (fieldName in fieldMappings) {
                    if(fieldMappings[fieldName] == 'album_art_url'){ // Replaces 100px image with 600px (undocumented hack)
                        $el.parents('#directus-form').find('#' + fieldMappings[fieldName]).val( item[fieldName].replace("100x100-75.jpg","600x600-75.jpg"));
                    } else {
                        $el.parents('#directus-form').find('#' + fieldMappings[fieldName]).val(item[fieldName]);
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