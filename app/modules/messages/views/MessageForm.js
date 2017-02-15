define([
  'app',
  'underscore',
  'core/t',
  'backbone',
  'core/edit',
  'schema/ColumnsCollection'
], function(app, _, __t, Backbone, EditView, Structure) {

  var schema = [
    {
      id: 'message',
      column_name: 'message',
      type: 'text',
      required: true,
      ui: 'textarea',
      options: {
        placeholder_text: __t('write_a_reply')
      }
    },
    {
      id: 'attachment',
      column_name: 'attachment',
      type: 'text',
      required: false,
      nullable: true,
      ui: 'multiple_files_csv'
    }
  ];

  var structure = new Structure(schema, {parse: true});

  return EditView.extend({
    el: '#message-form',
    structure: structure,
    events: {
      // 'change input, select, textarea': _.bind(this.onInputChange, this)
    }
  });
});
