define(['app', 'underscore'], function (app, _) {

  'use strict';

  return {
    
    storage: window.localStorage,

    save: function (key, value) {
      this.storage.setItem(key, value)
    },

    saveMulti: function (items) {
      items.forEach(item => this.save(item.key, item.value))
    },

    read: function (key) {
      return this.storage.getItem(key)
    },

    readMulti: function (keys) {
      return keys.map(key => this.read(key))
    },

    clear: function (key, clearAll = false) {
      if (clearAll) {
        this.storage.clear()
      } else {
        this.storage.removeItem(key)
      }
    },

    clearMulti: function (keys) {
      keys.forEach(key => this.clear(key))
    }
  }
})
