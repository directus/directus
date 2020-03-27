# Menu

Renders a dropdown menu. Can be attached to an activator element or free floating.

## Usage

Can be used with an activator in the corresponding slot:

```html
<v-menu>
    <template v-slot:activator>
        <v-button>Click me</v-button>
    </template>
    <v-list>
        <v-list-item v-for="i in [1, 2, 3]" @click="() => {}">
            Item 1
        </v-list-item>
    </v-list>
</v-menu>
```

Or without using the activator slot and using absolute positioning:

```vue
<template>
    <img @click="show" />
    <v-menu :value="showMenu":positionX="pos.x" :positionY="pos.y" :absolute="true">
        <v-list>
            <v-list-item v-for="i in [1, 2, 3]" key="i" @click="() => {}">
                Item 1
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    setup(_, { root }) {
        const showMenu = ref(false);
        const pos = reactive({ x: 0, y: 0 });
        function show(e: MouseEvent) {
            e.preventDefault();
            if (showMenu.value === false) {
                const { x, y } = toRefs(pos);
                x.value = e.clientX;
                y.value = e.clientY;
            }
            root.$nextTick(() => {
                showMenu.value = !showMenu.value;
            });
        }
        return { show, pos, showMenu };
    }
},
</script>
```

## Props

Strap in

### Positioning

| Prop        | Description                                                                  | Default     |
| ----------- | ---------------------------------------------------------------------------- | ----------- |
| `absolute`  | Applies absolute positioning to the menu                                     | `false`     |
| `fixed`     | Applies the fixed attribute to the menu                                      | `false`     |
| `auto`      | Centers the menu, if possible                                                | `false`     |
| `top`       | Aligns the menu to the top of the activator, going up (if possible)          | `false`     |
| `bottom`    | Aligns the menu to the bottom of the activator, going down (if possible)     | `false`     |
| `left`      | Aligns the menu to the left of the activator, expanding left (if possible)   | `false`     |
| `right`     | Aligns the menu to the right of the activator, expanding right (if possible) | `false`     |
| `offsetX`   | Positions the menu along the X-Axis so as not to cover any of the activator  | `false`     |
| `offsetY`   | Positions the menu along the Y-Axis so as not to cover any of the activator  | `false`     |
| `positionX` | "left" css value of menu. Only works with `absolute` or `fixed`              | `undefined` |
| `positionY` | "top" css value of menu. Only works with `absolute` or `fixed`               | `undefined` |

### Behavior

| Prop                  | Description                                               | Default |
| --------------------- | --------------------------------------------------------- | ------- |
| `closeOnClick`        | Closes the menu when user clicks somewhere else           | `true`  |
| `closeOnContentClick` | Closes the menu when user clicks on a menu item           | `false` |
| `openOnClick`         | Open the menu when activator is clicked                   | `true`  |
| `openOnHover`         | Open the menu when activator is hovered over              | `false` |
| `openDelay`           | Delay in milliseconds after hover enter for menu to open  | `0`     |
| `closeDelay`          | Delay in milliseconds after hover leave for menu to close | `0`     |

### Control

| Prop       | Description                        | Default     |
| ---------- | ---------------------------------- | ----------- |
| `value`    | Value to control menu active state | `undefined` |
| `disabled` | Menu does not appear               | `false`     |

### NOTES

1. You do not have to set a click listener or attach a value when using the activator slot. `v-menu` automatically wraps the activator and listens for a click on the wrapper, and models that value to the menu content's internal active state.
2. All positioning props are dependent on whether there is room (without causing page overflow) for the menu to follow them. If there is not, it will compensate so that it remains entirely on screen.
3. Default behavior is to align to the bottom and to the right. Therefore if both `bottom` and `top` and set, `top` takes precedent, and with `left` and `right` set, `left` takes precedent. `Auto` takes precedent over all of these.

## Slots

| Slot      | Description                                                                         | Data |
| --------- | ----------------------------------------------------------------------------------- | ---- |
| _default_ | Menu content                                                                        |      |
| activator | Activator element. Attaches click and mouse enter/leave handlers on wrapper element |      |
