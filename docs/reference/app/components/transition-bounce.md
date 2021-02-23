# Transition Bounce

Bounces items in or out depending if the get added or removed from the view.

```html
<transition-bounce>
	<div v-for="item in [{id: 1, name: 'Paris'}, {id: 2, name: 'NewYork'}, {id: 3, name: 'Berlin'}]" :key="item.id">
		{{item.name}}
	</div>
</transition-bounce>
```

## Slots

| Slot      | Description                               | Data |
| --------- | ----------------------------------------- | ---- |
| _default_ | The items that should get animated in/out |      |
