---
description: Learn how to build a live-updating pie chart with results from a poll.
contributors: Kevin Lewis
---

# Build a Live Poll Result Chart With JavaScript

In this guide, you will build a live-updating chart based on votes to a multiple-choice poll. New entries will be added
using a Directus REST API, and results will be accessed using a WebSockets connection. The chart will be created and
updated using [Chart.js](https://www.chartjs.org).

## Before You Start

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud).

Create a new collection called `votes`, with a dropdown selection field called `choice`. Create two choices - one with
the value of `dogs` and one with `cats`.

In the `Public` role, give Create access to the `votes` collection.

Create a new Role called `Results`, and make sure the `Results` role has Read access to the `votes` collection. Create a
new user with this role, generate an access token, and make note of it.

## Create The Vote Page

Create a `vote.html` file and open it in your code editor. Add the following:

```html
<!DOCTYPE html>
<html>
	<body>
		<div id="options">
			<button id="cat">Cats</button>
			<button id="dog">Dogs</button>
		</div>
		<p></p>
		<script>
			const directusUrl = 'https://your-directus-url';
			document.querySelector('#cat').addEventListener('click', vote('cats'));
			document.querySelector('#dog').addEventListener('click', vote('dogs'));

			async function vote(choice) {
				await fetch(`${directusUrl}/items/votes`, {
					method: 'POST',
					body: JSON.stringify({ choice }),
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
		</script>
	</body>
</html>
```

This uses the Directus REST API to create a new item in the `votes` collection when the a button is pressed. Make sure
to replace `your-directus-url` with your project’s URL.

_Load `vote.html` in your browser and click a button. Check your Directus project and you should see a new item in the
`votes` collection._

![Directus Votes collection with a single item with a choice of ‘cats’.](https://cdn.directus.io/docs/v9/guides/websockets/poll-item-added.webp)

At the bottom of your `vote` function, add some user feedback that the vote was cast:

```js
document.body.innerHTML = 'Vote cast';
```

_Refresh your browser and try casting a vote. The page should be replaced with a success message once the vote has taken
place._

## Create The Results Page

Also create a `results.html` file and open it in your editor. Add the following:

```html
<!DOCTYPE html>
<html>
  <body>
    <div style="display: flex; justify-content: center; height: 80vh">
      <canvas id="chart"></canvas>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script type="module">
      import {
        createDirectus,
        realtime,
        authentication,
        staticToken,
      } from 'https://www.unpkg.com/@directus/sdk/dist/index.js';

      const url = 'https://your-directus-url/';
      const access_token = 'your-access-token';

      const client = createDirectus(url)
        .with(staticToken(access_token))
        .with(realtime());

      client.connect();

      client.onWebSocket('open', function () {
        console.log({ event: 'onopen' });
      });

      client.onWebSocket('message', function (data) {
        if (data.type == 'auth' && data.status == 'ok') {
        }

        if (data.type == 'subscription' && data.event == 'init') {
        }

        if (data.type == 'subscription' && data.event == 'create') {
        }
      });
    </script>
  </body>
</html>
```

This boilerplate creates a placeholder element for our chart, and includes Chart.js from a CDN. It also sets up our
WebSocket methods - for more information check out our
[Getting Started With WebSockets](/guides/real-time/getting-started/websockets.md) guide.

Make sure to replace `your-directus-url` with your project’s URL, and `your-access-token` with your token.

### Set Up Chart

At the bottom of your `<script>`, initialize a pie chart which will have two segments:

```js
const ctx = document.getElementById('chart');

const chart = new Chart(ctx, {
	type: 'pie',
	data: {
		labels: [],
		datasets: [
			{
				label: '# of Votes',
				data: [],
				backgroundColor: ['#4f46e5', '#f472b6'],
			},
		],
	},
});
```

Load `results.html` in your browser. Don’t worry that nothing is displayed yet - the chart has no data so it can’t
render.

### Add Existing Votes On Load

Once authenticated, immediately subscribe to the `votes` collection:

```js
if (data.type == 'auth' && data.status == 'ok') {
	client.sendMessage({ // [!code ++]
			type: 'subscribe', // [!code ++]
			collection: 'votes', // [!code ++]
			query: { // [!code ++]
				aggregate: { count: 'choice' }, // [!code ++]
				groupBy: ['choice'], // [!code ++]
			}, // [!code ++]
		}) // [!code ++]
}
```

The `query` groups all items by their `choice` value, and are then counted by the aggregation. The result is a payload
that shows how many of each choice exist in the collection.

A message is sent over the connection when a connection is initialized with data from the existing collection. Use this
data to edit the chart’s dataset and update it:

```js
if (data.type == 'subscription' && data.event == 'init') {
	for (const item of data.data) { // [!code ++]
		chart.data.labels.push(item.choice); // [!code ++]
		chart.data.datasets[0].data.push(item.count.choice); // [!code ++]
	} // [!code ++]
// [!code ++]
	chart.update(); // [!code ++]
}
```

Refresh the page, and you should see the chart update with the initial values.

![A pie chart with two segments - one labeled cats and the other dogs.](https://cdn.directus.io/docs/v9/guides/websockets/poll-pie-chart.webp)

### Update Chart With New Votes

When a new vote is cast, update the chart’s dataset and update it:

```js
if (data.type == 'subscription' && data.event == 'create') {
	const vote = data.data[0]; // [!code ++]
	const itemToUpdate = chart.data.labels.indexOf(vote.choice); // [!code ++]
// [!code ++]
	if (itemToUpdate !== -1) { // [!code ++]
		chart.data.datasets[0].data[itemToUpdate]++; // [!code ++]
	} else { // [!code ++]
		chart.data.labels.push(vote.choice); // [!code ++]
		chart.data.datasets[0].data.push(1); // [!code ++]
	} // [!code ++]
// [!code ++]
	chart.update(); // [!code ++]
}
```

This code finds which index position the choice is in, increases it by 1, and updates the chart.

Open both `vote.html` and `results.html` in your browser. Make a vote and see the chart update.

## Next Steps

There are many ways to improve the project built in this guide:

1. Accept more data - such as voter name or contact details.
2. Dynamically generate the vote form based on the field options.
3. Disallow multiple votes by storing completion states.
4. Create other chart types.

## Full Code Sample

### `vote.html`

```html
<!DOCTYPE html>
<html>
	<body>
		<div id="options">
			<button id="cat">Cats</button>
			<button id="dog">Dogs</button>
		</div>
		<p></p>
		<script>
			const directusUrl = 'https://your-directus-url';
			document.querySelector('#cat').addEventListener('click', vote('cats'));
			document.querySelector('#dog').addEventListener('click', vote('dogs'));

			async function vote(choice) {
				await fetch(`${directusUrl}/items/votes`, {
					method: 'POST',
					body: JSON.stringify({ choice }),
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
		</script>
	</body>
</html>
```

### `results.html`

```html
<!DOCTYPE html>
<html>
  <body>
    <div style="display: flex; justify-content: center; height: 80vh">
      <canvas id="chart"></canvas>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script type="module">
      import {
        createDirectus,
        realtime,
        authentication,
        staticToken,
      } from 'https://www.unpkg.com/@directus/sdk/dist/index.js';

      const url = 'https://your-directus-url/';
      const access_token = 'your-access-token';

      const client = createDirectus(url)
        .with(staticToken(access_token))
        .with(realtime());

      client.connect();

      client.onWebSocket('open', function () {
        console.log({ event: 'onopen' });
      });

      client.onWebSocket('message', function (data) {
        if (data.type == 'auth' && data.status == 'ok') {
          client.sendMessage({
            type: 'subscribe',
            collection: 'votes',
            query: {
              aggregate: { count: 'choice' },
              groupBy: ['choice'],
            },
          });
        }

        if (data.type == 'subscription' && data.event == 'init') {
          for (const item of data.data) {
            chart.data.labels.push(item.choice);
            chart.data.datasets[0].data.push(item.count.choice);
          }

          chart.update();
        }

        if (data.type == 'subscription' && data.event == 'create') {
          const vote = data.data[0];
          const itemToUpdate = chart.data.labels.indexOf(vote.choice);

          if (itemToUpdate !== -1) {
            chart.data.datasets[0].data[itemToUpdate]++;
          } else {
            chart.data.labels.push(vote.choice);
            chart.data.datasets[0].data.push(1);
          }

          chart.update();
        }
      });

      const ctx = document.getElementById('chart');

      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: [],
          datasets: [
            {
              label: '# of Votes',
              data: [],
              backgroundColor: ['#4f46e5', '#f472b6'],
            },
          ],
        },
      });
    </script>
  </body>
</html>
```
