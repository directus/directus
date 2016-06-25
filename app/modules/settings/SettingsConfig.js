define(['core/t'],
function(__t) {
    'use strict';

    var SettingsConfig = {
        systemColumnDetails: {
            id: __t('system_column_details_id'),
            active: __t('system_column_details_active')+' <a target="_blank" class="link-underline" href="https://github.com/directus/docs/blob/master/01-getting-started/05-your-database.md#status-field">'+__t('learn_more')+'</a>',
            sort: __t('system_column_details_sort')+' <a target="_blank" class="link-underline" href="https://github.com/directus/docs/blob/master/01-getting-started/05-your-database.md#sort-field">'+__t('learn_more')+'</a>'
        }
    };

    return SettingsConfig;
});
