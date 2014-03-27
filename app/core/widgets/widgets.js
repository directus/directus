define([
  'core/widgets/PaginatorView',
  'core/widgets/addWidget',
  'core/widgets/bookmarkWidget'
],

function(PaginatorView, addWidget, bookmarkWidget) {

  return {
    paginator: PaginatorView,
    AddWidget: addWidget,
    BookmarkWidget: bookmarkWidget
  };

});