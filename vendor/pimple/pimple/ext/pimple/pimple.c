
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

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "php.h"
#include "php_ini.h"
#include "ext/standard/info.h"
#include "php_pimple.h"
#include "pimple_compat.h"
#include "zend_interfaces.h"
#include "zend.h"
#include "Zend/zend_closures.h"
#include "ext/spl/spl_exceptions.h"
#include "Zend/zend_exceptions.h"
#include "main/php_output.h"
#include "SAPI.h"

static zend_class_entry *pimple_ce_PsrContainerInterface;
static zend_class_entry *pimple_ce_PsrContainerExceptionInterface;
static zend_class_entry *pimple_ce_PsrNotFoundExceptionInterface;

static zend_class_entry *pimple_ce_ExpectedInvokableException;
static zend_class_entry *pimple_ce_FrozenServiceException;
static zend_class_entry *pimple_ce_InvalidServiceIdentifierException;
static zend_class_entry *pimple_ce_UnknownIdentifierException;

static zend_class_entry *pimple_ce;
static zend_object_handlers pimple_object_handlers;
static zend_class_entry *pimple_closure_ce;
static zend_class_entry *pimple_serviceprovider_ce;
static zend_object_handlers pimple_closure_object_handlers;
static zend_internal_function pimple_closure_invoker_function;

#define FETCH_DIM_HANDLERS_VARS 	pimple_object *pimple_obj = NULL; \
									ulong index; \
									pimple_obj = (pimple_object *)zend_object_store_get_object(object TSRMLS_CC); \

#define PIMPLE_OBJECT_HANDLE_INHERITANCE_OBJECT_HANDLERS	do { \
	if (ce != pimple_ce) { \
		zend_hash_find(&ce->function_table, ZEND_STRS("offsetget"), (void **)&function); \
		if (function->common.scope != ce) { /* if the function is not defined in this actual class */ \
			pimple_object_handlers.read_dimension = pimple_object_read_dimension; /* then overwrite the handler to use custom one */ \
		} \
		zend_hash_find(&ce->function_table, ZEND_STRS("offsetset"), (void **)&function); \
		if (function->common.scope != ce) { \
			pimple_object_handlers.write_dimension = pimple_object_write_dimension; \
		} \
		zend_hash_find(&ce->function_table, ZEND_STRS("offsetexists"), (void **)&function); \
		if (function->common.scope != ce) { \
			pimple_object_handlers.has_dimension = pimple_object_has_dimension; \
		} \
		zend_hash_find(&ce->function_table, ZEND_STRS("offsetunset"), (void **)&function); \
		if (function->common.scope != ce) { \
			pimple_object_handlers.unset_dimension = pimple_object_unset_dimension; \
		} \
	} else { \
		pimple_object_handlers.read_dimension = pimple_object_read_dimension; \
		pimple_object_handlers.write_dimension = pimple_object_write_dimension; \
		pimple_object_handlers.has_dimension = pimple_object_has_dimension; \
		pimple_object_handlers.unset_dimension = pimple_object_unset_dimension; \
	}\
											} while(0);

#define PIMPLE_CALL_CB	do { \
			zend_fcall_info_argn(&fci TSRMLS_CC, 1, &object); \
			fci.size           = sizeof(fci); \
			fci.object_ptr     = retval->fcc.object_ptr; \
			fci.function_name  = retval->value; \
			fci.no_separation  = 1; \
			fci.retval_ptr_ptr = &retval_ptr_ptr; \
\
			zend_call_function(&fci, &retval->fcc TSRMLS_CC); \
			efree(fci.params); \
			if (EG(exception)) { \
				return EG(uninitialized_zval_ptr); \
			} \
						} while(0);


/* Psr\Container\ContainerInterface */
ZEND_BEGIN_ARG_INFO_EX(arginfo_pimple_PsrContainerInterface_get, 0, 0, 1)
ZEND_ARG_INFO(0, id)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_pimple_PsrContainerInterface_has, 0, 0, 1)
ZEND_ARG_INFO(0, id)
ZEND_END_ARG_INFO()

static const zend_function_entry pimple_ce_PsrContainerInterface_functions[] = {
	PHP_ABSTRACT_ME(ContainerInterface, get, arginfo_pimple_PsrContainerInterface_get)
	PHP_ABSTRACT_ME(ContainerInterface, has, arginfo_pimple_PsrContainerInterface_has)
	PHP_FE_END
};

/* Psr\Container\ContainerExceptionInterface */
static const zend_function_entry pimple_ce_PsrContainerExceptionInterface_functions[] = {
	PHP_FE_END
};

/* Psr\Container\NotFoundExceptionInterface */
static const zend_function_entry pimple_ce_PsrNotFoundExceptionInterface_functions[] = {
	PHP_FE_END
};

/* Pimple\Exception\FrozenServiceException */
ZEND_BEGIN_ARG_INFO_EX(arginfo_FrozenServiceException___construct, 0, 0, 1)
ZEND_ARG_INFO(0, id)
ZEND_END_ARG_INFO()

static const zend_function_entry pimple_ce_FrozenServiceException_functions[] = {
	PHP_ME(FrozenServiceException, __construct, arginfo_FrozenServiceException___construct, ZEND_ACC_PUBLIC)
	PHP_FE_END
};

/* Pimple\Exception\InvalidServiceIdentifierException */
ZEND_BEGIN_ARG_INFO_EX(arginfo_InvalidServiceIdentifierException___construct, 0, 0, 1)
ZEND_ARG_INFO(0, id)
ZEND_END_ARG_INFO()

static const zend_function_entry pimple_ce_InvalidServiceIdentifierException_functions[] = {
	PHP_ME(InvalidServiceIdentifierException, __construct, arginfo_InvalidServiceIdentifierException___construct, ZEND_ACC_PUBLIC)
	PHP_FE_END
};

/* Pimple\Exception\UnknownIdentifierException */
ZEND_BEGIN_ARG_INFO_EX(arginfo_UnknownIdentifierException___construct, 0, 0, 1)
ZEND_ARG_INFO(0, id)
ZEND_END_ARG_INFO()

static const zend_function_entry pimple_ce_UnknownIdentifierException_functions[] = {
	PHP_ME(UnknownIdentifierException, __construct, arginfo_UnknownIdentifierException___construct, ZEND_ACC_PUBLIC)
	PHP_FE_END
};

/* Pimple\Container */
ZEND_BEGIN_ARG_INFO_EX(arginfo___construct, 0, 0, 0)
ZEND_ARG_ARRAY_INFO(0, value, 0)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_offsetset, 0, 0, 2)
ZEND_ARG_INFO(0, offset)
ZEND_ARG_INFO(0, value)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_offsetget, 0, 0, 1)
ZEND_ARG_INFO(0, offset)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_offsetexists, 0, 0, 1)
ZEND_ARG_INFO(0, offset)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_offsetunset, 0, 0, 1)
ZEND_ARG_INFO(0, offset)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_factory, 0, 0, 1)
ZEND_ARG_INFO(0, callable)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_protect, 0, 0, 1)
ZEND_ARG_INFO(0, callable)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_raw, 0, 0, 1)
ZEND_ARG_INFO(0, id)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_extend, 0, 0, 2)
ZEND_ARG_INFO(0, id)
ZEND_ARG_INFO(0, callable)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_keys, 0, 0, 0)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO_EX(arginfo_register, 0, 0, 1)
ZEND_ARG_OBJ_INFO(0, provider, Pimple\\ServiceProviderInterface, 0)
ZEND_ARG_ARRAY_INFO(0, values, 1)
ZEND_END_ARG_INFO()

static const zend_function_entry pimple_ce_functions[] = {
	PHP_ME(Pimple, __construct,	arginfo___construct, ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, factory,         arginfo_factory,         ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, protect,         arginfo_protect,         ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, raw,             arginfo_raw,             ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, extend,          arginfo_extend,          ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, keys,            arginfo_keys,            ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, register,		arginfo_register,		 ZEND_ACC_PUBLIC)

	PHP_ME(Pimple, offsetSet,       arginfo_offsetset,       ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, offsetGet,       arginfo_offsetget,       ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, offsetExists,    arginfo_offsetexists,    ZEND_ACC_PUBLIC)
	PHP_ME(Pimple, offsetUnset,     arginfo_offsetunset,     ZEND_ACC_PUBLIC)
	PHP_FE_END
};

/* Pimple\ServiceProviderInterface */
ZEND_BEGIN_ARG_INFO_EX(arginfo_serviceprovider_register, 0, 0, 1)
ZEND_ARG_OBJ_INFO(0, pimple, Pimple\\Container, 0)
ZEND_END_ARG_INFO()

static const zend_function_entry pimple_serviceprovider_iface_ce_functions[] = {
	PHP_ABSTRACT_ME(ServiceProviderInterface, register, arginfo_serviceprovider_register)
	PHP_FE_END
};

/* parent::__construct(sprintf("Something with %s", $arg1)) */
static void pimple_exception_call_parent_constructor(zval *this_ptr, const char *format, const char *arg1 TSRMLS_DC)
{
	zend_class_entry *ce = Z_OBJCE_P(this_ptr);
	char *message = NULL;
	int message_len;
	zval *constructor_arg;

	message_len = spprintf(&message, 0, format, arg1);
	ALLOC_INIT_ZVAL(constructor_arg);
	ZVAL_STRINGL(constructor_arg, message, message_len, 1);

	zend_call_method_with_1_params(&this_ptr, ce, &ce->parent->constructor, "__construct", NULL, constructor_arg);

	efree(message);
	zval_ptr_dtor(&constructor_arg);
}

/**
 * Pass a single string parameter to exception constructor and throw
 */
static void pimple_throw_exception_string(zend_class_entry *ce, const char *message, zend_uint message_len TSRMLS_DC)
{
	zval *exception, *param;

	ALLOC_INIT_ZVAL(exception);
	object_init_ex(exception, ce);

	ALLOC_INIT_ZVAL(param);
	ZVAL_STRINGL(param, message, message_len, 1);

	zend_call_method_with_1_params(&exception, ce, &ce->constructor, "__construct", NULL, param);

	zend_throw_exception_object(exception TSRMLS_CC);

	zval_ptr_dtor(&param);
}

static void pimple_closure_free_object_storage(pimple_closure_object *obj TSRMLS_DC)
{
	zend_object_std_dtor(&obj->zobj TSRMLS_CC);
	if (obj->factory) {
		zval_ptr_dtor(&obj->factory);
	}
	if (obj->callable) {
		zval_ptr_dtor(&obj->callable);
	}
	efree(obj);
}

static void pimple_free_object_storage(pimple_object *obj TSRMLS_DC)
{
	zend_hash_destroy(&obj->factories);
	zend_hash_destroy(&obj->protected);
	zend_hash_destroy(&obj->values);
	zend_object_std_dtor(&obj->zobj TSRMLS_CC);
	efree(obj);
}

static void pimple_free_bucket(pimple_bucket_value *bucket)
{
	if (bucket->raw) {
		zval_ptr_dtor(&bucket->raw);
	}
}

static zend_object_value pimple_closure_object_create(zend_class_entry *ce TSRMLS_DC)
{
	zend_object_value retval;
	pimple_closure_object *pimple_closure_obj = NULL;

	pimple_closure_obj = ecalloc(1, sizeof(pimple_closure_object));
	ZEND_OBJ_INIT(&pimple_closure_obj->zobj, ce);

	pimple_closure_object_handlers.get_constructor = pimple_closure_get_constructor;
	retval.handlers = &pimple_closure_object_handlers;
	retval.handle   = zend_objects_store_put(pimple_closure_obj, (zend_objects_store_dtor_t) zend_objects_destroy_object, (zend_objects_free_object_storage_t) pimple_closure_free_object_storage, NULL TSRMLS_CC);

	return retval;
}

static zend_function *pimple_closure_get_constructor(zval *obj TSRMLS_DC)
{
	zend_error(E_ERROR, "Pimple\\ContainerClosure is an internal class and cannot be instantiated");

	return NULL;
}

static int pimple_closure_get_closure(zval *obj, zend_class_entry **ce_ptr, union _zend_function **fptr_ptr, zval **zobj_ptr TSRMLS_DC)
{
	*zobj_ptr = obj;
	*ce_ptr   = Z_OBJCE_P(obj);
	*fptr_ptr = (zend_function *)&pimple_closure_invoker_function;

	return SUCCESS;
}

static zend_object_value pimple_object_create(zend_class_entry *ce TSRMLS_DC)
{
	zend_object_value retval;
	pimple_object *pimple_obj  = NULL;
	zend_function *function    = NULL;

	pimple_obj = emalloc(sizeof(pimple_object));
	ZEND_OBJ_INIT(&pimple_obj->zobj, ce);

	PIMPLE_OBJECT_HANDLE_INHERITANCE_OBJECT_HANDLERS

	retval.handlers = &pimple_object_handlers;
	retval.handle   = zend_objects_store_put(pimple_obj, (zend_objects_store_dtor_t) zend_objects_destroy_object, (zend_objects_free_object_storage_t) pimple_free_object_storage, NULL TSRMLS_CC);

	zend_hash_init(&pimple_obj->factories, PIMPLE_DEFAULT_ZVAL_CACHE_NUM, NULL, (dtor_func_t)pimple_bucket_dtor, 0);
	zend_hash_init(&pimple_obj->protected, PIMPLE_DEFAULT_ZVAL_CACHE_NUM, NULL, (dtor_func_t)pimple_bucket_dtor, 0);
	zend_hash_init(&pimple_obj->values, PIMPLE_DEFAULT_ZVAL_VALUES_NUM, NULL, (dtor_func_t)pimple_bucket_dtor, 0);

	return retval;
}

static void pimple_object_write_dimension(zval *object, zval *offset, zval *value TSRMLS_DC)
{
	FETCH_DIM_HANDLERS_VARS

	pimple_bucket_value pimple_value = {0}, *found_value = NULL;
	ulong hash;

	pimple_zval_to_pimpleval(value, &pimple_value TSRMLS_CC);

	if (!offset) {/* $p[] = 'foo' when not overloaded */
		zend_hash_next_index_insert(&pimple_obj->values, (void *)&pimple_value, sizeof(pimple_bucket_value), NULL);
		Z_ADDREF_P(value);
		return;
	}

	switch (Z_TYPE_P(offset)) {
	case IS_STRING:
		hash = zend_hash_func(Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1);
		zend_hash_quick_find(&pimple_obj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1, hash, (void **)&found_value);
		if (found_value && found_value->type == PIMPLE_IS_SERVICE && found_value->initialized == 1) {
			pimple_free_bucket(&pimple_value);
			pimple_throw_exception_string(pimple_ce_FrozenServiceException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
			return;
		}
		if (zend_hash_quick_update(&pimple_obj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1, hash, (void *)&pimple_value, sizeof(pimple_bucket_value), NULL) == FAILURE) {
			pimple_free_bucket(&pimple_value);
			return;
		}
		Z_ADDREF_P(value);
	break;
	case IS_DOUBLE:
	case IS_BOOL:
	case IS_LONG:
		if (Z_TYPE_P(offset) == IS_DOUBLE) {
			index = (ulong)Z_DVAL_P(offset);
		} else {
			index = Z_LVAL_P(offset);
		}
		zend_hash_index_find(&pimple_obj->values, index, (void **)&found_value);
		if (found_value && found_value->type == PIMPLE_IS_SERVICE && found_value->initialized == 1) {
			pimple_free_bucket(&pimple_value);
			convert_to_string(offset);
			pimple_throw_exception_string(pimple_ce_FrozenServiceException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
			return;
		}
		if (zend_hash_index_update(&pimple_obj->values, index, (void *)&pimple_value, sizeof(pimple_bucket_value), NULL) == FAILURE) {
			pimple_free_bucket(&pimple_value);
			return;
		}
		Z_ADDREF_P(value);
	break;
	case IS_NULL: /* $p[] = 'foo' when overloaded */
		zend_hash_next_index_insert(&pimple_obj->values, (void *)&pimple_value, sizeof(pimple_bucket_value), NULL);
		Z_ADDREF_P(value);
	break;
	default:
		pimple_free_bucket(&pimple_value);
		zend_error(E_WARNING, "Unsupported offset type");
	}
}

static void pimple_object_unset_dimension(zval *object, zval *offset TSRMLS_DC)
{
	FETCH_DIM_HANDLERS_VARS

	switch (Z_TYPE_P(offset)) {
	case IS_STRING:
		zend_symtable_del(&pimple_obj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1);
		zend_symtable_del(&pimple_obj->factories, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1);
		zend_symtable_del(&pimple_obj->protected, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1);
	break;
	case IS_DOUBLE:
	case IS_BOOL:
	case IS_LONG:
		if (Z_TYPE_P(offset) == IS_DOUBLE) {
			index = (ulong)Z_DVAL_P(offset);
		} else {
			index = Z_LVAL_P(offset);
		}
		zend_hash_index_del(&pimple_obj->values, index);
		zend_hash_index_del(&pimple_obj->factories, index);
		zend_hash_index_del(&pimple_obj->protected, index);
	break;
	default:
		zend_error(E_WARNING, "Unsupported offset type");
	}
}

static int pimple_object_has_dimension(zval *object, zval *offset, int check_empty TSRMLS_DC)
{
	FETCH_DIM_HANDLERS_VARS

	pimple_bucket_value *retval = NULL;

	switch (Z_TYPE_P(offset)) {
	case IS_STRING:
		if (zend_symtable_find(&pimple_obj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1, (void **)&retval) == SUCCESS) {
			switch (check_empty) {
			case 0: /* isset */
				return 1; /* Differs from PHP behavior (Z_TYPE_P(retval->value) != IS_NULL;) */
			case 1: /* empty */
			default:
				return zend_is_true(retval->value);
			}
		}
		return 0;
	break;
	case IS_DOUBLE:
	case IS_BOOL:
	case IS_LONG:
		if (Z_TYPE_P(offset) == IS_DOUBLE) {
			index = (ulong)Z_DVAL_P(offset);
		} else {
			index = Z_LVAL_P(offset);
		}
		if (zend_hash_index_find(&pimple_obj->values, index, (void **)&retval) == SUCCESS) {
			switch (check_empty) {
				case 0: /* isset */
					return 1; /* Differs from PHP behavior (Z_TYPE_P(retval->value) != IS_NULL;)*/
				case 1: /* empty */
				default:
					return zend_is_true(retval->value);
			}
		}
		return 0;
	break;
	default:
		zend_error(E_WARNING, "Unsupported offset type");
		return 0;
	}
}

static zval *pimple_object_read_dimension(zval *object, zval *offset, int type TSRMLS_DC)
{
	FETCH_DIM_HANDLERS_VARS

	pimple_bucket_value *retval = NULL;
	zend_fcall_info fci         = {0};
	zval *retval_ptr_ptr        = NULL;

	switch (Z_TYPE_P(offset)) {
	case IS_STRING:
		if (zend_symtable_find(&pimple_obj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1, (void **)&retval) == FAILURE) {
			pimple_throw_exception_string(pimple_ce_UnknownIdentifierException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);

			return EG(uninitialized_zval_ptr);
		}
	break;
	case IS_DOUBLE:
	case IS_BOOL:
	case IS_LONG:
		if (Z_TYPE_P(offset) == IS_DOUBLE) {
			index = (ulong)Z_DVAL_P(offset);
		} else {
			index = Z_LVAL_P(offset);
		}
		if (zend_hash_index_find(&pimple_obj->values, index, (void **)&retval) == FAILURE) {
			return EG(uninitialized_zval_ptr);
		}
	break;
	case IS_NULL: /* $p[][3] = 'foo' first dim access */
		return EG(uninitialized_zval_ptr);
	break;
	default:
		zend_error(E_WARNING, "Unsupported offset type");
		return EG(uninitialized_zval_ptr);
	}

	if(retval->type == PIMPLE_IS_PARAM) {
		return retval->value;
	}

	if (zend_hash_index_exists(&pimple_obj->protected, retval->handle_num)) {
		/* Service is protected, return the value every time */
		return retval->value;
	}

	if (zend_hash_index_exists(&pimple_obj->factories, retval->handle_num)) {
		/* Service is a factory, call it every time and never cache its result */
		PIMPLE_CALL_CB
		Z_DELREF_P(retval_ptr_ptr); /* fetch dim addr will increment refcount */
		return retval_ptr_ptr;
	}

	if (retval->initialized == 1) {
		/* Service has already been called, return its cached value */
		return retval->value;
	}

	ALLOC_INIT_ZVAL(retval->raw);
	MAKE_COPY_ZVAL(&retval->value, retval->raw);

	PIMPLE_CALL_CB

	retval->initialized = 1;
	zval_ptr_dtor(&retval->value);
	retval->value = retval_ptr_ptr;

	return retval->value;
}

static int pimple_zval_is_valid_callback(zval *_zval, pimple_bucket_value *_pimple_bucket_value TSRMLS_DC)
{
	if (Z_TYPE_P(_zval) != IS_OBJECT) {
		return FAILURE;
	}

	if (_pimple_bucket_value->fcc.called_scope) {
		return SUCCESS;
	}

	if (Z_OBJ_HANDLER_P(_zval, get_closure) && Z_OBJ_HANDLER_P(_zval, get_closure)(_zval, &_pimple_bucket_value->fcc.calling_scope, &_pimple_bucket_value->fcc.function_handler, &_pimple_bucket_value->fcc.object_ptr TSRMLS_CC) == SUCCESS) {
		_pimple_bucket_value->fcc.called_scope = _pimple_bucket_value->fcc.calling_scope;
		return SUCCESS;
	} else {
		return FAILURE;
	}
}

static int pimple_zval_to_pimpleval(zval *_zval, pimple_bucket_value *_pimple_bucket_value TSRMLS_DC)
{
	_pimple_bucket_value->value = _zval;

	if (Z_TYPE_P(_zval) != IS_OBJECT) {
		return PIMPLE_IS_PARAM;
	}

	if (pimple_zval_is_valid_callback(_zval, _pimple_bucket_value TSRMLS_CC) == SUCCESS) {
		_pimple_bucket_value->type       = PIMPLE_IS_SERVICE;
		_pimple_bucket_value->handle_num = Z_OBJ_HANDLE_P(_zval);
	}

	return PIMPLE_IS_SERVICE;
}

static void pimple_bucket_dtor(pimple_bucket_value *bucket)
{
	zval_ptr_dtor(&bucket->value);
	pimple_free_bucket(bucket);
}

PHP_METHOD(FrozenServiceException, __construct)
{
	char *id = NULL;
	int id_len;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s", &id, &id_len) == FAILURE) {
		return;
	}
	pimple_exception_call_parent_constructor(getThis(), "Cannot override frozen service \"%s\".", id TSRMLS_CC);
}

PHP_METHOD(InvalidServiceIdentifierException, __construct)
{
	char *id = NULL;
	int id_len;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s", &id, &id_len) == FAILURE) {
		return;
	}
	pimple_exception_call_parent_constructor(getThis(), "Identifier \"%s\" does not contain an object definition.", id TSRMLS_CC);
}

PHP_METHOD(UnknownIdentifierException, __construct)
{
	char *id = NULL;
	int id_len;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s", &id, &id_len) == FAILURE) {
		return;
	}
	pimple_exception_call_parent_constructor(getThis(), "Identifier \"%s\" is not defined.", id TSRMLS_CC);
}

PHP_METHOD(Pimple, protect)
{
	zval *protected     = NULL;
	pimple_object *pobj = NULL;
	pimple_bucket_value bucket = {0};

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &protected) == FAILURE) {
		return;
	}

	if (pimple_zval_is_valid_callback(protected, &bucket TSRMLS_CC) == FAILURE) {
		pimple_free_bucket(&bucket);
		zend_throw_exception(pimple_ce_ExpectedInvokableException, "Callable is not a Closure or invokable object.", 0 TSRMLS_CC);
		return;
	}

	pimple_zval_to_pimpleval(protected, &bucket TSRMLS_CC);
	pobj = (pimple_object *)zend_object_store_get_object(getThis() TSRMLS_CC);

	if (zend_hash_index_update(&pobj->protected, bucket.handle_num, (void *)&bucket, sizeof(pimple_bucket_value), NULL) == SUCCESS) {
		Z_ADDREF_P(protected);
		RETURN_ZVAL(protected, 1 , 0);
	} else {
		pimple_free_bucket(&bucket);
	}
	RETURN_FALSE;
}

PHP_METHOD(Pimple, raw)
{
	zval *offset = NULL;
	pimple_object *pobj        = NULL;
	pimple_bucket_value *value = NULL;
	ulong index;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &offset) == FAILURE) {
		return;
	}

	pobj = zend_object_store_get_object(getThis() TSRMLS_CC);

	switch (Z_TYPE_P(offset)) {
		case IS_STRING:
			if (zend_symtable_find(&pobj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1, (void *)&value) == FAILURE) {
				pimple_throw_exception_string(pimple_ce_UnknownIdentifierException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
				RETURN_NULL();
			}
		break;
		case IS_DOUBLE:
		case IS_BOOL:
		case IS_LONG:
			if (Z_TYPE_P(offset) == IS_DOUBLE) {
				index = (ulong)Z_DVAL_P(offset);
			} else {
				index = Z_LVAL_P(offset);
			}
			if (zend_hash_index_find(&pobj->values, index, (void *)&value) == FAILURE) {
				RETURN_NULL();
			}
		break;
		case IS_NULL:
		default:
			zend_error(E_WARNING, "Unsupported offset type");
	}

	if (value->raw) {
		RETVAL_ZVAL(value->raw, 1, 0);
	} else {
		RETVAL_ZVAL(value->value, 1, 0);
	}
}

PHP_METHOD(Pimple, extend)
{
	zval *offset = NULL, *callable = NULL, *pimple_closure_obj = NULL;
	pimple_bucket_value bucket = {0}, *value = NULL;
	pimple_object *pobj          = NULL;
	pimple_closure_object *pcobj = NULL;
	ulong index;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "zz", &offset, &callable) == FAILURE) {
		return;
	}

	pobj = zend_object_store_get_object(getThis() TSRMLS_CC);

	switch (Z_TYPE_P(offset)) {
		case IS_STRING:
			if (zend_symtable_find(&pobj->values, Z_STRVAL_P(offset), Z_STRLEN_P(offset)+1, (void *)&value) == FAILURE) {
				pimple_throw_exception_string(pimple_ce_UnknownIdentifierException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
				RETURN_NULL();
			}

			if (value->type != PIMPLE_IS_SERVICE) {
				pimple_throw_exception_string(pimple_ce_InvalidServiceIdentifierException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
				RETURN_NULL();
			}
			if (zend_hash_index_exists(&pobj->protected, value->handle_num)) {
				int er = EG(error_reporting);
				EG(error_reporting) = 0;
				php_error(E_DEPRECATED, "How Pimple behaves when extending protected closures will be fixed in Pimple 4. Are you sure \"%s\" should be protected?", Z_STRVAL_P(offset));
				EG(error_reporting) = er;
			}
		break;
		case IS_DOUBLE:
		case IS_BOOL:
		case IS_LONG:
			if (Z_TYPE_P(offset) == IS_DOUBLE) {
				index = (ulong)Z_DVAL_P(offset);
			} else {
				index = Z_LVAL_P(offset);
			}
			if (zend_hash_index_find(&pobj->values, index, (void *)&value) == FAILURE) {
				convert_to_string(offset);
				pimple_throw_exception_string(pimple_ce_UnknownIdentifierException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
				RETURN_NULL();
			}
			if (value->type != PIMPLE_IS_SERVICE) {
				convert_to_string(offset);
				pimple_throw_exception_string(pimple_ce_InvalidServiceIdentifierException, Z_STRVAL_P(offset), Z_STRLEN_P(offset) TSRMLS_CC);
				RETURN_NULL();
			}
			if (zend_hash_index_exists(&pobj->protected, value->handle_num)) {
				int er = EG(error_reporting);
				EG(error_reporting) = 0;
				php_error(E_DEPRECATED, "How Pimple behaves when extending protected closures will be fixed in Pimple 4. Are you sure \"%ld\" should be protected?", index);
				EG(error_reporting) = er;
			}
		break;
		case IS_NULL:
		default:
			zend_error(E_WARNING, "Unsupported offset type");
	}

	if (pimple_zval_is_valid_callback(callable, &bucket TSRMLS_CC) == FAILURE) {
		pimple_free_bucket(&bucket);
		zend_throw_exception(pimple_ce_ExpectedInvokableException, "Extension service definition is not a Closure or invokable object.", 0 TSRMLS_CC);
		RETURN_NULL();
	}
	pimple_free_bucket(&bucket);

	ALLOC_INIT_ZVAL(pimple_closure_obj);
	object_init_ex(pimple_closure_obj, pimple_closure_ce);

	pcobj = zend_object_store_get_object(pimple_closure_obj TSRMLS_CC);
	pcobj->callable = callable;
	pcobj->factory  = value->value;
	Z_ADDREF_P(callable);
	Z_ADDREF_P(value->value);

	if (zend_hash_index_exists(&pobj->factories, value->handle_num)) {
		pimple_zval_to_pimpleval(pimple_closure_obj, &bucket TSRMLS_CC);
		zend_hash_index_del(&pobj->factories, value->handle_num);
		zend_hash_index_update(&pobj->factories, bucket.handle_num, (void *)&bucket, sizeof(pimple_bucket_value), NULL);
		Z_ADDREF_P(pimple_closure_obj);
	}

	pimple_object_write_dimension(getThis(), offset, pimple_closure_obj TSRMLS_CC);

	RETVAL_ZVAL(pimple_closure_obj, 1, 1);
}

PHP_METHOD(Pimple, keys)
{
	HashPosition pos;
	pimple_object *pobj = NULL;
	zval **value        = NULL;
	zval *endval        = NULL;
	char *str_index     = NULL;
	int str_len;
	ulong num_index;

	if (zend_parse_parameters_none() == FAILURE) {
		return;
	}

	pobj = zend_object_store_get_object(getThis() TSRMLS_CC);
	array_init_size(return_value, zend_hash_num_elements(&pobj->values));

	zend_hash_internal_pointer_reset_ex(&pobj->values, &pos);

	while(zend_hash_get_current_data_ex(&pobj->values, (void **)&value, &pos) == SUCCESS) {
		MAKE_STD_ZVAL(endval);
		switch (zend_hash_get_current_key_ex(&pobj->values, &str_index, (uint *)&str_len, &num_index, 0, &pos)) {
			case HASH_KEY_IS_STRING:
				ZVAL_STRINGL(endval, str_index, str_len - 1, 1);
				zend_hash_next_index_insert(Z_ARRVAL_P(return_value), &endval, sizeof(zval *), NULL);
			break;
			case HASH_KEY_IS_LONG:
				ZVAL_LONG(endval, num_index);
				zend_hash_next_index_insert(Z_ARRVAL_P(return_value), &endval, sizeof(zval *), NULL);
			break;
		}
	zend_hash_move_forward_ex(&pobj->values, &pos);
	}
}

PHP_METHOD(Pimple, factory)
{
	zval *factory       = NULL;
	pimple_object *pobj = NULL;
	pimple_bucket_value bucket = {0};

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &factory) == FAILURE) {
		return;
	}

	if (pimple_zval_is_valid_callback(factory, &bucket TSRMLS_CC) == FAILURE) {
		pimple_free_bucket(&bucket);
		zend_throw_exception(pimple_ce_ExpectedInvokableException, "Service definition is not a Closure or invokable object.", 0 TSRMLS_CC);
		return;
	}

	pimple_zval_to_pimpleval(factory, &bucket TSRMLS_CC);
	pobj = (pimple_object *)zend_object_store_get_object(getThis() TSRMLS_CC);

	if (zend_hash_index_update(&pobj->factories, bucket.handle_num, (void *)&bucket, sizeof(pimple_bucket_value), NULL) == SUCCESS) {
		Z_ADDREF_P(factory);
		RETURN_ZVAL(factory, 1 , 0);
	} else {
		pimple_free_bucket(&bucket);
	}

	RETURN_FALSE;
}

PHP_METHOD(Pimple, offsetSet)
{
	zval *offset = NULL, *value = NULL;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "zz", &offset, &value) == FAILURE) {
		return;
	}

	pimple_object_write_dimension(getThis(), offset, value TSRMLS_CC);
}

PHP_METHOD(Pimple, offsetGet)
{
	zval *offset = NULL, *retval = NULL;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &offset) == FAILURE) {
		return;
	}

	retval = pimple_object_read_dimension(getThis(), offset, 0 TSRMLS_CC);

	RETVAL_ZVAL(retval, 1, 0);
}

PHP_METHOD(Pimple, offsetUnset)
{
	zval *offset = NULL;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &offset) == FAILURE) {
		return;
	}

	pimple_object_unset_dimension(getThis(), offset TSRMLS_CC);
}

PHP_METHOD(Pimple, offsetExists)
{
	zval *offset = NULL;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &offset) == FAILURE) {
		return;
	}

	RETVAL_BOOL(pimple_object_has_dimension(getThis(), offset, 1 TSRMLS_CC));
}

PHP_METHOD(Pimple, register)
{
	zval *provider;
	zval **data;
	zval *retval = NULL;
	zval key;

	HashTable *array = NULL;
	HashPosition pos;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "O|h", &provider, pimple_serviceprovider_ce, &array) == FAILURE) {
		return;
	}

	RETVAL_ZVAL(getThis(), 1, 0);

	zend_call_method_with_1_params(&provider, Z_OBJCE_P(provider), NULL, "register", &retval, getThis());

	if (retval) {
		zval_ptr_dtor(&retval);
	}

	if (!array) {
		return;
	}

	zend_hash_internal_pointer_reset_ex(array, &pos);

	while(zend_hash_get_current_data_ex(array, (void **)&data, &pos) == SUCCESS) {
		zend_hash_get_current_key_zval_ex(array, &key, &pos);
		pimple_object_write_dimension(getThis(), &key, *data TSRMLS_CC);
		zend_hash_move_forward_ex(array, &pos);
	}
}

PHP_METHOD(Pimple, __construct)
{
	zval *values = NULL, **pData = NULL, offset;
	HashPosition pos;
	char *str_index = NULL;
	zend_uint str_length;
	ulong num_index;

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "|a!", &values) == FAILURE) {
		return;
	}

	PIMPLE_DEPRECATE

	if (!values) {
		return;
	}

	zend_hash_internal_pointer_reset_ex(Z_ARRVAL_P(values), &pos);
	while (zend_hash_has_more_elements_ex(Z_ARRVAL_P(values), &pos) == SUCCESS) {
			zend_hash_get_current_data_ex(Z_ARRVAL_P(values), (void **)&pData, &pos);
			zend_hash_get_current_key_ex(Z_ARRVAL_P(values), &str_index, &str_length, &num_index, 0, &pos);
			INIT_ZVAL(offset);
			if (zend_hash_get_current_key_type_ex(Z_ARRVAL_P(values), &pos) == HASH_KEY_IS_LONG) {
				ZVAL_LONG(&offset, num_index);
			} else {
				ZVAL_STRINGL(&offset, str_index, (str_length - 1), 0);
			}
		pimple_object_write_dimension(getThis(), &offset, *pData TSRMLS_CC);
		zend_hash_move_forward_ex(Z_ARRVAL_P(values), &pos);
	}
}

/*
 * This is PHP code snippet handling extend()s calls :

  $extended = function ($c) use ($callable, $factory) {
      return $callable($factory($c), $c);
  };

 */
PHP_METHOD(PimpleClosure, invoker)
{
	pimple_closure_object *pcobj = NULL;
	zval *arg = NULL, *retval = NULL, *newretval = NULL;
	zend_fcall_info fci        = {0};
	zval **args[2];

	if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "z", &arg) == FAILURE) {
		return;
	}

	pcobj = zend_object_store_get_object(getThis() TSRMLS_CC);

	fci.function_name = pcobj->factory;
	args[0] = &arg;
	zend_fcall_info_argp(&fci TSRMLS_CC, 1, args);
	fci.retval_ptr_ptr = &retval;
	fci.size = sizeof(fci);

	if (zend_call_function(&fci, NULL TSRMLS_CC) == FAILURE || EG(exception)) {
		efree(fci.params);
		return; /* Should here return default zval */
	}

	efree(fci.params);
	memset(&fci, 0, sizeof(fci));
	fci.size = sizeof(fci);

	fci.function_name = pcobj->callable;
	args[0] = &retval;
	args[1] = &arg;
	zend_fcall_info_argp(&fci TSRMLS_CC, 2, args);
	fci.retval_ptr_ptr = &newretval;

	if (zend_call_function(&fci, NULL TSRMLS_CC) == FAILURE || EG(exception)) {
		efree(fci.params);
		zval_ptr_dtor(&retval);
		return;
	}

	efree(fci.params);
	zval_ptr_dtor(&retval);

	RETVAL_ZVAL(newretval, 1 ,1);
}

PHP_MINIT_FUNCTION(pimple)
{
	zend_class_entry tmp_ce_PsrContainerInterface, tmp_ce_PsrContainerExceptionInterface, tmp_ce_PsrNotFoundExceptionInterface;
	zend_class_entry tmp_ce_ExpectedInvokableException, tmp_ce_FrozenServiceException, tmp_ce_InvalidServiceIdentifierException, tmp_ce_UnknownIdentifierException;
	zend_class_entry tmp_pimple_ce, tmp_pimple_closure_ce, tmp_pimple_serviceprovider_iface_ce;

	/* Psr\Container namespace */
	INIT_NS_CLASS_ENTRY(tmp_ce_PsrContainerInterface,          PSR_CONTAINER_NS, "ContainerInterface",           pimple_ce_PsrContainerInterface_functions);
	INIT_NS_CLASS_ENTRY(tmp_ce_PsrContainerExceptionInterface, PSR_CONTAINER_NS, "ContainerExceptionInterface", pimple_ce_PsrContainerExceptionInterface_functions);
	INIT_NS_CLASS_ENTRY(tmp_ce_PsrNotFoundExceptionInterface,  PSR_CONTAINER_NS, "NotFoundExceptionInterface",  pimple_ce_PsrNotFoundExceptionInterface_functions);

	pimple_ce_PsrContainerInterface          = zend_register_internal_interface(&tmp_ce_PsrContainerInterface TSRMLS_CC);
	pimple_ce_PsrContainerExceptionInterface = zend_register_internal_interface(&tmp_ce_PsrContainerExceptionInterface TSRMLS_CC);
	pimple_ce_PsrNotFoundExceptionInterface  = zend_register_internal_interface(&tmp_ce_PsrNotFoundExceptionInterface TSRMLS_CC);

	zend_class_implements(pimple_ce_PsrNotFoundExceptionInterface TSRMLS_CC, 1, pimple_ce_PsrContainerExceptionInterface);

	/* Pimple\Exception namespace */
	INIT_NS_CLASS_ENTRY(tmp_ce_ExpectedInvokableException,        PIMPLE_EXCEPTION_NS, "ExpectedInvokableException",         NULL);
	INIT_NS_CLASS_ENTRY(tmp_ce_FrozenServiceException,            PIMPLE_EXCEPTION_NS, "FrozenServiceException",             pimple_ce_FrozenServiceException_functions);
	INIT_NS_CLASS_ENTRY(tmp_ce_InvalidServiceIdentifierException, PIMPLE_EXCEPTION_NS, "InvalidServiceIdentifierException", pimple_ce_InvalidServiceIdentifierException_functions);
	INIT_NS_CLASS_ENTRY(tmp_ce_UnknownIdentifierException,        PIMPLE_EXCEPTION_NS, "UnknownIdentifierException",         pimple_ce_UnknownIdentifierException_functions);

	pimple_ce_ExpectedInvokableException        = zend_register_internal_class_ex(&tmp_ce_ExpectedInvokableException, spl_ce_InvalidArgumentException, NULL TSRMLS_CC);
	pimple_ce_FrozenServiceException            = zend_register_internal_class_ex(&tmp_ce_FrozenServiceException, spl_ce_RuntimeException, NULL TSRMLS_CC);
	pimple_ce_InvalidServiceIdentifierException = zend_register_internal_class_ex(&tmp_ce_InvalidServiceIdentifierException, spl_ce_InvalidArgumentException, NULL TSRMLS_CC);
	pimple_ce_UnknownIdentifierException        = zend_register_internal_class_ex(&tmp_ce_UnknownIdentifierException, spl_ce_InvalidArgumentException, NULL TSRMLS_CC);

	zend_class_implements(pimple_ce_ExpectedInvokableException TSRMLS_CC,        1, pimple_ce_PsrContainerExceptionInterface);
	zend_class_implements(pimple_ce_FrozenServiceException TSRMLS_CC,            1, pimple_ce_PsrContainerExceptionInterface);
	zend_class_implements(pimple_ce_InvalidServiceIdentifierException TSRMLS_CC, 1, pimple_ce_PsrContainerExceptionInterface);
	zend_class_implements(pimple_ce_UnknownIdentifierException TSRMLS_CC,        1, pimple_ce_PsrNotFoundExceptionInterface);

    /* Pimple namespace */
	INIT_NS_CLASS_ENTRY(tmp_pimple_ce, PIMPLE_NS, "Container", pimple_ce_functions);
	INIT_NS_CLASS_ENTRY(tmp_pimple_closure_ce, PIMPLE_NS, "ContainerClosure", NULL);
	INIT_NS_CLASS_ENTRY(tmp_pimple_serviceprovider_iface_ce, PIMPLE_NS, "ServiceProviderInterface", pimple_serviceprovider_iface_ce_functions);

	tmp_pimple_ce.create_object         = pimple_object_create;
	tmp_pimple_closure_ce.create_object = pimple_closure_object_create;

	pimple_ce = zend_register_internal_class(&tmp_pimple_ce TSRMLS_CC);
	zend_class_implements(pimple_ce TSRMLS_CC, 1, zend_ce_arrayaccess);

	pimple_closure_ce = zend_register_internal_class(&tmp_pimple_closure_ce TSRMLS_CC);
	pimple_closure_ce->ce_flags |= ZEND_ACC_FINAL_CLASS;

	pimple_serviceprovider_ce = zend_register_internal_interface(&tmp_pimple_serviceprovider_iface_ce TSRMLS_CC);

	memcpy(&pimple_closure_object_handlers, zend_get_std_object_handlers(), sizeof(*zend_get_std_object_handlers()));
	pimple_object_handlers                     = std_object_handlers;
	pimple_closure_object_handlers.get_closure = pimple_closure_get_closure;

	pimple_closure_invoker_function.function_name     = "Pimple closure internal invoker";
	pimple_closure_invoker_function.fn_flags         |= ZEND_ACC_CLOSURE;
	pimple_closure_invoker_function.handler           = ZEND_MN(PimpleClosure_invoker);
	pimple_closure_invoker_function.num_args          = 1;
	pimple_closure_invoker_function.required_num_args = 1;
	pimple_closure_invoker_function.scope             = pimple_closure_ce;
	pimple_closure_invoker_function.type              = ZEND_INTERNAL_FUNCTION;
	pimple_closure_invoker_function.module            = &pimple_module_entry;

	return SUCCESS;
}

PHP_MINFO_FUNCTION(pimple)
{
	php_info_print_table_start();
	php_info_print_table_header(2, "SensioLabs Pimple C support", "enabled");
	php_info_print_table_row(2, "Pimple supported version", PIMPLE_VERSION);
	php_info_print_table_end();

	php_info_print_box_start(0);
	php_write((void *)ZEND_STRL("SensioLabs Pimple C support developed by Julien Pauli") TSRMLS_CC);
	if (!sapi_module.phpinfo_as_text) {
		php_write((void *)ZEND_STRL(sensiolabs_logo) TSRMLS_CC);
	}
	php_info_print_box_end();
}

zend_module_entry pimple_module_entry = {
	STANDARD_MODULE_HEADER,
	"pimple",
	NULL,
	PHP_MINIT(pimple),
	NULL,
	NULL,
	NULL,
	PHP_MINFO(pimple),
	PIMPLE_VERSION,
	STANDARD_MODULE_PROPERTIES
};

#ifdef COMPILE_DL_PIMPLE
ZEND_GET_MODULE(pimple)
#endif
