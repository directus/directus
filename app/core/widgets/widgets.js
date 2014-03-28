define([
  'core/widgets/PaginatorView',
  'core/widgets/addWidget',
  'core/widgets/bookmarkWidget',
  'core/widgets/listWidget',
  'core/widgets/gridWidget',
  'core/widgets/searchWidget',
  'core/widgets/editWidget'
],

function(PaginatorView, addWidget, bookmarkWidget, listWidget, gridWidget, searchWidget, editWidget) {

  return {
    paginator: PaginatorView,
    AddWidget: addWidget,
    BookmarkWidget: bookmarkWidget,
    ListWidget: listWidget,
    GridWidget: gridWidget,
    SearchWidget: searchWidget,
    EditWidget: editWidget
  };

});