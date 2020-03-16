dnl $Id$
dnl config.m4 for extension pimple

dnl Comments in this file start with the string 'dnl'.
dnl Remove where necessary. This file will not work
dnl without editing.

dnl If your extension references something external, use with:

dnl PHP_ARG_WITH(pimple, for pimple support,
dnl Make sure that the comment is aligned:
dnl [  --with-pimple             Include pimple support])

dnl Otherwise use enable:

PHP_ARG_ENABLE(pimple, whether to enable pimple support,
dnl Make sure that the comment is aligned:
[  --enable-pimple           Enable pimple support])

if test "$PHP_PIMPLE" != "no"; then
  dnl Write more examples of tests here...

  dnl # --with-pimple -> check with-path
  dnl SEARCH_PATH="/usr/local /usr"     # you might want to change this
  dnl SEARCH_FOR="/include/pimple.h"  # you most likely want to change this
  dnl if test -r $PHP_PIMPLE/$SEARCH_FOR; then # path given as parameter
  dnl   PIMPLE_DIR=$PHP_PIMPLE
  dnl else # search default path list
  dnl   AC_MSG_CHECKING([for pimple files in default path])
  dnl   for i in $SEARCH_PATH ; do
  dnl     if test -r $i/$SEARCH_FOR; then
  dnl       PIMPLE_DIR=$i
  dnl       AC_MSG_RESULT(found in $i)
  dnl     fi
  dnl   done
  dnl fi
  dnl
  dnl if test -z "$PIMPLE_DIR"; then
  dnl   AC_MSG_RESULT([not found])
  dnl   AC_MSG_ERROR([Please reinstall the pimple distribution])
  dnl fi

  dnl # --with-pimple -> add include path
  dnl PHP_ADD_INCLUDE($PIMPLE_DIR/include)

  dnl # --with-pimple -> check for lib and symbol presence
  dnl LIBNAME=pimple # you may want to change this
  dnl LIBSYMBOL=pimple # you most likely want to change this

  dnl PHP_CHECK_LIBRARY($LIBNAME,$LIBSYMBOL,
  dnl [
  dnl   PHP_ADD_LIBRARY_WITH_PATH($LIBNAME, $PIMPLE_DIR/lib, PIMPLE_SHARED_LIBADD)
  dnl   AC_DEFINE(HAVE_PIMPLELIB,1,[ ])
  dnl ],[
  dnl   AC_MSG_ERROR([wrong pimple lib version or lib not found])
  dnl ],[
  dnl   -L$PIMPLE_DIR/lib -lm
  dnl ])
  dnl
  dnl PHP_SUBST(PIMPLE_SHARED_LIBADD)

  PHP_NEW_EXTENSION(pimple, pimple.c, $ext_shared)
fi
