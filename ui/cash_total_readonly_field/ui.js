//  Text Input Core UI component
//  Directus 6.0
//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
define(['app', 'backbone'], function (app, Backbone) {

    var Module = {};

    Module.id = 'cash_total_readonly_field';
    Module.dataTypes = ['VARCHAR', 'INT'];

    Module.variables = [
        {id: 'field_mappings', ui: 'textarea', options: {rows: 4} }
    ];

        var template = '<label>{{{capitalize name}}} <span class="note">{{comment}}</span></label> \
                    <input type="text" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" />';

    Module.Input = Backbone.Layout.extend({

        tagName: 'fieldset',

        template: Handlebars.compile(template),

        events: {
           
        },
        initialize: function() {
            _.bindAll(this, 'calculateTotal');
            $('#pennies, #nickels, #dimes, #quarters, #ones, #fives, #tens, #twenties, #fifties, #hundreds').live('change', this.calculateTotal);
        },

        calculateTotal: function() {
            
            var penniesVal = (!isNaN($('#pennies').val()) && $('#pennies').val() != '') ? $('#pennies').val() : 0,
                nickelsVal = !isNaN($('#nickels').val()) && $('#nickels').val() != '' ? $('#nickels').val() : 0,
                dimesVal = !isNaN($('#dimes').val()) && $('#dimes').val() != '' ? $('#dimes').val() : 0,
                quartersVal = !isNaN($('#quarters').val()) && $('#quarters').val() != '' ? $('#quarters').val() : 0,
                onesVal = !isNaN($('#ones').val()) && $('#ones').val() != '' ? $('#ones').val() : 0,
                fivesVal = !isNaN($('#fives').val()) && $('#fives').val() != '' ? $('#fives').val() : 0,
                tensVal = !isNaN($('#tens').val()) && $('#tens').val() != '' ? $('#tens').val() : 0,
                twentiesVal = !isNaN($('#twenties').val()) && $('#twenties').val() != '' ? $('#twenties').val() : 0,
                fiftiesVal = !isNaN($('#fifties').val()) && $('#fifties').val() != '' ? $('#fifties').val() : 0,
                hundredsVal = !isNaN($('#hundreds').val()) && $('#hundreds').val() != '' ? $('#hundreds').val() : 0;

            var penniesAmt = penniesVal * 0.01,
                nickelsAmt = nickelsVal * 0.05,
                dimesAmt = dimesVal * 0.1,
                quartersAmt = quartersVal * 0.25,
                onesAmt = onesVal * 1,
                fivesAmt = fivesVal * 5,
                tensAmt = tensVal * 10,
                twentiesAmt = twentiesVal * 20,
                fiftiesAmt = fiftiesVal * 50,
                hundredsAmt = hundredsVal * 100;

            var totalAmt = penniesAmt + nickelsAmt + dimesAmt + quartersAmt + onesAmt + fivesAmt + tensAmt + twentiesAmt + fiftiesAmt + hundredsAmt;
            
            //console.log(this);
            this.$("input").val(totalAmt);

        },

        afterRender: function () {
         
         
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