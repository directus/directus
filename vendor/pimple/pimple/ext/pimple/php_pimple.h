
/*
 * This file is part of Pimple.
 *
 * Copyright (c) 2014 Fabien Potencier
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

#ifndef PHP_PIMPLE_H
#define PHP_PIMPLE_H

extern zend_module_entry pimple_module_entry;
#define phpext_pimple_ptr &pimple_module_entry

#ifdef PHP_WIN32
#	define PHP_PIMPLE_API __declspec(dllexport)
#elif defined(__GNUC__) && __GNUC__ >= 4
#	define PHP_PIMPLE_API __attribute__ ((visibility("default")))
#else
#	define PHP_PIMPLE_API
#endif

#ifdef ZTS
#include "TSRM.h"
#endif

#define PIMPLE_VERSION "3.2.3-DEV"

#define PIMPLE_NS "Pimple"
#define PSR_CONTAINER_NS "Psr\\Container"
#define PIMPLE_EXCEPTION_NS "Pimple\\Exception"

#define PIMPLE_DEFAULT_ZVAL_CACHE_NUM   5
#define PIMPLE_DEFAULT_ZVAL_VALUES_NUM 10

#define PIMPLE_DEPRECATE do { \
	int er = EG(error_reporting); \
	EG(error_reporting) = 0;\
	php_error(E_DEPRECATED, "The Pimple C extension is deprecated since version 3.1 and will be removed in 4.0."); \
	EG(error_reporting) = er; \
} while (0);

zend_module_entry *get_module(void);

PHP_MINIT_FUNCTION(pimple);
PHP_MINFO_FUNCTION(pimple);

PHP_METHOD(FrozenServiceException, __construct);
PHP_METHOD(InvalidServiceIdentifierException, __construct);
PHP_METHOD(UnknownIdentifierException, __construct);

PHP_METHOD(Pimple, __construct);
PHP_METHOD(Pimple, factory);
PHP_METHOD(Pimple, protect);
PHP_METHOD(Pimple, raw);
PHP_METHOD(Pimple, extend);
PHP_METHOD(Pimple, keys);
PHP_METHOD(Pimple, register);
PHP_METHOD(Pimple, offsetSet);
PHP_METHOD(Pimple, offsetUnset);
PHP_METHOD(Pimple, offsetGet);
PHP_METHOD(Pimple, offsetExists);

PHP_METHOD(PimpleClosure, invoker);

typedef struct _pimple_bucket_value {
	zval *value; /* Must be the first element */
	zval *raw;
	zend_object_handle handle_num;
	enum {
		PIMPLE_IS_PARAM   = 0,
		PIMPLE_IS_SERVICE = 2
	} type;
	zend_bool initialized;
	zend_fcall_info_cache fcc;
} pimple_bucket_value;

typedef struct _pimple_object {
	zend_object zobj;
	HashTable values;
	HashTable factories;
	HashTable protected;
} pimple_object;

typedef struct _pimple_closure_object {
	zend_object zobj;
	zval *callable;
	zval *factory;
} pimple_closure_object;

static const char sensiolabs_logo[] = "<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHYAAAAUCAMAAABvRTlyAAAAz1BMVEUAAAAAAAAAAAAsThWB5j4AAACD6T8AAACC6D+C6D6C6D+C6D4AAAAAAACC6D4AAAAAAACC6D8AAAAAAAAAAAAAAAAAAAAAAACC6D4AAAAAAAAAAACC6D4AAAAAAAAAAAAAAAAAAAAAAACC6D8AAACC6D4AAAAAAAAAAAAAAAAAAACC6D8AAACC6D6C6D+B6D+C6D+C6D+C6D8AAACC6D6C6D4AAACC6D/K/2KC6D+B6D6C6D6C6D+C6D8sTxUyWRhEeiEAAACC6D+C5z6B6D7drnEVAAAAQXRSTlMAE3oCNSUuDHFHzxaF9UFsu+irX+zlKzYimaJXktyOSFD6BolxqT7QGMMdarMIpuO28r9EolXKgR16OphfXYd4V14GtB4AAAMpSURBVEjHvVSJctowEF1jjME2RziMwUCoMfd9heZqG4n//6buLpJjkmYm03byZmxJa2nf6u2uQcG2bfhqRN4LoTKBzyGDm68M7mAwcOEdjo4zhA/Rf9Go/CVtTgiRhXfIC3EDH8F/eUX1/9KexRo+QgOdtHDsEe/sM7QT32/+K61Z1LFXcXJxN4pTbu1aTQUzuy2PIA0rDo0/0Aa5XFaJvKaVTrubywXvaa1Wq4Vu/Snr3Y7Aojh4VccwykW2N2oQ8wmjyut6+Q1t5ywIG5Npj1sh5E0B7YOzFDjfuRfaOh3O+MbbVNfTWS9COZk3Obd2su5d0a6IU9KLREbw8gEehWSr1r2sPWciXLG38r5NdW0xu9eioU87omjC9yNaMi5GNf6WppVSOqXCFkmCvMB3p9SROLoYQn5pDgQOujA1xjYvqH+plUdkwnmII8VxR/PKYkrfLLomhVlE3b/LhNbNr7hp0H2JaOc4v8dFB58HSsFTSafaqtY1sT3GO8wsy5rhokYPlRJdjPMajyYqTt1EHF/2uqSWQWmAjCUSmQ1MS3g8Btf1XOsy7YIC0CB1b5Xw1Vhba0zbxiCAQLH9TNPmHJXQUtJAN0KcDsoqLxsNvJrJExa7mKIdp2lRE2WexiS4pqWk/0jROlw6K6bV9YOBDGAuqMJ0bnuUKGB0L27bxgRhGEbzihbhxxXaQC88Vkwq8ldCi86RApWUb0Q+4VDosBCc+1s81lUdnBavH4Zp2mm3O44USwOfvSo9oBiwpFg71lMS1VKJLKljS3j9p+fOTvXXlsSNuEv6YPaZda9uRope0VJfKdo7fPiYfSmvFjXQbkhY0d9hCbBWIktRgEDieDhf1N3wbbkmNNgRy8hyl620yGQat/grV3HMpc2HDKTVmOPFz6ylPCKt/nXcAyV260jaAowwIW0YuBzrOgb/KrddZS9OmJaLgpWK4JX2DDuklcLZSDGcn8Vmx9YDNvT6UsjyBApRyFQVX7Vxm9TGxE16nmfRd8/zQoDmggQOTRh5Hv8pMt9Q/L2JmSwkMCE7dA4BuDjHJwfu0Om4QAhOjrN5XkIatglfiN/bUPdCQFjTYgAAAABJRU5ErkJggg==\">";

static void pimple_exception_call_parent_constructor(zval *this_ptr, const char *format, const char *arg1 TSRMLS_DC);

static int pimple_zval_to_pimpleval(zval *_zval, pimple_bucket_value *_pimple_bucket_value TSRMLS_DC);
static int pimple_zval_is_valid_callback(zval *_zval, pimple_bucket_value *_pimple_bucket_value TSRMLS_DC);

static void pimple_bucket_dtor(pimple_bucket_value *bucket);
static void pimple_free_bucket(pimple_bucket_value *bucket);

static zval *pimple_object_read_dimension(zval *object, zval *offset, int type TSRMLS_DC);
static void pimple_object_write_dimension(zval *object, zval *offset, zval *value TSRMLS_DC);
static int pimple_object_has_dimension(zval *object, zval *offset, int check_empty TSRMLS_DC);
static void pimple_object_unset_dimension(zval *object, zval *offset TSRMLS_DC);
static zend_object_value pimple_object_create(zend_class_entry *ce TSRMLS_DC);
static void pimple_free_object_storage(pimple_object *obj TSRMLS_DC);

static void pimple_closure_free_object_storage(pimple_closure_object *obj TSRMLS_DC);
static zend_object_value pimple_closure_object_create(zend_class_entry *ce TSRMLS_DC);
static zend_function *pimple_closure_get_constructor(zval * TSRMLS_DC);
static int pimple_closure_get_closure(zval *obj, zend_class_entry **ce_ptr, union _zend_function **fptr_ptr, zval **zobj_ptr TSRMLS_DC);

#ifdef ZTS
#define PIMPLE_G(v) TSRMG(pimple_globals_id, zend_pimple_globals *, v)
#else
#define PIMPLE_G(v) (pimple_globals.v)
#endif

#endif	/* PHP_PIMPLE_H */

