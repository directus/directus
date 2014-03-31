define([
  'core/widgets/PaginatorWidget',
  'core/widgets/ButtonWidget',
  'core/widgets/SearchWidget',
  'core/widgets/SaveWidget',
  'core/widgets/VisibilityWidget'
],

function(PaginatorWidget, ButtonWidget, SearchWidget, SaveWidget, VisibilityWidget) {

  return {
    PaginatorWidget: PaginatorWidget,
    ButtonWidget: ButtonWidget,
    SearchWidget: SearchWidget,
    SaveWidget: SaveWidget,
    VisibilityWidget: VisibilityWidget
  };

});