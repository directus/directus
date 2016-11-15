/*
   +----------------------------------------------------------------------+
   | Twig Extension                                                       |
   +----------------------------------------------------------------------+
   | Copyright (c) 2011 Derick Rethans                                    |
   +----------------------------------------------------------------------+
   | Redistribution and use in source and binary forms, with or without   |
   | modification, are permitted provided that the conditions mentioned   |
   | in the accompanying LICENSE file are met (BSD-3-Clause).             |
   +----------------------------------------------------------------------+
   | Author: Derick Rethans <derick@derickrethans.nl>                     |
   +----------------------------------------------------------------------+
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "php.h"
#include "php_twig.h"
#include "ext/standard/php_var.h"
#include "ext/standard/php_string.h"
#include "ext/standard/php_smart_str.h"
#include "ext/spl/spl_exceptions.h"

#include "Zend/zend_object_handlers.h"
#include "Zend/zend_interfaces.h"
#include "Zend/zend_exceptions.h"

#ifndef Z_ADDREF_P
#define Z_ADDREF_P(pz)                (pz)->refcount++
#endif

#define FREE_DTOR(z) 	\
	zval_dtor(z); 		\
	efree(z);

#if PHP_VERSION_ID >= 50300
	#define APPLY_TSRMLS_DC TSRMLS_DC
	#define APPLY_TSRMLS_CC TSRMLS_CC
	#define APPLY_TSRMLS_FETCH()
#else
	#define APPLY_TSRMLS_DC
	#define APPLY_TSRMLS_CC
	#define APPLY_TSRMLS_FETCH() TSRMLS_FETCH()
#endif

ZEND_BEGIN_ARG_INFO_EX(twig_template_get_attribute_args, ZEND_SEND_BY_VAL, ZEND_RETURN_VALUE, 6)
	ZEND_ARG_INFO(0, template)
	ZEND_ARG_INFO(0, object)
	ZEND_ARG_INFO(0, item)
	ZEND_ARG_INFO(0, arguments)
	ZEND_ARG_INFO(0, type)
	ZEND_ARG_INFO(0, isDefinedTest)
ZEND_END_ARG_INFO()

#ifndef PHP_FE_END
#define PHP_FE_END { NULL, NULL, NULL}
#endif

static const zend_function_entry twig_functions[] = {
	PHP_FE(twig_template_get_attributes, twig_template_get_attribute_args)
	PHP_FE_END
};

PHP_RSHUTDOWN_FUNCTION(twig)
{
#if ZEND_DEBUG
	CG(unclean_shutdown) = 0; /* get rid of PHPUnit's exit() and report memleaks */
#endif
	return SUCCESS;
}

zend_module_entry twig_module_entry = {
	STANDARD_MODULE_HEADER,
	"twig",
	twig_functions,
	NULL,
	NULL,
	NULL,
	PHP_RSHUTDOWN(twig),
	NULL,
	PHP_TWIG_VERSION,
	STANDARD_MODULE_PROPERTIES
};


#ifdef COMPILE_DL_TWIG
ZEND_GET_MODULE(twig)
#endif

static int TWIG_ARRAY_KEY_EXISTS(zval *array, zval *key)
{
	if (Z_TYPE_P(array) != IS_ARRAY) {
		return 0;
	}

	switch (Z_TYPE_P(key)) {
		case IS_NULL:
			return zend_hash_exists(Z_ARRVAL_P(array), "", 1);

		case IS_BOOL:
		case IS_DOUBLE:
			convert_to_long(key);
		case IS_LONG:
			return zend_hash_index_exists(Z_ARRVAL_P(array), Z_LVAL_P(key));

		default:
			convert_to_string(key);
			return zend_symtable_exists(Z_ARRVAL_P(array), Z_STRVAL_P(key), Z_STRLEN_P(key) + 1);
	}
}

static int TWIG_INSTANCE_OF(zval *object, zend_class_entry *interface TSRMLS_DC)
{
	if (Z_TYPE_P(object) != IS_OBJECT) {
		return 0;
	}
	return instanceof_function(Z_OBJCE_P(object), interface TSRMLS_CC);
}

static int TWIG_INSTANCE_OF_USERLAND(zval *object, char *interface TSRMLS_DC)
{
	zend_class_entry **pce;
	if (Z_TYPE_P(object) != IS_OBJECT) {
		return 0;
	}
	if (zend_lookup_class(interface, strlen(interface), &pce TSRMLS_CC) == FAILURE) {
		return 0;
	}
	return instanceof_function(Z_OBJCE_P(object), *pce TSRMLS_CC);
}

static zval *TWIG_GET_ARRAYOBJECT_ELEMENT(zval *object, zval *offset TSRMLS_DC)
{
	zend_class_entry *ce = Z_OBJCE_P(object);
	zval *retval;

	if (Z_TYPE_P(object) == IS_OBJECT) {
		SEPARATE_ARG_IF_REF(offset);
		zend_call_method_with_1_params(&object, ce, NULL, "offsetget", &retval, offset);

		zval_ptr_dtor(&offset);

		if (!retval) {
			if (!EG(exception)) {
				zend_error(E_ERROR, "Undefined offset for object of type %s used as array.", ce->name);
			}
			return NULL;
		}

		return retval;
	}
	return NULL;
}

static int TWIG_ISSET_ARRAYOBJECT_ELEMENT(zval *object, zval *offset TSRMLS_DC)
{
	zend_class_entry *ce = Z_OBJCE_P(object);
	zval *retval;

	if (Z_TYPE_P(object) == IS_OBJECT) {
		SEPARATE_ARG_IF_REF(offset);
		zend_call_method_with_1_params(&object, ce, NULL, "offsetexists", &retval, offset);

		zval_ptr_dtor(&offset);

		if (!retval) {
			if (!EG(exception)) {
				zend_error(E_ERROR, "Undefined offset for object of type %s used as array.", ce->name);
			}
			return 0;
		}

		return (retval && Z_TYPE_P(retval) == IS_BOOL && Z_LVAL_P(retval));
	}
	return 0;
}

static char *TWIG_STRTOLOWER(const char *str, int str_len)
{
	char *item_dup;

	item_dup = estrndup(str, str_len);
	php_strtolower(item_dup, str_len);
	return item_dup;
}

static zval *TWIG_CALL_USER_FUNC_ARRAY(zval *object, char *function, zval *arguments TSRMLS_DC)
{
	zend_fcall_info fci;
	zval ***args = NULL;
	int arg_count = 0;
	HashTable *table;
	HashPosition pos;
	int i = 0;
	zval *retval_ptr;
	zval *zfunction;

	if (arguments) {
		table = HASH_OF(arguments);
		args = safe_emalloc(sizeof(zval **), table->nNumOfElements, 0);

		zend_hash_internal_pointer_reset_ex(table, &pos);

		while (zend_hash_get_current_data_ex(table, (void **)&args[i], &pos) == SUCCESS) {
			i++;
			zend_hash_move_forward_ex(table, &pos);
		}
		arg_count = table->nNumOfElements;
	}

	MAKE_STD_ZVAL(zfunction);
	ZVAL_STRING(zfunction, function, 1);
	fci.size = sizeof(fci);
	fci.function_table = EG(function_table);
	fci.function_name = zfunction;
	fci.symbol_table = NULL;
#if PHP_VERSION_ID >= 50300
	fci.object_ptr = object;
#else
	fci.object_pp = &object;
#endif
	fci.retval_ptr_ptr = &retval_ptr;
	fci.param_count = arg_count;
	fci.params = args;
	fci.no_separation = 0;

	if (zend_call_function(&fci, NULL TSRMLS_CC) == FAILURE) {
		ALLOC_INIT_ZVAL(retval_ptr);
		ZVAL_BOOL(retval_ptr, 0);
	}

	if (args) {
		efree(fci.params);
	}
	FREE_DTOR(zfunction);
	return retval_ptr;
}

static int TWIG_CALL_BOOLEAN(zval *object, char *functionName TSRMLS_DC)
{
	zval *ret;
	int   res;

	ret = TWIG_CALL_USER_FUNC_ARRAY(object, functionName, NULL TSRMLS_CC);
	res = Z_LVAL_P(ret);
	zval_ptr_dtor(&ret);
	return res;
}

static zval *TWIG_GET_STATIC_PROPERTY(zval *class, char *prop_name TSRMLS_DC)
{
	zval **tmp_zval;
	zend_class_entry *ce;

	if (class == NULL || Z_TYPE_P(class) != IS_OBJECT) {
		return NULL;
	}

	ce = zend_get_class_entry(class TSRMLS_CC);
#if PHP_VERSION_ID >= 50400
	tmp_zval = zend_std_get_static_property(ce, prop_name, strlen(prop_name), 0, NULL TSRMLS_CC);
#else
	tmp_zval = zend_std_get_static_property(ce, prop_name, strlen(prop_name), 0 TSRMLS_CC);
#endif
	return *tmp_zval;
}

static zval *TWIG_GET_ARRAY_ELEMENT_ZVAL(zval *class, zval *prop_name TSRMLS_DC)
{
	zval **tmp_zval;

	if (class == NULL || Z_TYPE_P(class) != IS_ARRAY) {
		if (class != NULL && Z_TYPE_P(class) == IS_OBJECT && TWIG_INSTANCE_OF(class, zend_ce_arrayaccess TSRMLS_CC)) {
			// array access object
			return TWIG_GET_ARRAYOBJECT_ELEMENT(class, prop_name TSRMLS_CC);
		}
		return NULL;
	}

	switch(Z_TYPE_P(prop_name)) {
		case IS_NULL:
			zend_hash_find(HASH_OF(class), "", 1, (void**) &tmp_zval);
			return *tmp_zval;

		case IS_BOOL:
		case IS_DOUBLE:
			convert_to_long(prop_name);
		case IS_LONG:
			zend_hash_index_find(HASH_OF(class), Z_LVAL_P(prop_name), (void **) &tmp_zval);
			return *tmp_zval;

		case IS_STRING:
			zend_symtable_find(HASH_OF(class), Z_STRVAL_P(prop_name), Z_STRLEN_P(prop_name) + 1, (void**) &tmp_zval);
			return *tmp_zval;
	}

	return NULL;
}

static zval *TWIG_GET_ARRAY_ELEMENT(zval *class, char *prop_name, int prop_name_length TSRMLS_DC)
{
	zval **tmp_zval;

	if (class == NULL/* || Z_TYPE_P(class) != IS_ARRAY*/) {
		return NULL;
	}

	if (class != NULL && Z_TYPE_P(class) == IS_OBJECT && TWIG_INSTANCE_OF(class, zend_ce_arrayaccess TSRMLS_CC)) {
		// array access object
		zval *tmp_name_zval;
		zval *tmp_ret_zval;

		ALLOC_INIT_ZVAL(tmp_name_zval);
		ZVAL_STRING(tmp_name_zval, prop_name, 1);
		tmp_ret_zval = TWIG_GET_ARRAYOBJECT_ELEMENT(class, tmp_name_zval TSRMLS_CC);
		FREE_DTOR(tmp_name_zval);
		return tmp_ret_zval;
	}

	if (zend_symtable_find(HASH_OF(class), prop_name, prop_name_length+1, (void**)&tmp_zval) == SUCCESS) {
		return *tmp_zval;
	}
	return NULL;
}

static zval *TWIG_PROPERTY(zval *object, zval *propname TSRMLS_DC)
{
	zval *tmp = NULL;

	if (Z_OBJ_HT_P(object)->read_property) {
#if PHP_VERSION_ID >= 50400
		tmp = Z_OBJ_HT_P(object)->read_property(object, propname, BP_VAR_IS, NULL TSRMLS_CC);
#else
		tmp = Z_OBJ_HT_P(object)->read_property(object, propname, BP_VAR_IS TSRMLS_CC);
#endif
		if (tmp == EG(uninitialized_zval_ptr)) {
		        ZVAL_NULL(tmp);
		}
	}
	return tmp;
}

static int TWIG_HAS_PROPERTY(zval *object, zval *propname TSRMLS_DC)
{
	if (Z_OBJ_HT_P(object)->has_property) {
#if PHP_VERSION_ID >= 50400
		return Z_OBJ_HT_P(object)->has_property(object, propname, 0, NULL TSRMLS_CC);
#else
		return Z_OBJ_HT_P(object)->has_property(object, propname, 0 TSRMLS_CC);
#endif
	}
	return 0;
}

static int TWIG_HAS_DYNAMIC_PROPERTY(zval *object, char *prop, int prop_len TSRMLS_DC)
{
	if (Z_OBJ_HT_P(object)->get_properties) {
		return zend_hash_quick_exists(
				Z_OBJ_HT_P(object)->get_properties(object TSRMLS_CC), // the properties hash
				prop,                                                 // property name
				prop_len + 1,                                         // property length
				zend_get_hash_value(prop, prop_len + 1)               // hash value
			);
	}
	return 0;
}

static zval *TWIG_PROPERTY_CHAR(zval *object, char *propname TSRMLS_DC)
{
	zval *tmp_name_zval, *tmp;

	ALLOC_INIT_ZVAL(tmp_name_zval);
	ZVAL_STRING(tmp_name_zval, propname, 1);
	tmp = TWIG_PROPERTY(object, tmp_name_zval TSRMLS_CC);
	FREE_DTOR(tmp_name_zval);
	return tmp;
}

static zval *TWIG_CALL_S(zval *object, char *method, char *arg0 TSRMLS_DC)
{
	zend_fcall_info fci;
	zval **args[1];
	zval *argument;
	zval *zfunction;
	zval *retval_ptr;

	MAKE_STD_ZVAL(argument);
	ZVAL_STRING(argument, arg0, 1);
	args[0] = &argument;

	MAKE_STD_ZVAL(zfunction);
	ZVAL_STRING(zfunction, method, 1);
	fci.size = sizeof(fci);
	fci.function_table = EG(function_table);
	fci.function_name = zfunction;
	fci.symbol_table = NULL;
#if PHP_VERSION_ID >= 50300
	fci.object_ptr = object;
#else
	fci.object_pp = &object;
#endif
	fci.retval_ptr_ptr = &retval_ptr;
	fci.param_count = 1;
	fci.params = args;
	fci.no_separation = 0;

	if (zend_call_function(&fci, NULL TSRMLS_CC) == FAILURE) {
		FREE_DTOR(zfunction);
		zval_ptr_dtor(&argument);
		return 0;
	}
	FREE_DTOR(zfunction);
	zval_ptr_dtor(&argument);
	return retval_ptr;
}

static int TWIG_CALL_SB(zval *object, char *method, char *arg0 TSRMLS_DC)
{
	zval *retval_ptr;
	int success;

	retval_ptr = TWIG_CALL_S(object, method, arg0 TSRMLS_CC);
	success = (retval_ptr && (Z_TYPE_P(retval_ptr) == IS_BOOL) && Z_LVAL_P(retval_ptr));

	if (retval_ptr) {
		zval_ptr_dtor(&retval_ptr);
	}

	return success;
}

static int TWIG_CALL_ZZ(zval *object, char *method, zval *arg1, zval *arg2 TSRMLS_DC)
{
	zend_fcall_info fci;
	zval **args[2];
	zval *zfunction;
	zval *retval_ptr;
	int   success;

	args[0] = &arg1;
	args[1] = &arg2;

	MAKE_STD_ZVAL(zfunction);
	ZVAL_STRING(zfunction, method, 1);
	fci.size = sizeof(fci);
	fci.function_table = EG(function_table);
	fci.function_name = zfunction;
	fci.symbol_table = NULL;
#if PHP_VERSION_ID >= 50300
	fci.object_ptr = object;
#else
	fci.object_pp = &object;
#endif
	fci.retval_ptr_ptr = &retval_ptr;
	fci.param_count = 2;
	fci.params = args;
	fci.no_separation = 0;

	if (zend_call_function(&fci, NULL TSRMLS_CC) == FAILURE) {
		FREE_DTOR(zfunction);
		return 0;
	}

	FREE_DTOR(zfunction);

	success = (retval_ptr && (Z_TYPE_P(retval_ptr) == IS_BOOL) && Z_LVAL_P(retval_ptr));
	if (retval_ptr) {
		zval_ptr_dtor(&retval_ptr);
	}

	return success;
}

#ifndef Z_SET_REFCOUNT_P
# define Z_SET_REFCOUNT_P(pz, rc)  pz->refcount = rc
# define Z_UNSET_ISREF_P(pz) pz->is_ref = 0
#endif

static void TWIG_NEW(zval *object, char *class, zval *arg0, zval *arg1 TSRMLS_DC)
{
	zend_class_entry **pce;

	if (zend_lookup_class(class, strlen(class), &pce TSRMLS_CC) == FAILURE) {
		return;
	}

	Z_TYPE_P(object) = IS_OBJECT;
	object_init_ex(object, *pce);
	Z_SET_REFCOUNT_P(object, 1);
	Z_UNSET_ISREF_P(object);

	TWIG_CALL_ZZ(object, "__construct", arg0, arg1 TSRMLS_CC);
}

static int twig_add_array_key_to_string(void *pDest APPLY_TSRMLS_DC, int num_args, va_list args, zend_hash_key *hash_key)
{
	smart_str *buf;
	char *joiner;
	APPLY_TSRMLS_FETCH();

	buf = va_arg(args, smart_str*);
	joiner = va_arg(args, char*);

	if (buf->len != 0) {
		smart_str_appends(buf, joiner);
	}

	if (hash_key->nKeyLength == 0) {
		smart_str_append_long(buf, (long) hash_key->h);
	} else {
		char *key, *tmp_str;
		int key_len, tmp_len;
		key = php_addcslashes(hash_key->arKey, hash_key->nKeyLength - 1, &key_len, 0, "'\\", 2 TSRMLS_CC);
		tmp_str = php_str_to_str_ex(key, key_len, "\0", 1, "' . \"\\0\" . '", 12, &tmp_len, 0, NULL);

		smart_str_appendl(buf, tmp_str, tmp_len);
		efree(key);
		efree(tmp_str);
	}

	return 0;
}

static char *TWIG_IMPLODE_ARRAY_KEYS(char *joiner, zval *array TSRMLS_DC)
{
	smart_str collector = { 0, 0, 0 };

	smart_str_appendl(&collector, "", 0);
	zend_hash_apply_with_arguments(HASH_OF(array) APPLY_TSRMLS_CC, twig_add_array_key_to_string, 2, &collector, joiner);
	smart_str_0(&collector);

	return collector.c;
}

static void TWIG_RUNTIME_ERROR(zval *template TSRMLS_DC, char *message, ...)
{
	char *buffer;
	va_list args;
	zend_class_entry **pce;
	zval *ex;
	zval *constructor;
	zval *zmessage;
	zval *lineno;
	zval *filename_func;
	zval *filename;
	zval *constructor_args[3];
	zval *constructor_retval;

	if (zend_lookup_class("Twig_Error_Runtime", strlen("Twig_Error_Runtime"), &pce TSRMLS_CC) == FAILURE) {
		return;
	}

	va_start(args, message);
	vspprintf(&buffer, 0, message, args);
	va_end(args);

	MAKE_STD_ZVAL(ex);
	object_init_ex(ex, *pce);

	// Call Twig_Error constructor
	MAKE_STD_ZVAL(constructor);
	MAKE_STD_ZVAL(zmessage);
	MAKE_STD_ZVAL(lineno);
	MAKE_STD_ZVAL(filename);
	MAKE_STD_ZVAL(filename_func);
	MAKE_STD_ZVAL(constructor_retval);

	ZVAL_STRINGL(constructor, "__construct", sizeof("__construct")-1, 1);
	ZVAL_STRING(zmessage, buffer, 1);
	ZVAL_LONG(lineno, -1);

	// Get template filename
	ZVAL_STRINGL(filename_func, "getTemplateName", sizeof("getTemplateName")-1, 1);
	call_user_function(EG(function_table), &template, filename_func, filename, 0, 0 TSRMLS_CC);

	constructor_args[0] = zmessage;
	constructor_args[1] = lineno;
	constructor_args[2] = filename;
	call_user_function(EG(function_table), &ex, constructor, constructor_retval, 3, constructor_args TSRMLS_CC);

	zval_ptr_dtor(&constructor_retval);
	zval_ptr_dtor(&zmessage);
	zval_ptr_dtor(&lineno);
	zval_ptr_dtor(&filename);
	FREE_DTOR(constructor);
	FREE_DTOR(filename_func);
	efree(buffer);

	zend_throw_exception_object(ex TSRMLS_CC);
}

static char *TWIG_GET_CLASS_NAME(zval *object TSRMLS_DC)
{
	char *class_name;
	zend_uint class_name_len;

	if (Z_TYPE_P(object) != IS_OBJECT) {
		return "";
	}
#if PHP_API_VERSION >= 20100412
	zend_get_object_classname(object, (const char **) &class_name, &class_name_len TSRMLS_CC);
#else
	zend_get_object_classname(object, &class_name, &class_name_len TSRMLS_CC);
#endif
	return class_name;
}

static int twig_add_method_to_class(void *pDest APPLY_TSRMLS_DC, int num_args, va_list args, zend_hash_key *hash_key)
{
	zend_class_entry *ce;
	zval *retval;
	char *item;
	size_t item_len;
	zend_function *mptr = (zend_function *) pDest;
	APPLY_TSRMLS_FETCH();

	if (!(mptr->common.fn_flags & ZEND_ACC_PUBLIC)) {
		return 0;
	}

	ce = *va_arg(args, zend_class_entry**);
	retval = va_arg(args, zval*);

	item_len = strlen(mptr->common.function_name);
	item = estrndup(mptr->common.function_name, item_len);
	php_strtolower(item, item_len);

	if (strcmp("getenvironment", item) == 0) {
		zend_class_entry **twig_template_ce;
		if (zend_lookup_class("Twig_Template", strlen("Twig_Template"), &twig_template_ce TSRMLS_CC) == FAILURE) {
			return 0;
		}
		if (instanceof_function(ce, *twig_template_ce TSRMLS_CC)) {
			return 0;
		}
	}

	add_assoc_stringl_ex(retval, item, item_len+1, item, item_len, 0);

	return 0;
}

static int twig_add_property_to_class(void *pDest APPLY_TSRMLS_DC, int num_args, va_list args, zend_hash_key *hash_key)
{
	zend_class_entry *ce;
	zval *retval;
	char *class_name, *prop_name;
	zend_property_info *pptr = (zend_property_info *) pDest;
	APPLY_TSRMLS_FETCH();

	if (!(pptr->flags & ZEND_ACC_PUBLIC) || (pptr->flags & ZEND_ACC_STATIC)) {
		return 0;
	}

	ce = *va_arg(args, zend_class_entry**);
	retval = va_arg(args, zval*);

#if PHP_API_VERSION >= 20100412
	zend_unmangle_property_name(pptr->name, pptr->name_length, (const char **) &class_name, (const char **) &prop_name);
#else
	zend_unmangle_property_name(pptr->name, pptr->name_length, &class_name, &prop_name);
#endif

	add_assoc_string(retval, prop_name, prop_name, 1);

	return 0;
}

static void twig_add_class_to_cache(zval *cache, zval *object, char *class_name TSRMLS_DC)
{
	zval *class_info, *class_methods, *class_properties;
	zend_class_entry *class_ce;

	class_ce = zend_get_class_entry(object TSRMLS_CC);

	ALLOC_INIT_ZVAL(class_info);
	ALLOC_INIT_ZVAL(class_methods);
	ALLOC_INIT_ZVAL(class_properties);
	array_init(class_info);
	array_init(class_methods);
	array_init(class_properties);
	// add all methods to self::cache[$class]['methods']
	zend_hash_apply_with_arguments(&class_ce->function_table APPLY_TSRMLS_CC, twig_add_method_to_class, 2, &class_ce, class_methods);
	zend_hash_apply_with_arguments(&class_ce->properties_info APPLY_TSRMLS_CC, twig_add_property_to_class, 2, &class_ce, class_properties);

	add_assoc_zval(class_info, "methods", class_methods);
	add_assoc_zval(class_info, "properties", class_properties);
	add_assoc_zval(cache, class_name, class_info);
}

/* {{{ proto mixed twig_template_get_attributes(TwigTemplate template, mixed object, mixed item, array arguments, string type, boolean isDefinedTest, boolean ignoreStrictCheck)
   A C implementation of TwigTemplate::getAttribute() */
PHP_FUNCTION(twig_template_get_attributes)
{
	zval *template;
	zval *object;
	char *item;
	int  item_len;
	zval *zitem, ztmpitem;
	zval *arguments = NULL;
	zval *ret = NULL;
	char *type = NULL;
	int   type_len = 0;
	zend_bool isDefinedTest = 0;
	zend_bool ignoreStrictCheck = 0;
	int free_ret = 0;
	zval *tmp_self_cache;
	char *class_name = NULL;
	zval *tmp_class;
	char *type_name;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "ozz|asbb", &template, &object, &zitem, &arguments, &type, &type_len, &isDefinedTest, &ignoreStrictCheck) == FAILURE) {
		return;
	}

	// convert the item to a string
	ztmpitem = *zitem;
	zval_copy_ctor(&ztmpitem);
	convert_to_string(&ztmpitem);
	item_len = Z_STRLEN(ztmpitem);
	item = estrndup(Z_STRVAL(ztmpitem), item_len);
	zval_dtor(&ztmpitem);

	if (!type) {
		type = "any";
	}

/*
	// array
	if (Twig_Template::METHOD_CALL !== $type) {
		$arrayItem = is_bool($item) || is_float($item) ? (int) $item : $item;

		if ((is_array($object) && array_key_exists($arrayItem, $object))
			|| ($object instanceof ArrayAccess && isset($object[$arrayItem]))
		) {
			if ($isDefinedTest) {
				return true;
			}

			return $object[$arrayItem];
		}
*/


	if (strcmp("method", type) != 0) {
		if ((TWIG_ARRAY_KEY_EXISTS(object, zitem))
			|| (TWIG_INSTANCE_OF(object, zend_ce_arrayaccess TSRMLS_CC) && TWIG_ISSET_ARRAYOBJECT_ELEMENT(object, zitem TSRMLS_CC))
		) {

			if (isDefinedTest) {
				efree(item);
				RETURN_TRUE;
			}

			ret = TWIG_GET_ARRAY_ELEMENT_ZVAL(object, zitem TSRMLS_CC);

			if (!ret) {
				ret = &EG(uninitialized_zval);
			}
			RETVAL_ZVAL(ret, 1, 0);
			if (free_ret) {
				zval_ptr_dtor(&ret);
			}
			efree(item);
			return;
		}
/*
		if (Twig_Template::ARRAY_CALL === $type) {
			if ($isDefinedTest) {
				return false;
			}
			if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
				return null;
			}
*/
		if (strcmp("array", type) == 0 || Z_TYPE_P(object) != IS_OBJECT) {
			if (isDefinedTest) {
				efree(item);
				RETURN_FALSE;
			}
			if (ignoreStrictCheck || !TWIG_CALL_BOOLEAN(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "isStrictVariables" TSRMLS_CC)) {
				efree(item);
				return;
			}
/*
			if ($object instanceof ArrayAccess) {
				$message = sprintf('Key "%s" in object with ArrayAccess of class "%s" does not exist', $arrayItem, get_class($object));
			} elseif (is_object($object)) {
				$message = sprintf('Impossible to access a key "%s" on an object of class "%s" that does not implement ArrayAccess interface', $item, get_class($object));
			} elseif (is_array($object)) {
				if (empty($object)) {
					$message = sprintf('Key "%s" does not exist as the array is empty', $arrayItem);
				} else {
					$message = sprintf('Key "%s" for array with keys "%s" does not exist', $arrayItem, implode(', ', array_keys($object)));
				}
			} elseif (Twig_Template::ARRAY_CALL === $type) {
				if (null === $object) {
					$message = sprintf('Impossible to access a key ("%s") on a null variable', $item);
				} else {
					$message = sprintf('Impossible to access a key ("%s") on a %s variable ("%s")', $item, gettype($object), $object);
				}
			} elseif (null === $object) {
				$message = sprintf('Impossible to access an attribute ("%s") on a null variable', $item);
			} else {
				$message = sprintf('Impossible to access an attribute ("%s") on a %s variable ("%s")', $item, gettype($object), $object);
			}
			throw new Twig_Error_Runtime($message, -1, $this->getTemplateName());
		}
	}
*/
			if (TWIG_INSTANCE_OF(object, zend_ce_arrayaccess TSRMLS_CC)) {
				TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Key \"%s\" in object with ArrayAccess of class \"%s\" does not exist.", item, TWIG_GET_CLASS_NAME(object TSRMLS_CC));
			} else if (Z_TYPE_P(object) == IS_OBJECT) {
				TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Impossible to access a key \"%s\" on an object of class \"%s\" that does not implement ArrayAccess interface.", item, TWIG_GET_CLASS_NAME(object TSRMLS_CC));
			} else if (Z_TYPE_P(object) == IS_ARRAY) {
				if (0 == zend_hash_num_elements(Z_ARRVAL_P(object))) {
					TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Key \"%s\" does not exist as the array is empty.", item);
				} else {
					char *array_keys = TWIG_IMPLODE_ARRAY_KEYS(", ", object TSRMLS_CC);
					TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Key \"%s\" for array with keys \"%s\" does not exist.", item, array_keys);
					efree(array_keys);
				}
			} else {
				char *type_name = zend_zval_type_name(object);
				Z_ADDREF_P(object);
				if (Z_TYPE_P(object) == IS_NULL) {
					convert_to_string(object);
					TWIG_RUNTIME_ERROR(template TSRMLS_CC,
						(strcmp("array", type) == 0)
							? "Impossible to access a key (\"%s\") on a %s variable."
							: "Impossible to access an attribute (\"%s\") on a %s variable.",
						item, type_name);
				} else {
					convert_to_string(object);
					TWIG_RUNTIME_ERROR(template TSRMLS_CC,
						(strcmp("array", type) == 0)
							? "Impossible to access a key (\"%s\") on a %s variable (\"%s\")."
							: "Impossible to access an attribute (\"%s\") on a %s variable (\"%s\").",
						item, type_name, Z_STRVAL_P(object));
				}
				zval_ptr_dtor(&object);
			}
			efree(item);
			return;
		}
	}

/*
	if (!is_object($object)) {
		if ($isDefinedTest) {
			return false;
		}
*/

	if (Z_TYPE_P(object) != IS_OBJECT) {
		if (isDefinedTest) {
			efree(item);
			RETURN_FALSE;
		}
/*
		if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
			return null;
		}

		if (null === $object) {
			$message = sprintf('Impossible to invoke a method ("%s") on a null variable', $item);
		} else {
			$message = sprintf('Impossible to invoke a method ("%s") on a %s variable ("%s")', $item, gettype($object), $object);
		}

		throw new Twig_Error_Runtime($message, -1, $this->getTemplateName());
	}
*/
		if (ignoreStrictCheck || !TWIG_CALL_BOOLEAN(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "isStrictVariables" TSRMLS_CC)) {
			efree(item);
			return;
		}

		type_name = zend_zval_type_name(object);
		Z_ADDREF_P(object);
		if (Z_TYPE_P(object) == IS_NULL) {
			convert_to_string_ex(&object);

			TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Impossible to invoke a method (\"%s\") on a %s variable.", item, type_name);
		} else {
			convert_to_string_ex(&object);

			TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Impossible to invoke a method (\"%s\") on a %s variable (\"%s\").", item, type_name, Z_STRVAL_P(object));
		}

		zval_ptr_dtor(&object);
		efree(item);
		return;
	}
/*
	$class = get_class($object);
*/

	class_name = TWIG_GET_CLASS_NAME(object TSRMLS_CC);
	tmp_self_cache = TWIG_GET_STATIC_PROPERTY(template, "cache" TSRMLS_CC);
	tmp_class = TWIG_GET_ARRAY_ELEMENT(tmp_self_cache, class_name, strlen(class_name) TSRMLS_CC);

	if (!tmp_class) {
		twig_add_class_to_cache(tmp_self_cache, object, class_name TSRMLS_CC);
		tmp_class = TWIG_GET_ARRAY_ELEMENT(tmp_self_cache, class_name, strlen(class_name) TSRMLS_CC);
	}
	efree(class_name);

/*
	// object property
	if (Twig_Template::METHOD_CALL !== $type && !$object instanceof Twig_Template) {
		if (isset($object->$item) || array_key_exists((string) $item, $object)) {
			if ($isDefinedTest) {
				return true;
			}

			if ($this->env->hasExtension('Twig_Extension_Sandbox')) {
				$this->env->getExtension('Twig_Extension_Sandbox')->checkPropertyAllowed($object, $item);
			}

			return $object->$item;
		}
	}
*/
	if (strcmp("method", type) != 0 && !TWIG_INSTANCE_OF_USERLAND(object, "Twig_Template" TSRMLS_CC)) {
		zval *tmp_properties, *tmp_item;

		tmp_properties = TWIG_GET_ARRAY_ELEMENT(tmp_class, "properties", strlen("properties") TSRMLS_CC);
		tmp_item = TWIG_GET_ARRAY_ELEMENT(tmp_properties, item, item_len TSRMLS_CC);

		if (tmp_item || TWIG_HAS_PROPERTY(object, zitem TSRMLS_CC) || TWIG_HAS_DYNAMIC_PROPERTY(object, item, item_len TSRMLS_CC)) {
			if (isDefinedTest) {
				efree(item);
				RETURN_TRUE;
			}
			if (TWIG_CALL_SB(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "hasExtension", "Twig_Extension_Sandbox" TSRMLS_CC)) {
				TWIG_CALL_ZZ(TWIG_CALL_S(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "getExtension", "Twig_Extension_Sandbox" TSRMLS_CC), "checkPropertyAllowed", object, zitem TSRMLS_CC);
			}
			if (EG(exception)) {
				efree(item);
				return;
			}

			ret = TWIG_PROPERTY(object, zitem TSRMLS_CC);
			efree(item);
			RETURN_ZVAL(ret, 1, 0);
		}
	}
/*
	// object method
	if (!isset(self::$cache[$class]['methods'])) {
		if ($object instanceof self) {
			$ref = new ReflectionClass($class);
			$methods = array();

			foreach ($ref->getMethods(ReflectionMethod::IS_PUBLIC) as $refMethod) {
				$methodName = strtolower($refMethod->name);

				// Accessing the environment from templates is forbidden to prevent untrusted changes to the environment
				if ('getenvironment' !== $methodName) {
					$methods[$methodName] = true;
				}
			}

			self::$cache[$class]['methods'] = $methods;
        } else {
			self::$cache[$class]['methods'] = array_change_key_case(array_flip(get_class_methods($object)));
        }
	}

	$call = false;
	$lcItem = strtolower($item);
	if (isset(self::$cache[$class]['methods'][$lcItem])) {
		$method = (string) $item;
	} elseif (isset(self::$cache[$class]['methods']['get'.$lcItem])) {
		$method = 'get'.$item;
	} elseif (isset(self::$cache[$class]['methods']['is'.$lcItem])) {
		$method = 'is'.$item;
	} elseif (isset(self::$cache[$class]['methods']['__call'])) {
		$method = (string) $item;
		$call = true;
*/
	{
		int call = 0;
		char *lcItem = TWIG_STRTOLOWER(item, item_len);
		int   lcItem_length;
		char *method = NULL;
		char *tmp_method_name_get;
		char *tmp_method_name_is;
		zval *zmethod;
		zval *tmp_methods;

		lcItem_length = strlen(lcItem);
		tmp_method_name_get = emalloc(4 + lcItem_length);
		tmp_method_name_is  = emalloc(3 + lcItem_length);

		sprintf(tmp_method_name_get, "get%s", lcItem);
		sprintf(tmp_method_name_is, "is%s", lcItem);

		tmp_methods = TWIG_GET_ARRAY_ELEMENT(tmp_class, "methods", strlen("methods") TSRMLS_CC);

		if (TWIG_GET_ARRAY_ELEMENT(tmp_methods, lcItem, lcItem_length TSRMLS_CC)) {
			method = item;
		} else if (TWIG_GET_ARRAY_ELEMENT(tmp_methods, tmp_method_name_get, lcItem_length + 3 TSRMLS_CC)) {
			method = tmp_method_name_get;
		} else if (TWIG_GET_ARRAY_ELEMENT(tmp_methods, tmp_method_name_is, lcItem_length + 2 TSRMLS_CC)) {
			method = tmp_method_name_is;
		} else if (TWIG_GET_ARRAY_ELEMENT(tmp_methods, "__call", 6 TSRMLS_CC)) {
			method = item;
			call = 1;
/*
	} else {
		if ($isDefinedTest) {
			return false;
		}

		if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
			return null;
		}

		throw new Twig_Error_Runtime(sprintf('Method "%s" for object "%s" does not exist.', $item, get_class($object)), -1, $this->getTemplateName());
	}

	if ($isDefinedTest) {
		return true;
	}
*/
		} else {
			efree(tmp_method_name_get);
			efree(tmp_method_name_is);
			efree(lcItem);

			if (isDefinedTest) {
				efree(item);
				RETURN_FALSE;
			}
			if (ignoreStrictCheck || !TWIG_CALL_BOOLEAN(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "isStrictVariables" TSRMLS_CC)) {
				efree(item);
				return;
			}
			TWIG_RUNTIME_ERROR(template TSRMLS_CC, "Neither the property \"%s\" nor one of the methods \"%s()\", \"get%s()\"/\"is%s()\" or \"__call()\" exist and have public access in class \"%s\".", item, item, item, item, TWIG_GET_CLASS_NAME(object TSRMLS_CC));
			efree(item);
			return;
		}

		if (isDefinedTest) {
			efree(tmp_method_name_get);
			efree(tmp_method_name_is);
			efree(lcItem);efree(item);
			RETURN_TRUE;
		}
/*
	if ($this->env->hasExtension('Twig_Extension_Sandbox')) {
		$this->env->getExtension('Twig_Extension_Sandbox')->checkMethodAllowed($object, $method);
	}
*/
		MAKE_STD_ZVAL(zmethod);
		ZVAL_STRING(zmethod, method, 1);
		if (TWIG_CALL_SB(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "hasExtension", "Twig_Extension_Sandbox" TSRMLS_CC)) {
			TWIG_CALL_ZZ(TWIG_CALL_S(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "getExtension", "Twig_Extension_Sandbox" TSRMLS_CC), "checkMethodAllowed", object, zmethod TSRMLS_CC);
		}
		zval_ptr_dtor(&zmethod);
		if (EG(exception)) {
			efree(tmp_method_name_get);
			efree(tmp_method_name_is);
			efree(lcItem);efree(item);
			return;
		}
/*
	// Some objects throw exceptions when they have __call, and the method we try
	// to call is not supported. If ignoreStrictCheck is true, we should return null.
	try {
	    $ret = call_user_func_array(array($object, $method), $arguments);
	} catch (BadMethodCallException $e) {
	    if ($call && ($ignoreStrictCheck || !$this->env->isStrictVariables())) {
	        return null;
	    }
	    throw $e;
	}
*/
		ret = TWIG_CALL_USER_FUNC_ARRAY(object, method, arguments TSRMLS_CC);
		if (EG(exception) && TWIG_INSTANCE_OF(EG(exception), spl_ce_BadMethodCallException TSRMLS_CC)) {
			if (ignoreStrictCheck || !TWIG_CALL_BOOLEAN(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "isStrictVariables" TSRMLS_CC)) {
				efree(tmp_method_name_get);
				efree(tmp_method_name_is);
				efree(lcItem);efree(item);
				zend_clear_exception(TSRMLS_C);
				return;
			}
		}
		free_ret = 1;
		efree(tmp_method_name_get);
		efree(tmp_method_name_is);
		efree(lcItem);
	}
/*
	// useful when calling a template method from a template
	// this is not supported but unfortunately heavily used in the Symfony profiler
	if ($object instanceof Twig_TemplateInterface) {
		return $ret === '' ? '' : new Twig_Markup($ret, $this->env->getCharset());
	}

	return $ret;
*/
	efree(item);
	// ret can be null, if e.g. the called method throws an exception
	if (ret) {
		if (TWIG_INSTANCE_OF_USERLAND(object, "Twig_TemplateInterface" TSRMLS_CC)) {
			if (Z_STRLEN_P(ret) != 0) {
				zval *charset = TWIG_CALL_USER_FUNC_ARRAY(TWIG_PROPERTY_CHAR(template, "env" TSRMLS_CC), "getCharset", NULL TSRMLS_CC);
				TWIG_NEW(return_value, "Twig_Markup", ret, charset TSRMLS_CC);
				zval_ptr_dtor(&charset);
				if (ret) {
					zval_ptr_dtor(&ret);
				}
				return;
			}
		}

		RETVAL_ZVAL(ret, 1, 0);
		if (free_ret) {
			zval_ptr_dtor(&ret);
		}
	}
}
