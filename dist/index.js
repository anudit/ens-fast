"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/.pnpm/fastify-plugin@3.0.1/node_modules/fastify-plugin/stackParser.js
var require_stackParser = __commonJS({
  "../node_modules/.pnpm/fastify-plugin@3.0.1/node_modules/fastify-plugin/stackParser.js"(exports, module2) {
    "use strict";
    var fpStackTracePattern = /at\s{1}(?:.*\.)?plugin\s{1}.*\n\s*(.*)/;
    var fileNamePattern = /(\w*(\.\w*)*)\..*/;
    module2.exports = /* @__PURE__ */ __name(function extractPluginName(stack) {
      const m = stack.match(fpStackTracePattern);
      return m ? m[1].split(/[/\\]/).slice(-1)[0].match(fileNamePattern)[1] : "anonymous";
    }, "extractPluginName");
  }
});

// ../node_modules/.pnpm/fastify-plugin@3.0.1/node_modules/fastify-plugin/plugin.js
var require_plugin = __commonJS({
  "../node_modules/.pnpm/fastify-plugin@3.0.1/node_modules/fastify-plugin/plugin.js"(exports, module2) {
    "use strict";
    var extractPluginName = require_stackParser();
    var count = 0;
    function plugin(fn, options = {}) {
      let autoName = false;
      if (typeof fn.default !== "undefined") {
        fn = fn.default;
      }
      if (typeof fn !== "function") {
        throw new TypeError(
          `fastify-plugin expects a function, instead got a '${typeof fn}'`
        );
      }
      fn[Symbol.for("skip-override")] = true;
      const pluginName = options && options.name || checkName(fn);
      if (typeof options === "string") {
        options = {
          fastify: options
        };
      }
      if (typeof options !== "object" || Array.isArray(options) || options === null) {
        throw new TypeError("The options object should be an object");
      }
      if (options.fastify !== void 0 && typeof options.fastify !== "string") {
        throw new TypeError(`fastify-plugin expects a version string, instead got '${typeof options.fastify}'`);
      }
      if (!options.name) {
        autoName = true;
        options.name = pluginName + "-auto-" + count++;
      }
      fn[Symbol.for("fastify.display-name")] = options.name;
      fn[Symbol.for("plugin-meta")] = options;
      if (!fn.default) {
        fn.default = fn;
      }
      const camelCase = toCamelCase(options.name);
      if (!autoName && !fn[camelCase]) {
        fn[camelCase] = fn;
      }
      return fn;
    }
    __name(plugin, "plugin");
    function checkName(fn) {
      if (fn.name.length > 0)
        return fn.name;
      try {
        throw new Error("anonymous function");
      } catch (e) {
        return extractPluginName(e.stack);
      }
    }
    __name(checkName, "checkName");
    function toCamelCase(name) {
      const newName = name.replace(/-(.)/g, function(match, g1) {
        return g1.toUpperCase();
      });
      return newName;
    }
    __name(toCamelCase, "toCamelCase");
    plugin.default = plugin;
    module2.exports = plugin;
  }
});

// ../node_modules/.pnpm/random-bytes@1.0.0/node_modules/random-bytes/index.js
var require_random_bytes = __commonJS({
  "../node_modules/.pnpm/random-bytes@1.0.0/node_modules/random-bytes/index.js"(exports, module2) {
    "use strict";
    var crypto = require("crypto");
    var generateAttempts = crypto.randomBytes === crypto.pseudoRandomBytes ? 1 : 3;
    module2.exports = randomBytes;
    module2.exports.sync = randomBytesSync;
    function randomBytes(size, callback) {
      if (callback !== void 0 && typeof callback !== "function") {
        throw new TypeError("argument callback must be a function");
      }
      if (!callback && !global.Promise) {
        throw new TypeError("argument callback is required");
      }
      if (callback) {
        return generateRandomBytes(size, generateAttempts, callback);
      }
      return new Promise(/* @__PURE__ */ __name(function executor(resolve, reject) {
        generateRandomBytes(size, generateAttempts, /* @__PURE__ */ __name(function onRandomBytes(err, str) {
          if (err)
            return reject(err);
          resolve(str);
        }, "onRandomBytes"));
      }, "executor"));
    }
    __name(randomBytes, "randomBytes");
    function randomBytesSync(size) {
      var err = null;
      for (var i = 0; i < generateAttempts; i++) {
        try {
          return crypto.randomBytes(size);
        } catch (e) {
          err = e;
        }
      }
      throw err;
    }
    __name(randomBytesSync, "randomBytesSync");
    function generateRandomBytes(size, attempts, callback) {
      crypto.randomBytes(size, /* @__PURE__ */ __name(function onRandomBytes(err, buf) {
        if (!err)
          return callback(null, buf);
        if (!--attempts)
          return callback(err);
        setTimeout(generateRandomBytes.bind(null, size, attempts, callback), 10);
      }, "onRandomBytes"));
    }
    __name(generateRandomBytes, "generateRandomBytes");
  }
});

// ../node_modules/.pnpm/uid-safe@2.1.5/node_modules/uid-safe/index.js
var require_uid_safe = __commonJS({
  "../node_modules/.pnpm/uid-safe@2.1.5/node_modules/uid-safe/index.js"(exports, module2) {
    "use strict";
    var randomBytes = require_random_bytes();
    var EQUAL_END_REGEXP = /=+$/;
    var PLUS_GLOBAL_REGEXP = /\+/g;
    var SLASH_GLOBAL_REGEXP = /\//g;
    module2.exports = uid;
    module2.exports.sync = uidSync;
    function uid(length, callback) {
      if (callback !== void 0 && typeof callback !== "function") {
        throw new TypeError("argument callback must be a function");
      }
      if (!callback && !global.Promise) {
        throw new TypeError("argument callback is required");
      }
      if (callback) {
        return generateUid(length, callback);
      }
      return new Promise(/* @__PURE__ */ __name(function executor(resolve, reject) {
        generateUid(length, /* @__PURE__ */ __name(function onUid(err, str) {
          if (err)
            return reject(err);
          resolve(str);
        }, "onUid"));
      }, "executor"));
    }
    __name(uid, "uid");
    function uidSync(length) {
      return toString(randomBytes.sync(length));
    }
    __name(uidSync, "uidSync");
    function generateUid(length, callback) {
      randomBytes(length, function(err, buf) {
        if (err)
          return callback(err);
        callback(null, toString(buf));
      });
    }
    __name(generateUid, "generateUid");
    function toString(buf) {
      return buf.toString("base64").replace(EQUAL_END_REGEXP, "").replace(PLUS_GLOBAL_REGEXP, "-").replace(SLASH_GLOBAL_REGEXP, "_");
    }
    __name(toString, "toString");
  }
});

// ../node_modules/.pnpm/is-plain-obj@1.1.0/node_modules/is-plain-obj/index.js
var require_is_plain_obj = __commonJS({
  "../node_modules/.pnpm/is-plain-obj@1.1.0/node_modules/is-plain-obj/index.js"(exports, module2) {
    "use strict";
    var toString = Object.prototype.toString;
    module2.exports = function(x) {
      var prototype;
      return toString.call(x) === "[object Object]" && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
    };
  }
});

// ../node_modules/.pnpm/merge-options@1.0.1/node_modules/merge-options/index.js
var require_merge_options = __commonJS({
  "../node_modules/.pnpm/merge-options@1.0.1/node_modules/merge-options/index.js"(exports, module2) {
    "use strict";
    var isOptionObject = require_is_plain_obj();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.propertyIsEnumerable;
    var defineProperty = /* @__PURE__ */ __name((obj, name, value) => Object.defineProperty(obj, name, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    }), "defineProperty");
    var globalThis = exports;
    var defaultMergeOpts = {
      concatArrays: false
    };
    var getEnumerableOwnPropertyKeys = /* @__PURE__ */ __name((value) => {
      const keys = [];
      for (const key in value) {
        if (hasOwnProperty.call(value, key)) {
          keys.push(key);
        }
      }
      if (Object.getOwnPropertySymbols) {
        const symbols = Object.getOwnPropertySymbols(value);
        for (let i = 0; i < symbols.length; i++) {
          if (propIsEnumerable.call(value, symbols[i])) {
            keys.push(symbols[i]);
          }
        }
      }
      return keys;
    }, "getEnumerableOwnPropertyKeys");
    function clone(value) {
      if (Array.isArray(value)) {
        return cloneArray(value);
      }
      if (isOptionObject(value)) {
        return cloneOptionObject(value);
      }
      return value;
    }
    __name(clone, "clone");
    function cloneArray(array) {
      const result = array.slice(0, 0);
      getEnumerableOwnPropertyKeys(array).forEach((key) => {
        defineProperty(result, key, clone(array[key]));
      });
      return result;
    }
    __name(cloneArray, "cloneArray");
    function cloneOptionObject(obj) {
      const result = Object.getPrototypeOf(obj) === null ? /* @__PURE__ */ Object.create(null) : {};
      getEnumerableOwnPropertyKeys(obj).forEach((key) => {
        defineProperty(result, key, clone(obj[key]));
      });
      return result;
    }
    __name(cloneOptionObject, "cloneOptionObject");
    var mergeKeys = /* @__PURE__ */ __name((merged, source, keys, mergeOpts) => {
      keys.forEach((key) => {
        if (key in merged && merged[key] !== Object.getPrototypeOf(merged)) {
          defineProperty(merged, key, merge(merged[key], source[key], mergeOpts));
        } else {
          defineProperty(merged, key, clone(source[key]));
        }
      });
      return merged;
    }, "mergeKeys");
    var concatArrays = /* @__PURE__ */ __name((merged, source, mergeOpts) => {
      let result = merged.slice(0, 0);
      let resultIndex = 0;
      [merged, source].forEach((array) => {
        const indices = [];
        for (let k = 0; k < array.length; k++) {
          if (!hasOwnProperty.call(array, k)) {
            continue;
          }
          indices.push(String(k));
          if (array === merged) {
            defineProperty(result, resultIndex++, array[k]);
          } else {
            defineProperty(result, resultIndex++, clone(array[k]));
          }
        }
        result = mergeKeys(result, array, getEnumerableOwnPropertyKeys(array).filter((key) => {
          return indices.indexOf(key) === -1;
        }), mergeOpts);
      });
      return result;
    }, "concatArrays");
    function merge(merged, source, mergeOpts) {
      if (mergeOpts.concatArrays && Array.isArray(merged) && Array.isArray(source)) {
        return concatArrays(merged, source, mergeOpts);
      }
      if (!isOptionObject(source) || !isOptionObject(merged)) {
        return clone(source);
      }
      return mergeKeys(merged, source, getEnumerableOwnPropertyKeys(source), mergeOpts);
    }
    __name(merge, "merge");
    module2.exports = function() {
      const mergeOpts = merge(clone(defaultMergeOpts), this !== globalThis && this || {}, defaultMergeOpts);
      let merged = { foobar: {} };
      for (let i = 0; i < arguments.length; i++) {
        const option = arguments[i];
        if (option === void 0) {
          continue;
        }
        if (!isOptionObject(option)) {
          throw new TypeError("`" + option + "` is not an Option Object");
        }
        merged = merge(merged, { foobar: option }, mergeOpts);
      }
      return merged.foobar;
    };
  }
});

// ../node_modules/.pnpm/lru_map@0.3.3/node_modules/lru_map/lru.js
var require_lru = __commonJS({
  "../node_modules/.pnpm/lru_map@0.3.3/node_modules/lru_map/lru.js"(exports) {
    (function(g, f) {
      const e = typeof exports == "object" ? exports : typeof g == "object" ? g : {};
      f(e);
      if (typeof define == "function" && define.amd) {
        define("lru", e);
      }
    })(exports, function(exports2) {
      const NEWER = Symbol("newer");
      const OLDER = Symbol("older");
      function LRUMap(limit, entries) {
        if (typeof limit !== "number") {
          entries = limit;
          limit = 0;
        }
        this.size = 0;
        this.limit = limit;
        this.oldest = this.newest = void 0;
        this._keymap = /* @__PURE__ */ new Map();
        if (entries) {
          this.assign(entries);
          if (limit < 1) {
            this.limit = this.size;
          }
        }
      }
      __name(LRUMap, "LRUMap");
      exports2.LRUMap = LRUMap;
      function Entry(key, value) {
        this.key = key;
        this.value = value;
        this[NEWER] = void 0;
        this[OLDER] = void 0;
      }
      __name(Entry, "Entry");
      LRUMap.prototype._markEntryAsUsed = function(entry) {
        if (entry === this.newest) {
          return;
        }
        if (entry[NEWER]) {
          if (entry === this.oldest) {
            this.oldest = entry[NEWER];
          }
          entry[NEWER][OLDER] = entry[OLDER];
        }
        if (entry[OLDER]) {
          entry[OLDER][NEWER] = entry[NEWER];
        }
        entry[NEWER] = void 0;
        entry[OLDER] = this.newest;
        if (this.newest) {
          this.newest[NEWER] = entry;
        }
        this.newest = entry;
      };
      LRUMap.prototype.assign = function(entries) {
        let entry, limit = this.limit || Number.MAX_VALUE;
        this._keymap.clear();
        let it = entries[Symbol.iterator]();
        for (let itv = it.next(); !itv.done; itv = it.next()) {
          let e = new Entry(itv.value[0], itv.value[1]);
          this._keymap.set(e.key, e);
          if (!entry) {
            this.oldest = e;
          } else {
            entry[NEWER] = e;
            e[OLDER] = entry;
          }
          entry = e;
          if (limit-- == 0) {
            throw new Error("overflow");
          }
        }
        this.newest = entry;
        this.size = this._keymap.size;
      };
      LRUMap.prototype.get = function(key) {
        var entry = this._keymap.get(key);
        if (!entry)
          return;
        this._markEntryAsUsed(entry);
        return entry.value;
      };
      LRUMap.prototype.set = function(key, value) {
        var entry = this._keymap.get(key);
        if (entry) {
          entry.value = value;
          this._markEntryAsUsed(entry);
          return this;
        }
        this._keymap.set(key, entry = new Entry(key, value));
        if (this.newest) {
          this.newest[NEWER] = entry;
          entry[OLDER] = this.newest;
        } else {
          this.oldest = entry;
        }
        this.newest = entry;
        ++this.size;
        if (this.size > this.limit) {
          this.shift();
        }
        return this;
      };
      LRUMap.prototype.shift = function() {
        var entry = this.oldest;
        if (entry) {
          if (this.oldest[NEWER]) {
            this.oldest = this.oldest[NEWER];
            this.oldest[OLDER] = void 0;
          } else {
            this.oldest = void 0;
            this.newest = void 0;
          }
          entry[NEWER] = entry[OLDER] = void 0;
          this._keymap.delete(entry.key);
          --this.size;
          return [entry.key, entry.value];
        }
      };
      LRUMap.prototype.find = function(key) {
        let e = this._keymap.get(key);
        return e ? e.value : void 0;
      };
      LRUMap.prototype.has = function(key) {
        return this._keymap.has(key);
      };
      LRUMap.prototype["delete"] = function(key) {
        var entry = this._keymap.get(key);
        if (!entry)
          return;
        this._keymap.delete(entry.key);
        if (entry[NEWER] && entry[OLDER]) {
          entry[OLDER][NEWER] = entry[NEWER];
          entry[NEWER][OLDER] = entry[OLDER];
        } else if (entry[NEWER]) {
          entry[NEWER][OLDER] = void 0;
          this.oldest = entry[NEWER];
        } else if (entry[OLDER]) {
          entry[OLDER][NEWER] = void 0;
          this.newest = entry[OLDER];
        } else {
          this.oldest = this.newest = void 0;
        }
        this.size--;
        return entry.value;
      };
      LRUMap.prototype.clear = function() {
        this.oldest = this.newest = void 0;
        this.size = 0;
        this._keymap.clear();
      };
      function EntryIterator(oldestEntry) {
        this.entry = oldestEntry;
      }
      __name(EntryIterator, "EntryIterator");
      EntryIterator.prototype[Symbol.iterator] = function() {
        return this;
      };
      EntryIterator.prototype.next = function() {
        let ent = this.entry;
        if (ent) {
          this.entry = ent[NEWER];
          return { done: false, value: [ent.key, ent.value] };
        } else {
          return { done: true, value: void 0 };
        }
      };
      function KeyIterator(oldestEntry) {
        this.entry = oldestEntry;
      }
      __name(KeyIterator, "KeyIterator");
      KeyIterator.prototype[Symbol.iterator] = function() {
        return this;
      };
      KeyIterator.prototype.next = function() {
        let ent = this.entry;
        if (ent) {
          this.entry = ent[NEWER];
          return { done: false, value: ent.key };
        } else {
          return { done: true, value: void 0 };
        }
      };
      function ValueIterator(oldestEntry) {
        this.entry = oldestEntry;
      }
      __name(ValueIterator, "ValueIterator");
      ValueIterator.prototype[Symbol.iterator] = function() {
        return this;
      };
      ValueIterator.prototype.next = function() {
        let ent = this.entry;
        if (ent) {
          this.entry = ent[NEWER];
          return { done: false, value: ent.value };
        } else {
          return { done: true, value: void 0 };
        }
      };
      LRUMap.prototype.keys = function() {
        return new KeyIterator(this.oldest);
      };
      LRUMap.prototype.values = function() {
        return new ValueIterator(this.oldest);
      };
      LRUMap.prototype.entries = function() {
        return this;
      };
      LRUMap.prototype[Symbol.iterator] = function() {
        return new EntryIterator(this.oldest);
      };
      LRUMap.prototype.forEach = function(fun, thisObj) {
        if (typeof thisObj !== "object") {
          thisObj = this;
        }
        let entry = this.oldest;
        while (entry) {
          fun.call(thisObj, entry.value, entry.key, this);
          entry = entry[NEWER];
        }
      };
      LRUMap.prototype.toJSON = function() {
        var s = new Array(this.size), i = 0, entry = this.oldest;
        while (entry) {
          s[i++] = { key: entry.key, value: entry.value };
          entry = entry[NEWER];
        }
        return s;
      };
      LRUMap.prototype.toString = function() {
        var s = "", entry = this.oldest;
        while (entry) {
          s += String(entry.key) + ":" + entry.value;
          entry = entry[NEWER];
          if (entry) {
            s += " < ";
          }
        }
        return s;
      };
    });
  }
});

// ../node_modules/.pnpm/clone@2.1.2/node_modules/clone/clone.js
var require_clone = __commonJS({
  "../node_modules/.pnpm/clone@2.1.2/node_modules/clone/clone.js"(exports, module2) {
    var clone = function() {
      "use strict";
      function _instanceof(obj, type) {
        return type != null && obj instanceof type;
      }
      __name(_instanceof, "_instanceof");
      var nativeMap;
      try {
        nativeMap = Map;
      } catch (_) {
        nativeMap = /* @__PURE__ */ __name(function() {
        }, "nativeMap");
      }
      var nativeSet;
      try {
        nativeSet = Set;
      } catch (_) {
        nativeSet = /* @__PURE__ */ __name(function() {
        }, "nativeSet");
      }
      var nativePromise;
      try {
        nativePromise = Promise;
      } catch (_) {
        nativePromise = /* @__PURE__ */ __name(function() {
        }, "nativePromise");
      }
      function clone2(parent, circular, depth, prototype, includeNonEnumerable) {
        if (typeof circular === "object") {
          depth = circular.depth;
          prototype = circular.prototype;
          includeNonEnumerable = circular.includeNonEnumerable;
          circular = circular.circular;
        }
        var allParents = [];
        var allChildren = [];
        var useBuffer = typeof Buffer != "undefined";
        if (typeof circular == "undefined")
          circular = true;
        if (typeof depth == "undefined")
          depth = Infinity;
        function _clone(parent2, depth2) {
          if (parent2 === null)
            return null;
          if (depth2 === 0)
            return parent2;
          var child;
          var proto;
          if (typeof parent2 != "object") {
            return parent2;
          }
          if (_instanceof(parent2, nativeMap)) {
            child = new nativeMap();
          } else if (_instanceof(parent2, nativeSet)) {
            child = new nativeSet();
          } else if (_instanceof(parent2, nativePromise)) {
            child = new nativePromise(function(resolve, reject) {
              parent2.then(function(value) {
                resolve(_clone(value, depth2 - 1));
              }, function(err) {
                reject(_clone(err, depth2 - 1));
              });
            });
          } else if (clone2.__isArray(parent2)) {
            child = [];
          } else if (clone2.__isRegExp(parent2)) {
            child = new RegExp(parent2.source, __getRegExpFlags(parent2));
            if (parent2.lastIndex)
              child.lastIndex = parent2.lastIndex;
          } else if (clone2.__isDate(parent2)) {
            child = new Date(parent2.getTime());
          } else if (useBuffer && Buffer.isBuffer(parent2)) {
            if (Buffer.allocUnsafe) {
              child = Buffer.allocUnsafe(parent2.length);
            } else {
              child = new Buffer(parent2.length);
            }
            parent2.copy(child);
            return child;
          } else if (_instanceof(parent2, Error)) {
            child = Object.create(parent2);
          } else {
            if (typeof prototype == "undefined") {
              proto = Object.getPrototypeOf(parent2);
              child = Object.create(proto);
            } else {
              child = Object.create(prototype);
              proto = prototype;
            }
          }
          if (circular) {
            var index = allParents.indexOf(parent2);
            if (index != -1) {
              return allChildren[index];
            }
            allParents.push(parent2);
            allChildren.push(child);
          }
          if (_instanceof(parent2, nativeMap)) {
            parent2.forEach(function(value, key) {
              var keyChild = _clone(key, depth2 - 1);
              var valueChild = _clone(value, depth2 - 1);
              child.set(keyChild, valueChild);
            });
          }
          if (_instanceof(parent2, nativeSet)) {
            parent2.forEach(function(value) {
              var entryChild = _clone(value, depth2 - 1);
              child.add(entryChild);
            });
          }
          for (var i in parent2) {
            var attrs;
            if (proto) {
              attrs = Object.getOwnPropertyDescriptor(proto, i);
            }
            if (attrs && attrs.set == null) {
              continue;
            }
            child[i] = _clone(parent2[i], depth2 - 1);
          }
          if (Object.getOwnPropertySymbols) {
            var symbols = Object.getOwnPropertySymbols(parent2);
            for (var i = 0; i < symbols.length; i++) {
              var symbol = symbols[i];
              var descriptor = Object.getOwnPropertyDescriptor(parent2, symbol);
              if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
                continue;
              }
              child[symbol] = _clone(parent2[symbol], depth2 - 1);
              if (!descriptor.enumerable) {
                Object.defineProperty(child, symbol, {
                  enumerable: false
                });
              }
            }
          }
          if (includeNonEnumerable) {
            var allPropertyNames = Object.getOwnPropertyNames(parent2);
            for (var i = 0; i < allPropertyNames.length; i++) {
              var propertyName = allPropertyNames[i];
              var descriptor = Object.getOwnPropertyDescriptor(parent2, propertyName);
              if (descriptor && descriptor.enumerable) {
                continue;
              }
              child[propertyName] = _clone(parent2[propertyName], depth2 - 1);
              Object.defineProperty(child, propertyName, {
                enumerable: false
              });
            }
          }
          return child;
        }
        __name(_clone, "_clone");
        return _clone(parent, depth);
      }
      __name(clone2, "clone");
      clone2.clonePrototype = /* @__PURE__ */ __name(function clonePrototype(parent) {
        if (parent === null)
          return null;
        var c = /* @__PURE__ */ __name(function() {
        }, "c");
        c.prototype = parent;
        return new c();
      }, "clonePrototype");
      function __objToStr(o) {
        return Object.prototype.toString.call(o);
      }
      __name(__objToStr, "__objToStr");
      clone2.__objToStr = __objToStr;
      function __isDate(o) {
        return typeof o === "object" && __objToStr(o) === "[object Date]";
      }
      __name(__isDate, "__isDate");
      clone2.__isDate = __isDate;
      function __isArray(o) {
        return typeof o === "object" && __objToStr(o) === "[object Array]";
      }
      __name(__isArray, "__isArray");
      clone2.__isArray = __isArray;
      function __isRegExp(o) {
        return typeof o === "object" && __objToStr(o) === "[object RegExp]";
      }
      __name(__isRegExp, "__isRegExp");
      clone2.__isRegExp = __isRegExp;
      function __getRegExpFlags(re) {
        var flags = "";
        if (re.global)
          flags += "g";
        if (re.ignoreCase)
          flags += "i";
        if (re.multiline)
          flags += "m";
        return flags;
      }
      __name(__getRegExpFlags, "__getRegExpFlags");
      clone2.__getRegExpFlags = __getRegExpFlags;
      return clone2;
    }();
    if (typeof module2 === "object" && module2.exports) {
      module2.exports = clone;
    }
  }
});

// ../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/lib/memclient.js
var require_memclient = __commonJS({
  "../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/lib/memclient.js"(exports, module2) {
    "use strict";
    var LMap = require_lru().LRUMap;
    var clone = require_clone();
    function mapKey(key, segment) {
      if (typeof key === "string")
        return `${segment}:${key}`;
      return `${key.segment || segment}:${key.id}`;
    }
    __name(mapKey, "mapKey");
    var cacheProto = {
      delete: function(key, callback) {
        this._cache.delete(mapKey(key, this._segment));
        callback(null);
      },
      get: function(key, callback) {
        const _key = mapKey(key, this._segment);
        const obj = this._cache.get(_key);
        if (!obj)
          return callback(null, null);
        const now = Date.now();
        const expires = obj.ttl + obj.stored;
        const ttl = expires - now;
        if (ttl < 0) {
          this._cache.delete(_key);
          return callback(null, null);
        }
        callback(null, {
          item: clone(obj.item),
          stored: obj.stored,
          ttl
        });
      },
      has: function(key, callback) {
        callback(null, this._cache.has(mapKey(key, this._segment)));
      },
      set: function(key, value, ttl, callback) {
        this._cache.set(mapKey(key, this._segment), {
          ttl,
          item: value,
          stored: Date.now()
        });
        callback(null);
      }
    };
    module2.exports = function(config) {
      const _config = config || {};
      const _segment = _config.segment || "abstractMemcache";
      const _maxItems = _config.maxItems && Number.isInteger(_config.maxItems) ? _config.maxItems : 1e5;
      const map = new LMap(_maxItems);
      const cache = Object.create(cacheProto);
      Object.defineProperties(cache, {
        await: {
          value: false
        },
        _cache: {
          enumerable: false,
          value: map
        },
        _segment: {
          enumerable: false,
          value: _segment
        }
      });
      return cache;
    };
  }
});

// ../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/lib/wrapCB.js
var require_wrapCB = __commonJS({
  "../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/lib/wrapCB.js"(exports, module2) {
    "use strict";
    var proto = {
      delete: function(key) {
        return new Promise((resolve, reject) => {
          this.client.delete(key, (err) => {
            if (err)
              return reject(err);
            resolve();
          });
        });
      },
      get: function(key) {
        return new Promise((resolve, reject) => {
          this.client.get(key, (err, result) => {
            if (err)
              return reject(err);
            resolve(result);
          });
        });
      },
      has: function(key) {
        return new Promise((resolve, reject) => {
          this.client.has(key, (err, result) => {
            if (err)
              return reject(err);
            resolve(result);
          });
        });
      },
      set: function(key, value, ttl) {
        return new Promise((resolve, reject) => {
          this.client.set(key, value, ttl, (err) => {
            if (err)
              return reject(err);
            resolve();
          });
        });
      }
    };
    function start() {
      return new Promise((resolve, reject) => {
        this.client.start((err) => {
          if (err)
            return reject(err);
          resolve();
        });
      });
    }
    __name(start, "start");
    function stop() {
      return new Promise((resolve, reject) => {
        this.client.stop((err) => {
          if (err)
            return reject(err);
          resolve();
        });
      });
    }
    __name(stop, "stop");
    module2.exports = /* @__PURE__ */ __name(function abstractCacheWrapCB(client) {
      const instance = Object.create(proto);
      Object.defineProperty(instance, "client", {
        enumerable: false,
        value: client
      });
      if (client.start) {
        instance.start = start.bind(instance);
        instance.stop = stop.bind(instance);
      }
      return instance;
    }, "abstractCacheWrapCB");
  }
});

// ../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/lib/wrapAwait.js
var require_wrapAwait = __commonJS({
  "../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/lib/wrapAwait.js"(exports, module2) {
    "use strict";
    var proto = {
      delete: function(key, callback) {
        this.client.delete(key).then(() => callback(null)).catch(callback);
      },
      get: function(key, callback) {
        this.client.get(key).then((result) => callback(null, result)).catch(callback);
      },
      has: function(key, callback) {
        this.client.has(key).then((result) => callback(null, result)).catch(callback);
      },
      set: function(key, value, ttl, callback) {
        this.client.set(key, value, ttl).then((result) => callback(null, result)).catch(callback);
      }
    };
    function start(callback) {
      this.client.start().then(() => callback(null)).catch((err) => callback(err));
    }
    __name(start, "start");
    function stop(callback) {
      this.client.stop().then(() => callback(null)).catch((err) => callback(err));
    }
    __name(stop, "stop");
    module2.exports = function(client) {
      const instance = Object.create(proto);
      Object.defineProperty(instance, "client", {
        enumerable: false,
        value: client
      });
      if (client.start) {
        instance.start = start.bind(instance);
        instance.stop = stop.bind(instance);
      }
      return instance;
    };
  }
});

// ../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/index.js
var require_abstract_cache = __commonJS({
  "../node_modules/.pnpm/abstract-cache@1.0.1/node_modules/abstract-cache/index.js"(exports, module2) {
    "use strict";
    var merge = require_merge_options();
    var defaultOptions = {
      useAwait: false,
      client: void 0,
      driver: {
        name: void 0,
        options: {}
      }
    };
    module2.exports = /* @__PURE__ */ __name(function abstractCache(options) {
      const opts = merge({}, defaultOptions, options);
      let client;
      if (opts.client) {
        client = opts.client;
      } else if (!opts.driver.name) {
        client = require_memclient()(opts.driver.options);
      } else {
        client = require(opts.driver.name)(opts.driver.options);
      }
      if (opts.useAwait === true && client.await === true) {
        return client;
      } else if (opts.useAwait === true && !client.await) {
        return require_wrapCB()(client);
      } else if (opts.useAwait === false && client.await === true) {
        return require_wrapAwait()(client);
      }
      return client;
    }, "abstractCache");
    module2.exports.memclient = require_memclient();
  }
});

// ../node_modules/.pnpm/@fastify+caching@8.0.1/node_modules/@fastify/caching/plugin.js
var require_plugin2 = __commonJS({
  "../node_modules/.pnpm/@fastify+caching@8.0.1/node_modules/@fastify/caching/plugin.js"(exports, module2) {
    "use strict";
    var fp = require_plugin();
    var uidSafe = require_uid_safe();
    var abstractCache = require_abstract_cache();
    var defaultOptions = {
      expiresIn: void 0,
      serverExpiresIn: void 0,
      privacy: void 0,
      cache: void 0,
      cacheSegment: "fastify-caching"
    };
    function cachingExpires(date) {
      if (!date)
        return this;
      this.header("Expires", Date.prototype.isPrototypeOf(date) ? date.toUTCString() : date);
      return this;
    }
    __name(cachingExpires, "cachingExpires");
    function etag(value, lifetime) {
      if (value) {
        this.header("ETag", value);
      } else {
        this.header("ETag", uidSafe.sync(18));
      }
      this._etagLife = Number.isInteger(lifetime) ? lifetime : 36e5;
      return this;
    }
    __name(etag, "etag");
    function etagHandleRequest(req, res, next) {
      if (!req.headers["if-none-match"])
        return next();
      const etag2 = req.headers["if-none-match"];
      this.cache.get({ id: etag2, segment: this.cacheSegment }, (err, cached) => {
        if (err)
          return next(err);
        if (cached && cached.item) {
          return res.status(304).send();
        }
        next();
      });
    }
    __name(etagHandleRequest, "etagHandleRequest");
    function etagOnSend(req, res, payload, next) {
      const etag2 = res.getHeader("etag");
      if (!etag2 || !res._etagLife)
        return next();
      this.cache.set(
        { id: etag2, segment: this.cacheSegment },
        true,
        res._etagLife,
        (err) => next(err, payload)
      );
    }
    __name(etagOnSend, "etagOnSend");
    function fastifyCachingPlugin(instance, options, next) {
      let _options;
      if (Function.prototype.isPrototypeOf(options)) {
        _options = Object.assign({}, defaultOptions);
      } else {
        _options = Object.assign({}, defaultOptions, options);
      }
      if (!_options.cache)
        _options.cache = abstractCache();
      if (_options.privacy) {
        let value = _options.privacy;
        if (_options.privacy.toLowerCase() !== "no-cache" && _options.expiresIn) {
          value = `${_options.privacy}, max-age=${_options.expiresIn}`;
        }
        if (_options.privacy !== void 0 && _options.privacy.toLowerCase() === "public" && _options.serverExpiresIn) {
          value += `, s-maxage=${_options.serverExpiresIn}`;
        }
        instance.addHook("onRequest", (req, res, next2) => {
          res.header("Cache-control", value);
          next2();
        });
      }
      instance.decorate("cache", _options.cache);
      instance.decorate("cacheSegment", _options.cacheSegment);
      instance.decorate("etagMaxLife", _options.etagMaxLife);
      instance.decorateReply("etag", etag);
      instance.decorateReply("expires", cachingExpires);
      instance.addHook("onRequest", etagHandleRequest);
      instance.addHook("onSend", etagOnSend);
      instance[Symbol.for("fastify-caching.registered")] = true;
      next();
    }
    __name(fastifyCachingPlugin, "fastifyCachingPlugin");
    module2.exports = fp(fastifyCachingPlugin, {
      fastify: "4.x",
      name: "@fastify/caching"
    });
    module2.exports.privacy = {
      NOCACHE: "no-cache",
      PUBLIC: "public",
      PRIVATE: "private"
    };
  }
});

// src/index.ts
var import_fastify = __toESM(require("fastify"));
var import_helmet = __toESM(require("@fastify/helmet"));
var import_compress = __toESM(require("@fastify/compress"));
var import_cors = __toESM(require("@fastify/cors"));
var import_caching = __toESM(require_plugin2());
var import_fs = require("fs");
var import_path = __toESM(require("path"));
"strict";
var server = (0, import_fastify.default)({ logger: false });
var bfj = require("bfj");
var MegaHash = require("megahash");
server.register(import_helmet.default, { global: true }).register(import_compress.default, { global: true }).register(import_cors.default, { origin: "*" }).register(
  import_caching.default,
  { privacy: import_caching.default.privacy.PUBLIC }
);
var hashTable = new MegaHash();
server.get("/resolve/ens/:ensName", async (req, reply) => {
  const { ensName } = req.params;
  const resp = hashTable.get(ensName);
  if (!resp) {
    return reply.send({
      success: false
    });
  } else {
    return reply.send({
      address: resp
    });
  }
});
server.get("/", async (req, reply) => {
  return reply.send({ "hello": "world" });
});
async function erecto() {
  console.time("Compiled HashTable");
  console.log("Compiling HashTable");
  const emitter = bfj.walk((0, import_fs.createReadStream)(import_path.default.join(__dirname, "../../data/ensToAdd.json")), { encoding: "utf8", flag: "r" });
  let lastEnsName = "";
  emitter.on(bfj.events.property, (name) => {
    lastEnsName = name;
  });
  emitter.on(bfj.events.string, (value) => {
    hashTable.set(lastEnsName, value);
  });
  emitter.on(bfj.events.end, () => {
    console.timeEnd("Compiled HashTable");
    console.log(hashTable.stats());
    console.log("Starting Server");
    server.listen({ port: parseInt(process.env.PORT) || 3002, host: "0.0.0.0" }, (err, address) => {
      if (!err)
        console.log("\u{1F680} Server is listening on", address);
      else
        throw err;
    });
  });
}
__name(erecto, "erecto");
erecto();
/*!
 * random-bytes
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * uid-safe
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
