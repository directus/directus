# Translation Strings

> Translation strings allow translations of information that describes your Collection Fields. When creating a Field,
> you may want to add a note or other description along with it. Translation strings let you standardize this
> description across multiple languages.

<!-- :::tip Before You Begin

::: -->

<!--
:::tip Additional Resources

You can also translate [Collection Content]() and [Field Names]().

:::
-->

## How It Works

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/configuration/translation-strings/translation-strings-20220615A/translation-strings-20220615A.mp4" type="video/mp4" />
</video>

When configuring Fields as well as Presets and Bookmarks, you may wish to add additional notes or descriptions to
clarify their purpose or context.

**Create and Manage Translation Strings**\

1. Navigate to **Settings > Translation Strings**.
2. Click <span mi btn>add</span> in the page header and a side menu will appear.
3. Add a key and click **"Create New"**. Another side menu will appear.
4. Select the language and add the corresponding translation.
5. Click <span mi btn>check</span> to confirm and add the translation.
6. Repeat steps 3-5 as desired.
7. Optional:
   - Click and drag <span mi icon>drag_handle</span> to reposition a translation.
   - Click <span mi icon>close</span> to delete a translation.
8. Click <span mi btn>check</span> to save the translation(s).
9. Optional: Delete Translation String\
   Click the translation string to open the side menu, click <span mi btn dngr>delete</span>, then click **Delete**.

Now you can add it to Translation String Inputs in the **Settings Module**, noted with <span mi icon>translate</span> on
them.

**Assign a Translation String**\

1. Navigate to the desired Translation String Input within Settings.\
2. Click <span mi icon>translate</span> and a dropdown menu with all Translation Strings will appear.
3. Select the Translation String as desired and click <span mi btn>check</span> to confirm.

Now your translation string is set! Whenever the app's language is set, the corresponding translation string will be
displayed. Also note that if a language is chosen for which there is no Translation String, the translation key _(from
step three)_ will be displayed instead. There are two locations where the language could be set. First, you can set the
Project's default language under **Settings > Project Settings**. Second, Users can choose their own
[language preference](/app/user-directory/#user-preferences) from the user details page.
