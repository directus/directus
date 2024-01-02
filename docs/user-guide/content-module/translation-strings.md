---
description:
  Translation Strings are multilingual key-value pairs that you can use throughout the app. They enable you to translate
  things like dropdown options, placeholder text, field notes, and more.
readTime: 3 min read
---

# Translation Strings

> Translation Strings are multilingual key-value pairs that you can use throughout the app. They enable you to translate
> things like dropdown options, placeholder text, field notes, and more.

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/configuration/translation-strings/translation-strings-20220615A/translation-strings-20220615A.mp4" type="video/mp4" />
</video>

## Create a Translation String

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/configuration/translation-strings/translation-strings-20220616A/create-and-manage-a-trasnlation-string-20220616A.mp4" type="video/mp4" />
</video>

To create a Translation String, follow these steps.

1. Navigate to **Settings > Translation Strings**.
2. Click <span mi btn>add</span> in the page header and a drawer will open.
3. Add a key and click **"Create New"** and another drawer will open.
4. Select the language and type in the corresponding translation.
5. Click <span mi btn>check</span> to confirm and add the translation.
6. Repeat steps 3-5 as desired.
7. Optional: Click <span mi icon>close</span> to delete a translation.
8. Click <span mi btn>check</span> to confirm and save the Translation Strings.

## Use a Translation String

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/configuration/translation-strings/translation-strings-20220616A/assign-and-remove-translation-string-20220616A.mp4" type="video/mp4" />
</video>

Throughout the Settings Module, you will notice certain input fields have a <span mi icon>translate</span> icon on them.
While can always type static text into these input fields, this <span mi icon>translate</span> icon indicates that you
have the option assign a Translation String. To assign a Translation String, follow these steps.

1. Navigate to the input that you'd like to add a Translation String to.
2. There are two ways to assign a Translation String:
   - Click <span mi icon>translate</span> and a dropdown menu with all Translation Strings will appear.
   - Type `$t:translation-string-key` and hit enter.
3. Choose a Translation String key as desired.
4. Optional: Click to remove the Translation String.
5. Click <span mi btn>check</span> to confirm.

Your Translation String is set! Now the language-appropriate text will be shown based on the current language of the
app. There are two ways to change the app language. First, administrators can set the Project's
[default language](/user-guide/settings/project-settings#general). Second, Users can choose their own personal
[language preference](/user-guide/user-management/user-directory#user-preferences). Also note that if a language is
chosen for which there is no Translation String, the translation key _(from step three)_ will be displayed instead.

::: tip <span mi icon prmry>add</span> New Translation String

You can also click <span mi icon prmry>add</span> **New Translation String** in the <span mi icon>translate</span>
dropdown menu to create a new Translation String on the fly.

:::
