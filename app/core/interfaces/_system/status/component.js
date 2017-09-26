define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  var statusMappingPlaceholder = JSON.stringify({
    0: {
      name: 'Delete',
      text_color: '#FFFFFF',
      background_color: '#F44336',
      subdued_in_listing: true,
      show_listing_badge: true,
      hidden_globally: true,
      hard_delete: false,
      published: false,
      sort: 3
    },
    1: {
      name: 'Active',
      text_color: '#FFFFFF',
      background_color: '#3498DB',
      subdued_in_listing: false,
      show_listing_badge: false,
      hidden_globally: false,
      hard_delete: false,
      published: true,
      sort: 1
    },
    2: {
      name: 'Draft',
      text_color: '#999999',
      background_color: '#EEEEEE',
      subdued_in_listing: true,
      show_listing_badge: true,
      hidden_globally: false,
      hard_delete: false,
      published: false,
      sort: 2
    }
  }, null, 2);

  return UIComponent.extend({
    id: 'status',
    dataTypes: ['TINYINT', 'SMALLINT', 'INT', 'BIGINT'],
    options: [{
      id: 'delete_value',
      column_name: 'delete_value',
      ui: 'numeric',
      type: 'TINYINT',
      default_value: 0,
      required: false,
      nullable: true,
      system: false,
      hidden_input: false,
      sort: 6,
      comment: __t('directus_tables_status_delete_value_comment')
    }, {
      id: 'status_mapping',
      column_name: 'status_mapping',
      ui: 'json',
      type: 'TEXT',
      hidden_input: false,
      required: false,
      nullable: true,
      comment: __t('directus_tables_status_mapping_comment'),
      options: {
        rows: 17,
        placeholder: statusMappingPlaceholder,
        filter: 'number'
      }
    }],
    Input: Input
  });
});
