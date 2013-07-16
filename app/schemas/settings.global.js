define([], function() {

	var settingsGlobalSchema = {};

	settingsGlobalSchema.structure = [
	    {id: 'site_name', ui: 'textinput', char_length: 255},
	    {id: 'site_url', ui: 'textinput', char_length: 255},
	    {id: 'cms_color', ui: 'textinput' /*, options: { options: [{title: 'Green', value: 'green'}]}*/},
	    {id: 'cms_user_auto_sign_out', ui: 'numeric', char_length: 255, options: {size: 'small'}}
	];

	return settingsGlobalSchema;
});