define([
  'core/widgets/PaginatorWidget',
  'core/widgets/PaginationCountWidget',
  'core/widgets/ButtonWidget',
  'core/widgets/InfoButtonWidget',
  'core/widgets/SaveWidget',
  'core/widgets/VisibilityWidget',
  'core/widgets/FilterWidget',
  'core/widgets/FilterButtonWidget',
  'core/widgets/SelectionActionWidget',
  'core/widgets/SelectedCountWidget'
],

function(PaginatorWidget, PaginationCountWidget, ButtonWidget, InfoButtonWidget, SaveWidget, VisibilityWidget, FilterWidget, FilterButtonWidget, SelectionActionWidget, SelectedCountWidget) {

  return {
    PaginatorWidget: PaginatorWidget,
    PaginationCountWidget: PaginationCountWidget,
    ButtonWidget: ButtonWidget,
    InfoButtonWidget: InfoButtonWidget,
    SaveWidget: SaveWidget,
    VisibilityWidget: VisibilityWidget,
    FilterWidget: FilterWidget,
    FilterButtonWidget: FilterButtonWidget,
    SelectionActionWidget: SelectionActionWidget,
    SelectedCountWidget: SelectedCountWidget
  };

});
