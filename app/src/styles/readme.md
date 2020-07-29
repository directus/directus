# Styles

The global styles of the application. Even though everything is based around scoped styles in the
components, there's still a need to have a certain set of global styles. Most importantly the global
reset ([_base.scss](./_base.scss)) and CSS Custom Properties (variables).

There are a couple of third party plugins (codemirror / TinyMCE etc) that expect their styles to be
global. This folder can be used for that as well.
