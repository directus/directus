---
description: Insights is a Module in Directus that allows rapid, no-code build-out of analytics dashboards.
readTime: 9 min read
---

# Charts

> Insights is a Module in Directus that allows rapid, no-code build-out of analytics dashboards. Regardless of your
> use-case _(be it business intelligence, user progress tracking, web traffic conversions, or whatever!)_ you will be
> able to setup key data metrics in just a few clicks.

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/insights-dashboards-20220216A.mp4" type="video/mp4" />
</video>

## Bar Chart

![Dashboard edit page with a bar chart options panel visible.](https://cdn.directus.io/docs/v9/app-guide/insights/20220223/panels-bar-options-230223A.webp)

The Bar Chart Panel allows you to build vertical and horizontal bar charts from data held in collections.

- **Collection** – Selects the Collection you want to analyze.
- **Horizontal** - If enabled, the bars will be horizontal (originating from the y-axis).
- **X-Axis** - The Field presented on the x-axis.
- **Y-Axis** - The Field presented on the y-axis.
- **Value Decimals** – Changes the number of decimals displayed on both axes.
- **Color** – Sets the default color of your bars.
- **Filter** – Allows filtering of Items considered for analysis based on logical conditions.
- **Conditional Styles** – Changes color of bar if its value is `>`, `>=`, `<`, `<=`, `==`, or `!=` to some defined
  value.

## Line Chart

![Dashboard edit page with a line chart options panel visible.](https://cdn.directus.io/docs/v9/app-guide/insights/20220223/panels-line-options-230223A.webp)

The Line Chart Panel allows you to build line charts from data held in collections, and are often used for time-series
data.

- **Collection** – Selects the Collection you want to analyze.
- **X-Axis** - The Field presented on the x-axis.
- **Y-Axis** - The Field presented on the y-axis.
- **Group Aggregation** – Selects the type of aggregation to perform. If you may only select a Field to be presented on
  the x-axis. [Learn more](#more-on-aggregate-functions).
- **Function** – Selects the type of aggregate to perform.
- **Filter** – Allows filtering of Items considered for analysis based on logical conditions.
- **Value Decimals** – Changes the number of decimals displayed on both axes.
- **Color** – Sets the default color of your line.
- **Show Axis Labels** - Selects if and on which axis labels are shown.
- **Show Tooltip Marker** - If enabled, shows data when a data point is hovered over.
- **Curve Type** - Selects the style of the curve - smooth, straight, or stepped.
- **Conditional Styles** – Changes color of line if its value is `>`, `>=`, `<`, `<=`, `==`, or `!=` to some defined
  value.

## Meter

![Dashboard edit page with a meter options panel visible.](https://cdn.directus.io/docs/v9/app-guide/insights/20220223/panels-meter-options-230223A.webp)

The Meter Panel takes a maximum value and allows you to show a completion percentage given a second value.

- **Collection** – Selects the Collection you want to analyze.
- **Field** – Selects the Field to run aggregate function on.
- **Function** – Selects the type of aggregate to perform.
- **Maximum** - Sets the maximum value (100% of the meter).
- **Filter** – Allows filtering of Items considered for analysis based on logical conditions.
- **Size** - Sets dial to be a full circle or a half circle.
- **Stroke Width** - Sets thickness of the meter dial line.
- **Color** – Sets the default color of your dial.
- **Rounded Stroke** - If enabled, changes the cap style to rounded.
- **Conditional Styles** – Changes color of meter if its value is `>`, `>=`, `<`, `<=`, `==`, or `!=` to some defined
  value.

## Pie or Donut Chart

![Dashboard edit page with a pie or donut options panel visible.](https://cdn.directus.io/docs/v9/app-guide/insights/20220223/panels-pie-donut-options-230223A.webp)

The Pie and Donut Charts allow you to create segmented charts based on your data.

- **Collection** – Selects the Collection you want to analyze.
- **Field** – Selects the Field to run aggregate function on.
- **Function** – Selects the type of aggregate to perform.
- **Donut** - If enabled, a circle is cut out of the center of the chart.
- **Show Labels** - If enabled, the percentage value is shown in each segment.
- **Show Legend** - Selects if and where the legend is shown - none, right, or bottom.
- **Filter** – Allows filtering of Items considered for analysis based on logical conditions.
- **Value Decimals** – Changes the number of decimals displayed in the chart segments.
- **Color** – Sets the default base color of your first segment. Other segments will be variations of this default.
- **Conditional Styles** – Changes color of segment if its value is `>`, `>=`, `<`, `<=`, `==`, or `!=` to some defined
  value.
