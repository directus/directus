//  Blob core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['core/interfaces/blob/interface', 'core/UIComponent'], function (Input, UIComponent) {
  'use strict';

  return UIComponent.extend({
    id: 'blob',
    dataTypes: ['BLOB', 'MEDIUMBLOB'],
    Input: Input,
    list: function () {
      return 'BLOB';
    }
  });
});
