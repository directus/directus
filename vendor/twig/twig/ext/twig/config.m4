dnl config.m4 for extension twig

PHP_ARG_ENABLE(twig, whether to enable twig support,
[  --enable-twig           Enable twig support])

if test "$PHP_TWIG" != "no"; then
  PHP_NEW_EXTENSION(twig, twig.c, $ext_shared)
fi
