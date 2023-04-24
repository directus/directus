# Build a Multi-User Chat With React.js

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticates users
with an existing account, shows historical messages stored in Directus, allows users to send new messages, and
immediately updates all connected chats.

## Before You Start

### Set Up Your Directus Project

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud).

Create a new collection called `Messages`, with `date_created` and `user_created` fields enabled in the _Optional System
Fields_ pane on collection creation. Create a text field called `text`.

Create a new Role called `Users`. Give Create and Read access to the `Messages` collection, and Read access to the
`Directus Users` system collection. Now, create a new user with this role and take note of the password you set.

### Create a React.js Boilerplate

```js
function App() {
	return (
		<div className="App">
			<form>
				<label htmlFor="email">Email</label>
				<input type="email" id="email" />
				<label htmlFor="password">Password</label>
				<input type="password" id="password" />
				<button type="submit">Submit</button>
			</form>

			<ol></ol>

			<form>
				<label htmlFor="message">Message</label>
				<input type="text" id="message" />
				<button type="submit">Submit</button>
			</form>
		</div>
	);
}
```

The first form will handle user login, the second will handle new message submissions while the empty `<ol>` will be
populated with messages we will create shortly.

### Initialize Connection

Create a `url` variable and be sure to replace `your-directus-url` with your project’s URL:

```js
const url = 'wss://your-directus-url/websocket';
```

Now, create a variable called `connectionRef` that has an initial null value. The `connectionRef` will later contain a
WebSocket instance.

```js
const connectionRef = useRef(null);
```

## Set Up Form Submission Methods

Create the methods for form submissions:

```js
const loginSubmit = () => {
	//do something here
};

const messageSubmit = () => {
	//do something here
};
```

Ensure to call the `event.preventDefault()` in these methods to prevent the browser from refreshing the page upon
submission of the form.

```js
const loginSubmit = (event) => {
	event.preventDefault(); // [!code ++]
};

const messageSubmit = (event) => {
	event.preventDefault(); // [!code ++]
};
```

## Establish WebSocket Connection

First, create a piece of state to hold the `email` and `password` values of the login form:

```js
const [formValue, setFormValue] = useState({ email: '', password: '' });
```

Set up a `handleLoginChange` method that updates the value of the login input field as the user types.

```js
const handleLoginChange = (event) => {
	setFormValue({ ...formValue, [event.target.name]: event.target.value });
};
```

Then, connect these values to the form input fields:

```js
<form onSubmit={loginSubmit}>
	<label htmlFor="email">Email</label>
	<input type="email" id="email" /> // [!code --]
	<input type="email" id="email" name="email" value={formValue.email} onChange={handleLoginChange} /> // [!code ++]
	<label htmlFor="password">Password</label>
	<input type="password" id="password" /> // [!code --]
	<input type="password" id="password" name="password" value={formValue.password} onChange={handleLoginChange} /> // [!code
	++]
	<button type="submit">Submit</button>
</form>
```

Within the `loginSubmit` method, create a new WebSocket, which will immediately attempt connection:

```js
const loginSubmit = (event) => {
	connectionRef.current = new WebSocket(url); // [!code ++]
};
```

On connection, you must [send an authentication message before the timeout](/guides/real-time/authentication). Add an
event handler for the connection's `open` event:

```js
const loginSubmit = (event) => {
	connectionRef.current = new WebSocket(url);
	connectionRef.current.onopen = () => authenticate(formValue); // [!code ++]
};
```

Then, create a new `authenticate` method:

```js
const authenticate = (opts) => {
	const { email, password } = opts;
	connectionRef.current.send(JSON.stringify({ type: 'auth', email, password }));
};
```
