this['JST'] = this['JST'] || {};

this['JST']['app/templates/alert.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div id="alert">\n<span class="glyphicon-repeat"></span>\nLoading\n</div>';
}
return __p;
};

this['JST']['app/templates/main.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div id="navbar"></div>\n\n<div class="head">\n<div id="tabs" class="container-fluid"></div>\n</div>\n\n<div id="content" class="container-fluid"></div>';
}
return __p;
};

this['JST']['app/templates/modal.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="modal-header">\n<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>\n<h3 id="myModalLabel">{{title}}</h3>\n</div>\n\n<div class="modal-body">\n</div>\n\n<div class="modal-footer">\n\t<button class="btn btn-primary" name="save">{{buttonText}}</button>\n\t<button class="btn btn-link" name="close">Close</button>\n</div>';
}
return __p;
};

this['JST']['app/templates/module-messages.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="directus-module-header">Item Messsages</div>';
}
return __p;
};

this['JST']['app/templates/module-revisions.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="directus-module-header">Item Revisions</div>\n';
}
return __p;
};

this['JST']['app/templates/module-save.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='{{#if showActive}}\n<div class="directus-module-section">\n\t<label class="radio inline"><input type="radio" name="active" value="1" {{#if isActive}}checked="true"{{/if}}> Active</label>\n\t<label class="radio inline"><input type="radio" name="active" value="2" {{#if isInactive}}checked="true"{{/if}}> Inactive</label>\n</div>\n{{/if}}\n\n<div class="directus-module-section">\n\t{{#if showDropdown}}\n\t\t<div class="btn-group">\n\t\t\t<a class="btn btn-primary" id="save-form">Save Item</a>\n\t\t\t<a class="btn btn-primary dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></a>\n\t\t\t<ul class="dropdown-menu dropdown-menu-primary">\n\t\t\t\t<li><a id="save-form-stay">Save & Stay</a></li>\n\t\t\t\t<li><a id="save-form-add">Save & Add</a></li>\n\t\t\t\t<li><a id="save-form-copy">Save as Copy</a></li>\n\t\t\t</ul>\n\t\t</div>\n\t{{else}}\n\t\t<a class="btn btn-primary" id="save-form">Save Item</a>\n\t{{/if}}\n\t<div class="cancel">or <a href="#" id="save-form-cancel">Cancel</a></div>\n</div>\n{{#if showDelete}}\n<div class="directus-module-section">\n\t<button class="btn-delete" id="delete-form"><span class="glyphicon-remove"></span>Delete</button>\n</div>\n{{/if}}';
}
return __p;
};

this['JST']['app/templates/navbar.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="navbar navbar-fixed-top">\n\t<div class="navbar-inner">\n\t\t\t<a href="{{siteUrl}}" target="_blank" class="brand">{{siteName}}  <span class="glyphicon-share-alt"></span></a>\n\t\t\t<div class="pull-right dropdown">\n\t\t\t\t\t<div data-toggle="dropdown" class="user">\n\t\t\t\t\t<span class="label speech-bubble">5</span>\n\t\t\t\t\t<span class="user-firstname">{{user}}</span>\n\t\t\t\t\t<img src="{{avatar}}" class="avatar">\n\t\t\t\t\t</div>\n\t\t\t\t<ul class="dropdown-menu">\n\t\t\t\t\t\t<li><a href="#users/1">User Settings</a></li>\n\t\t\t\t\t\t<li><a href="#messages">Messages</a></li>\n\t\t\t\t\t\t<li class="divider"></li>\n\t\t\t\t\t\t<li><a href="#">Sign Out</a></li>\n\t\t\t\t\t</ul>\n\t\t\t</div>\n\t</div>\n</div>';
}
return __p;
};

this['JST']['app/templates/page.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<header>\n\t<h2>{{#each breadcrumbs}}<a href="{{anchor}}">{{{capitalize title}}}</a> <span class="glyphicon-chevron-right breadcrumb-divider"></span> {{/each}} {{{capitalize title}}}</h2>\n\t{{#if buttonTitle}}<button class="btn btn-primary btn-top" id="btn-top">{{buttonTitle}}</button>{{/if}}\n</header>\n\n{{#if sidebar}}\n<div class="row-fluid">\n<div class="span8" id="page-content"></div>\n<div class="span4" id="sidebar"></div>\n</div>\n{{else}}\n<div id="page-content"></div>\n{{/if}}\n\n\n{{#if upload}}\n<input id="fileupload" type="file" name="files[]" data-url="http://localhost/directus6/server/api/1/media" multiple style="display:none;">\n{{/if}}';
}
return __p;
};

this['JST']['app/templates/settings-columns.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<table class="table table-striped directus-table" id="directus_columns">\n<thead>\n<tr>\n    <th><span class="glyphicon-random"></span></th>\n    <th>Field</th>\n    <th>Input Type</th>\n    <th>Required</th>\n    <th>Hidden</th>\n    <th>Primary</th>\n</tr>\n</thead>\n<tbody>\n  {{#rows}}\n  <tr class="{{#if alias}}alias{{/if}}" data-id="{{id}}">\n    <td>&nbsp;</td>\n    <td title="{{this.type}}">{{{capitalize id}}}</td>\n    {{#if system}}\n    <td colspan="4"></td>\n    {{else}}\n    <td>\n      <select>\n        {{#types}}\n        <option {{#if active}}selected{{/if}}>{{{capitalize id}}}</option>\n        {{/types}}\n      </select>\n      {{#if uiHasVariables}}<button class="glyphicon-settings btn btn-link" data-action="ui" data-id="{{id}}"></button>{{/if}}\n    </td>\n    <td>\n      <div class="btn-group" data-toggle="buttons-checkbox">\n        <button type="button" class="btn btn-small"><span class="glyphicon-justify"></span></button>\n        <button type="button" class="btn btn-small active"><span class="glyphicon-pencil"></span></button>\n      </div>\n    </td>\n    <td><input type="checkbox"></td>\n    <td><input type="radio"></td>\n    {{/if}}\n\n\n  </tr>\n  {{/rows}}\n</tbody>\n</table>';
}
return __p;
};

this['JST']['app/templates/settings.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="row">\n<div class="span12">\n\t<h2>Settings</h2>\n\t<hr/>\n</div>\n</div>\n<div class="row-fluid">\n\t<div class="span4">\n\t\t<a href="#settings/global">\n\t\t<div class="well well-small">\n\t\t<h3>Global Settings</h3>\n\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\tCurabitur quis urna eu massa commodo faucibus. Aenean\n\t\tmauris nisi, ornare sed vulputate sit amet, suscipit ut libero.\n\t\t</div>\n\t\t</a>\n\t</div>\n\t<div class="span4">\n\t\t<a href="#settings/tables">\n\t\t<div class="well well-small">\n\t\t<h3>Tables & Inputs</h3>\n\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\tCurabitur quis urna eu massa commodo faucibus. Aenean\n\t\tmauris nisi, ornare sed vulputate sit amet, suscipit ut libero.\n\t\t</div>\n\t\t</a>\n\t</div>\n\t<div class="span4">\n\t\t<a href="#settings/media">\n\t\t<div class="well well-small">\n\t\t<h3>Media & Thumbnails</h3>\n\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\tCurabitur quis urna eu massa commodo faucibus. Aenean\n\t\tmauris nisi, ornare sed vulputate sit amet, suscipit ut libero.\n\t\t</div>\n\t\t</a>\n\t</div>\n</div>\n<div class="row-fluid">\n\t<div class="span4">\n\t\t<a href="#settings/permissions">\n\t\t<div class="well well-small">\n\t\t<h3>User Permissions</h3>\n\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\tCurabitur quis urna eu massa commodo faucibus. Aenean\n\t\tmauris nisi, ornare sed vulputate sit amet, suscipit ut libero.\n\t\t</div>\n\t\t</a>\n\t</div>\n\t<div class="span4">\n\t\t<a href="#settings/system">\n\t\t<div class="well well-small">\n\t\t<h3>System Details</h3>\n\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\tCurabitur quis urna eu massa commodo faucibus. Aenean\n\t\tmauris nisi, ornare sed vulputate sit amet, suscipit ut libero.\n\t\t</div>\n\t\t</a>\n\t</div>\n\t<div class="span4">\n\t\t<a href="#settings/about">\n\t\t<div class="well well-small">\n\t\t<h3>About Directus</h3>\n\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\tCurabitur quis urna eu massa commodo faucibus. Aenean\n\t\tmauris nisi, ornare sed vulputate sit amet, suscipit ut libero.\n\t\t</div>\n\t\t</a>\n\t</div>\n</div>';
}
return __p;
};

this['JST']['app/templates/table-body.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='{{#each rows}}\n\t<tr data-id="{{this.id}}" data-cid="{{this.cid}}" class="{{{active this}}}">\n\t\t<td class="status"></td>\n\t\t{{#if ../sortable}}<td class="sort"><span class="glyphicon-show-lines"></span></td>{{/if}}\n\t\t{{#if ../selectable}}<td class="check"><input type="checkbox" value="{{this.id}}"></td>{{/if}}\n\t\t{{#each ../columns}}<td>{{ui ../this this}}</td>{{/each}}\n\t</tr>\n{{/each}}';
}
return __p;
};

this['JST']['app/templates/table-head.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<tr>\n  <th class="status"></th>\n  {{#if sortable}}<th class="sort" data-id="sort"><span class="glyphicon-random"></span></th>{{/if}}\n  {{#if selectable}}<th class="check"><input type="checkbox"></th>{{/if}}\n  {{#columns}}\n    <th data-id="{{name}}">{{{capitalize name}}} {{#if orderBy}}{{#if desc}}▼{{else}}▲{{/if}}{{/if}}</th>\n  {{/columns}}\n</tr>';
}
return __p;
};

this['JST']['app/templates/table-toolbar.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='{{#if actionButtons}}\n<div class="btn-group btn-group-action active" id="set-visibility">\n  <button class="btn btn-small" data-value="1" rel="tooltip" data-placement="bottom" title="Active"><span class="glyphicon-eye-open"></span></button>\n  <button class="btn btn-small" data-value="2" rel="tooltip" data-placement="bottom" title="Inactive"><span class="glyphicon-eye-close"></span></button>\n  <button class="btn btn-small" data-value="0" rel="tooltip" data-placement="bottom" title="Delete"><span class="glyphicon-trash"></span></button>\n</div>\n{{/if}}\n\n\n<div class="btn-group" id="visibility">\n  XXX\n  {{#visibility}}\n  {{#if this.active}}\n    <a class="btn btn-small dropdown-toggle" data-toggle="dropdown">\n      Viewing {{text}}\n      <span class="caret"></span>\n    </a>\n  {{/if}}\n  {{/visibility}}\n\n  <ul class="dropdown-menu">\n    {{#visibility}}\n      {{#unless active}}<li><a data-value="{{value}}">View {{text}}</a></li>{{/unless}}\n    {{/visibility}}\n  </ul>\n</div>\n\n{{#if paginator}}\n<div class="btn-group">\n  <a class="btn btn-small {{#unless pagePrev}}disabled{{/unless}} pag-prev"><span class="glyphicon-arrow-left"></span></a>\n  <a class="btn btn-small {{#unless pageNext}}disabled{{/unless}} pag-next"><span class="glyphicon-arrow-right"></span></a>\n</div>\n{{/if}}\n<div class="pagination-number">{{#if uBound}} {{lBound}}–{{uBound}} of {{totalCount}}{{/if}}</div>\n\n\n{{#if filter}}\n<div class="filter pull-right">\n  <input type="text" id="table-filter" placeholder="Filter" value="{{filterText}}">\n</div>\n{{/if}}';
}
return __p;
};

this['JST']['app/templates/table.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!--<form id="user-preferences">-->\n<div class="directus-toolbar"></div>\n\n<table class="table table-striped directus-table" id="{{id}}">\n<colgroup>\n\t<col class="col-status">\n\t{{#if sortable}}<col class="col-sort">{{/if}}\n\t{{#if selectable}}<col class="col-check">{{/if}}\n\t{{#columns}}\n\t\t<col class="col-{{this}}">\n\t{{/columns}}\n</colgroup>\n</table>\n\n{{#unless hasData}}\n<div class="nothing-here">\n<h1>There doesn\'t seem to be anything here</h1>\nCreate a new item by click the button above\n</div>\n{{/unless}}\n\n<!--</form>-->';
}
return __p;
};

this['JST']['app/templates/tables.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<table class="table table-striped directus-table" id="directus_tables">\n<thead>\n<tr>\n    <th class="table_name">Table Name</th>\n    <th class="active">Active</th>\n    <th class="modified">Modified</th>\n</tr>\n</thead>\n<tbody>\n  {{#rows}}\n    <tr data-id="{{table_name}}">\n      <td>{{{capitalize table_name}}}</td>\n      <td>{{#if single}}<span class="glyphicon-pencil"></span>{{else}}{{count}}{{/if}}</td>\n      <td>{{contextualDate date_modified}}</td>\n    </tr>\n  {{/rows}}\n</tbody>\n</table>';
}
return __p;
};

this['JST']['app/templates/tabs.html'] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<ul class="nav nav-tabs">\n{{#tabs}}\n  <li {{#if active}}class="active"{{/if}}>\n  \t<a href="#{{id}}">{{title}} {{#if count}}<div class="label hidden-phone">{{{number count}}}</div>{{/if}}</a>\n  </li>\n{{/tabs}}\n</ul>';
}
return __p;
};