---
description: Insights is a Module in Directus that allows rapid, no-code build-out of analytics dashboards.
readTime: 9 min read
---

# Panels

> Insights is a Module in Directus that allows rapid, no-code build-out of analytics dashboards. Regardless of your
> use-case _(be it business intelligence, user progress tracking, web traffic conversions, or whatever!)_ you will be
> able to setup key data metrics in just a few clicks.

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/insights-dashboards-20220216A.mp4" type="video/mp4" />
</video>

## Panels Overview

![Directus Dashboard Panels](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/panels-overview-20220216A.webp)

Panels are the building-blocks we add onto Insights dashboards to create, save and display data analytics. There are
five types of Panels, and each one provides some unique analytics tool.

1. **Label** – Displays simple header text to describe other groups of panels. Doesn't actually provide data analysis.
2. **List** – Sortable, filterable list of items within a collection.
3. **Metric** – Sortable, filterable single-number metrics like sum, average, minimum and maximum, or first and last.
4. **Time Series** – Graph to display how metrics change over time. Provides same sorting, filtering and aggregation
   features seen in the list and metric panels.
5. **Global Variables** — Sets a variable which is globally accessible across other panels.

## Panel Header Options

![Panel Header Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/panel-header-options-20220216A.webp)

All panel types let you set custom text to provide quick and clear context about what a Panel represents. Panel Header
options are exactly the same for all four Panel types. Headers are also totally optional and can be hidden.

- **Visible** – Determines if the header is visible or not.
- **Name** – Sets a name in the header area.
- **Icon** – Sets a small icon by the name.
- **Color** – Sets a color for the icon.
- **Note** – Sets a short description of the icon.

## Labels

![Label Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/label-panel-options-20220216A.webp)

As the name implies, this panel simply allows you to _label_ a group of other panels. Labels do not provide analytics.
Labels simply help visually group the other panels (_which do provide analytics_) and give context to your dashboard.

- **Label** – Sets the label text.
- **Color** – Sets the label text color.

## Lists

![List Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/list-panel-options-20220216A.webp)

List panels display some number of Items from a Collection, _as a list!_ These Items displayed can be filtered by other
criteria as well. So for example, you could show your top 5 selling products, 3 worst performing sales regions, 10
students with the highest GPA _that are also_ in intramural sports, or create any other kind of ranked and/or filtered
list that could be generated from your dataset.

- **Collection** – Selects the Collection to rank.
- **Limit** – Limits the number of Items that will appear in the Dashboard.
- **Sort Field** – Sets the Collection Field you wish to order results by.
- **Sort Direction** – Sets Items to display in ascending or descending order.
- **Display Template** – Defines how List Items will be represented. Allows use of Field Item values as well as custom
  text.
- **Filter** – Sets filters to only consider and rank Items that meet some criteria.

## Metrics

![Metrics Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/metric-panel-options-20220216A.webp)

Metrics Panels allow you to aggregate all Items in a Field down to a single value.

- **Collection** – Selects the Collection.
- **Field** – Selects the Field to run aggregate function on.
- **Aggregate Function** – Selects the type of aggregate to perform.
- **Sort Field** – Sets the collection field you wish to order results by.
- **Filter** – Sets filters to only run metrics on Items that meet some criteria.

### More on Aggregate Functions

Generally speaking, aggregate functions take a list of values and returns one single value.

- **Count** – Counts the number of Items in a Field.
- **Count (Distinct)** – Counts the number of _unique_ Items in a field.
- **Average** – Averages values of all Items in a Field.
- **Average (Distinct)** – Averages values of all _unique_ Items in a Field.
- **Sum** – Sums the values of all Items in a Field.
- **Sum (Distinct)** – Sums the values of all _unique_ Items in a Field.
- **Minimum** – Selects the lowest valued Item in a Field.
- **Maximum** – Selects the highest valued Item in a Field.
- **First** – Selects the first Item out of all Items in a Field.
- **Last** – Selects the last Item out of all Items in a Field.

::: tip First, Last, Minimum and Maximum

First, Last, Minimum and Maximum are not aggregates in the purely mathematical sense of the word. However, they are
placed in this panel option because they return one single Item.

:::

::: tip Why are some Fields grayed out?

Certain Fields cannot be used with certain aggregate functions. For example, you cannot use the average function on
Fields that store text, because text cannot be averaged. When there is a conflict between panel options, Fields will be
grayed out and unselectable in the `field dropdown list`.

:::

### Style and Format Options

- **Abbreviate Value** – Abbreviates large numbers with a letter _(e.g. 2,000 = 2K)_.
- **Decimals** – Changes the number of decimals displayed.
- **Prefix** – Adds text before the aggregate metric.
- **Suffix** – Adds text after the aggregate metric.
- **Conditional Styles** – Changes color of number displayed if it is `>`, `>=`, `<`, `<=`, `==`, or `!=` to some
  defined value.

## Time Series

![Time Series Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/time-series-panel-options-20220216A.webp)

The Time Series Panel allows you to build graphs and see how data changes over time.

- **Collection** – Selects the Collection you want to analyze.
- **Color** – Sets color of your graph curve.
- **Group Aggregation** – Selects the type of aggregation to perform. [Learn more](#more-on-aggregate-functions).
- **Group Precision** – Sets the time interval to aggregate by _(days, weeks, months, etc.)_.
- **Date Field** – Selects the datetime Field used along the x-axis.
- **Date Range** – Sets the time range from which data should be displayed, can be customized.
- **Value Field** – Sets the Field you wish to aggregate.
- **Value Decimals** – Changes the number of decimals displayed on the y-axis.
- **Min Value** – Sets minimum value displayed on y-axis.
- **Max Value** – Sets maximum value displayed on y-axis.
- **Curve Type** – Sets curve to be shown as smooth, straight or stepline.
- **Fill Type** – Sets fill type under curve to gradient, solid, or none.
- **Filter** – Allows filtering of Items considered for analysis based on logical conditions.
- **Show X-axis** – Toggles display of time along X-axis.
- **Show Y-axis** – Toggles display of numeric values along Y-axis.

::: warning Time-oriented metrics only

In order to use this Panel, your Collection will need a datetime Field.

:::

::: tip Custom Date Range

Note that `Past` is not prefixed to a custom range as it is on the default ranges. When selecting **"Other"**, simply
type in `3 years`, `1 month`, `2 weeks`, `5 days`, etc.

:::

## Global Variable

![Global Variables](https://cdn.directus.io/docs/v9/app-guide/insights/insights-220624A/global-variable-220624A.webp)

- **Variable Key** — Sets your variable. Use this key to access the variable in other Insights panels.
- **Type** — Sets the data type of your variable.
- **Default Value** — Sets a default value for the global variable.
- **Interface** — Selects the Interface to be used.
- **Options** — Sets the Interface Options.

This panel allows you to create a variable which is globally accessible across other panels. You can use this to do
things like create a string or number to prefix other Insights Panel titles or pass it as a value into a Filter to query
results.

To create and assign a Global Variable, follow the steps from [How it Works](#how-it-works), selecting the Global
Variable panel. Wrap the variable key in double-moustache syntax to access and assign it throughout other Insights
Panels:

```
{{ your_variable_key }}
```

You will notice that the Global Variable Panel is an interface in the Dashboard, allowing you to modify the value of
this variable. If you change its value, all panels referencing the variable will update automatically.

::: warning Must be Valid Data Type

Your variable's data type will need to be a valid match to wherever you are using it. For example, do not apply a string
or JSON variable in a place that requires Datetime data.

:::

## Global Relational Variable

- **Variable Key** — Sets your variable. Use this key to access the variable in other Insights panels.
- **Collection** — The collection to get the item IDs from.
- **Multiple** — Allow selection of multiple items when enabled.
- **Limit** — Limits the number of items that can be selected.
- **Display Template** — Defines how the items will be represented. Allows use of Field Item values as well as custom
  text.
- **Filter** — Sets filters to allow selection of items that meet some criteria.

This panel allows you to create a variable which is globally accessible across other panels. You can use this to do
things like select single or multiple items and pass their IDs as a value into a Filter to query results.

To create and assign a Global Relational Variable, follow the steps from [How it Works](#how-it-works), selecting the
Global Relational Variable panel. Wrap the variable key in double-moustache syntax to access and assign it throughout
other Insights Panels:

```
{{ your_variable_key }}
```

You will notice that the Global Relational Variable Panel is an interface in the Dashboard, allowing you to modify the
value of this variable. If you change its value, all panels referencing the variable will update automatically.

::: warning Must be Valid Data Type

Your variable's data type will need to be a valid match to wherever you are using it. For example, do not apply a string
or JSON variable in a place that requires Datetime data.

:::
