/**!
 * Sortable
 * @author  RubaXa   <trash@rubaxa.org>
 * @license MIT
 */


(function (factory){
  "use strict";

  if( typeof define === "function" && define.amd ){
    define(factory);
  }
  else if( typeof module != "undefined" && typeof module.exports != "undefined" ){
    module.exports = factory();
  }
  else {
    window["Sortable"] = factory();
  }
})(function (){
  "use strict";

  var
      dragEl
    , ghostEl
    , rootEl
    , nextEl

    , lastEl
    , lastCSS
    , lastRect

    , activeGroup

    , tapEvt
    , touchEvt

    , expando = 'Sortable' + (new Date).getTime()

    , win = window
    , document = win.document
    , parseInt = win.parseInt
    , supportIEdnd = !!document.createElement('div').dragDrop

    , _silent = false

    , _createEvent = function (event/**String*/, item/**HTMLElement*/){
      var evt = document.createEvent('Event');
      evt.initEvent(event, true, true);
      evt.item = item;
      return evt;
    }

    , _dispatchEvent = function (rootEl, name, targetEl) {
      rootEl.dispatchEvent(_createEvent(name, targetEl || rootEl));
    }

    , _customEvents = 'onAdd onUpdate onRemove onStart onEnd onFilter'.split(' ')

    , noop = function (){}
    , slice = [].slice

    , touchDragOverListeners = []
  ;



  /**
   * @class  Sortable
   * @param  {HTMLElement}  el
   * @param  {Object}       [options]
   */
  function Sortable(el, options){
    this.el = el; // root element
    this.options = options = (options || {});


    // Defaults
    var defaults = {
      group: Math.random(),
      store: null,
      handle: null,
      draggable: el.children[0] && el.children[0].nodeName || (/[uo]l/i.test(el.nodeName) ? 'li' : '*'),
      ghostClass: 'sortable-ghost',
      ignore: 'a, img',
      filter: null
    };

    // Set default options
    for (var name in defaults) {
      options[name] = options[name] || defaults[name];
    }


    // Define events
    _customEvents.forEach(function (name) {
      options[name] = _bind(this, options[name] || noop);
      _on(el, name.substr(2).toLowerCase(), options[name]);
    }, this);


    // Export group name
    el[expando] = options.group;


    // Bind all private methods
    for( var fn in this ){
      if( fn.charAt(0) === '_' ){
        this[fn] = _bind(this, this[fn]);
      }
    }


    // Bind events
    _on(el, 'mousedown', this._onTapStart);
    _on(el, 'touchstart', this._onTapStart);
    supportIEdnd && _on(el, 'selectstart', this._onTapStart);

    _on(el, 'dragover', this._onDragOver);
    _on(el, 'dragenter', this._onDragOver);

    touchDragOverListeners.push(this._onDragOver);

    // Restore sorting
    options.store && this.sort(options.store.get(this));
  }


  Sortable.prototype = /** @lends Sortable.prototype */ {
    constructor: Sortable,


    _applyEffects: function (){
      _toggleClass(dragEl, this.options.ghostClass, true);
    },


    _onTapStart: function (evt/**Event|TouchEvent*/){
      var
          touch = evt.touches && evt.touches[0]
        , target = (touch || evt).target
        , options =  this.options
        , el = this.el
        , filter = options.filter
      ;

      if( evt.type === 'mousedown' && evt.button !== 0 ) {
        return; // only left button
      }

      // Check filter
      if( typeof filter === 'function' ){
        if( filter.call(this, target, this) ){
          _dispatchEvent(el, 'filter', target);
          return; // cancel dnd
        }
      }
      else if( filter ){
        filter = filter.split(',').filter(function (criteria) {
          return _closest(target, criteria.trim(), el);
        });

        if (filter.length) {
          _dispatchEvent(el, 'filter', target);
          return; // cancel dnd
        }
      }

      if( options.handle ){
        target = _closest(target, options.handle, el);
      }

      target = _closest(target, options.draggable, el);

      // IE 9 Support
      if( target && evt.type == 'selectstart' ){
        if( target.tagName != 'A' && target.tagName != 'IMG'){
          target.dragDrop();
        }
      }

      if( target && !dragEl && (target.parentNode === el) ){
        tapEvt = evt;

        rootEl = this.el;
        dragEl = target;
        nextEl = dragEl.nextSibling;
        activeGroup = this.options.group;

        dragEl.draggable = true;

        // Disable "draggable"
        options.ignore.split(',').forEach(function (criteria) {
          _find(target, criteria.trim(), _disableDraggable);
        });

        if( touch ){
          // Touch device support
          tapEvt = {
              target:  target
            , clientX: touch.clientX
            , clientY: touch.clientY
          };

          this._onDragStart(tapEvt, true);
          evt.preventDefault();
        }

        _on(document, 'mouseup', this._onDrop);
        _on(document, 'touchend', this._onDrop);
        _on(document, 'touchcancel', this._onDrop);

        _on(this.el, 'dragstart', this._onDragStart);
        _on(this.el, 'dragend', this._onDrop);
        _on(document, 'dragover', _globalDragOver);


        try {
          if( document.selection ){
            document.selection.empty();
          } else {
            window.getSelection().removeAllRanges()
          }
        } catch (err){ }


        _dispatchEvent(dragEl, 'start');
      }
    },

    _emulateDragOver: function (){
      if( touchEvt ){
        _css(ghostEl, 'display', 'none');

        var
            target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY)
          , parent = target
          , group = this.options.group
          , i = touchDragOverListeners.length
        ;

        if( parent ){
          do {
            if( parent[expando] === group ){
              while( i-- ){
                touchDragOverListeners[i]({
                  clientX: touchEvt.clientX,
                  clientY: touchEvt.clientY,
                  target: target,
                  rootEl: parent
                });
              }
              break;
            }

            target = parent; // store last element
          }
          while( parent = parent.parentNode );
        }

        _css(ghostEl, 'display', '');
      }
    },


    _onTouchMove: function (evt/**TouchEvent*/){
      if( tapEvt ){
        var
            touch = evt.touches[0]
          , dx = touch.clientX - tapEvt.clientX
          , dy = touch.clientY - tapEvt.clientY
          , translate3d = 'translate3d(' + dx + 'px,' + dy + 'px,0)'
        ;

        touchEvt = touch;

        _css(ghostEl, 'webkitTransform', translate3d);
        _css(ghostEl, 'mozTransform', translate3d);
        _css(ghostEl, 'msTransform', translate3d);
        _css(ghostEl, 'transform', translate3d);

        evt.preventDefault();
      }
    },


    _onDragStart: function (evt/**Event*/, isTouch/**Boolean*/){
      var dataTransfer = evt.dataTransfer;

      this._offUpEvents();

      if( isTouch ){
        var
            rect = dragEl.getBoundingClientRect()
          , css = _css(dragEl)
          , ghostRect
        ;

        ghostEl = dragEl.cloneNode(true);

        _css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
        _css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
        _css(ghostEl, 'width', rect.width);
        _css(ghostEl, 'height', rect.height);
        _css(ghostEl, 'opacity', '0.8');
        _css(ghostEl, 'position', 'fixed');
        _css(ghostEl, 'zIndex', '100000');

        rootEl.appendChild(ghostEl);

        // Fixing dimensions.
        ghostRect = ghostEl.getBoundingClientRect();
        _css(ghostEl, 'width', rect.width*2 - ghostRect.width);
        _css(ghostEl, 'height', rect.height*2 - ghostRect.height);

        // Bind touch events
        _on(document, 'touchmove', this._onTouchMove);
        _on(document, 'touchend', this._onDrop);
        _on(document, 'touchcancel', this._onDrop);

        this._loopId = setInterval(this._emulateDragOver, 150);
      }
      else {
        dataTransfer.effectAllowed = 'move';
        dataTransfer.setData('Text', dragEl.textContent);

        _on(document, 'drop', this._onDrop);
      }

      setTimeout(this._applyEffects);
    },


    _onDragOver: function (evt/**Event*/){
      if( !_silent && (activeGroup === this.options.group) && (evt.rootEl === void 0 || evt.rootEl === this.el) ){
        var
            el = this.el
          , target = _closest(evt.target, this.options.draggable, el)
        ;

        if( el.children.length === 0 || el.children[0] === ghostEl || (el === evt.target) && _ghostInBottom(el, evt) ){
          el.appendChild(dragEl);
        }
        else if( target && target !== dragEl && (target.parentNode[expando] !== void 0) ){
          if( lastEl !== target ){
            lastEl = target;
            lastCSS = _css(target);
            lastRect = target.getBoundingClientRect();
          }


          var
              rect = lastRect
            , width = rect.right - rect.left
            , height = rect.bottom - rect.top
            , floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display)
            , isWide = (target.offsetWidth > dragEl.offsetWidth)
            , isLong = (target.offsetHeight > dragEl.offsetHeight)
            , halfway = (floating ? (evt.clientX - rect.left)/width : (evt.clientY - rect.top)/height) > .5
            , nextSibling = target.nextElementSibling
            , after
          ;

          _silent = true;
          setTimeout(_unsilent, 30);

          if( floating ){
            after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide
          } else {
            after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
          }

          if( after && !nextSibling ){
            el.appendChild(dragEl);
          } else {
            target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
          }
        }
      }
    },

    _offUpEvents: function () {
      _off(document, 'mouseup', this._onDrop);
      _off(document, 'touchmove', this._onTouchMove);
      _off(document, 'touchend', this._onDrop);
      _off(document, 'touchcancel', this._onDrop);
    },

    _onDrop: function (evt/**Event*/){
      clearInterval(this._loopId);

      // Unbind events
      _off(document, 'drop', this._onDrop);
      _off(document, 'dragover', _globalDragOver);

      _off(this.el, 'dragend', this._onDrop);
      _off(this.el, 'dragstart', this._onDragStart);
      _off(this.el, 'selectstart', this._onTapStart);

      this._offUpEvents();

      if( evt ){
        evt.preventDefault();
        evt.stopPropagation();

        if( ghostEl ){
          ghostEl.parentNode.removeChild(ghostEl);
        }

        if( dragEl ){
          _disableDraggable(dragEl);
          _toggleClass(dragEl, this.options.ghostClass, false);

          if( !rootEl.contains(dragEl) ){
            // Remove event
            _dispatchEvent(rootEl, 'remove', dragEl);

            // Add event
            _dispatchEvent(dragEl, 'add');
          }
          else if( dragEl.nextSibling !== nextEl ){
            // Update event
            _dispatchEvent(dragEl, 'update');
          }

          _dispatchEvent(dragEl, 'end');
        }

        // Set NULL
        rootEl =
        dragEl =
        ghostEl =
        nextEl =

        tapEvt =
        touchEvt =

        lastEl =
        lastCSS =

        activeGroup = null;

        // Save sorting
        this.options.store && this.options.store.set(this);
      }
    },


    /**
     * Serializes the item into an array of string.
     * @returns {String[]}
     */
    toArray: function () {
      var order = [],
        el,
        children = this.el.children,
        i = 0,
        n = children.length
      ;

      for (; i < n; i++) {
        el = children[i];
        if (_closest(el, this.options.draggable, this.el)) {
          order.push(el.getAttribute('data-id') || _generateId(el));
        }
      }

      return order;
    },


    /**
     * Sorts the elements according to the array.
     * @param  {String[]}  order  order of the items
     */
    sort: function (order) {
      var items = {}, rootEl = this.el;

      this.toArray().forEach(function (id, i) {
        var el = rootEl.children[i];

        if (_closest(el, this.options.draggable, rootEl)) {
          items[id] = el;
        }
      }, this);


      order.forEach(function (id) {
        if (items[id]) {
          rootEl.removeChild(items[id]);
          rootEl.appendChild(items[id]);
        }
      });
    },


    /**
     * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
     * @param   {HTMLElement}  el
     * @param   {String}       [selector]  default: `options.draggable`
     * @returns {HTMLElement|null}
     */
    closest: function (el, selector) {
      return _closest(el, selector || this.options.draggable, this.el);
    },


    /**
     * Destroy
     */
    destroy: function () {
      var el = this.el, options = this.options;

      _customEvents.forEach(function (name) {
        _off(el, name.substr(2).toLowerCase(), options[name]);
      });

      _off(el, 'mousedown', this._onTapStart);
      _off(el, 'touchstart', this._onTapStart);
      _off(el, 'selectstart', this._onTapStart);

      _off(el, 'dragover', this._onDragOver);
      _off(el, 'dragenter', this._onDragOver);

      //remove draggable attributes
      Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function(el) {
        el.removeAttribute('draggable');
      });

      touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

      this._onDrop();

      this.el = null;
    }
  };


  function _bind(ctx, fn){
    var args = slice.call(arguments, 2);
    return  fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function (){
      return fn.apply(ctx, args.concat(slice.call(arguments)));
    };
  }


  function _closest(el, selector, ctx){
    if( selector === '*' ){
      return el;
    }
    else if( el ){
      ctx = ctx || document;
      selector = selector.split('.');

      var
          tag = selector.shift().toUpperCase()
        , re = new RegExp('\\s('+selector.join('|')+')\\s', 'g')
      ;

      do {
        if(
             (tag === '' || el.nodeName == tag)
          && (!selector.length || ((' '+el.className+' ').match(re) || []).length == selector.length)
        ){
          return  el;
        }
      }
      while( el !== ctx && (el = el.parentNode) );
    }

    return  null;
  }


  function _globalDragOver(evt){
    evt.dataTransfer.dropEffect = 'move';
    evt.preventDefault();
  }


  function _on(el, event, fn){
    el.addEventListener(event, fn, false);
  }


  function _off(el, event, fn){
    el.removeEventListener(event, fn, false);
  }


  function _toggleClass(el, name, state){
    if( el ){
      if( el.classList ){
        el.classList[state ? 'add' : 'remove'](name);
      }
      else {
        var className = (' '+el.className+' ').replace(/\s+/g, ' ').replace(' '+name+' ', '');
        el.className = className + (state ? ' '+name : '')
      }
    }
  }


  function _css(el, prop, val){
    if( el && el.style ){
      if( val === void 0 ){
        if( document.defaultView && document.defaultView.getComputedStyle ){
          val = document.defaultView.getComputedStyle(el, '');
        }
        else if( el.currentStyle ){
          val = el.currentStyle;
        }
        return  prop === void 0 ? val : val[prop];
      } else {
        el.style[prop] = val + (typeof val === 'string' ? '' : 'px');
      }
    }
  }


  function _find(ctx, tagName, iterator){
    if( ctx ){
      var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;
      if( iterator ){
        for( ; i < n; i++ ){
          iterator(list[i], i);
        }
      }
      return  list;
    }
    return  [];
  }


  function _disableDraggable(el){
    return el.draggable = false;
  }


  function _unsilent(){
    _silent = false;
  }


  function _ghostInBottom(el, evt){
    var last = el.lastElementChild.getBoundingClientRect();
    return evt.clientY - (last.top + last.height) > 5; // min delta
  }


  /**
   * Generate id
   * @param   {HTMLElement} el
   * @returns {String}
   * @private
   */
  function _generateId(el) {
    var str = el.tagName + el.className + el.src + el.href + el.textContent,
      i = str.length,
      sum = 0
    ;

    while (i--) {
      sum += str.charCodeAt(i);
    }

    return sum.toString(36);
  }


  // Export utils
  Sortable.utils = {
    on: _on,
    off: _off,
    css: _css,
    find: _find,
    bind: _bind,
    closest: _closest,
    toggleClass: _toggleClass,
    createEvent: _createEvent,
    dispatchEvent: _dispatchEvent
  };


  Sortable.version = '0.5.2';


  // Export
  return Sortable;
});