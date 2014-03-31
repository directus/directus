define([
  'core/widgets/PaginatorWidget',
  'core/widgets/ButtonWidget',
  'core/widgets/SearchWidget',
  'core/widgets/SaveWidget'
],

function(PaginatorWidget, ButtonWidget, SearchWidget, SaveWidget) {

  return {
    PaginatorWidget: PaginatorWidget,
    ButtonWidget: ButtonWidget,
    SearchWidget: SearchWidget,
    SaveWidget: SaveWidget
  };

});