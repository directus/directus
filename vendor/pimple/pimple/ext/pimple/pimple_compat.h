
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

#ifndef PIMPLE_COMPAT_H_
#define PIMPLE_COMPAT_H_

#include "Zend/zend_extensions.h" /* for ZEND_EXTENSION_API_NO */

#define PHP_5_0_X_API_NO		220040412
#define PHP_5_1_X_API_NO		220051025
#define PHP_5_2_X_API_NO		220060519
#define PHP_5_3_X_API_NO		220090626
#define PHP_5_4_X_API_NO		220100525
#define PHP_5_5_X_API_NO		220121212
#define PHP_5_6_X_API_NO		220131226

#define IS_PHP_56 ZEND_EXTENSION_API_NO == PHP_5_6_X_API_NO
#define IS_AT_LEAST_PHP_56 ZEND_EXTENSION_API_NO >= PHP_5_6_X_API_NO

#define IS_PHP_55 ZEND_EXTENSION_API_NO == PHP_5_5_X_API_NO
#define IS_AT_LEAST_PHP_55 ZEND_EXTENSION_API_NO >= PHP_5_5_X_API_NO

#define IS_PHP_54 ZEND_EXTENSION_API_NO == PHP_5_4_X_API_NO
#define IS_AT_LEAST_PHP_54 ZEND_EXTENSION_API_NO >= PHP_5_4_X_API_NO

#define IS_PHP_53 ZEND_EXTENSION_API_NO == PHP_5_3_X_API_NO
#define IS_AT_LEAST_PHP_53 ZEND_EXTENSION_API_NO >= PHP_5_3_X_API_NO

#if IS_PHP_53
#define object_properties_init(obj, ce) do { \
		 zend_hash_copy(obj->properties, &ce->default_properties, zval_copy_property_ctor(ce), NULL, sizeof(zval *)); \
		} while (0);
#endif

#define ZEND_OBJ_INIT(obj, ce) do { \
		zend_object_std_init(obj, ce TSRMLS_CC); \
		object_properties_init((obj), (ce)); \
	} while(0);

#if IS_PHP_53 || IS_PHP_54
static void zend_hash_get_current_key_zval_ex(const HashTable *ht, zval *key, HashPosition *pos) {
    Bucket *p;

    p = pos ? (*pos) : ht->pInternalPointer;

    if (!p) {
        Z_TYPE_P(key) = IS_NULL;
    } else if (p->nKeyLength) {
        Z_TYPE_P(key) = IS_STRING;
        Z_STRVAL_P(key) = estrndup(p->arKey, p->nKeyLength - 1);
        Z_STRLEN_P(key) = p->nKeyLength - 1;
    } else {
        Z_TYPE_P(key) = IS_LONG;
        Z_LVAL_P(key) = p->h;
    }
}
#endif

#endif /* PIMPLE_COMPAT_H_ */
