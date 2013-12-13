// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 27576;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });
var ___fsmu8;
var ___dso_handle;
var ___dso_handle=___dso_handle=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,168,77,0,0,40,1,0,0,176,0,0,0,76,0,0,0,182,0,0,0,8,0,0,0,10,0,0,0,8,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,184,77,0,0,40,1,0,0,32,1,0,0,76,0,0,0,182,0,0,0,8,0,0,0,30,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZN5capnp1_12BuilderArenaC1EPNS_14MessageBuilderE;
var __ZN5capnp1_12BuilderArenaD1Ev;
var __ZN5capnp20MallocMessageBuilderC1EjNS_18AllocationStrategyE;
var __ZN5capnp20MallocMessageBuilderD1Ev;
var __ZN5capnp12DynamicValue6ReaderD1Ev;
var __ZN2kj10StringTreeC1EONS_5ArrayIS0_EENS_9StringPtrE;
var __ZN2kj9ExceptionC1ENS0_6NatureENS0_10DurabilityEPKciNS_6StringE;
var __ZN2kj9ExceptionD1Ev;
var __ZN2kj1_5Debug5FaultD1Ev;
var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
/* memory initializer */ allocate([0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,74,117,108,0,0,0,0,0,74,117,110,0,0,0,0,0,65,112,114,0,0,0,0,0,86,97,108,117,101,32,111,117,116,45,111,102,45,114,97,110,103,101,32,102,111,114,32,114,101,113,117,101,115,116,101,100,32,116,121,112,101,46,0,0,77,97,114,0,0,0,0,0,34,86,97,108,117,101,32,111,117,116,45,111,102,45,114,97,110,103,101,32,102,111,114,32,114,101,113,117,101,115,116,101,100,32,116,121,112,101,46,34,44,32,118,97,108,117,101,0,70,101,98,0,0,0,0,0,37,108,108,100,0,0,0,0,92,116,0,0,0,0,0,0,84,40,118,97,108,117,101,41,32,61,61,32,118,97,108,117,101,0,0,0,0,0,0,0,74,97,110,0,0,0,0,0,32,110,97,109,101,115,58,32,0,0,0,0,0,0,0,0,96,102,105,101,108,100,96,32,105,115,32,110,111,116,32,97,32,102,105,101,108,100,32,111,102,32,116,104,105,115,32,115,116,114,117,99,116,46,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,58,32,99,111,110,116,101,120,116,58,32,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,103,101,116,80,114,111,116,111,40,41,46,105,115,73,110,116,101,114,102,97,99,101,40,41,0,0,0,0,0,0,0,0,70,105,114,115,116,32,97,108,108,111,99,97,116,101,100,32,119,111,114,100,32,111,102,32,110,101,119,32,97,114,101,110,97,32,119,97,115,32,110,111,116,32,116,104,101,32,102,105,114,115,116,32,119,111,114,100,32,105,110,32,105,116,115,32,115,101,103,109,101,110,116,46,0,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,34,73,110,118,97,108,105,100,32,99,97,112,97,98,105,108,105,116,121,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,109,101,115,115,97,103,101,46,34,0,0,0,0,0,65,117,103,117,115,116,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,65,112,114,105,108,0,0,0,92,114,0,0,0,0,0,0,77,97,114,99,104,0,0,0,70,97,105,108,101,100,32,116,111,32,112,97,114,115,101,32,108,111,103,103,105,110,103,32,109,97,99,114,111,32,97,114,103,115,32,105,110,116,111,32,0,0,0,0,0,0,0,0,34,96,102,105,101,108,100,96,32,105,115,32,110,111,116,32,97,32,102,105,101,108,100,32,111,102,32,116,104,105,115,32,115,116,114,117,99,116,46,34,0,0,0,0,0,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,58,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,84,114,105,101,100,32,116,111,32,117,115,101,32,110,111,110,45,101,110,117,109,32,115,99,104,101,109,97,32,97,115,32,97,110,32,101,110,117,109,46,0,0,0,0,0,0,0,0,34,70,105,114,115,116,32,97,108,108,111,99,97,116,101,100,32,119,111,114,100,32,111,102,32,110,101,119,32,97,114,101,110,97,32,119,97,115,32,110,111,116,32,116,104,101,32,102,105,114,115,116,32,119,111,114,100,32,105,110,32,105,116,115,32,115,101,103,109,101,110,116,46,34,0,0,0,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,105,110,100,101,120,32,60,32,99,97,112,84,97,98,108,101,46,115,105,122,101,40,41,0,114,101,97,100,101,114,46,116,121,112,101,32,61,61,32,68,65,84,65,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,115,116,114,117,99,116,32,112,111,105,110,116,101,114,46,0,92,110,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,115,114,99,47,107,106,47,100,101,98,117,103,46,99,43,43,0,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,115,116,114,117,99,116,32,112,111,105,110,116,101,114,46,34,0,0,0,0,0,0,0,102,105,101,108,100,46,103,101,116,67,111,110,116,97,105,110,105,110,103,83,116,114,117,99,116,40,41,32,61,61,32,115,99,104,101,109,97,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,98,111,117,110,100,115,67,104,101,99,107,40,115,101,103,109,101,110,116,44,32,112,116,114,44,32,112,116,114,32,43,32,114,101,102,45,62,115,116,114,117,99,116,82,101,102,46,119,111,114,100,83,105,122,101,40,41,41,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,115,116,114,117,99,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,115,116,114,117,99,116,32,112,111,105,110,116,101,114,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,34,84,114,105,101,100,32,116,111,32,117,115,101,32,110,111,110,45,101,110,117,109,32,115,99,104,101,109,97,32,97,115,32,97,110,32,101,110,117,109,46,34,44,32,103,101,116,80,114,111,116,111,40,41,46,103,101,116,68,105,115,112,108,97,121,78,97,109,101,40,41,0,53,53,53,45,55,54,53,52,0,0,0,0,0,0,0,0,97,108,108,111,99,97,116,105,111,110,46,119,111,114,100,115,32,61,61,32,97,108,108,111,99,97,116,105,111,110,46,115,101,103,109,101,110,116,45,62,103,101,116,80,116,114,85,110,99,104,101,99,107,101,100,40,48,32,42,32,87,79,82,68,83,41,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,115,116,114,117,99,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,115,116,114,117,99,116,32,112,111,105,110,116,101,114,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,114,101,102,45,62,107,105,110,100,40,41,32,61,61,32,87,105,114,101,80,111,105,110,116,101,114,58,58,83,84,82,85,67,84,0,0,0,0,0,0,82,101,97,100,32,108,105,109,105,116,32,114,101,97,99,104,101,100,32,102,111,114,32,66,117,105,108,100,101,114,65,114,101,110,97,44,32,98,117,116,32,105,116,32,115,104,111,117,108,100,32,104,97,118,101,32,98,101,101,110,32,117,110,108,105,109,105,116,101,100,46,0,114,101,97,100,101,114,46,116,121,112,101,32,61,61,32,69,78,85,77,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,101,120,112,101,99,116,101,100,80,111,105,110,116,101,114,115,80,101,114,69,108,101,109,101,110,116,32,60,61,32,112,111,105,110,116,101,114,67,111,117,110,116,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,108,105,115,116,32,119,105,116,104,32,105,110,99,111,109,112,97,116,105,98,108,101,32,101,108,101,109,101,110,116,32,116,121,112,101,46,0,0,114,101,97,100,101,114,46,116,121,112,101,32,61,61,32,83,84,82,85,67,84,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,108,105,115,116,32,119,105,116,104,32,105,110,99,111,109,112,97,116,105,98,108,101,32,101,108,101,109,101,110,116,32,116,121,112,101,46,34,0,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,101,120,112,101,99,116,101,100,68,97,116,97,66,105,116,115,80,101,114,69,108,101,109,101,110,116,32,60,61,32,100,97,116,97,83,105,122,101,0,0,114,101,97,100,101,114,46,116,121,112,101,32,61,61,32,76,73,83,84,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,37,117,0,0,0,0,0,0,98,111,117,110,100,115,67,104,101,99,107,40,115,101,103,109,101,110,116,44,32,112,116,114,44,32,112,116,114,32,43,32,114,111,117,110,100,66,105,116,115,85,112,84,111,87,111,114,100,115,40,69,108,101,109,101,110,116,67,111,117,110,116,54,52,40,114,101,102,45,62,108,105,115,116,82,101,102,46,101,108,101,109,101,110,116,67,111,117,110,116,40,41,41,32,42,32,115,116,101,112,41,41,0,92,102,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,69,120,112,101,99,116,101,100,32,97,32,112,111,105,110,116,101,114,32,108,105,115,116,44,32,98,117,116,32,103,111,116,32,97,32,108,105,115,116,32,111,102,32,100,97,116,97,45,111,110,108,121,32,115,116,114,117,99,116,115,46,0,0,0,84,114,105,101,100,32,116,111,32,103,101,116,40,41,32,97,32,117,110,105,111,110,32,109,101,109,98,101,114,32,119,104,105,99,104,32,105,115,32,110,111,116,32,99,117,114,114,101,110,116,108,121,32,105,110,105,116,105,97,108,105,122,101,100,46,0,0,0,0,0,0,0,114,101,97,100,101,114,46,116,121,112,101,32,61,61,32,84,69,88,84,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,34,69,120,112,101,99,116,101,100,32,97,32,112,111,105,110,116,101,114,32,108,105,115,116,44,32,98,117,116,32,103,111,116,32,97,32,108,105,115,116,32,111,102,32,100,97,116,97,45,111,110,108,121,32,115,116,114,117,99,116,115,46,34,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,116,97,103,45,62,115,116,114,117,99,116,82,101,102,46,112,116,114,67,111,117,110,116,46,103,101,116,40,41,32,62,32,48,32,42,32,80,79,73,78,84,69,82,83,0,0,0,0,103,101,116,80,114,111,116,111,40,41,46,105,115,69,110,117,109,40,41,0,0,0,0,0,103,101,116,85,110,99,104,101,99,107,101,100,80,111,105,110,116,101,114,40,41,32,111,110,108,121,32,97,108,108,111,119,101,100,32,111,110,32,117,110,99,104,101,99,107,101,100,32,109,101,115,115,97,103,101,115,46,0,0,0,0,0,0,0,53,53,53,45,52,53,54,55,0,0,0,0,0,0,0,0,70,105,114,115,116,32,97,108,108,111,99,97,116,101,100,32,119,111,114,100,32,111,102,32,110,101,119,32,97,114,101,110,97,32,119,97,115,32,110,111,116,32,105,110,32,115,101,103,109,101,110,116,32,73,68,32,48,46,0,0,0,0,0,0,114,101,97,100,101,114,46,116,121,112,101,32,61,61,32,66,79,79,76,0,0,0,0,0,69,120,112,101,99,116,101,100,32,97,32,112,114,105,109,105,116,105,118,101,32,108,105,115,116,44,32,98,117,116,32,103,111,116,32,97,32,108,105,115,116,32,111,102,32,112,111,105,110,116,101,114,45,111,110,108,121,32,115,116,114,117,99,116,115,46,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,34,69,120,112,101,99,116,101,100,32,97,32,112,114,105,109,105,116,105,118,101,32,108,105,115,116,44,32,98,117,116,32,103,111,116,32,97,32,108,105,115,116,32,111,102,32,112,111,105,110,116,101,114,45,111,110,108,121,32,115,116,114,117,99,116,115,46,34,0,0,0,0,34,82,101,97,100,32,108,105,109,105,116,32,114,101,97,99,104,101,100,32,102,111,114,32,66,117,105,108,100,101,114,65,114,101,110,97,44,32,98,117,116,32,105,116,32,115,104,111,117,108,100,32,104,97,118,101,32,98,101,101,110,32,117,110,108,105,109,105,116,101,100,46,34,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,116,97,103,45,62,115,116,114,117,99,116,82,101,102,46,100,97,116,97,83,105,122,101,46,103,101,116,40,41,32,62,32,48,32,42,32,87,79,82,68,83,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,73,78,76,73,78,69,95,67,79,77,80,79,83,73,84,69,32,108,105,115,116,39,115,32,101,108,101,109,101,110,116,115,32,111,118,101,114,114,117,110,32,105,116,115,32,119,111,114,100,32,99,111,117,110,116,46,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,34,73,78,76,73,78,69,95,67,79,77,80,79,83,73,84,69,32,108,105,115,116,39,115,32,101,108,101,109,101,110,116,115,32,111,118,101,114,114,117,110,32,105,116,115,32,119,111,114,100,32,99,111,117,110,116,46,34,0,0,0,0,0,0,115,105,122,101,32,42,32,119,111,114,100,115,80,101,114,69,108,101,109,101,110,116,32,60,61,32,119,111,114,100,67,111,117,110,116,0,0,0,0,0,80,77,0,0,0,0,0,0,37,100,0,0,0,0,0,0,73,78,76,73,78,69,95,67,79,77,80,79,83,73,84,69,32,108,105,115,116,115,32,111,102,32,110,111,110,45,83,84,82,85,67,84,32,116,121,112,101,32,97,114,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,0,0,0,0,92,98,0,0,0,0,0,0,65,77,0,0,0,0,0,0,34,73,78,76,73,78,69,95,67,79,77,80,79,83,73,84,69,32,108,105,115,116,115,32,111,102,32,110,111,110,45,83,84,82,85,67,84,32,116,121,112,101,32,97,114,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,34,0,0,34,84,114,105,101,100,32,116,111,32,103,101,116,40,41,32,97,32,117,110,105,111,110,32,109,101,109,98,101,114,32,119,104,105,99,104,32,105,115,32,110,111,116,32,99,117,114,114,101,110,116,108,121,32,105,110,105,116,105,97,108,105,122,101,100,46,34,44,32,102,105,101,108,100,46,103,101,116,80,114,111,116,111,40,41,46,103,101,116,78,97,109,101,40,41,44,32,115,99,104,101,109,97,46,103,101,116,80,114,111,116,111,40,41,46,103,101,116,68,105,115,112,108,97,121,78,97,109,101,40,41,0,0,0,0,0,116,97,103,45,62,107,105,110,100,40,41,32,61,61,32,87,105,114,101,80,111,105,110,116,101,114,58,58,83,84,82,85,67,84,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,108,105,115,116,32,112,111,105,110,116,101,114,46,0,0,0,0,84,114,105,101,100,32,116,111,32,117,115,101,32,110,111,110,45,115,116,114,117,99,116,32,115,99,104,101,109,97,32,97,115,32,97,32,115,116,114,117,99,116,46,0,0,0,0,0,34,103,101,116,85,110,99,104,101,99,107,101,100,80,111,105,110,116,101,114,40,41,32,111,110,108,121,32,97,108,108,111,119,101,100,32,111,110,32,117,110,99,104,101,99,107,101,100,32,109,101,115,115,97,103,101,115,46,34,0,0,0,0,0,98,111,98,64,101,120,97,109,112,108,101,46,99,111,109,0,34,70,105,114,115,116,32,97,108,108,111,99,97,116,101,100,32,119,111,114,100,32,111,102,32,110,101,119,32,97,114,101,110,97,32,119,97,115,32,110,111,116,32,105,110,32,115,101,103,109,101,110,116,32,73,68,32,48,46,34,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,108,105,115,116,32,112,111,105,110,116,101,114,46,34,0,0,98,111,117,110,100,115,67,104,101,99,107,40,115,101,103,109,101,110,116,44,32,112,116,114,32,45,32,80,79,73,78,84,69,82,95,83,73,90,69,95,73,78,95,87,79,82,68,83,44,32,112,116,114,32,43,32,119,111,114,100,67,111,117,110,116,41,0,0,0,0,0,0,105,110,118,97,108,105,100,32,115,101,103,109,101,110,116,32,105,100,0,0,0,0,0,0,115,114,99,47,107,106,47,99,111,109,109,111,110,46,99,43,43,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,108,105,115,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,108,105,115,116,32,112,111,105,110,116,101,114,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,108,105,115,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,108,105,115,116,32,112,111,105,110,116,101,114,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,116,101,120,116,32,112,111,105,110,116,101,114,46,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,116,101,120,116,32,112,111,105,110,116,101,114,46,34,0,63,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,108,105,115,116,32,112,111,105,110,116,101,114,32,111,102,32,110,111,110,45,98,121,116,101,115,32,119,104,101,114,101,32,116,101,120,116,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,0,0,0,92,97,0,0,0,0,0,0,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,76,105,115,116,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,108,105,115,116,115,46,0,0,0,105,110,100,101,120,32,60,32,115,105,122,101,40,41,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,108,105,115,116,32,112,111,105,110,116,101,114,32,111,102,32,110,111,110,45,98,121,116,101,115,32,119,104,101,114,101,32,116,101,120,116,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,105,115,83,101,116,73,110,85,110,105,111,110,40,102,105,101,108,100,41,0,0,0,0,0,34,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,76,105,115,116,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,108,105,115,116,115,46,34,0,46,46,47,115,114,99,47,99,97,112,110,112,47,108,105,115,116,46,104,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,108,105,115,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,116,101,120,116,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,0,0,0,0,110,101,115,116,105,110,103,68,101,112,116,104,32,62,32,48,0,0,0,0,0,0,0,0,77,117,115,116,32,99,97,108,108,32,101,110,115,117,114,101,73,110,105,116,105,97,108,105,122,101,100,40,41,32,111,110,32,82,97,119,83,99,104,101,109,97,32,98,101,102,111,114,101,32,99,111,110,115,116,114,117,99,116,105,110,103,32,83,99,104,101,109,97,46,0,0,101,114,114,111,114,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,108,105,115,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,116,101,120,116,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,0,34,84,114,105,101,100,32,116,111,32,117,115,101,32,110,111,110,45,115,116,114,117,99,116,32,115,99,104,101,109,97,32,97,115,32,97,32,115,116,114,117,99,116,46,34,44,32,103,101,116,80,114,111,116,111,40,41,46,103,101,116,68,105,115,112,108,97,121,78,97,109,101,40,41,0,0,0,0,0,0,66,111,98,0,0,0,0,0,97,108,108,111,99,97,116,105,111,110,46,115,101,103,109,101,110,116,45,62,103,101,116,83,101,103,109,101,110,116,73,100,40,41,32,61,61,32,95,58,58,83,101,103,109,101,110,116,73,100,40,48,41,0,0,0,115,101,103,109,101,110,116,32,61,61,32,110,117,108,108,112,116,114,0,0,0,0,0,0,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,73,110,116,101,114,102,97,99,101,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,105,110,116,101,114,102,97,99,101,115,46,0,34,77,117,115,116,32,99,97,108,108,32,101,110,115,117,114,101,73,110,105,116,105,97,108,105,122,101,100,40,41,32,111,110,32,82,97,119,83,99,104,101,109,97,32,98,101,102,111,114,101,32,99,111,110,115,116,114,117,99,116,105,110,103,32,83,99,104,101,109,97,46,34,0,0,0,0,0,0,0,0,34,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,73,110,116,101,114,102,97,99,101,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,105,110,116,101,114,102,97,99,101,115,46,34,0,0,0,0,0,0,0,114,97,119,45,62,108,97,122,121,73,110,105,116,105,97,108,105,122,101,114,32,61,61,32,110,117,108,108,112,116,114,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,100,111,117,98,108,101,45,102,97,114,32,112,111,105,110,116,101,114,32,116,111,32,117,110,107,110,111,119,110,32,115,101,103,109,101,110,116,46,0,34,105,110,118,97,108,105,100,32,115,101,103,109,101,110,116,32,105,100,34,44,32,105,100,46,118,97,108,117,101,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,110,101,115,116,105,110,103,68,101,112,116,104,32,61,61,32,48,32,38,38,32,101,108,101,109,101,110,116,84,121,112,101,32,61,61,32,115,99,104,101,109,97,58,58,84,121,112,101,58,58,73,78,84,69,82,70,65,67,69,0,0,0,0,0,46,46,47,115,114,99,47,99,97,112,110,112,47,115,99,104,101,109,97,46,104,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,100,111,117,98,108,101,45,102,97,114,32,112,111,105,110,116,101,114,32,116,111,32,117,110,107,110,111,119,110,32,115,101,103,109,101,110,116,46,34,0,0,0,0,0,0,0,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,69,110,117,109,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,101,110,117,109,115,46,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,102,97,114,32,112,111,105,110,116,101,114,46,0,0,0,0,0,76,105,115,116,40,65,110,121,80,111,105,110,116,101,114,41,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,34,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,69,110,117,109,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,101,110,117,109,115,46,34,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,102,97,114,32,112,111,105,110,116,101,114,46,34,0,0,0,34,76,105,115,116,40,65,110,121,80,111,105,110,116,101,114,41,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,34,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,110,101,115,116,105,110,103,68,101,112,116,104,32,61,61,32,48,32,38,38,32,101,108,101,109,101,110,116,84,121,112,101,32,61,61,32,115,99,104,101,109,97,58,58,84,121,112,101,58,58,69,78,85,77,0,0,98,111,117,110,100,115,67,104,101,99,107,40,115,101,103,109,101,110,116,44,32,112,116,114,44,32,112,116,114,32,43,32,112,97,100,87,111,114,100,115,41,0,0,0,0,0,0,0,76,105,115,116,32,105,110,100,101,120,32,111,117,116,45,111,102,45,98,111,117,110,100,115,46,0,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,83,116,114,117,99,116,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,115,116,114,117,99,116,115,46,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,102,97,114,32,112,111,105,110,116,101,114,32,116,111,32,117,110,107,110,111,119,110,32,115,101,103,109,101,110,116,46,0,0,0,0,0,0,0,0,115,114,99,47,99,97,112,110,112,47,100,121,110,97,109,105,99,46,99,43,43,0,0,0,102,97,108,115,101,0,0,0,34,76,105,115,116,32,105,110,100,101,120,32,111,117,116,45,111,102,45,98,111,117,110,100,115,46,34,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,34,76,105,115,116,83,99,104,101,109,97,58,58,103,101,116,83,116,114,117,99,116,69,108,101,109,101,110,116,84,121,112,101,40,41,58,32,84,104,101,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,115,116,114,117,99,116,115,46,34,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,102,97,114,32,112,111,105,110,116,101,114,32,116,111,32,117,110,107,110,111,119,110,32,115,101,103,109,101,110,116,46,34,0,0,0,0,0,0,105,110,100,101,120,32,60,32,115,105,122,101,40,41,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,110,101,115,116,105,110,103,68,101,112,116,104,32,61,61,32,48,32,38,38,32,101,108,101,109,101,110,116,84,121,112,101,32,61,61,32,115,99,104,101,109,97,58,58,84,121,112,101,58,58,83,84,82,85,67,84,0,0,0,0,0,0,0,0,115,101,103,109,101,110,116,32,33,61,32,110,117,108,108,112,116,114,0,0,0,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,76,105,115,116,40,65,110,121,80,111,105,110,116,101,114,41,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,100,97,116,97,32,112,111,105,110,116,101,114,46,0,0,0,110,101,116,119,111,114,107,32,102,97,105,108,117,114,101,0,103,101,116,80,114,111,116,111,40,41,46,105,115,83,116,114,117,99,116,40,41,0,0,0,77,73,84,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,34,76,105,115,116,40,65,110,121,80,111,105,110,116,101,114,41,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,34,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,101,100,32,111,117,116,45,111,102,45,98,111,117,110,100,115,32,100,97,116,97,32,112,111,105,110,116,101,114,46,34,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,77,117,115,116,32,117,115,101,32,111,110,101,32,111,102,32,116,104,101,32,111,116,104,101,114,32,76,105,115,116,83,99,104,101,109,97,58,58,111,102,40,41,32,111,118,101,114,108,111,97,100,115,32,102,111,114,32,99,111,109,112,108,101,120,32,116,121,112,101,115,46,0,98,111,117,110,100,115,67,104,101,99,107,40,115,101,103,109,101,110,116,44,32,112,116,114,44,32,112,116,114,32,43,32,114,111,117,110,100,66,121,116,101,115,85,112,84,111,87,111,114,100,115,40,114,101,102,45,62,108,105,115,116,82,101,102,46,101,108,101,109,101,110,116,67,111,117,110,116,40,41,32,42,32,40,49,32,42,32,66,89,84,69,83,32,47,32,69,76,69,77,69,78,84,83,41,41,41,0,0,0,0,0,0,105,100,46,118,97,108,117,101,32,45,32,49,32,60,32,115,45,62,103,101,116,40,41,45,62,98,117,105,108,100,101,114,115,46,115,105,122,101,40,41,0,0,0,0,0,0,0,0,37,108,108,120,0,0,0,0,34,77,117,115,116,32,117,115,101,32,111,110,101,32,111,102,32,116,104,101,32,111,116,104,101,114,32,76,105,115,116,83,99,104,101,109,97,58,58,111,102,40,41,32,111,118,101,114,108,111,97,100,115,32,102,111,114,32,99,111,109,112,108,101,120,32,116,121,112,101,115,46,34,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,108,105,115,116,32,112,111,105,110,116,101,114,32,111,102,32,110,111,110,45,98,121,116,101,115,32,119,104,101,114,101,32,100,97,116,97,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,108,105,115,116,32,112,111,105,110,116,101,114,32,111,102,32,110,111,110,45,98,121,116,101,115,32,119,104,101,114,101,32,100,97,116,97,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,37,112,0,0,0,0,0,0,102,97,108,115,101,0,0,0,114,101,102,45,62,108,105,115,116,82,101,102,46,101,108,101,109,101,110,116,83,105,122,101,40,41,32,61,61,32,70,105,101,108,100,83,105,122,101,58,58,66,89,84,69,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,108,105,115,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,100,97,116,97,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,0,0,0,0,116,114,117,101,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,108,105,115,116,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,100,97,116,97,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,0,83,117,112,112,111,115,101,100,108,121,45,117,110,114,101,97,99,104,97,98,108,101,32,98,114,97,110,99,104,32,101,120,101,99,117,116,101,100,46,0,116,114,117,101,0,0,0,0,58,32,0,0,0,0,0,0,114,101,102,45,62,107,105,110,100,40,41,32,61,61,32,87,105,114,101,80,111,105,110,116,101,114,58,58,76,73,83,84,0,0,0,0,0,0,0,0,85,110,101,120,112,101,99,116,101,100,32,79,84,72,69,82,32,112,111,105,110,116,101,114,46,0,0,0,0,0,0,0,34,85,110,101,120,112,101,99,116,101,100,32,79,84,72,69,82,32,112,111,105,110,116,101,114,46,34,0,0,0,0,0,82,101,113,117,101,115,116,101,100,32,73,68,32,110,111,116,32,102,111,117,110,100,32,105,110,32,100,101,112,101,110,100,101,110,99,121,32,116,97,98,108,101,46,0,0,0,0,0,101,114,114,111,114,32,102,114,111,109,32,79,83,0,0,0,53,53,53,45,49,50,49,50,0,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,85,110,101,120,112,101,99,116,101,100,32,70,65,82,32,112,111,105,110,116,101,114,46,0,115,105,122,101,0,0,0,0,34,85,110,101,120,112,101,99,116,101,100,32,70,65,82,32,112,111,105,110,116,101,114,46,34,0,0,0,0,0,0,0,99,97,108,108,111,99,40,115,105,122,101,44,32,115,105,122,101,111,102,40,119,111,114,100,41,41,0,0,0,0,0,0,68,111,110,39,116,32,107,110,111,119,32,104,111,119,32,116,111,32,104,97,110,100,108,101,32,110,111,110,45,83,84,82,85,67,84,32,105,110,108,105,110,101,32,99,111,109,112,111,115,105,116,101,46,0,0,0,32,0,0,0,0,0,0,0,70,105,114,115,116,32,115,101,103,109,101,110,116,32,105,110,32,103,101,116,83,101,103,109,101,110,116,115,70,111,114,79,117,116,112,117,116,40,41,32,105,115,32,110,111,116,32,116,104,101,32,102,105,114,115,116,32,115,101,103,109,101,110,116,32,97,108,108,111,99,97,116,101,100,63,0,0,0,0,0,34,68,111,110,39,116,32,107,110,111,119,32,104,111,119,32,116,111,32,104,97,110,100,108,101,32,110,111,110,45,83,84,82,85,67,84,32,105,110,108,105,110,101,32,99,111,109,112,111,115,105,116,101,46,34,0,115,114,99,47,99,97,112,110,112,47,115,99,104,101,109,97,46,99,43,43,0,0,0,0,44,32,0,0,0,0,0,0,86,97,108,117,101,32,116,121,112,101,32,109,105,115,109,97,116,99,104,46,0,0,0,0,67,0,0,0,0,0,0,0,34,70,105,114,115,116,32,115,101,103,109,101,110,116,32,105,110,32,103,101,116,83,101,103,109,101,110,116,115,70,111,114,79,117,116,112,117,116,40,41,32,105,115,32,110,111,116,32,116,104,101,32,102,105,114,115,116,32,115,101,103,109,101,110,116,32,97,108,108,111,99,97,116,101,100,63,34,0,0,0,101,108,101,109,101,110,116,84,97,103,45,62,107,105,110,100,40,41,32,61,61,32,87,105,114,101,80,111,105,110,116,101,114,58,58,83,84,82,85,67,84,0,0,0,0,0,0,0,114,101,113,117,105,114,101,109,101,110,116,32,110,111,116,32,109,101,116,0,0,0,0,0,60,111,112,97,113,117,101,32,112,111,105,110,116,101,114,62,0,0,0,0,0,0,0,0,34,86,97,108,117,101,32,116,121,112,101,32,109,105,115,109,97,116,99,104,46,34,0,0,118,101,99,116,111,114,0,0,115,101,103,109,101,110,116,115,91,48,93,46,98,101,103,105,110,40,41,32,61,61,32,102,105,114,115,116,83,101,103,109,101,110,116,0,0,0,0,0,77,101,115,115,97,103,101,32,105,115,32,116,111,111,32,100,101,101,112,108,121,45,110,101,115,116,101,100,32,111,114,32,99,111,110,116,97,105,110,115,32,99,121,99,108,101,115,46,32,32,83,101,101,32,99,97,112,110,112,58,58,82,101,97,100,79,112,116,105,111,110,115,46,0,0,0,0,0,0,0,37,46,42,103,0,0,0,0,60,101,120,116,101,114,110,97,108,32,99,97,112,97,98,105,108,105,116,121,62,0,0,0,32,0,0,0,0,0,0,0,37,46,48,76,102,0,0,0,65,108,105,99,101,0,0,0,34,77,101,115,115,97,103,101,32,105,115,32,116,111,111,32,100,101,101,112,108,121,45,110,101,115,116,101,100,32,111,114,32,99,111,110,116,97,105,110,115,32,99,121,99,108,101,115,46,32,32,83,101,101,32,99,97,112,110,112,58,58,82,101,97,100,79,112,116,105,111,110,115,46,34,0,0,0,0,0,34,83,117,112,112,111,115,101,100,108,121,45,117,110,114,101,97,99,104,97,98,108,101,32,98,114,97,110,99,104,32,101,120,101,99,117,116,101,100,46,34,0,0,0,0,0,0,0,115,114,99,47,99,97,112,110,112,47,109,101,115,115,97,103,101,46,99,43,43,0,0,0,67,97,108,108,105,110,103,32,105,110,118,97,108,105,100,32,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,46,0,0,0,0,0,118,111,105,100,0,0,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,105,110,118,97,108,105,100,32,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,46,0,0,0,0,32,61,32,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,105,110,118,97,108,105,100,32,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,46,34,0,0,67,97,108,108,105,110,103,32,99,97,112,97,98,105,108,105,116,121,32,101,120,116,114,97,99,116,101,100,32,102,114,111,109,32,97,32,110,111,110,45,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,46,0,0,0,0,0,10,115,116,97,99,107,58,32,0,0,0,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,32,119,97,115,32,101,120,112,101,99,116,101,100,46,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,110,111,110,45,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,32,119,104,101,114,101,32,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,32,119,97,115,32,101,120,112,101,99,116,101,100,46,34,0,0,0,0,0,0,0,0,67,97,108,108,105,110,103,32,110,117,108,108,32,99,97,112,97,98,105,108,105,116,121,32,112,111,105,110,116,101,114,46,0,0,0,0,0,0,0,0,110,101,115,116,105,110,103,76,105,109,105,116,32,62,32,48,0,0,0,0,0,0,0,0,84,114,121,105,110,103,32,116,111,32,114,101,97,100,32,99,97,112,97,98,105,108,105,116,105,101,115,32,119,105,116,104,111,117,116,32,101,118,101,114,32,104,97,118,105,110,103,32,99,114,101,97,116,101,100,32,97,32,99,97,112,97,98,105,108,105,116,121,32,99,111,110,116,101,120,116,46,32,32,84,111,32,114,101,97,100,32,99,97,112,97,98,105,108,105,116,105,101,115,32,102,114,111,109,32,97,32,109,101,115,115,97,103,101,44,32,121,111,117,32,109,117,115,116,32,105,109,98,117,101,32,105,116,32,119,105,116,104,32,67,97,112,82,101,97,100,101,114,67,111,110,116,101,120,116,44,32,111,114,32,117,115,101,32,116,104,101,32,67,97,112,39,110,32,80,114,111,116,111,32,82,80,67,32,115,121,115,116,101,109,46,0,34,84,114,121,105,110,103,32,116,111,32,114,101,97,100,32,99,97,112,97,98,105,108,105,116,105,101,115,32,119,105,116,104,111,117,116,32,101,118,101,114,32,104,97,118,105,110,103,32,99,114,101,97,116,101,100,32,97,32,99,97,112,97,98,105,108,105,116,121,32,99,111,110,116,101,120,116,46,32,32,34,32,34,84,111,32,114,101,97,100,32,99,97,112,97,98,105,108,105,116,105,101,115,32,102,114,111,109,32,97,32,109,101,115,115,97,103,101,44,32,121,111,117,32,109,117,115,116,32,105,109,98,117,101,32,105,116,32,119,105,116,104,32,67,97,112,82,101,97,100,101,114,67,111,110,116,101,120,116,44,32,111,114,32,34,32,34,117,115,101,32,116,104,101,32,67,97,112,39,110,32,80,114,111,116,111,32,82,80,67,32,115,121,115,116,101,109,46,34,0,98,114,111,107,101,110,67,97,112,70,97,99,116,111,114,121,32,33,61,32,110,117,108,108,112,116,114,0,0,0,0,0,45,105,110,102,0,0,0,0,92,92,0,0,0,0,0,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,32,40,116,101,109,112,111,114,97,114,121,41,0,0,0,0,84,104,117,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,99,112,116,114,91,115,105,122,101,93,32,61,61,32,39,92,48,39,0,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,92,34,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,85,110,107,110,111,119,110,32,112,111,105,110,116,101,114,32,116,121,112,101,46,0,0,0,77,111,110,100,97,121,0,0,34,85,110,107,110,111,119,110,32,112,111,105,110,116,101,114,32,116,121,112,101,46,34,0,83,117,110,100,97,121,0,0,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,116,101,120,116,32,116,104,97,116,32,105,115,32,110,111,116,32,78,85,76,45,116,101].concat([114,109,105,110,97,116,101,100,46,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,34,82,101,113,117,101,115,116,101,100,32,73,68,32,110,111,116,32,102,111,117,110,100,32,105,110,32,100,101,112,101,110,100,101,110,99,121,32,116,97,98,108,101,46,34,44,32,107,106,58,58,104,101,120,40,105,100,41,0,0,0,0,0,0,98,117,103,32,105,110,32,99,111,100,101,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,97,108,105,99,101,64,101,120,97,109,112,108,101,46,99,111,109,0,0,0,0,0,0,0,92,39,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,34,77,101,115,115,97,103,101,32,99,111,110,116,97,105,110,115,32,116,101,120,116,32,116,104,97,116,32,105,115,32,110,111,116,32,78,85,76,45,116,101,114,109,105,110,97,116,101,100,46,34,0,0,0,0,0,84,114,105,101,100,32,116,111,32,117,115,101,32,110,111,110,45,105,110,116,101,114,102,97,99,101,32,115,99,104,101,109,97,32,97,115,32,97,110,32,105,110,116,101,114,102,97,99,101,46,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,115,114,99,47,99,97,112,110,112,47,108,97,121,111,117,116,46,99,43,43,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,37,108,108,117,0,0,0,0,92,118,0,0,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,10,0,0,0,0,0,0,0,79,99,116,0,0,0,0,0,115,105,122,101,32,62,32,48,0,0,0,0,0,0,0,0,34,84,114,105,101,100,32,116,111,32,117,115,101,32,110,111,110,45,105,110,116,101,114,102,97,99,101,32,115,99,104,101,109,97,32,97,115,32,97,110,32,105,110,116,101,114,102,97,99,101,46,34,44,32,103,101,116,80,114,111,116,111,40,41,46,103,101,116,68,105,115,112,108,97,121,78,97,109,101,40,41,0,0,0,0,0,0,0,105,110,116,54,52,95,116,40,118,97,108,117,101,41,32,62,61,32,48,0,0,0,0,0,83,101,112,0,0,0,0,0,118,97,108,117,101,32,62,61,32,48,0,0,0,0,0,0,65,117,103,0,0,0,0,0,73,110,118,97,108,105,100,32,99,97,112,97,98,105,108,105,116,121,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,109,101,115,115,97,103,101,46,0,0,0,0,0,0,0,115,114,99,47,99,97,112,110,112,47,97,114,101,110,97,46,99,43,43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,168,33,0,0,120,40,0,0,144,31,0,0,56,27,0,0,152,19,0,0,0,0,0,0,0,0,0,0,0,71,0,0,40,0,0,0,140,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,71,0,0,240,0,0,0,192,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,71,0,0,82,0,0,0,56,1,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,71,0,0,108,0,0,0,8,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,71,0,0,108,0,0,0,22,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,71,0,0,198,0,0,0,94,0,0,0,62,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,71,0,0,48,1,0,0,224,0,0,0,62,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,71,0,0,190,0,0,0,228,0,0,0,62,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,71,0,0,50,1,0,0,164,0,0,0,62,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,72,0,0,44,1,0,0,104,0,0,0,62,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,72,0,0,188,0,0,0,132,0,0,0,62,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,72,0,0,48,0,0,0,134,0,0,0,62,0,0,0,118,0,0,0,4,0,0,0,30,0,0,0,6,0,0,0,20,0,0,0,54,0,0,0,2,0,0,0,248,255,255,255,152,72,0,0,20,0,0,0,10,0,0,0,32,0,0,0,14,0,0,0,2,0,0,0,30,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,72,0,0,30,1,0,0,18,1,0,0,62,0,0,0,18,0,0,0,16,0,0,0,58,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,192,72,0,0,62,0,0,0,100,0,0,0,112,0,0,0,120,0,0,0,88,0,0,0,42,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,72,0,0,88,0,0,0,230,0,0,0,62,0,0,0,44,0,0,0,38,0,0,0,14,0,0,0,56,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,72,0,0,120,0,0,0,78,0,0,0,62,0,0,0,40,0,0,0,76,0,0,0,24,0,0,0,70,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,73,0,0,34,1,0,0,2,0,0,0,62,0,0,0,24,0,0,0,34,0,0,0,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,73,0,0,56,0,0,0,2,1,0,0,62,0,0,0,38,0,0,0,14,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,73,0,0,4,1,0,0,136,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,73,0,0,34,0,0,0,162,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,73,0,0,6,0,0,0,204,0,0,0,62,0,0,0,8,0,0,0,6,0,0,0,12,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,73,0,0,116,0,0,0,20,0,0,0,62,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,26,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,73,0,0,50,0,0,0,28,0,0,0,62,0,0,0,46,0,0,0,44,0,0,0,36,0,0,0,38,0,0,0,28,0,0,0,42,0,0,0,34,0,0,0,52,0,0,0,50,0,0,0,48,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,73,0,0,66,0,0,0,4,0,0,0,62,0,0,0,76,0,0,0,68,0,0,0,62,0,0,0,64,0,0,0,56,0,0,0,66,0,0,0,60,0,0,0,74,0,0,0,72,0,0,0,70,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,73,0,0,84,0,0,0,102,0,0,0,62,0,0,0,6,0,0,0,10,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,73,0,0,32,0,0,0,206,0,0,0,62,0,0,0,16,0,0,0,14,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,0,0,12,0,0,0,220,0,0,0,62,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,116,0,0,0,94,0,0,0,24,0,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,74,0,0,212,0,0,0,154,0,0,0,62,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,48,0,0,0,8,0,0,0,20,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,74,0,0,212,0,0,0,24,0,0,0,62,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,92,0,0,0,58,0,0,0,10,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,74,0,0,212,0,0,0,124,0,0,0,62,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,74,0,0,212,0,0,0,44,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,74,0,0,74,0,0,0,186,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,74,0,0,212,0,0,0,90,0,0,0,62,0,0,0,20,0,0,0,2,0,0,0,4,0,0,0,10,0,0,0,16,0,0,0,28,0,0,0,24,0,0,0,6,0,0,0,4,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,74,0,0,54,1,0,0,46,0,0,0,62,0,0,0,10,0,0,0,4,0,0,0,18,0,0,0,36,0,0,0,8,0,0,0,6,0,0,0,26,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,74,0,0,80,0,0,0,12,1,0,0,70,0,0,0,8,0,0,0,14,0,0,0,32,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,0,0,212,0,0,0,96,0,0,0,62,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,75,0,0,212,0,0,0,194,0,0,0,62,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,75,0,0,152,0,0,0,24,1,0,0,38,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,75,0,0,10,0,0,0,142,0,0,0,74,0,0,0,40,0,0,0,32,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,28,0,0,0,16,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,88,75,0,0,54,0,0,0,0,1,0,0,252,255,255,255,252,255,255,255,88,75,0,0,170,0,0,0,150,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,112,75,0,0,6,1,0,0,26,1,0,0,252,255,255,255,252,255,255,255,112,75,0,0,130,0,0,0,246,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,136,75,0,0,98,0,0,0,58,1,0,0,248,255,255,255,248,255,255,255,136,75,0,0,214,0,0,0,22,1,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,160,75,0,0,128,0,0,0,252,0,0,0,248,255,255,255,248,255,255,255,160,75,0,0,160,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,75,0,0,250,0,0,0,216,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,75,0,0,36,1,0,0,218,0,0,0,28,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,54,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,75,0,0,184,0,0,0,208,0,0,0,48,0,0,0,40,0,0,0,32,0,0,0,8,0,0,0,82,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,28,0,0,0,42,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,76,0,0,14,1,0,0,168,0,0,0,62,0,0,0,60,0,0,0,114,0,0,0,42,0,0,0,94,0,0,0,8,0,0,0,44,0,0,0,50,0,0,0,34,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,76,0,0,126,0,0,0,72,0,0,0,62,0,0,0,106,0,0,0,4,0,0,0,80,0,0,0,88,0,0,0,90,0,0,0,36,0,0,0,110,0,0,0,66,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,76,0,0,20,1,0,0,138,0,0,0,62,0,0,0,16,0,0,0,56,0,0,0,12,0,0,0,60,0,0,0,96,0,0,0,68,0,0,0,86,0,0,0,72,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,76,0,0,86,0,0,0,202,0,0,0,62,0,0,0,98,0,0,0,102,0,0,0,92,0,0,0,86,0,0,0,40,0,0,0,32,0,0,0,72,0,0,0,84,0,0,0,82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,76,0,0,100,0,0,0,18,0,0,0,52,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,64,0,0,0,74,0,0,0,12,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,76,0,0,16,0,0,0,8,1,0,0,76,0,0,0,40,0,0,0,32,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,90,0,0,0,22,0,0,0,2,0,0,0,16,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,76,0,0,46,1,0,0,122,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,76,0,0,58,0,0,0,180,0,0,0,20,0,0,0,238,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,0,0,38,1,0,0,36,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,77,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,77,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,77,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,77,0,0,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,77,0,0,236,0,0,0,30,0,0,0,4,0,0,0,50,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,77,0,0,42,1,0,0,114,0,0,0,18,0,0,0,10,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,77,0,0,68,0,0,0,16,1,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,77,0,0,40,1,0,0,242,0,0,0,76,0,0,0,182,0,0,0,8,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,53,99,97,112,110,112,50,48,77,97,108,108,111,99,77,101,115,115,97,103,101,66,117,105,108,100,101,114,69,0,0,78,53,99,97,112,110,112,49,95,53,65,114,101,110,97,69,0,0,0,0,0,0,0,0,78,53,99,97,112,110,112,49,95,49,50,66,117,105,108,100,101,114,65,114,101,110,97,69,0,0,0,0,0,0,0,0,78,53,99,97,112,110,112,49,52,77,101,115,115,97,103,101,66,117,105,108,100,101,114,69,0,0,0,0,0,0,0,0,78,50,107,106,57,69,120,99,101,112,116,105,111,110,69,0,78,50,107,106,56,68,105,115,112,111,115,101,114,69,0,0,78,50,107,106,49,95,49,55,72,101,97,112,65,114,114,97,121,68,105,115,112,111,115,101,114,69,0,0,0,0,0,0,78,50,107,106,49,95,49,50,72,101,97,112,68,105,115,112,111,115,101,114,73,78,53,99,97,112,110,112,50,48,77,97,108,108,111,99,77,101,115,115,97,103,101,66,117,105,108,100,101,114,49,50,77,111,114,101,83,101,103,109,101,110,116,115,69,69,69,0,0,0,0,0,78,50,107,106,49,95,49,50,72,101,97,112,68,105,115,112,111,115,101,114,73,78,53,99,97,112,110,112,49,95,49,52,83,101,103,109,101,110,116,66,117,105,108,100,101,114,69,69,69,0,0,0,0,0,0,0,78,50,107,106,49,95,49,50,72,101,97,112,68,105,115,112,111,115,101,114,73,78,53,99,97,112,110,112,49,95,49,50,66,117,105,108,100,101,114,65,114,101,110,97,49,55,77,117,108,116,105,83,101,103,109,101,110,116,83,116,97,116,101,69,69,69,0,0,0,0,0,0,78,50,107,106,49,55,69,120,99,101,112,116,105,111,110,67,97,108,108,98,97,99,107,69,0,0,0,0,0,0,0,0,78,50,107,106,49,55,69,120,99,101,112,116,105,111,110,67,97,108,108,98,97,99,107,50,49,82,111,111,116,69,120,99,101,112,116,105,111,110,67,97,108,108,98,97,99,107,69,0,78,50,107,106,49,51,69,120,99,101,112,116,105,111,110,73,109,112,108,69,0,0,0,0,78,50,107,106,49,51,65,114,114,97,121,68,105,115,112,111,115,101,114,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,0,0,0,0,72,57,0,0,0,0,0,0,88,57,0,0,0,0,0,0,104,57,0,0,248,70,0,0,0,0,0,0,0,0,0,0,120,57,0,0,248,70,0,0,0,0,0,0,0,0,0,0,136,57,0,0,248,70,0,0,0,0,0,0,0,0,0,0,160,57,0,0,64,71,0,0,0,0,0,0,0,0,0,0,184,57,0,0,248,70,0,0,0,0,0,0,0,0,0,0,200,57,0,0,32,57,0,0,224,57,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,0,76,0,0,0,0,0,0,32,57,0,0,40,58,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,8,76,0,0,0,0,0,0,32,57,0,0,112,58,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,16,76,0,0,0,0,0,0,32,57,0,0,184,58,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,24,76,0,0,0,0,0,0,0,0,0,0,0,59,0,0,72,73,0,0,0,0,0,0,0,0,0,0,48,59,0,0,72,73,0,0,0,0,0,0,32,57,0,0,96,59,0,0,0,0,0,0,1,0,0,0,64,75,0,0,0,0,0,0,32,57,0,0,120,59,0,0,0,0,0,0,1,0,0,0,64,75,0,0,0,0,0,0,32,57,0,0,144,59,0,0,0,0,0,0,1,0,0,0,72,75,0,0,0,0,0,0,32,57,0,0,168,59,0,0,0,0,0,0,1,0,0,0,72,75,0,0,0,0,0,0,32,57,0,0,192,59,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,176,76,0,0,0,8,0,0,32,57,0,0,8,60,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,176,76,0,0,0,8,0,0,32,57,0,0,80,60,0,0,0,0,0,0,3,0,0,0,128,74,0,0,2,0,0,0,80,71,0,0,2,0,0,0,224,74,0,0,0,8,0,0,32,57,0,0,152,60,0,0,0,0,0,0,3,0,0,0,128,74,0,0,2,0,0,0,80,71,0,0,2,0,0,0,232,74,0,0,0,8,0,0,0,0,0,0,224,60,0,0,128,74,0,0,0,0,0,0,0,0,0,0,248,60,0,0,128,74,0,0,0,0,0,0,32,57,0,0,16,61,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,80,75,0,0,2,0,0,0,32,57,0,0,40,61,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,80,75,0,0,2,0,0,0,0,0,0,0,64,61,0,0,0,0,0,0,88,61,0,0,184,75,0,0,0,0,0,0,32,57,0,0,120,61,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,248,71,0,0,0,0,0,0,32,57,0,0,192,61,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,16,72,0,0,0,0,0,0,32,57,0,0,8,62,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,40,72,0,0,0,0,0,0,32,57,0,0,80,62,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,64,72,0,0,0,0,0,0,0,0,0,0,152,62,0,0,128,74,0,0,0,0,0,0,0,0,0,0,176,62,0,0,128,74,0,0,0,0,0,0,32,57,0,0,200,62,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,200,75,0,0,2,0,0,0,32,57,0,0,240,62,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,200,75,0,0,2,0,0,0,32,57,0,0,24,63,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,200,75,0,0,2,0,0,0,32,57,0,0,64,63,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,200,75,0,0,2,0,0,0,0,0,0,0,104,63,0,0,56,75,0,0,0,0,0,0,0,0,0,0,128,63,0,0,128,74,0,0,0,0,0,0,32,57,0,0,152,63,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,168,76,0,0,2,0,0,0,32,57,0,0,176,63,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,168,76,0,0,2,0,0,0,0,0,0,0,200,63,0,0,0,0,0,0,240,63,0,0,0,0,0,0,24,64,0,0,208,75,0,0,0,0,0,0,0,0,0,0,56,64,0,0,96,74,0,0,0,0,0,0,0,0,0,0,96,64,0,0,96,74,0,0,0,0,0,0,0,0,0,0,136,64,0,0,0,0,0,0,192,64,0,0,0,0,0,0,248,64,0,0,0,0,0,0,24,65,0,0,0,0,0,0,56,65,0,0,0,0,0,0,88,65,0,0,0,0,0,0,120,65,0,0,32,57,0,0,144,65,0,0,0,0,0,0,1,0,0,0,216,71,0,0,3,244,255,255,32,57,0,0,192,65,0,0,0,0,0,0,1,0,0,0,232,71,0,0,3,244,255,255,32,57,0,0,240,65,0,0,0,0,0,0,1,0,0,0,216,71,0,0,3,244,255,255,32,57,0,0,32,66,0,0,0,0,0,0,1,0,0,0,232,71,0,0,3,244,255,255,0,0,0,0,80,66,0,0,32,71,0,0,0,0,0,0,0,0,0,0,104,66,0,0,0,0,0,0,128,66,0,0,48,75,0,0,0,0,0,0,0,0,0,0,152,66,0,0,32,75,0,0,0,0,0,0,0,0,0,0,184,66,0,0,40,75,0,0,0,0,0,0,0,0,0,0,216,66,0,0,0,0,0,0,248,66,0,0,0,0,0,0,24,67,0,0,0,0,0,0,56,67,0,0,32,57,0,0,88,67,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,160,76,0,0,2,0,0,0,32,57,0,0,120,67,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,160,76,0,0,2,0,0,0,32,57,0,0,152,67,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,160,76,0,0,2,0,0,0,32,57,0,0,184,67,0,0,0,0,0,0,2,0,0,0,128,74,0,0,2,0,0,0,160,76,0,0,2,0,0,0,0,0,0,0,216,67,0,0,0,0,0,0,240,67,0,0,0,0,0,0,8,68,0,0,0,0,0,0,32,68,0,0,32,75,0,0,0,0,0,0,0,0,0,0,56,68,0,0,40,75,0,0,0,0,0,0,0,0,0,0,80,68,0,0,0,77,0,0,0,0,0,0,0,0,0,0,112,68,0,0,0,0,0,0,136,68,0,0,232,76,0,0,0,0,0,0,0,0,0,0,168,68,0,0,0,0,0,0,200,68,0,0,0,0,0,0,216,68,0,0,0,0,0,0,232,68,0,0,144,77,0,0,0,0,0,0,0,0,0,0,8,69,0,0,16,77,0,0,0,0,0,0,0,0,0,0,80,69,0,0,16,77,0,0,0,0,0,0,0,0,0,0,136,69,0,0,16,77,0,0,0,0,0,0,0,0,0,0,208,69,0,0,0,0,0,0,240,69,0,0,88,77,0,0,0,0,0,0,32,57,0,0,32,70,0,0,0,0,0,0,2,0,0,0,8,77,0,0,2,4,0,0,248,70,0,0,2,0,0,0,0,0,0,0,56,70,0,0,0,0,0,0,80,70,0,0,184,77,0,0,0,0,0,0,0,0,0,0,120,70,0,0,184,77,0,0,0,0,0,0,0,0,0,0,160,70,0,0,200,77,0,0,0,0,0,0,0,0,0,0,200,70,0,0,240,70,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,1,0,2,0,3,0,0,0,2,0,4,0,0,0,1,0,3,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,2,0,3,0,0,0,1,0,2,0,3,0,4,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,128,87,0,0,0,0,0,0,128,87,0,0,0,0,0,0,224,87,0,0,80,87,0,0,176,87,0,0,0,0,0,0,0,0,0,0,5,0,5,0,52,161,168,84,179,217,52,249,0,0,0,0,1,0,0,0,116,225,110,248,25,46,179,158,1,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,242,0,0,0,29,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,25,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,97,100,100,114,101,115,115,98,111,111,107,46,99,97,112,110,112,58,65,100,100,114,101,115,115,66,111,111,107,0,0,0,0,0,0,0,1,0,1,0,4,0,0,0,3,0,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,2,0,1,0,28,0,0,0,2,0,1,0,112,101,111,112,108,101,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1,0,16,0,0,0,0,0,0,0,24,188,232,50,152,142,128,152,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,5,0,61,105,195,189,212,43,11,187,25,0,0,0,1,0,1,0,24,188,232,50,152,142,128,152,4,0,7,0,1,0,4,0,2,0,0,0,0,0,0,0,17,0,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25,0,0,0,231,0,0,0,0,0,0,0,0,0,0,0,97,100,100,114,101,115,115,98,111,111,107,46,99,97,112,110,112,58,80,101,114,115,111,110,46,101,109,112,108,111,121,109,101,110,116,0,0,0,0,0,16,0,0,0,3,0,4,0,0,0,255,255,0,0,0,0])
.concat([0,0,1,0,4,0,0,0,0,0,0,0,0,0,0,0,97,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,96,0,0,0,2,0,1,0,104,0,0,0,2,0,1,0,1,0,254,255,3,0,0,0,0,0,1,0,5,0,0,0,0,0,0,0,0,0,0,0,101,0,0,0,74,0,0,0,0,0,0,0,0,0,0,0,100,0,0,0,2,0,1,0,108,0,0,0,2,0,1,0,2,0,253,255,3,0,0,0,0,0,1,0,6,0,0,0,0,0,0,0,0,0,0,0,105,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,100,0,0,0,2,0,1,0,108,0,0,0,2,0,1,0,3,0,252,255,0,0,0,0,0,0,1,0,7,0,0,0,0,0,0,0,0,0,0,0,105,0,0,0,106,0,0,0,0,0,0,0,0,0,0,0,104,0,0,0,2,0,1,0,112,0,0,0,2,0,1,0,117,110,101,109,112,108,111,121,101,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,101,109,112,108,111,121,101,114,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,115,99,104,111,111,108,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,115,101,108,102,69,109,112,108,111,121,101,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,5,0,24,188,232,50,152,142,128,152,0,0,0,0,1,0,1,0,116,225,110,248,25,46,179,158,4,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,202,0,0,0,29,0,0,0,23,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,31,1,0,0,0,0,0,0,0,0,0,0,97,100,100,114,101,115,115,98,111,111,107,46,99,97,112,110,112,58,80,101,114,115,111,110,0,0,0,0,0,0,0,0,4,0,0,0,1,0,1,0,208,138,158,156,178,144,78,129,1,0,0,0,98,0,0,0,80,104,111,110,101,78,117,109,98,101,114,0,0,0,0,0,20,0,0,0,3,0,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,125,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,120,0,0,0,2,0,1,0,128,0,0,0,2,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,125,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,120,0,0,0,2,0,1,0,128,0,0,0,2,0,1,0,2,0,0,0,1,0,0,0,0,0,1,0,2,0,0,0,0,0,0,0,0,0,0,0,125,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,120,0,0,0,2,0,1,0,128,0,0,0,2,0,1,0,3,0,0,0,2,0,0,0,0,0,1,0,3,0,0,0,0,0,0,0,0,0,0,0,125,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,120,0,0,0,2,0,1,0,140,0,0,0,2,0,1,0,4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,61,105,195,189,212,43,11,187,137,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,100,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,110,97,109,101,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,101,109,97,105,108,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,104,111,110,101,115,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1,0,16,0,0,0,0,0,0,0,208,138,158,156,178,144,78,129,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,101,109,112,108,111,121,109,101,110,116,0,0,0,0,0,0,0,0,0,0,5,0,5,0,47,6,133,213,4,189,224,145,0,0,0,0,2,0,0,0,208,138,158,156,178,144,78,129,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,82,1,0,0,37,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,33,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,97,100,100,114,101,115,115,98,111,111,107,46,99,97,112,110,112,58,80,101,114,115,111,110,46,80,104,111,110,101,78,117,109,98,101,114,46,84,121,112,101,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,12,0,0,0,1,0,2,0,0,0,0,0,0,0,0,0,29,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,21,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,109,111,98,105,108,101,0,0,104,111,109,101,0,0,0,0,119,111,114,107,0,0,0,0,0,0,0,0,5,0,5,0,208,138,158,156,178,144,78,129,0,0,0,0,1,0,1,0,24,188,232,50,152,142,128,152,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,42,1,0,0,33,0,0,0,23,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,119,0,0,0,0,0,0,0,0,0,0,0,97,100,100,114,101,115,115,98,111,111,107,46,99,97,112,110,112,58,80,101,114,115,111,110,46,80,104,111,110,101,78,117,109,98,101,114,0,0,0,0,4,0,0,0,1,0,1,0,47,6,133,213,4,189,224,145,1,0,0,0,42,0,0,0,84,121,112,101,0,0,0,0,8,0,0,0,3,0,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,36,0,0,0,2,0,1,0,44,0,0,0,2,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,36,0,0,0,2,0,1,0,44,0,0,0,2,0,1,0,110,117,109,98,101,114,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,116,121,112,101,0,0,0,0,15,0,0,0,0,0,0,0,47,6,133,213,4,189,224,145,0,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,52,161,168,84,179,217,52,249,104,78,0,0,34,0,0,0,72,78,0,0,152,106,0,0,1,0,0,0,1,0,0,0,160,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,61,105,195,189,212,43,11,187,120,79,0,0,76,0,0,0,80,78,0,0,0,78,0,0,1,0,0,0,4,0,0,0,40,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,188,232,50,152,142,128,152,216,81,0,0,89,0,0,0,88,78,0,0,8,78,0,0,2,0,0,0,5,0,0,0,48,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,6,133,213,4,189,224,145,160,84,0,0,31,0,0,0,0,0,0,0,24,78,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,138,158,156,178,144,78,129,152,85,0,0,49,0,0,0,96,78,0,0,32,78,0,0,1,0,0,0,2,0,0,0,64,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,5,0,3,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,194,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,110,117,108,108,32,105,110,116,101,114,102,97,99,101,32,115,99,104,101,109,97,41,0,0,0,0,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,110,117,108,108,32,115,116,114,117,99,116,32,115,99,104,101,109,97,41,0,0,0,0,0,0,0,0,5,0,5,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,154,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,110,117,108,108,32,101,110,117,109,32,115,99,104,101,109,97,41,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,32,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,110,117,108,108,32,115,99,104,101,109,97,41,0,0,0,3,0,0,0,0,0,0,0,16,88,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,128,88,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,240,88,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,4,0,7,0,0,0,1,0,1,0,7,0,0,0,0,0,1,0,6,0,0,0,0,0,0,0,0,0,0,0,128,89,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,0,0,0,0,0,0,0,0,80,56,0,0,0,0,0,0,104,56,0,0,0,0,0,0,128,56,0,0,0,0,0,0,152,56,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___gxx_personality_v0() {
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }
  Module["_strlen"] = _strlen;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }
  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      Runtime.stackRestore(ret);
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function ___cxa_guard_release() {}
  function _abort() {
      Module['abort']();
    }
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }
  function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var r=env._stderr|0;var s=env._stdout|0;var t=env.___fsmu8|0;var u=env.___dso_handle|0;var v=+env.NaN;var w=+env.Infinity;var x=0;var y=0;var z=0;var A=0;var B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0.0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=global.Math.floor;var V=global.Math.abs;var W=global.Math.sqrt;var X=global.Math.pow;var Y=global.Math.cos;var Z=global.Math.sin;var _=global.Math.tan;var $=global.Math.acos;var aa=global.Math.asin;var ab=global.Math.atan;var ac=global.Math.atan2;var ad=global.Math.exp;var ae=global.Math.log;var af=global.Math.ceil;var ag=global.Math.imul;var ah=env.abort;var ai=env.assert;var aj=env.asmPrintInt;var ak=env.asmPrintFloat;var al=env.min;var am=env.invoke_viiiii;var an=env.invoke_viiiiiii;var ao=env.invoke_vi;var ap=env.invoke_vii;var aq=env.invoke_iii;var ar=env.invoke_ii;var as=env.invoke_viiiiiid;var at=env.invoke_iiii;var au=env.invoke_viii;var av=env.invoke_viiiiid;var aw=env.invoke_v;var ax=env.invoke_iiiiiiiii;var ay=env.invoke_viiiiiiiii;var az=env.invoke_viiiiiiii;var aA=env.invoke_viiiiii;var aB=env.invoke_iiiii;var aC=env.invoke_iiiiii;var aD=env.invoke_viiii;var aE=env._llvm_lifetime_end;var aF=env.__scanString;var aG=env._pthread_mutex_lock;var aH=env.___cxa_end_catch;var aI=env._strtoull;var aJ=env._fflush;var aK=env.__isLeapYear;var aL=env._llvm_stackrestore;var aM=env._fwrite;var aN=env._send;var aO=env._isspace;var aP=env._read;var aQ=env.___cxa_guard_abort;var aR=env._newlocale;var aS=env.___gxx_personality_v0;var aT=env._pthread_cond_wait;var aU=env.___cxa_rethrow;var aV=env.___resumeException;var aW=env._llvm_va_end;var aX=env._vsscanf;var aY=env._snprintf;var aZ=env._fgetc;var a_=env.__getFloat;var a$=env._atexit;var a0=env.___cxa_free_exception;var a1=env._strchr;var a2=env.___setErrNo;var a3=env._isxdigit;var a4=env._exit;var a5=env._sprintf;var a6=env.___ctype_b_loc;var a7=env._freelocale;var a8=env._catgets;var a9=env._asprintf;var ba=env.___cxa_is_number_type;var bb=env.___cxa_does_inherit;var bc=env.___cxa_guard_acquire;var bd=env.___cxa_begin_catch;var be=env._recv;var bf=env.__parseInt64;var bg=env.__ZSt18uncaught_exceptionv;var bh=env.___cxa_call_unexpected;var bi=env._llvm_stacksave;var bj=env.__exit;var bk=env._strftime;var bl=env.___cxa_throw;var bm=env._llvm_eh_exception;var bn=env._printf;var bo=env._pread;var bp=env.__arraySum;var bq=env.___cxa_find_matching_catch;var br=env.__formatString;var bs=env._pthread_cond_broadcast;var bt=env.__ZSt9terminatev;var bu=env._isascii;var bv=env._pthread_mutex_unlock;var bw=env._sbrk;var bx=env.___errno_location;var by=env._strerror;var bz=env._catclose;var bA=env._llvm_lifetime_start;var bB=env.___cxa_guard_release;var bC=env._ungetc;var bD=env._uselocale;var bE=env._vsnprintf;var bF=env._sscanf;var bG=env._sysconf;var bH=env._fread;var bI=env._abort;var bJ=env._fprintf;var bK=env._isdigit;var bL=env._strtoll;var bM=env.__addDays;var bN=env.__reallyNegative;var bO=env._write;var bP=env.___cxa_allocate_exception;var bQ=env.___cxa_pure_virtual;var bR=env._vasprintf;var bS=env._catopen;var bT=env.___ctype_toupper_loc;var bU=env.___ctype_tolower_loc;var bV=env._pwrite;var bW=env._strerror_r;var bX=env._time;var bY=0.0;
// EMSCRIPTEN_START_FUNCS
function iL(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;iU(o,j,x,m,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L1837:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=b2[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=1489}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=b2[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=1489;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L1837}}}}while(0);if((I|0)==1489){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}gH(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}gH(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=b2[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{W=c[J>>2]|0}if((iV(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;b2[V&255](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+mS(N,c[r>>2]|0,k);kJ(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=b2[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=1532}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=b2[c[(c[O>>2]|0)+36>>2]&255](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=1532;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}}while(0);do{if((I|0)==1532){if(j){break}$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}function iM(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iN(a,0,j,k,f,g,h);i=b;return}function iN(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;iU(o,j,x,m,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L1923:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=b2[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=1557}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=b2[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=1557;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L1923}}}}while(0);if((I|0)==1557){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}gH(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}gH(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=b2[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{W=c[J>>2]|0}if((iV(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;b2[V&255](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+mR(N,c[r>>2]|0,k);kJ(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=b2[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=1600}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=b2[c[(c[O>>2]|0)+36>>2]&255](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=1600;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}}while(0);do{if((I|0)==1600){if(j){break}$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}function iO(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+136|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+120|0;o=n;p=i;i=i+4|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;nW(o|0,0,12)|0;o=q;gZ(p,h);h=p|0;p=c[h>>2]|0;if((c[6698]|0)!=-1){c[l>>2]=26792;c[l+4>>2]=14;c[l+8>>2]=0;gA(26792,l,110)}l=(c[6699]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+48>>2]|0;cc[z&15](x,19928,19954,y)|0;x=c[h>>2]|0;gg(x)|0;nW(o|0,0,12)|0;x=q;gH(q,10,0);if((a[o]&1)==0){z=x+1|0;A=z;B=z;C=q+8|0}else{z=q+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[r>>2]=A;z=s|0;c[t>>2]=z;c[u>>2]=0;x=f|0;w=g|0;D=q|0;E=q+4|0;F=A;G=c[x>>2]|0;L2016:while(1){do{if((G|0)==0){H=0}else{I=c[G+12>>2]|0;if((I|0)==(c[G+16>>2]|0)){J=b2[c[(c[G>>2]|0)+36>>2]&255](G)|0}else{J=c[I>>2]|0}if((J|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;K=c[w>>2]|0;do{if((K|0)==0){L=1632}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=b2[c[(c[K>>2]|0)+36>>2]&255](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[w>>2]=0;L=1632;break}else{if(I^(K|0)==0){break}else{O=F;break L2016}}}}while(0);if((L|0)==1632){L=0;if(I){O=F;break}}K=d[o]|0;M=(K&1|0)==0;if(((c[r>>2]|0)-F|0)==((M?K>>>1:c[E>>2]|0)|0)){if(M){P=K>>>1;Q=K>>>1}else{K=c[E>>2]|0;P=K;Q=K}gH(q,P<<1,0);if((a[o]&1)==0){R=10}else{R=(c[D>>2]&-2)-1|0}gH(q,R,0);if((a[o]&1)==0){S=B}else{S=c[C>>2]|0}c[r>>2]=S+Q;T=S}else{T=F}K=H+12|0;M=c[K>>2]|0;U=H+16|0;if((M|0)==(c[U>>2]|0)){V=b2[c[(c[H>>2]|0)+36>>2]&255](H)|0}else{V=c[M>>2]|0}if((iP(V,16,T,r,u,0,n,z,t,y)|0)!=0){O=T;break}M=c[K>>2]|0;if((M|0)==(c[U>>2]|0)){U=c[(c[H>>2]|0)+40>>2]|0;b2[U&255](H)|0;F=T;G=H;continue}else{c[K>>2]=M+4;F=T;G=H;continue}}a[O+3|0]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);G=ir(O,c[6340]|0,7648,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){W=0}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){X=b2[c[(c[G>>2]|0)+36>>2]&255](G)|0}else{X=c[F>>2]|0}if((X|0)!=-1){W=G;break}c[x>>2]=0;W=0}}while(0);x=(W|0)==0;G=c[w>>2]|0;do{if((G|0)==0){L=1677}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){Y=b2[c[(c[G>>2]|0)+36>>2]&255](G)|0}else{Y=c[F>>2]|0}if((Y|0)==-1){c[w>>2]=0;L=1677;break}if(!(x^(G|0)==0)){break}Z=b|0;c[Z>>2]=W;gF(q);gF(n);i=e;return}}while(0);do{if((L|0)==1677){if(x){break}Z=b|0;c[Z>>2]=W;gF(q);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;gF(q);gF(n);i=e;return}}while(0);e=bP(4)|0;nj(e);bl(e|0,18192,158)}function iP(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&(b|0)==(i|0)){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+104|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((c[i>>2]|0)==(b|0)){s=i;break}else{i=i+4|0}}i=s-m|0;m=i>>2;if((i|0)>92){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;s=a[19928+m|0]|0;b=c[g>>2]|0;c[g>>2]=b+1;a[b]=s;q=0;return q|0}}while(0);f=a[19928+m|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function iQ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;gZ(k,d);d=k|0;k=c[d>>2]|0;if((c[6700]|0)!=-1){c[j>>2]=26800;c[j+4>>2]=14;c[j+8>>2]=0;gA(26800,j,110)}j=(c[6701]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+32>>2]|0;cc[o&15](n,19928,19954,e)|0;n=c[d>>2]|0;if((c[6604]|0)!=-1){c[h>>2]=26416;c[h+4>>2]=14;c[h+8>>2]=0;gA(26416,h,110)}o=(c[6605]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;a[f]=b2[c[(c[p>>2]|0)+16>>2]&255](q)|0;b0[c[(c[p>>2]|0)+20>>2]&127](b,q);q=c[d>>2]|0;gg(q)|0;i=g;return}}while(0);o=bP(4)|0;nj(o);bl(o|0,18192,158)}}while(0);g=bP(4)|0;nj(g);bl(g|0,18192,158)}function iR(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+40|0;j=h|0;k=h+16|0;l=h+32|0;gZ(l,d);d=l|0;l=c[d>>2]|0;if((c[6700]|0)!=-1){c[k>>2]=26800;c[k+4>>2]=14;c[k+8>>2]=0;gA(26800,k,110)}k=(c[6701]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;p=c[(c[n>>2]|0)+32>>2]|0;cc[p&15](o,19928,19960,e)|0;o=c[d>>2]|0;if((c[6604]|0)!=-1){c[j>>2]=26416;c[j+4>>2]=14;c[j+8>>2]=0;gA(26416,j,110)}p=(c[6605]|0)-1|0;n=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-n>>2>>>0>p>>>0){q=c[n+(p<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;a[f]=b2[c[(c[s>>2]|0)+12>>2]&255](r)|0;a[g]=b2[c[(c[s>>2]|0)+16>>2]&255](r)|0;b0[c[(c[q>>2]|0)+20>>2]&127](b,r);r=c[d>>2]|0;gg(r)|0;i=h;return}}while(0);p=bP(4)|0;nj(p);bl(p|0,18192,158)}}while(0);h=bP(4)|0;nj(h);bl(h|0,18192,158)}function iS(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(b<<24>>24==i<<24>>24){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((a[j]|0)==b<<24>>24){s=j;break}else{j=j+1|0}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[19928+j|0]|0;if((j|0)==25|(j|0)==24){s=c[h>>2]|0;do{if((s|0)!=(g|0)){if((a[s-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=s+1;a[s]=o;p=0;return p|0}else if((j|0)==22|(j|0)==23){a[f]=80;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=o;p=0;return p|0}else{s=a[f]|0;do{if((o&95|0)==(s<<24>>24|0)){a[f]=s|-128;if((a[e]&1)==0){break}a[e]=0;g=d[k]|0;if((g&1|0)==0){t=g>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}g=c[m>>2]|0;if((g-l|0)>=160){break}b=c[n>>2]|0;c[m>>2]=g+4;c[g>>2]=b}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=o;if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}return 0}function iT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+32|0;gZ(j,b);b=j|0;j=c[b>>2]|0;if((c[6698]|0)!=-1){c[h>>2]=26792;c[h+4>>2]=14;c[h+8>>2]=0;gA(26792,h,110)}h=(c[6699]|0)-1|0;k=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-k>>2>>>0>h>>>0){l=c[k+(h<<2)>>2]|0;if((l|0)==0){break}m=l;n=c[(c[l>>2]|0)+48>>2]|0;cc[n&15](m,19928,19954,d)|0;m=c[b>>2]|0;if((c[6602]|0)!=-1){c[g>>2]=26408;c[g+4>>2]=14;c[g+8>>2]=0;gA(26408,g,110)}n=(c[6603]|0)-1|0;l=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-l>>2>>>0>n>>>0){o=c[l+(n<<2)>>2]|0;if((o|0)==0){break}p=o;c[e>>2]=b2[c[(c[o>>2]|0)+16>>2]&255](p)|0;b0[c[(c[o>>2]|0)+20>>2]&127](a,p);p=c[b>>2]|0;gg(p)|0;i=f;return}}while(0);n=bP(4)|0;nj(n);bl(n|0,18192,158)}}while(0);f=bP(4)|0;nj(f);bl(f|0,18192,158)}function iU(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;gZ(k,b);b=k|0;k=c[b>>2]|0;if((c[6698]|0)!=-1){c[j>>2]=26792;c[j+4>>2]=14;c[j+8>>2]=0;gA(26792,j,110)}j=(c[6699]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+48>>2]|0;cc[o&15](n,19928,19960,d)|0;n=c[b>>2]|0;if((c[6602]|0)!=-1){c[h>>2]=26408;c[h+4>>2]=14;c[h+8>>2]=0;gA(26408,h,110)}o=(c[6603]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;r=p;c[e>>2]=b2[c[(c[r>>2]|0)+12>>2]&255](q)|0;c[f>>2]=b2[c[(c[r>>2]|0)+16>>2]&255](q)|0;b0[c[(c[p>>2]|0)+20>>2]&127](a,q);q=c[b>>2]|0;gg(q)|0;i=g;return}}while(0);o=bP(4)|0;nj(o);bl(o|0,18192,158)}}while(0);g=bP(4)|0;nj(g);bl(g|0,18192,158)}function iV(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(i|0)){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((c[j>>2]|0)==(b|0)){s=j;break}else{j=j+4|0}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[19928+o|0]|0;do{if((o|0)==22|(o|0)==23){a[f]=80}else if((o|0)==25|(o|0)==24){b=c[h>>2]|0;do{if((b|0)!=(g|0)){if((a[b-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=b+1;a[b]=s;p=0;return p|0}else{r=a[f]|0;if((s&95|0)!=(r<<24>>24|0)){break}a[f]=r|-128;if((a[e]&1)==0){break}a[e]=0;r=d[k]|0;if((r&1|0)==0){t=r>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}r=c[m>>2]|0;if((r-l|0)>=160){break}q=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=q}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=s;if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}function iW(a){a=a|0;ge(a|0);nM(a);return}function iX(a){a=a|0;ge(a|0);return}function iY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];cb[o&63](b,d,l,f,g,h&1);i=j;return}gZ(m,f);f=m|0;m=c[f>>2]|0;if((c[6604]|0)!=-1){c[k>>2]=26416;c[k+4>>2]=14;c[k+8>>2]=0;gA(26416,k,110)}k=(c[6605]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;gg(o)|0;o=c[l>>2]|0;if(h){b0[c[o+24>>2]&127](n,d)}else{b0[c[o+28>>2]&127](n,d)}d=n;o=n;l=a[o]|0;if((l&1)==0){p=d+1|0;q=p;r=p;s=n+8|0}else{p=n+8|0;q=c[p>>2]|0;r=d+1|0;s=p}p=e|0;d=n+4|0;t=q;u=l;while(1){if((u&1)==0){v=r}else{v=c[s>>2]|0}l=u&255;if((t|0)==(v+((l&1|0)==0?l>>>1:c[d>>2]|0)|0)){break}l=a[t]|0;w=c[p>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)!=(c[w+28>>2]|0)){c[x>>2]=y+1;a[y]=l;break}if((b1[c[(c[w>>2]|0)+52>>2]&31](w,l&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2];gF(n);i=j;return}}while(0);j=bP(4)|0;nj(j);bl(j|0,18192,158)}function iZ(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[11600]|0;a[q+1|0]=a[11601]|0;a[q+2|0]=a[11602]|0;a[q+3|0]=a[11603]|0;a[q+4|0]=a[11604]|0;a[q+5|0]=a[11605]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);v=i_(u,12,c[6340]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=1940;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1940;break}w=k+2|0}else if((h|0)==32){w=q}else{x=1940}}while(0);if((x|0)==1940){w=u}x=l|0;gZ(o,f);i$(u,w,q,x,m,n,o);gg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];fK(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function i_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+16|0;h=g|0;j=h;c[j>>2]=f;c[j+4>>2]=0;j=bD(d|0)|0;d=bE(a|0,b|0,e|0,h|0)|0;if((j|0)==0){i=g;return d|0}bD(j|0)|0;i=g;return d|0}function i$(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6700]|0)!=-1){c[n>>2]=26800;c[n+4>>2]=14;c[n+8>>2]=0;gA(26800,n,110)}n=(c[6701]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}r=k;s=c[p>>2]|0;if((c[6604]|0)!=-1){c[m>>2]=26416;c[m+4>>2]=14;c[m+8>>2]=0;gA(26416,m,110)}m=(c[6605]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}t=s;b0[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+32>>2]|0;cc[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=b1[c[(c[k>>2]|0)+28>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=b1[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1;a[y]=q;q=b1[c[(c[p>>2]|0)+28>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=b2[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+1;a[I]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=b1[c[(c[p>>2]|0)+28>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-1|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=a[J]|0;a[J]=a[K]|0;a[K]=C;J=J+1|0;K=K-1|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;gF(o);i=l;return}else{L=g+(e-b)|0;c[h>>2]=L;gF(o);i=l;return}}function i0(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);t=i_(u,22,c[6340]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=2023;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2023;break}w=l+2|0}else if((j|0)==32){w=r}else{x=2023}}while(0);if((x|0)==2023){w=u}x=m|0;gZ(p,f);i$(u,w,r,x,n,o,p);gg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];fK(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function i1(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[11600]|0;a[q+1|0]=a[11601]|0;a[q+2|0]=a[11602]|0;a[q+3|0]=a[11603]|0;a[q+4|0]=a[11604]|0;a[q+5|0]=a[11605]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=k|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);t=i_(u,12,c[6340]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=2048;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2048;break}w=k+2|0}else if((h|0)==32){w=q}else{x=2048}}while(0);if((x|0)==2048){w=u}x=l|0;gZ(o,f);i$(u,w,q,x,m,n,o);gg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];fK(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function i2(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);t=i_(u,23,c[6340]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=2073;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2073;break}w=l+2|0}else{x=2073}}while(0);if((x|0)==2073){w=u}x=m|0;gZ(p,f);i$(u,w,r,x,n,o,p);gg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];fK(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function i3(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=c[6340]|0;if(y){w=i_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=i_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[27448]|0)==0;if(y){do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=i4(m,c[6340]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);w=i4(m,c[6340]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}nR();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=2129;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=2129;break}F=E+2|0}else if((B|0)==32){F=A}else{G=2129}}while(0);if((G|0)==2129){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=nE(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}nR();H=0;I=0;J=c[m>>2]|0}}while(0);gZ(q,f);i5(J,F,A,H,o,p,q);gg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];fK(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){nF(I)}if((D|0)==0){i=d;return}nF(D);i=d;return}function i4(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=bD(b|0)|0;b=bR(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}bD(h|0)|0;i=f;return b|0}function i5(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6700]|0)!=-1){c[n>>2]=26800;c[n+4>>2]=14;c[n+8>>2]=0;gA(26800,n,110)}n=(c[6701]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}r=k;s=c[p>>2]|0;if((c[6604]|0)!=-1){c[m>>2]=26416;c[m+4>>2]=14;c[m+8>>2]=0;gA(26416,m,110)}m=(c[6605]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}t=s;b0[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=b1[c[(c[k>>2]|0)+28>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=m;v=b+1|0}else{v=b}m=f;L2688:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=2195;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=2195;break}p=k;n=b1[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1;a[q]=n;n=v+2|0;q=b1[c[(c[p>>2]|0)+28>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L2688}u=a[q]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((a3(u<<24>>24|0,c[6340]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=2195}}while(0);L2703:do{if((x|0)==2195){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L2703}q=a[w]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((bK(q<<24>>24|0,c[6340]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=2195}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+32>>2]|0;cc[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=b2[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+1;a[J]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=b1[c[(c[p>>2]|0)+28>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-1|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=a[K]|0;a[K]=a[L]|0;a[L]=D;K=K+1|0;L=L-1|0;}while(K>>>0<L>>>0)}}while(0);L2742:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=b1[c[(c[L>>2]|0)+28>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L2742}}L=b2[c[(c[s>>2]|0)+12>>2]&255](t)|0;H=c[j>>2]|0;c[j>>2]=H+1;a[H]=L;M=K+1|0}else{M=y}}while(0);cc[c[(c[k>>2]|0)+32>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;gF(o);i=l;return}N=g+(e-b)|0;c[h>>2]=N;gF(o);i=l;return}function i6(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=c[6340]|0;if(y){w=i_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=i_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[27448]|0)==0;if(y){do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=i4(m,c[6340]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);w=i4(m,c[6340]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}nR();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=2292;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=2292;break}F=E+2|0}else{G=2292}}while(0);if((G|0)==2292){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=nE(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}nR();H=0;I=0;J=c[m>>2]|0}}while(0);gZ(q,f);i5(J,F,A,H,o,p,q);gg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];fK(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){nF(I)}if((D|0)==0){i=d;return}nF(D);i=d;return}function i7(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+104|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+88|0;n=d+96|0;o=d+16|0;a[o]=a[11608]|0;a[o+1|0]=a[11609]|0;a[o+2|0]=a[11610]|0;a[o+3|0]=a[11611]|0;a[o+4|0]=a[11612]|0;a[o+5|0]=a[11613]|0;p=k|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);q=i_(p,20,c[6340]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==32){r=o}else if((h|0)==16){s=a[p]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){r=k+1|0;break}if(!((q|0)>1&s<<24>>24==48)){t=2325;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){t=2325;break}r=k+2|0}else{t=2325}}while(0);if((t|0)==2325){r=p}gZ(m,f);t=m|0;m=c[t>>2]|0;if((c[6700]|0)!=-1){c[j>>2]=26800;c[j+4>>2]=14;c[j+8>>2]=0;gA(26800,j,110)}j=(c[6701]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){s=c[h+(j<<2)>>2]|0;if((s|0)==0){break}u=s;v=c[t>>2]|0;gg(v)|0;v=l|0;w=c[(c[s>>2]|0)+32>>2]|0;cc[w&15](u,p,o,v)|0;u=l+q|0;if((r|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;fK(b,n,v,x,u,f,g);i=d;return}x=l+(r-k)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;fK(b,n,v,x,u,f,g);i=d;return}}while(0);d=bP(4)|0;nj(d);bl(d|0,18192,158)}function i8(a){a=a|0;ge(a|0);nM(a);return}function i9(a){a=a|0;ge(a|0);return}function ja(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];cb[o&63](b,d,l,f,g,h&1);i=j;return}gZ(m,f);f=m|0;m=c[f>>2]|0;if((c[6602]|0)!=-1){c[k>>2]=26408;c[k+4>>2]=14;c[k+8>>2]=0;gA(26408,k,110)}k=(c[6603]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;gg(o)|0;o=c[l>>2]|0;if(h){b0[c[o+24>>2]&127](n,d)}else{b0[c[o+28>>2]&127](n,d)}d=n;o=a[d]|0;if((o&1)==0){l=n+4|0;p=l;q=l;r=n+8|0}else{l=n+8|0;p=c[l>>2]|0;q=n+4|0;r=l}l=e|0;s=p;t=o;while(1){if((t&1)==0){u=q}else{u=c[r>>2]|0}o=t&255;if((o&1|0)==0){v=o>>>1}else{v=c[q>>2]|0}if((s|0)==(u+(v<<2)|0)){break}o=c[s>>2]|0;w=c[l>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)==(c[w+28>>2]|0)){z=b1[c[(c[w>>2]|0)+52>>2]&31](w,o)|0}else{c[x>>2]=y+4;c[y>>2]=o;z=o}if((z|0)!=-1){break}c[l>>2]=0}}while(0);s=s+4|0;t=a[d]|0}c[b>>2]=c[l>>2];gQ(n);i=j;return}}while(0);j=bP(4)|0;nj(j);bl(j|0,18192,158)}function jb(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[11600]|0;a[q+1|0]=a[11601]|0;a[q+2|0]=a[11602]|0;a[q+3|0]=a[11603]|0;a[q+4|0]=a[11604]|0;a[q+5|0]=a[11605]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);v=i_(u,12,c[6340]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=2396;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2396;break}w=k+2|0}else{x=2396}}while(0);if((x|0)==2396){w=u}x=l|0;gZ(o,f);jc(u,w,q,x,m,n,o);gg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];jd(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function jc(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6698]|0)!=-1){c[n>>2]=26792;c[n+4>>2]=14;c[n+8>>2]=0;gA(26792,n,110)}n=(c[6699]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}r=k;s=c[p>>2]|0;if((c[6602]|0)!=-1){c[m>>2]=26408;c[m+4>>2]=14;c[m+8>>2]=0;gA(26408,m,110)}m=(c[6603]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}t=s;b0[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+48>>2]|0;cc[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b<<2)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=b1[c[(c[k>>2]|0)+44>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=b1[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4;c[y>>2]=q;q=b1[c[(c[p>>2]|0)+44>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=b2[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=b1[c[(c[p>>2]|0)+44>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b<<2)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-4|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=c[J>>2]|0;c[J>>2]=c[K>>2];c[K>>2]=C;J=J+4|0;K=K-4|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;gF(o);i=l;return}else{L=g+(e-b<<2)|0;c[h>>2]=L;gF(o);i=l;return}}function jd(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g>>2;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;g=h>>2;do{if((h|0)>0){if((b4[c[(c[d>>2]|0)+48>>2]&63](d,e,g)|0)==(g|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){gP(l,q,j);if((a[l]&1)==0){r=l+4|0}else{r=c[l+8>>2]|0}if((b4[c[(c[d>>2]|0)+48>>2]&63](d,r,q)|0)==(q|0)){gQ(l);break}c[m>>2]=0;c[b>>2]=0;gQ(l);i=k;return}}while(0);l=n-o|0;o=l>>2;do{if((l|0)>0){if((b4[c[(c[d>>2]|0)+48>>2]&63](d,f,o)|0)==(o|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function je(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+232|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+200|0;o=d+208|0;p=d+216|0;q=d+224|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=l|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);v=i_(u,22,c[6340]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+v|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=2497;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2497;break}w=l+2|0}else if((j|0)==32){w=r}else{x=2497}}while(0);if((x|0)==2497){w=u}x=m|0;gZ(p,f);jc(u,w,r,x,n,o,p);gg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];jd(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function jf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[11600]|0;a[q+1|0]=a[11601]|0;a[q+2|0]=a[11602]|0;a[q+3|0]=a[11603]|0;a[q+4|0]=a[11604]|0;a[q+5|0]=a[11605]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=k|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);v=i_(u,12,c[6340]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=2522;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2522;break}w=k+2|0}else if((h|0)==32){w=q}else{x=2522}}while(0);if((x|0)==2522){w=u}x=l|0;gZ(o,f);jc(u,w,q,x,m,n,o);gg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];jd(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function jg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+240|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+208|0;o=d+216|0;p=d+224|0;q=d+232|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);t=i_(u,23,c[6340]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=2547;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=2547;break}w=l+2|0}else if((j|0)==32){w=r}else{x=2547}}while(0);if((x|0)==2547){w=u}x=m|0;gZ(p,f);jc(u,w,r,x,n,o,p);gg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];jd(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function jh(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=c[6340]|0;if(y){w=i_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=i_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[27448]|0)==0;if(y){do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=i4(m,c[6340]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);w=i4(m,c[6340]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}nR();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else if((B|0)==32){F=A}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=nE(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}nR();H=B;I=B;J=c[m>>2]|0}}while(0);gZ(q,f);ji(J,F,A,H,o,p,q);gg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];jd(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){nF(I)}if((D|0)==0){i=d;return}nF(D);i=d;return}function ji(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6698]|0)!=-1){c[n>>2]=26792;c[n+4>>2]=14;c[n+8>>2]=0;gA(26792,n,110)}n=(c[6699]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bP(4)|0;s=r;nj(s);bl(r|0,18192,158)}r=k;s=c[p>>2]|0;if((c[6602]|0)!=-1){c[m>>2]=26408;c[m+4>>2]=14;c[m+8>>2]=0;gA(26408,m,110)}m=(c[6603]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bP(4)|0;u=t;nj(u);bl(t|0,18192,158)}t=s;b0[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=b1[c[(c[k>>2]|0)+44>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L104:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=108;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=108;break}p=k;n=b1[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4;c[q>>2]=n;n=v+2|0;q=b1[c[(c[p>>2]|0)+44>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L104}u=a[q]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((a3(u<<24>>24|0,c[6340]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=108}}while(0);L119:do{if((x|0)==108){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L119}q=a[w]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((bK(q<<24>>24|0,c[6340]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=108}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+48>>2]|0;cc[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z<<2)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=b2[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=b1[c[(c[p>>2]|0)+44>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b<<2)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-4|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=c[K>>2]|0;c[K>>2]=c[L>>2];c[L>>2]=D;K=K+4|0;L=L-4|0;}while(K>>>0<L>>>0)}}while(0);L158:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=b1[c[(c[L>>2]|0)+44>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L158}}L=b2[c[(c[s>>2]|0)+12>>2]&255](t)|0;H=c[j>>2]|0;c[j>>2]=H+4;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);cc[c[(c[k>>2]|0)+48>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;gF(o);i=l;return}N=g+(e-b<<2)|0;c[h>>2]=N;gF(o);i=l;return}function jj(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=c[6340]|0;if(y){w=i_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=i_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[27448]|0)==0;if(y){do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=i4(m,c[6340]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);w=i4(m,c[6340]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}nR();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=205;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=205;break}F=E+2|0}else if((B|0)==32){F=A}else{G=205}}while(0);if((G|0)==205){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=nE(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}nR();H=B;I=B;J=c[m>>2]|0}}while(0);gZ(q,f);ji(J,F,A,H,o,p,q);gg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];jd(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){nF(I)}if((D|0)==0){i=d;return}nF(D);i=d;return}function jk(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+216|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+200|0;n=d+208|0;o=d+16|0;a[o]=a[11608]|0;a[o+1|0]=a[11609]|0;a[o+2|0]=a[11610]|0;a[o+3|0]=a[11611]|0;a[o+4|0]=a[11612]|0;a[o+5|0]=a[11613]|0;p=k|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);q=i_(p,20,c[6340]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==32){r=o}else if((h|0)==16){s=a[p]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){r=k+1|0;break}if(!((q|0)>1&s<<24>>24==48)){t=238;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){t=238;break}r=k+2|0}else{t=238}}while(0);if((t|0)==238){r=p}gZ(m,f);t=m|0;m=c[t>>2]|0;if((c[6698]|0)!=-1){c[j>>2]=26792;c[j+4>>2]=14;c[j+8>>2]=0;gA(26792,j,110)}j=(c[6699]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){s=c[h+(j<<2)>>2]|0;if((s|0)==0){break}u=s;v=c[t>>2]|0;gg(v)|0;v=l|0;w=c[(c[s>>2]|0)+48>>2]|0;cc[w&15](u,p,o,v)|0;u=l+(q<<2)|0;if((r|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;jd(b,n,v,x,u,f,g);i=d;return}x=l+(r-k<<2)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;jd(b,n,v,x,u,f,g);i=d;return}}while(0);d=bP(4)|0;nj(d);bl(d|0,18192,158)}function jl(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;n=i;i=i+48|0;o=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[o>>2];o=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[o>>2];o=n|0;p=n+16|0;q=n+24|0;r=n+32|0;s=n+40|0;gZ(p,h);t=p|0;p=c[t>>2]|0;if((c[6700]|0)!=-1){c[o>>2]=26800;c[o+4>>2]=14;c[o+8>>2]=0;gA(26800,o,110)}o=(c[6701]|0)-1|0;u=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-u>>2>>>0>o>>>0){v=c[u+(o<<2)>>2]|0;if((v|0)==0){break}w=v;x=c[t>>2]|0;gg(x)|0;c[j>>2]=0;x=f|0;L288:do{if((l|0)==(m|0)){y=317}else{z=g|0;A=v;B=v;C=v+8|0;D=e;E=r|0;F=s|0;G=q|0;H=l;I=0;L290:while(1){J=I;while(1){if((J|0)!=0){y=317;break L288}K=c[x>>2]|0;do{if((K|0)==0){L=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){L=K;break}if((b2[c[(c[K>>2]|0)+36>>2]&255](K)|0)!=-1){L=K;break}c[x>>2]=0;L=0}}while(0);K=(L|0)==0;M=c[z>>2]|0;L300:do{if((M|0)==0){y=270}else{do{if((c[M+12>>2]|0)==(c[M+16>>2]|0)){if((b2[c[(c[M>>2]|0)+36>>2]&255](M)|0)!=-1){break}c[z>>2]=0;y=270;break L300}}while(0);if(K){N=M}else{y=271;break L290}}}while(0);if((y|0)==270){y=0;if(K){y=271;break L290}else{N=0}}if((b4[c[(c[A>>2]|0)+36>>2]&63](w,a[H]|0,0)|0)<<24>>24==37){y=274;break}M=a[H]|0;if(M<<24>>24>=0){O=c[C>>2]|0;if((b[O+(M<<24>>24<<1)>>1]&8192)!=0){P=H;y=285;break}}Q=L+12|0;M=c[Q>>2]|0;R=L+16|0;if((M|0)==(c[R>>2]|0)){S=(b2[c[(c[L>>2]|0)+36>>2]&255](L)|0)&255}else{S=a[M]|0}M=b1[c[(c[B>>2]|0)+12>>2]&31](w,S)|0;if(M<<24>>24==(b1[c[(c[B>>2]|0)+12>>2]&31](w,a[H]|0)|0)<<24>>24){y=312;break}c[j>>2]=4;J=4}L318:do{if((y|0)==312){y=0;J=c[Q>>2]|0;if((J|0)==(c[R>>2]|0)){M=c[(c[L>>2]|0)+40>>2]|0;b2[M&255](L)|0}else{c[Q>>2]=J+1}T=H+1|0}else if((y|0)==274){y=0;J=H+1|0;if((J|0)==(m|0)){y=275;break L290}M=b4[c[(c[A>>2]|0)+36>>2]&63](w,a[J]|0,0)|0;if((M<<24>>24|0)==69|(M<<24>>24|0)==48){U=H+2|0;if((U|0)==(m|0)){y=278;break L290}V=M;W=b4[c[(c[A>>2]|0)+36>>2]&63](w,a[U]|0,0)|0;X=U}else{V=0;W=M;X=J}J=c[(c[D>>2]|0)+36>>2]|0;c[E>>2]=L;c[F>>2]=N;b9[J&7](q,e,r,s,h,j,k,W,V);c[x>>2]=c[G>>2];T=X+1|0}else if((y|0)==285){while(1){y=0;J=P+1|0;if((J|0)==(m|0)){Y=m;break}M=a[J]|0;if(M<<24>>24<0){Y=J;break}if((b[O+(M<<24>>24<<1)>>1]&8192)==0){Y=J;break}else{P=J;y=285}}K=L;J=N;while(1){do{if((K|0)==0){Z=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){Z=K;break}if((b2[c[(c[K>>2]|0)+36>>2]&255](K)|0)!=-1){Z=K;break}c[x>>2]=0;Z=0}}while(0);M=(Z|0)==0;do{if((J|0)==0){y=298}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(M){_=J;break}else{T=Y;break L318}}if((b2[c[(c[J>>2]|0)+36>>2]&255](J)|0)==-1){c[z>>2]=0;y=298;break}else{if(M^(J|0)==0){_=J;break}else{T=Y;break L318}}}}while(0);if((y|0)==298){y=0;if(M){T=Y;break L318}else{_=0}}U=Z+12|0;$=c[U>>2]|0;aa=Z+16|0;if(($|0)==(c[aa>>2]|0)){ab=(b2[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)&255}else{ab=a[$]|0}if(ab<<24>>24<0){T=Y;break L318}if((b[(c[C>>2]|0)+(ab<<24>>24<<1)>>1]&8192)==0){T=Y;break L318}$=c[U>>2]|0;if(($|0)==(c[aa>>2]|0)){aa=c[(c[Z>>2]|0)+40>>2]|0;b2[aa&255](Z)|0;K=Z;J=_;continue}else{c[U>>2]=$+1;K=Z;J=_;continue}}}}while(0);if((T|0)==(m|0)){y=317;break L288}H=T;I=c[j>>2]|0}if((y|0)==271){c[j>>2]=4;ac=L;break}else if((y|0)==275){c[j>>2]=4;ac=L;break}else if((y|0)==278){c[j>>2]=4;ac=L;break}}}while(0);if((y|0)==317){ac=c[x>>2]|0}w=f|0;do{if((ac|0)!=0){if((c[ac+12>>2]|0)!=(c[ac+16>>2]|0)){break}if((b2[c[(c[ac>>2]|0)+36>>2]&255](ac)|0)!=-1){break}c[w>>2]=0}}while(0);x=c[w>>2]|0;v=(x|0)==0;I=g|0;H=c[I>>2]|0;L376:do{if((H|0)==0){y=327}else{do{if((c[H+12>>2]|0)==(c[H+16>>2]|0)){if((b2[c[(c[H>>2]|0)+36>>2]&255](H)|0)!=-1){break}c[I>>2]=0;y=327;break L376}}while(0);if(!v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);do{if((y|0)==327){if(v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);c[j>>2]=c[j>>2]|2;ad=d|0;c[ad>>2]=x;i=n;return}}while(0);n=bP(4)|0;nj(n);bl(n|0,18192,158)}function jm(a){a=a|0;ge(a|0);nM(a);return}function jn(a){a=a|0;ge(a|0);return}function jo(a){a=a|0;return 2}function jp(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];jl(a,b,k,l,f,g,h,11592,11600);i=j;return}function jq(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=b2[c[(c[n>>2]|0)+20>>2]&255](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=o;e=a[o]|0;if((e&1)==0){p=f+1|0;q=f+1|0}else{f=c[o+8>>2]|0;p=f;q=f}f=e&255;if((f&1|0)==0){r=f>>>1}else{r=c[o+4>>2]|0}jl(b,d,l,m,g,h,j,q,p+r|0);i=k;return}function jr(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;gZ(m,f);f=m|0;m=c[f>>2]|0;if((c[6700]|0)!=-1){c[l>>2]=26800;c[l+4>>2]=14;c[l+8>>2]=0;gA(26800,l,110)}l=(c[6701]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b2[c[c[q>>2]>>2]&255](q)|0;c[k>>2]=o;o=(h4(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bP(4)|0;nj(j);bl(j|0,18192,158)}function js(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;gZ(m,f);f=m|0;m=c[f>>2]|0;if((c[6700]|0)!=-1){c[l>>2]=26800;c[l+4>>2]=14;c[l+8>>2]=0;gA(26800,l,110)}l=(c[6701]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b2[c[(c[q>>2]|0)+4>>2]&255](q)|0;c[k>>2]=o;o=(h4(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bP(4)|0;nj(j);bl(j|0,18192,158)}function jt(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;gZ(l,f);f=l|0;l=c[f>>2]|0;if((c[6700]|0)!=-1){c[k>>2]=26800;c[k+4>>2]=14;c[k+8>>2]=0;gA(26800,k,110)}k=(c[6701]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;gg(n)|0;c[j>>2]=c[e>>2];n=jy(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=bP(4)|0;nj(b);bl(b|0,18192,158)}function ju(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;gZ(z,g);_=z|0;z=c[_>>2]|0;if((c[6700]|0)!=-1){c[y>>2]=26800;c[y+4>>2]=14;c[y+8>>2]=0;gA(26800,y,110)}y=(c[6701]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;gg(aa)|0;L453:do{switch(k<<24>>24|0){case 89:{c[m>>2]=c[f>>2];aa=jy(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L453}c[j+20>>2]=aa-1900;break};case 37:{c[Z>>2]=c[f>>2];jx(0,e,Z,h,ab);break};case 72:{c[u>>2]=c[f>>2];aa=jy(e,u,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L453}else{c[h>>2]=ac|4;break L453}break};case 73:{ac=j+8|0;c[t>>2]=c[f>>2];aa=jy(e,t,h,ab,2)|0;ad=c[h>>2]|0;do{if((ad&4|0)==0){if((aa-1|0)>>>0>=12>>>0){break}c[ac>>2]=aa;break L453}}while(0);c[h>>2]=ad|4;break};case 98:case 66:case 104:{aa=c[f>>2]|0;ac=d+8|0;ae=b2[c[(c[ac>>2]|0)+4>>2]&255](ac)|0;c[w>>2]=aa;aa=(h4(e,w,ae,ae+288|0,ab,h,0)|0)-ae|0;if((aa|0)>=288){break L453}c[j+16>>2]=((aa|0)/12|0|0)%12|0;break};case 110:case 116:{c[J>>2]=c[f>>2];jv(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];jw(d,j+8|0,e,K,h,ab);break};case 114:{aa=e|0;c[M>>2]=c[aa>>2];c[N>>2]=c[f>>2];jl(L,d,M,N,g,h,j,11560,11571);c[aa>>2]=c[L>>2];break};case 82:{aa=e|0;c[P>>2]=c[aa>>2];c[Q>>2]=c[f>>2];jl(O,d,P,Q,g,h,j,11552,11557);c[aa>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];aa=jy(e,p,h,ab,2)|0;ae=c[h>>2]|0;if((ae&4|0)==0&(aa|0)<61){c[j>>2]=aa;break L453}else{c[h>>2]=ae|4;break L453}break};case 84:{ae=e|0;c[S>>2]=c[ae>>2];c[T>>2]=c[f>>2];jl(R,d,S,T,g,h,j,11544,11552);c[ae>>2]=c[R>>2];break};case 119:{c[o>>2]=c[f>>2];ae=jy(e,o,h,ab,1)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ae|0)<7){c[j+24>>2]=ae;break L453}else{c[h>>2]=aa|4;break L453}break};case 100:case 101:{aa=j+12|0;c[v>>2]=c[f>>2];ae=jy(e,v,h,ab,2)|0;ac=c[h>>2]|0;do{if((ac&4|0)==0){if((ae-1|0)>>>0>=31>>>0){break}c[aa>>2]=ae;break L453}}while(0);c[h>>2]=ac|4;break};case 68:{ae=e|0;c[E>>2]=c[ae>>2];c[F>>2]=c[f>>2];jl(D,d,E,F,g,h,j,11584,11592);c[ae>>2]=c[D>>2];break};case 70:{ae=e|0;c[H>>2]=c[ae>>2];c[I>>2]=c[f>>2];jl(G,d,H,I,g,h,j,11576,11584);c[ae>>2]=c[G>>2];break};case 97:case 65:{ae=c[f>>2]|0;aa=d+8|0;ad=b2[c[c[aa>>2]>>2]&255](aa)|0;c[x>>2]=ae;ae=(h4(e,x,ad,ad+168|0,ab,h,0)|0)-ad|0;if((ae|0)>=168){break L453}c[j+24>>2]=((ae|0)/12|0|0)%7|0;break};case 120:{ae=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];b_[ae&127](b,d,U,V,g,h,j);i=l;return};case 88:{ae=d+8|0;ad=b2[c[(c[ae>>2]|0)+24>>2]&255](ae)|0;ae=e|0;c[X>>2]=c[ae>>2];c[Y>>2]=c[f>>2];aa=ad;af=a[ad]|0;if((af&1)==0){ag=aa+1|0;ah=aa+1|0}else{aa=c[ad+8>>2]|0;ag=aa;ah=aa}aa=af&255;if((aa&1|0)==0){ai=aa>>>1}else{ai=c[ad+4>>2]|0}jl(W,d,X,Y,g,h,j,ah,ag+ai|0);c[ae>>2]=c[W>>2];break};case 121:{c[n>>2]=c[f>>2];ae=jy(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L453}if((ae|0)<69){aj=ae+2e3|0}else{aj=(ae-69|0)>>>0<31>>>0?ae+1900|0:ae}c[j+20>>2]=aj-1900;break};case 99:{ae=d+8|0;ad=b2[c[(c[ae>>2]|0)+12>>2]&255](ae)|0;ae=e|0;c[B>>2]=c[ae>>2];c[C>>2]=c[f>>2];aa=ad;af=a[ad]|0;if((af&1)==0){ak=aa+1|0;al=aa+1|0}else{aa=c[ad+8>>2]|0;ak=aa;al=aa}aa=af&255;if((aa&1|0)==0){am=aa>>>1}else{am=c[ad+4>>2]|0}jl(A,d,B,C,g,h,j,al,ak+am|0);c[ae>>2]=c[A>>2];break};case 106:{c[s>>2]=c[f>>2];ae=jy(e,s,h,ab,3)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ae|0)<366){c[j+28>>2]=ae;break L453}else{c[h>>2]=ad|4;break L453}break};case 109:{c[r>>2]=c[f>>2];ad=(jy(e,r,h,ab,2)|0)-1|0;ae=c[h>>2]|0;if((ae&4|0)==0&(ad|0)<12){c[j+16>>2]=ad;break L453}else{c[h>>2]=ae|4;break L453}break};case 77:{c[q>>2]=c[f>>2];ae=jy(e,q,h,ab,2)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ae|0)<60){c[j+4>>2]=ae;break L453}else{c[h>>2]=ad|4;break L453}break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=bP(4)|0;nj(l);bl(l|0,18192,158)}function jv(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;j=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[j>>2];j=e|0;e=f|0;f=h+8|0;L534:while(1){h=c[j>>2]|0;do{if((h|0)==0){k=0}else{if((c[h+12>>2]|0)!=(c[h+16>>2]|0)){k=h;break}if((b2[c[(c[h>>2]|0)+36>>2]&255](h)|0)==-1){c[j>>2]=0;k=0;break}else{k=c[j>>2]|0;break}}}while(0);h=(k|0)==0;l=c[e>>2]|0;L543:do{if((l|0)==0){m=467}else{do{if((c[l+12>>2]|0)==(c[l+16>>2]|0)){if((b2[c[(c[l>>2]|0)+36>>2]&255](l)|0)!=-1){break}c[e>>2]=0;m=467;break L543}}while(0);if(h){n=l;o=0}else{p=l;q=0;break L534}}}while(0);if((m|0)==467){m=0;if(h){p=0;q=1;break}else{n=0;o=1}}l=c[j>>2]|0;r=c[l+12>>2]|0;if((r|0)==(c[l+16>>2]|0)){s=(b2[c[(c[l>>2]|0)+36>>2]&255](l)|0)&255}else{s=a[r]|0}if(s<<24>>24<0){p=n;q=o;break}if((b[(c[f>>2]|0)+(s<<24>>24<<1)>>1]&8192)==0){p=n;q=o;break}r=c[j>>2]|0;l=r+12|0;t=c[l>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;b2[u&255](r)|0;continue}else{c[l>>2]=t+1;continue}}o=c[j>>2]|0;do{if((o|0)==0){v=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){v=o;break}if((b2[c[(c[o>>2]|0)+36>>2]&255](o)|0)==-1){c[j>>2]=0;v=0;break}else{v=c[j>>2]|0;break}}}while(0);j=(v|0)==0;do{if(q){m=486}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(!(j^(p|0)==0)){break}i=d;return}if((b2[c[(c[p>>2]|0)+36>>2]&255](p)|0)==-1){c[e>>2]=0;m=486;break}if(!j){break}i=d;return}}while(0);do{if((m|0)==486){if(j){break}i=d;return}}while(0);c[g>>2]=c[g>>2]|2;i=d;return}function jw(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=b2[c[(c[l>>2]|0)+8>>2]&255](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=h4(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function jx(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;h=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[h>>2];h=d|0;d=c[h>>2]|0;do{if((d|0)==0){j=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){j=d;break}if((b2[c[(c[d>>2]|0)+36>>2]&255](d)|0)==-1){c[h>>2]=0;j=0;break}else{j=c[h>>2]|0;break}}}while(0);d=(j|0)==0;j=e|0;e=c[j>>2]|0;L617:do{if((e|0)==0){k=524}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((b2[c[(c[e>>2]|0)+36>>2]&255](e)|0)!=-1){break}c[j>>2]=0;k=524;break L617}}while(0);if(d){l=e;m=0}else{k=525}}}while(0);if((k|0)==524){if(d){k=525}else{l=0;m=1}}if((k|0)==525){c[f>>2]=c[f>>2]|6;i=b;return}d=c[h>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){n=(b2[c[(c[d>>2]|0)+36>>2]&255](d)|0)&255}else{n=a[e]|0}if((b4[c[(c[g>>2]|0)+36>>2]&63](g,n,0)|0)<<24>>24!=37){c[f>>2]=c[f>>2]|4;i=b;return}n=c[h>>2]|0;g=n+12|0;e=c[g>>2]|0;if((e|0)==(c[n+16>>2]|0)){d=c[(c[n>>2]|0)+40>>2]|0;b2[d&255](n)|0}else{c[g>>2]=e+1}e=c[h>>2]|0;do{if((e|0)==0){o=0}else{if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){o=e;break}if((b2[c[(c[e>>2]|0)+36>>2]&255](e)|0)==-1){c[h>>2]=0;o=0;break}else{o=c[h>>2]|0;break}}}while(0);h=(o|0)==0;do{if(m){k=544}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){if(!(h^(l|0)==0)){break}i=b;return}if((b2[c[(c[l>>2]|0)+36>>2]&255](l)|0)==-1){c[j>>2]=0;k=544;break}if(!h){break}i=b;return}}while(0);do{if((k|0)==544){if(h){break}i=b;return}}while(0);c[f>>2]=c[f>>2]|2;i=b;return}function jy(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;j=i;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){l=d;break}if((b2[c[(c[d>>2]|0)+36>>2]&255](d)|0)==-1){c[k>>2]=0;l=0;break}else{l=c[k>>2]|0;break}}}while(0);d=(l|0)==0;l=e|0;e=c[l>>2]|0;L671:do{if((e|0)==0){m=564}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((b2[c[(c[e>>2]|0)+36>>2]&255](e)|0)!=-1){break}c[l>>2]=0;m=564;break L671}}while(0);if(d){n=e}else{m=565}}}while(0);if((m|0)==564){if(d){m=565}else{n=0}}if((m|0)==565){c[f>>2]=c[f>>2]|6;o=0;i=j;return o|0}d=c[k>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){p=(b2[c[(c[d>>2]|0)+36>>2]&255](d)|0)&255}else{p=a[e]|0}do{if(p<<24>>24>=0){e=g+8|0;if((b[(c[e>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0){break}d=g;q=(b4[c[(c[d>>2]|0)+36>>2]&63](g,p,0)|0)<<24>>24;r=c[k>>2]|0;s=r+12|0;t=c[s>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;b2[u&255](r)|0;v=q;w=h;x=n}else{c[s>>2]=t+1;v=q;w=h;x=n}while(1){y=v-48|0;q=w-1|0;t=c[k>>2]|0;do{if((t|0)==0){z=0}else{if((c[t+12>>2]|0)!=(c[t+16>>2]|0)){z=t;break}if((b2[c[(c[t>>2]|0)+36>>2]&255](t)|0)==-1){c[k>>2]=0;z=0;break}else{z=c[k>>2]|0;break}}}while(0);t=(z|0)==0;if((x|0)==0){A=z;B=0}else{do{if((c[x+12>>2]|0)==(c[x+16>>2]|0)){if((b2[c[(c[x>>2]|0)+36>>2]&255](x)|0)!=-1){C=x;break}c[l>>2]=0;C=0}else{C=x}}while(0);A=c[k>>2]|0;B=C}D=(B|0)==0;if(!((t^D)&(q|0)>0)){m=594;break}s=c[A+12>>2]|0;if((s|0)==(c[A+16>>2]|0)){E=(b2[c[(c[A>>2]|0)+36>>2]&255](A)|0)&255}else{E=a[s]|0}if(E<<24>>24<0){o=y;m=607;break}if((b[(c[e>>2]|0)+(E<<24>>24<<1)>>1]&2048)==0){o=y;m=608;break}s=((b4[c[(c[d>>2]|0)+36>>2]&63](g,E,0)|0)<<24>>24)+(y*10|0)|0;r=c[k>>2]|0;u=r+12|0;F=c[u>>2]|0;if((F|0)==(c[r+16>>2]|0)){G=c[(c[r>>2]|0)+40>>2]|0;b2[G&255](r)|0;v=s;w=q;x=B;continue}else{c[u>>2]=F+1;v=s;w=q;x=B;continue}}if((m|0)==594){do{if((A|0)==0){H=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){H=A;break}if((b2[c[(c[A>>2]|0)+36>>2]&255](A)|0)==-1){c[k>>2]=0;H=0;break}else{H=c[k>>2]|0;break}}}while(0);d=(H|0)==0;L728:do{if(D){m=604}else{do{if((c[B+12>>2]|0)==(c[B+16>>2]|0)){if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){break}c[l>>2]=0;m=604;break L728}}while(0);if(d){o=y}else{break}i=j;return o|0}}while(0);do{if((m|0)==604){if(d){break}else{o=y}i=j;return o|0}}while(0);c[f>>2]=c[f>>2]|2;o=y;i=j;return o|0}else if((m|0)==607){i=j;return o|0}else if((m|0)==608){i=j;return o|0}}}while(0);c[f>>2]=c[f>>2]|4;o=0;i=j;return o|0}function jz(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0;l=i;i=i+48|0;m=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[m>>2];m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=l|0;n=l+16|0;o=l+24|0;p=l+32|0;q=l+40|0;gZ(n,f);r=n|0;n=c[r>>2]|0;if((c[6698]|0)!=-1){c[m>>2]=26792;c[m+4>>2]=14;c[m+8>>2]=0;gA(26792,m,110)}m=(c[6699]|0)-1|0;s=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;v=c[r>>2]|0;gg(v)|0;c[g>>2]=0;v=d|0;L751:do{if((j|0)==(k|0)){w=684}else{x=e|0;y=t;z=t;A=t;B=b;C=p|0;D=q|0;E=o|0;F=j;G=0;L753:while(1){H=G;while(1){if((H|0)!=0){w=684;break L751}I=c[v>>2]|0;do{if((I|0)==0){J=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){L=b2[c[(c[I>>2]|0)+36>>2]&255](I)|0}else{L=c[K>>2]|0}if((L|0)!=-1){J=I;break}c[v>>2]=0;J=0}}while(0);I=(J|0)==0;K=c[x>>2]|0;do{if((K|0)==0){w=636}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=b2[c[(c[K>>2]|0)+36>>2]&255](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[x>>2]=0;w=636;break}else{if(I^(K|0)==0){O=K;break}else{w=638;break L753}}}}while(0);if((w|0)==636){w=0;if(I){w=638;break L753}else{O=0}}if((b4[c[(c[y>>2]|0)+52>>2]&63](u,c[F>>2]|0,0)|0)<<24>>24==37){w=641;break}if(b4[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[F>>2]|0)|0){P=F;w=651;break}Q=J+12|0;K=c[Q>>2]|0;R=J+16|0;if((K|0)==(c[R>>2]|0)){S=b2[c[(c[J>>2]|0)+36>>2]&255](J)|0}else{S=c[K>>2]|0}K=b1[c[(c[A>>2]|0)+28>>2]&31](u,S)|0;if((K|0)==(b1[c[(c[A>>2]|0)+28>>2]&31](u,c[F>>2]|0)|0)){w=679;break}c[g>>2]=4;H=4}L785:do{if((w|0)==679){w=0;H=c[Q>>2]|0;if((H|0)==(c[R>>2]|0)){K=c[(c[J>>2]|0)+40>>2]|0;b2[K&255](J)|0}else{c[Q>>2]=H+4}T=F+4|0}else if((w|0)==641){w=0;H=F+4|0;if((H|0)==(k|0)){w=642;break L753}K=b4[c[(c[y>>2]|0)+52>>2]&63](u,c[H>>2]|0,0)|0;if((K<<24>>24|0)==69|(K<<24>>24|0)==48){M=F+8|0;if((M|0)==(k|0)){w=645;break L753}U=K;V=b4[c[(c[y>>2]|0)+52>>2]&63](u,c[M>>2]|0,0)|0;W=M}else{U=0;V=K;W=H}H=c[(c[B>>2]|0)+36>>2]|0;c[C>>2]=J;c[D>>2]=O;b9[H&7](o,b,p,q,f,g,h,V,U);c[v>>2]=c[E>>2];T=W+4|0}else if((w|0)==651){while(1){w=0;H=P+4|0;if((H|0)==(k|0)){X=k;break}if(b4[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[H>>2]|0)|0){P=H;w=651}else{X=H;break}}I=J;H=O;while(1){do{if((I|0)==0){Y=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){Z=b2[c[(c[I>>2]|0)+36>>2]&255](I)|0}else{Z=c[K>>2]|0}if((Z|0)!=-1){Y=I;break}c[v>>2]=0;Y=0}}while(0);K=(Y|0)==0;do{if((H|0)==0){w=666}else{M=c[H+12>>2]|0;if((M|0)==(c[H+16>>2]|0)){_=b2[c[(c[H>>2]|0)+36>>2]&255](H)|0}else{_=c[M>>2]|0}if((_|0)==-1){c[x>>2]=0;w=666;break}else{if(K^(H|0)==0){$=H;break}else{T=X;break L785}}}}while(0);if((w|0)==666){w=0;if(K){T=X;break L785}else{$=0}}M=Y+12|0;aa=c[M>>2]|0;ab=Y+16|0;if((aa|0)==(c[ab>>2]|0)){ac=b2[c[(c[Y>>2]|0)+36>>2]&255](Y)|0}else{ac=c[aa>>2]|0}if(!(b4[c[(c[z>>2]|0)+12>>2]&63](u,8192,ac)|0)){T=X;break L785}aa=c[M>>2]|0;if((aa|0)==(c[ab>>2]|0)){ab=c[(c[Y>>2]|0)+40>>2]|0;b2[ab&255](Y)|0;I=Y;H=$;continue}else{c[M>>2]=aa+4;I=Y;H=$;continue}}}}while(0);if((T|0)==(k|0)){w=684;break L751}F=T;G=c[g>>2]|0}if((w|0)==645){c[g>>2]=4;ad=J;break}else if((w|0)==638){c[g>>2]=4;ad=J;break}else if((w|0)==642){c[g>>2]=4;ad=J;break}}}while(0);if((w|0)==684){ad=c[v>>2]|0}u=d|0;do{if((ad|0)!=0){t=c[ad+12>>2]|0;if((t|0)==(c[ad+16>>2]|0)){ae=b2[c[(c[ad>>2]|0)+36>>2]&255](ad)|0}else{ae=c[t>>2]|0}if((ae|0)!=-1){break}c[u>>2]=0}}while(0);v=c[u>>2]|0;t=(v|0)==0;G=e|0;F=c[G>>2]|0;do{if((F|0)==0){w=697}else{z=c[F+12>>2]|0;if((z|0)==(c[F+16>>2]|0)){af=b2[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{af=c[z>>2]|0}if((af|0)==-1){c[G>>2]=0;w=697;break}if(!(t^(F|0)==0)){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);do{if((w|0)==697){if(t){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);c[g>>2]=c[g>>2]|2;ag=a|0;c[ag>>2]=v;i=l;return}}while(0);l=bP(4)|0;nj(l);bl(l|0,18192,158)}function jA(a){a=a|0;ge(a|0);nM(a);return}function jB(a){a=a|0;ge(a|0);return}function jC(a){a=a|0;return 2}function jD(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];jz(a,b,k,l,f,g,h,11512,11544);i=j;return}function jE(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=b2[c[(c[n>>2]|0)+20>>2]&255](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=a[o]|0;if((f&1)==0){p=o+4|0;q=o+4|0}else{e=c[o+8>>2]|0;p=e;q=e}e=f&255;if((e&1|0)==0){r=e>>>1}else{r=c[o+4>>2]|0}jz(b,d,l,m,g,h,j,q,p+(r<<2)|0);i=k;return}function jF(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;gZ(m,f);f=m|0;m=c[f>>2]|0;if((c[6698]|0)!=-1){c[l>>2]=26792;c[l+4>>2]=14;c[l+8>>2]=0;gA(26792,l,110)}l=(c[6699]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b2[c[c[q>>2]>>2]&255](q)|0;c[k>>2]=o;o=(iv(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bP(4)|0;nj(j);bl(j|0,18192,158)}function jG(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;gZ(m,f);f=m|0;m=c[f>>2]|0;if((c[6698]|0)!=-1){c[l>>2]=26792;c[l+4>>2]=14;c[l+8>>2]=0;gA(26792,l,110)}l=(c[6699]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b2[c[(c[q>>2]|0)+4>>2]&255](q)|0;c[k>>2]=o;o=(iv(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bP(4)|0;nj(j);bl(j|0,18192,158)}function jH(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;gZ(l,f);f=l|0;l=c[f>>2]|0;if((c[6698]|0)!=-1){c[k>>2]=26792;c[k+4>>2]=14;c[k+8>>2]=0;gA(26792,k,110)}k=(c[6699]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;gg(n)|0;c[j>>2]=c[e>>2];n=jM(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=bP(4)|0;nj(b);bl(b|0,18192,158)}function jI(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;gZ(z,g);_=z|0;z=c[_>>2]|0;if((c[6698]|0)!=-1){c[y>>2]=26792;c[y+4>>2]=14;c[y+8>>2]=0;gA(26792,y,110)}y=(c[6699]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;gg(aa)|0;L928:do{switch(k<<24>>24|0){case 121:{c[n>>2]=c[f>>2];aa=jM(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L928}if((aa|0)<69){ac=aa+2e3|0}else{ac=(aa-69|0)>>>0<31>>>0?aa+1900|0:aa}c[j+20>>2]=ac-1900;break};case 89:{c[m>>2]=c[f>>2];aa=jM(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L928}c[j+20>>2]=aa-1900;break};case 77:{c[q>>2]=c[f>>2];aa=jM(e,q,h,ab,2)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(aa|0)<60){c[j+4>>2]=aa;break L928}else{c[h>>2]=ad|4;break L928}break};case 110:case 116:{c[J>>2]=c[f>>2];jJ(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];jK(d,j+8|0,e,K,h,ab);break};case 114:{ad=e|0;c[M>>2]=c[ad>>2];c[N>>2]=c[f>>2];jz(L,d,M,N,g,h,j,11432,11476);c[ad>>2]=c[L>>2];break};case 98:case 66:case 104:{ad=c[f>>2]|0;aa=d+8|0;ae=b2[c[(c[aa>>2]|0)+4>>2]&255](aa)|0;c[w>>2]=ad;ad=(iv(e,w,ae,ae+288|0,ab,h,0)|0)-ae|0;if((ad|0)>=288){break L928}c[j+16>>2]=((ad|0)/12|0|0)%12|0;break};case 82:{ad=e|0;c[P>>2]=c[ad>>2];c[Q>>2]=c[f>>2];jz(O,d,P,Q,g,h,j,11408,11428);c[ad>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];ad=jM(e,p,h,ab,2)|0;ae=c[h>>2]|0;if((ae&4|0)==0&(ad|0)<61){c[j>>2]=ad;break L928}else{c[h>>2]=ae|4;break L928}break};case 37:{c[Z>>2]=c[f>>2];jL(0,e,Z,h,ab);break};case 97:case 65:{ae=c[f>>2]|0;ad=d+8|0;aa=b2[c[c[ad>>2]>>2]&255](ad)|0;c[x>>2]=ae;ae=(iv(e,x,aa,aa+168|0,ab,h,0)|0)-aa|0;if((ae|0)>=168){break L928}c[j+24>>2]=((ae|0)/12|0|0)%7|0;break};case 100:case 101:{ae=j+12|0;c[v>>2]=c[f>>2];aa=jM(e,v,h,ab,2)|0;ad=c[h>>2]|0;do{if((ad&4|0)==0){if((aa-1|0)>>>0>=31>>>0){break}c[ae>>2]=aa;break L928}}while(0);c[h>>2]=ad|4;break};case 106:{c[s>>2]=c[f>>2];aa=jM(e,s,h,ab,3)|0;ae=c[h>>2]|0;if((ae&4|0)==0&(aa|0)<366){c[j+28>>2]=aa;break L928}else{c[h>>2]=ae|4;break L928}break};case 73:{ae=j+8|0;c[t>>2]=c[f>>2];aa=jM(e,t,h,ab,2)|0;af=c[h>>2]|0;do{if((af&4|0)==0){if((aa-1|0)>>>0>=12>>>0){break}c[ae>>2]=aa;break L928}}while(0);c[h>>2]=af|4;break};case 109:{c[r>>2]=c[f>>2];aa=(jM(e,r,h,ab,2)|0)-1|0;ae=c[h>>2]|0;if((ae&4|0)==0&(aa|0)<12){c[j+16>>2]=aa;break L928}else{c[h>>2]=ae|4;break L928}break};case 84:{ae=e|0;c[S>>2]=c[ae>>2];c[T>>2]=c[f>>2];jz(R,d,S,T,g,h,j,11376,11408);c[ae>>2]=c[R>>2];break};case 119:{c[o>>2]=c[f>>2];ae=jM(e,o,h,ab,1)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ae|0)<7){c[j+24>>2]=ae;break L928}else{c[h>>2]=aa|4;break L928}break};case 120:{aa=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];b_[aa&127](b,d,U,V,g,h,j);i=l;return};case 88:{aa=d+8|0;ae=b2[c[(c[aa>>2]|0)+24>>2]&255](aa)|0;aa=e|0;c[X>>2]=c[aa>>2];c[Y>>2]=c[f>>2];ad=a[ae]|0;if((ad&1)==0){ag=ae+4|0;ah=ae+4|0}else{ai=c[ae+8>>2]|0;ag=ai;ah=ai}ai=ad&255;if((ai&1|0)==0){aj=ai>>>1}else{aj=c[ae+4>>2]|0}jz(W,d,X,Y,g,h,j,ah,ag+(aj<<2)|0);c[aa>>2]=c[W>>2];break};case 68:{aa=e|0;c[E>>2]=c[aa>>2];c[F>>2]=c[f>>2];jz(D,d,E,F,g,h,j,11480,11512);c[aa>>2]=c[D>>2];break};case 70:{aa=e|0;c[H>>2]=c[aa>>2];c[I>>2]=c[f>>2];jz(G,d,H,I,g,h,j,11344,11376);c[aa>>2]=c[G>>2];break};case 72:{c[u>>2]=c[f>>2];aa=jM(e,u,h,ab,2)|0;ae=c[h>>2]|0;if((ae&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L928}else{c[h>>2]=ae|4;break L928}break};case 99:{ae=d+8|0;aa=b2[c[(c[ae>>2]|0)+12>>2]&255](ae)|0;ae=e|0;c[B>>2]=c[ae>>2];c[C>>2]=c[f>>2];ai=a[aa]|0;if((ai&1)==0){ak=aa+4|0;al=aa+4|0}else{ad=c[aa+8>>2]|0;ak=ad;al=ad}ad=ai&255;if((ad&1|0)==0){am=ad>>>1}else{am=c[aa+4>>2]|0}jz(A,d,B,C,g,h,j,al,ak+(am<<2)|0);c[ae>>2]=c[A>>2];break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=bP(4)|0;nj(l);bl(l|0,18192,158)}function jJ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=d|0;d=f;L1009:while(1){h=c[g>>2]|0;do{if((h|0)==0){j=1}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){l=b2[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[g>>2]=0;j=1;break}else{j=(c[g>>2]|0)==0;break}}}while(0);h=c[b>>2]|0;do{if((h|0)==0){m=841}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){n=b2[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{n=c[k>>2]|0}if((n|0)==-1){c[b>>2]=0;m=841;break}else{k=(h|0)==0;if(j^k){o=h;p=k;break}else{q=h;r=k;break L1009}}}}while(0);if((m|0)==841){m=0;if(j){q=0;r=1;break}else{o=0;p=1}}h=c[g>>2]|0;k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){s=b2[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{s=c[k>>2]|0}if(!(b4[c[(c[d>>2]|0)+12>>2]&63](f,8192,s)|0)){q=o;r=p;break}k=c[g>>2]|0;h=k+12|0;t=c[h>>2]|0;if((t|0)==(c[k+16>>2]|0)){u=c[(c[k>>2]|0)+40>>2]|0;b2[u&255](k)|0;continue}else{c[h>>2]=t+4;continue}}p=c[g>>2]|0;do{if((p|0)==0){v=1}else{o=c[p+12>>2]|0;if((o|0)==(c[p+16>>2]|0)){w=b2[c[(c[p>>2]|0)+36>>2]&255](p)|0}else{w=c[o>>2]|0}if((w|0)==-1){c[g>>2]=0;v=1;break}else{v=(c[g>>2]|0)==0;break}}}while(0);do{if(r){m=863}else{g=c[q+12>>2]|0;if((g|0)==(c[q+16>>2]|0)){x=b2[c[(c[q>>2]|0)+36>>2]&255](q)|0}else{x=c[g>>2]|0}if((x|0)==-1){c[b>>2]=0;m=863;break}if(!(v^(q|0)==0)){break}i=a;return}}while(0);do{if((m|0)==863){if(v){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function jK(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=b2[c[(c[l>>2]|0)+8>>2]&255](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=iv(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function jL(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=c[g>>2]|0;do{if((b|0)==0){h=1}else{j=c[b+12>>2]|0;if((j|0)==(c[b+16>>2]|0)){k=b2[c[(c[b>>2]|0)+36>>2]&255](b)|0}else{k=c[j>>2]|0}if((k|0)==-1){c[g>>2]=0;h=1;break}else{h=(c[g>>2]|0)==0;break}}}while(0);k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=903}else{b=c[d+12>>2]|0;if((b|0)==(c[d+16>>2]|0)){m=b2[c[(c[d>>2]|0)+36>>2]&255](d)|0}else{m=c[b>>2]|0}if((m|0)==-1){c[k>>2]=0;l=903;break}else{b=(d|0)==0;if(h^b){n=d;o=b;break}else{l=905;break}}}}while(0);if((l|0)==903){if(h){l=905}else{n=0;o=1}}if((l|0)==905){c[e>>2]=c[e>>2]|6;i=a;return}h=c[g>>2]|0;d=c[h+12>>2]|0;if((d|0)==(c[h+16>>2]|0)){p=b2[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{p=c[d>>2]|0}if((b4[c[(c[f>>2]|0)+52>>2]&63](f,p,0)|0)<<24>>24!=37){c[e>>2]=c[e>>2]|4;i=a;return}p=c[g>>2]|0;f=p+12|0;d=c[f>>2]|0;if((d|0)==(c[p+16>>2]|0)){h=c[(c[p>>2]|0)+40>>2]|0;b2[h&255](p)|0}else{c[f>>2]=d+4}d=c[g>>2]|0;do{if((d|0)==0){q=1}else{f=c[d+12>>2]|0;if((f|0)==(c[d+16>>2]|0)){r=b2[c[(c[d>>2]|0)+36>>2]&255](d)|0}else{r=c[f>>2]|0}if((r|0)==-1){c[g>>2]=0;q=1;break}else{q=(c[g>>2]|0)==0;break}}}while(0);do{if(o){l=927}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){s=b2[c[(c[n>>2]|0)+36>>2]&255](n)|0}else{s=c[g>>2]|0}if((s|0)==-1){c[k>>2]=0;l=927;break}if(!(q^(n|0)==0)){break}i=a;return}}while(0);do{if((l|0)==927){if(q){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function jM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=i;h=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[h>>2];h=a|0;a=c[h>>2]|0;do{if((a|0)==0){j=1}else{k=c[a+12>>2]|0;if((k|0)==(c[a+16>>2]|0)){l=b2[c[(c[a>>2]|0)+36>>2]&255](a)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[h>>2]=0;j=1;break}else{j=(c[h>>2]|0)==0;break}}}while(0);l=b|0;b=c[l>>2]|0;do{if((b|0)==0){m=949}else{a=c[b+12>>2]|0;if((a|0)==(c[b+16>>2]|0)){n=b2[c[(c[b>>2]|0)+36>>2]&255](b)|0}else{n=c[a>>2]|0}if((n|0)==-1){c[l>>2]=0;m=949;break}else{if(j^(b|0)==0){o=b;break}else{m=951;break}}}}while(0);if((m|0)==949){if(j){m=951}else{o=0}}if((m|0)==951){c[d>>2]=c[d>>2]|6;p=0;i=g;return p|0}j=c[h>>2]|0;b=c[j+12>>2]|0;if((b|0)==(c[j+16>>2]|0)){q=b2[c[(c[j>>2]|0)+36>>2]&255](j)|0}else{q=c[b>>2]|0}b=e;if(!(b4[c[(c[b>>2]|0)+12>>2]&63](e,2048,q)|0)){c[d>>2]=c[d>>2]|4;p=0;i=g;return p|0}j=e;n=(b4[c[(c[j>>2]|0)+52>>2]&63](e,q,0)|0)<<24>>24;q=c[h>>2]|0;a=q+12|0;k=c[a>>2]|0;if((k|0)==(c[q+16>>2]|0)){r=c[(c[q>>2]|0)+40>>2]|0;b2[r&255](q)|0;s=n;t=f;u=o}else{c[a>>2]=k+4;s=n;t=f;u=o}while(1){v=s-48|0;o=t-1|0;f=c[h>>2]|0;do{if((f|0)==0){w=0}else{n=c[f+12>>2]|0;if((n|0)==(c[f+16>>2]|0)){x=b2[c[(c[f>>2]|0)+36>>2]&255](f)|0}else{x=c[n>>2]|0}if((x|0)==-1){c[h>>2]=0;w=0;break}else{w=c[h>>2]|0;break}}}while(0);f=(w|0)==0;if((u|0)==0){y=w;z=0}else{n=c[u+12>>2]|0;if((n|0)==(c[u+16>>2]|0)){A=b2[c[(c[u>>2]|0)+36>>2]&255](u)|0}else{A=c[n>>2]|0}if((A|0)==-1){c[l>>2]=0;B=0}else{B=u}y=c[h>>2]|0;z=B}C=(z|0)==0;if(!((f^C)&(o|0)>0)){break}f=c[y+12>>2]|0;if((f|0)==(c[y+16>>2]|0)){D=b2[c[(c[y>>2]|0)+36>>2]&255](y)|0}else{D=c[f>>2]|0}if(!(b4[c[(c[b>>2]|0)+12>>2]&63](e,2048,D)|0)){p=v;m=999;break}f=((b4[c[(c[j>>2]|0)+52>>2]&63](e,D,0)|0)<<24>>24)+(v*10|0)|0;n=c[h>>2]|0;k=n+12|0;a=c[k>>2]|0;if((a|0)==(c[n+16>>2]|0)){q=c[(c[n>>2]|0)+40>>2]|0;b2[q&255](n)|0;s=f;t=o;u=z;continue}else{c[k>>2]=a+4;s=f;t=o;u=z;continue}}if((m|0)==999){i=g;return p|0}do{if((y|0)==0){E=1}else{u=c[y+12>>2]|0;if((u|0)==(c[y+16>>2]|0)){F=b2[c[(c[y>>2]|0)+36>>2]&255](y)|0}else{F=c[u>>2]|0}if((F|0)==-1){c[h>>2]=0;E=1;break}else{E=(c[h>>2]|0)==0;break}}}while(0);do{if(C){m=995}else{h=c[z+12>>2]|0;if((h|0)==(c[z+16>>2]|0)){G=b2[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[h>>2]|0}if((G|0)==-1){c[l>>2]=0;m=995;break}if(E^(z|0)==0){p=v}else{break}i=g;return p|0}}while(0);do{if((m|0)==995){if(E){break}else{p=v}i=g;return p|0}}while(0);c[d>>2]=c[d>>2]|2;p=v;i=g;return p|0}function jN(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((f|0)==(c[6340]|0)){g=b|0;ge(g);nM(d);return}a7(c[e>>2]|0);g=b|0;ge(g);nM(d);return}function jO(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((e|0)==(c[6340]|0)){f=b|0;ge(f);return}a7(c[d>>2]|0);f=b|0;ge(f);return}function jP(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+112|0;f=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[f>>2];f=g|0;l=g+8|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=bk(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=b1[c[(c[s>>2]|0)+52>>2]&31](s,m&255)|0}else{c[l>>2]=j+1;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function jQ(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((f|0)==(c[6340]|0)){g=b|0;ge(g);nM(d);return}a7(c[e>>2]|0);g=b|0;ge(g);nM(d);return}function jR(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((e|0)==(c[6340]|0)){f=b|0;ge(f);return}a7(c[d>>2]|0);f=b|0;ge(f);return}function jS(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+408|0;e=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[e>>2];e=f|0;k=f+400|0;l=e|0;c[k>>2]=e+400;jT(b+8|0,l,k,g,h,j);j=c[k>>2]|0;k=c[d>>2]|0;if((l|0)==(j|0)){m=k;n=a|0;c[n>>2]=m;i=f;return}else{o=k;p=l}while(1){l=c[p>>2]|0;if((o|0)==0){q=0}else{k=o+24|0;d=c[k>>2]|0;if((d|0)==(c[o+28>>2]|0)){r=b1[c[(c[o>>2]|0)+52>>2]&31](o,l)|0}else{c[k>>2]=d+4;c[d>>2]=l;r=l}q=(r|0)==-1?0:o}l=p+4|0;if((l|0)==(j|0)){m=q;break}else{o=q;p=l}}n=a|0;c[n>>2]=m;i=f;return}function jT(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+120|0;k=j|0;l=j+112|0;m=i;i=i+4|0;i=i+7&-8;n=j+8|0;o=k|0;a[o]=37;p=k+1|0;a[p]=g;q=k+2|0;a[q]=h;a[k+3|0]=0;if(h<<24>>24!=0){a[p]=h;a[q]=g}g=b|0;bk(n|0,100,o|0,f|0,c[g>>2]|0)|0;c[l>>2]=0;c[l+4>>2]=0;c[m>>2]=n;n=(c[e>>2]|0)-d>>2;f=bD(c[g>>2]|0)|0;g=m9(d,m,n,l)|0;if((f|0)!=0){bD(f|0)|0}if((g|0)==-1){kF(5608)}else{c[e>>2]=d+(g<<2);i=j;return}}function jU(a){a=a|0;ge(a|0);nM(a);return}function jV(a){a=a|0;ge(a|0);return}function jW(a){a=a|0;return 127}function jX(a){a=a|0;return 127}function jY(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function jZ(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function j_(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function j$(a,b){a=a|0;b=b|0;gE(a,1,45);return}function j0(a){a=a|0;return 0}function j1(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function j2(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function j3(a){a=a|0;ge(a|0);nM(a);return}function j4(a){a=a|0;ge(a|0);return}function j5(a){a=a|0;return 127}function j6(a){a=a|0;return 127}function j7(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function j8(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function j9(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function ka(a,b){a=a|0;b=b|0;gE(a,1,45);return}function kb(a){a=a|0;return 0}function kc(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function kd(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function ke(a){a=a|0;ge(a|0);nM(a);return}function kf(a){a=a|0;ge(a|0);return}function kg(a){a=a|0;return 2147483647}function kh(a){a=a|0;return 2147483647}function ki(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function kj(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function kk(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function kl(a,b){a=a|0;b=b|0;gP(a,1,45);return}function km(a){a=a|0;return 0}function kn(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function ko(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function kp(a){a=a|0;ge(a|0);nM(a);return}function kq(a){a=a|0;ge(a|0);return}function kr(a){a=a|0;return 2147483647}function ks(a){a=a|0;return 2147483647}function kt(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function ku(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function kv(a,b){a=a|0;b=b|0;b=a;nW(b|0,0,12)|0;return}function kw(a,b){a=a|0;b=b|0;gP(a,1,45);return}function kx(a){a=a|0;return 0}function ky(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function kz(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function kA(a){a=a|0;ge(a|0);nM(a);return}function kB(a){a=a|0;ge(a|0);return}function kC(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+280|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=d+160|0;t=d+176|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=196;w=m+100|0;gZ(p,h);m=p|0;x=c[m>>2]|0;if((c[6700]|0)!=-1){c[l>>2]=26800;c[l+4>>2]=14;c[l+8>>2]=0;gA(26800,l,110)}l=(c[6701]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(kE(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+32>>2]|0;cc[D&15](A,11328,11338,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>98){H=nE(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}nR();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+10|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((a[N]|0)==(a[M]|0)){O=N;break}else{N=N+1|0}}a[L]=a[11328+(O-H)|0]|0;N=M+1|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=bF(D|0,9976,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}nF(J);break}M=bP(8)|0;gm(M,9256);bl(M|0,18208,26)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){R=z;break}if((b2[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){S=1178}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(A){break}else{S=1180;break}}if((b2[c[(c[z>>2]|0)+36>>2]&255](z)|0)==-1){c[B>>2]=0;S=1178;break}else{if(A^(z|0)==0){break}else{S=1180;break}}}}while(0);if((S|0)==1178){if(A){S=1180}}if((S|0)==1180){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;gg(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}b$[c[v>>2]&511](z);i=d;return}}while(0);d=bP(4)|0;nj(d);bl(d|0,18192,158)}function kD(a){a=a|0;return}function kE(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0;q=i;i=i+440|0;r=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[r>>2];r=q|0;s=q+400|0;t=q+408|0;u=q+416|0;v=q+424|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=r|0;nW(w|0,0,12)|0;E=x;F=y;G=z;H=A;nW(E|0,0,12)|0;nW(F|0,0,12)|0;nW(G|0,0,12)|0;nW(H|0,0,12)|0;kI(g,h,s,t,u,v,x,y,z,B);h=n|0;c[o>>2]=c[h>>2];g=e|0;e=f|0;f=m+8|0;m=z+1|0;I=z+4|0;J=z+8|0;K=y+1|0;L=y+4|0;M=y+8|0;N=(j&512|0)!=0;j=x+1|0;O=x+4|0;P=x+8|0;Q=A+1|0;R=A+4|0;S=A+8|0;T=s+3|0;U=v+4|0;V=n+4|0;n=p;p=196;W=D;X=D;D=r+400|0;r=0;Y=0;L1441:while(1){Z=c[g>>2]|0;do{if((Z|0)==0){_=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){_=Z;break}if((b2[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)==-1){c[g>>2]=0;_=0;break}else{_=c[g>>2]|0;break}}}while(0);Z=(_|0)==0;$=c[e>>2]|0;do{if(($|0)==0){aa=1206}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=1465;break L1441}}if((b2[c[(c[$>>2]|0)+36>>2]&255]($)|0)==-1){c[e>>2]=0;aa=1206;break}else{if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=1465;break L1441}}}}while(0);if((aa|0)==1206){aa=0;if(Z){ac=p;ad=W;ae=X;af=r;aa=1465;break}else{ab=0}}L1463:do{switch(a[s+Y|0]|0){case 1:{if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=1465;break L1441}$=c[g>>2]|0;ag=c[$+12>>2]|0;if((ag|0)==(c[$+16>>2]|0)){ah=(b2[c[(c[$>>2]|0)+36>>2]&255]($)|0)&255}else{ah=a[ag]|0}ag=ah<<24>>24;if((bu(ag|0)|0)==0){aa=1233;break L1441}if((b[(c[f>>2]|0)+(ag<<1)>>1]&8192)==0){aa=1233;break L1441}ag=c[g>>2]|0;$=ag+12|0;ai=c[$>>2]|0;if((ai|0)==(c[ag+16>>2]|0)){aj=(b2[c[(c[ag>>2]|0)+40>>2]&255](ag)|0)&255}else{c[$>>2]=ai+1;aj=a[ai]|0}gK(A,aj);aa=1234;break};case 3:{ai=a[F]|0;$=ai&255;ag=($&1|0)==0?$>>>1:c[L>>2]|0;$=a[G]|0;ak=$&255;al=(ak&1|0)==0?ak>>>1:c[I>>2]|0;if((ag|0)==(-al|0)){am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}ak=(ag|0)==0;ag=c[g>>2]|0;as=c[ag+12>>2]|0;at=c[ag+16>>2]|0;au=(as|0)==(at|0);if(!(ak|(al|0)==0)){if(au){al=(b2[c[(c[ag>>2]|0)+36>>2]&255](ag)|0)&255;av=c[g>>2]|0;aw=al;ax=a[F]|0;ay=av;az=c[av+12>>2]|0;aA=c[av+16>>2]|0}else{aw=a[as]|0;ax=ai;ay=ag;az=as;aA=at}at=ay+12|0;av=(az|0)==(aA|0);if(aw<<24>>24==(a[(ax&1)==0?K:c[M>>2]|0]|0)){if(av){al=c[(c[ay>>2]|0)+40>>2]|0;b2[al&255](ay)|0}else{c[at>>2]=az+1}at=d[F]|0;am=((at&1|0)==0?at>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}if(av){aB=(b2[c[(c[ay>>2]|0)+36>>2]&255](ay)|0)&255}else{aB=a[az]|0}if(aB<<24>>24!=(a[(a[G]&1)==0?m:c[J>>2]|0]|0)){aa=1301;break L1441}av=c[g>>2]|0;at=av+12|0;al=c[at>>2]|0;if((al|0)==(c[av+16>>2]|0)){aC=c[(c[av>>2]|0)+40>>2]|0;b2[aC&255](av)|0}else{c[at>>2]=al+1}a[l]=1;al=d[G]|0;am=((al&1|0)==0?al>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}if(ak){if(au){ak=(b2[c[(c[ag>>2]|0)+36>>2]&255](ag)|0)&255;aD=ak;aE=a[G]|0}else{aD=a[as]|0;aE=$}if(aD<<24>>24!=(a[(aE&1)==0?m:c[J>>2]|0]|0)){am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}$=c[g>>2]|0;ak=$+12|0;al=c[ak>>2]|0;if((al|0)==(c[$+16>>2]|0)){at=c[(c[$>>2]|0)+40>>2]|0;b2[at&255]($)|0}else{c[ak>>2]=al+1}a[l]=1;al=d[G]|0;am=((al&1|0)==0?al>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}if(au){au=(b2[c[(c[ag>>2]|0)+36>>2]&255](ag)|0)&255;aF=au;aG=a[F]|0}else{aF=a[as]|0;aG=ai}if(aF<<24>>24!=(a[(aG&1)==0?K:c[M>>2]|0]|0)){a[l]=1;am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}ai=c[g>>2]|0;as=ai+12|0;au=c[as>>2]|0;if((au|0)==(c[ai+16>>2]|0)){ag=c[(c[ai>>2]|0)+40>>2]|0;b2[ag&255](ai)|0}else{c[as>>2]=au+1}au=d[F]|0;am=((au&1|0)==0?au>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;an=D;ao=X;ap=W;aq=p;ar=n;break};case 2:{if(!((r|0)!=0|Y>>>0<2>>>0)){if((Y|0)==2){aH=(a[T]|0)!=0}else{aH=0}if(!(N|aH)){am=0;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}}au=a[E]|0;as=c[P>>2]|0;ai=(au&1)==0?j:as;L1538:do{if((Y|0)==0){aI=ai;aJ=au;aK=as}else{if((d[s+(Y-1)|0]|0)>>>0>=2>>>0){aI=ai;aJ=au;aK=as;break}ag=au&255;L1541:do{if((((ag&1|0)==0?ag>>>1:c[O>>2]|0)|0)==0){aL=ai;aM=au;aN=as}else{al=ai;while(1){ak=a[al]|0;if((bu(ak|0)|0)==0){break}if((b[(c[f>>2]|0)+(ak<<1)>>1]&8192)==0){break}ak=al+1|0;$=a[E]|0;at=c[P>>2]|0;av=$&255;if((ak|0)==((($&1)==0?j:at)+((av&1|0)==0?av>>>1:c[O>>2]|0)|0)){aL=ak;aM=$;aN=at;break L1541}else{al=ak}}aL=al;aM=a[E]|0;aN=c[P>>2]|0}}while(0);ag=(aM&1)==0?j:aN;ak=aL-ag|0;at=a[H]|0;$=at&255;av=($&1|0)==0?$>>>1:c[R>>2]|0;if(ak>>>0>av>>>0){aI=ag;aJ=aM;aK=aN;break}$=(at&1)==0?Q:c[S>>2]|0;at=$+av|0;if((aL|0)==(ag|0)){aI=aL;aJ=aM;aK=aN;break}aC=$+(av-ak)|0;ak=ag;while(1){if((a[aC]|0)!=(a[ak]|0)){aI=ag;aJ=aM;aK=aN;break L1538}av=aC+1|0;if((av|0)==(at|0)){aI=aL;aJ=aM;aK=aN;break}else{aC=av;ak=ak+1|0}}}}while(0);ai=aJ&255;L1555:do{if((aI|0)==(((aJ&1)==0?j:aK)+((ai&1|0)==0?ai>>>1:c[O>>2]|0)|0)){aO=aI}else{as=ab;au=aI;while(1){ak=c[g>>2]|0;do{if((ak|0)==0){aP=0}else{if((c[ak+12>>2]|0)!=(c[ak+16>>2]|0)){aP=ak;break}if((b2[c[(c[ak>>2]|0)+36>>2]&255](ak)|0)==-1){c[g>>2]=0;aP=0;break}else{aP=c[g>>2]|0;break}}}while(0);ak=(aP|0)==0;do{if((as|0)==0){aa=1332}else{if((c[as+12>>2]|0)!=(c[as+16>>2]|0)){if(ak){aQ=as;break}else{aO=au;break L1555}}if((b2[c[(c[as>>2]|0)+36>>2]&255](as)|0)==-1){c[e>>2]=0;aa=1332;break}else{if(ak){aQ=as;break}else{aO=au;break L1555}}}}while(0);if((aa|0)==1332){aa=0;if(ak){aO=au;break L1555}else{aQ=0}}al=c[g>>2]|0;aC=c[al+12>>2]|0;if((aC|0)==(c[al+16>>2]|0)){aR=(b2[c[(c[al>>2]|0)+36>>2]&255](al)|0)&255}else{aR=a[aC]|0}if(aR<<24>>24!=(a[au]|0)){aO=au;break L1555}aC=c[g>>2]|0;al=aC+12|0;at=c[al>>2]|0;if((at|0)==(c[aC+16>>2]|0)){ag=c[(c[aC>>2]|0)+40>>2]|0;b2[ag&255](aC)|0}else{c[al>>2]=at+1}at=au+1|0;al=a[E]|0;aC=al&255;if((at|0)==(((al&1)==0?j:c[P>>2]|0)+((aC&1|0)==0?aC>>>1:c[O>>2]|0)|0)){aO=at;break}else{as=aQ;au=at}}}}while(0);if(!N){am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1463}ai=a[E]|0;au=ai&255;if((aO|0)==(((ai&1)==0?j:c[P>>2]|0)+((au&1|0)==0?au>>>1:c[O>>2]|0)|0)){am=r;an=D;ao=X;ap=W;aq=p;ar=n}else{aa=1345;break L1441}break};case 0:{aa=1234;break};case 4:{au=0;ai=D;as=X;at=W;aC=p;al=n;L1590:while(1){ag=c[g>>2]|0;do{if((ag|0)==0){aS=0}else{if((c[ag+12>>2]|0)!=(c[ag+16>>2]|0)){aS=ag;break}if((b2[c[(c[ag>>2]|0)+36>>2]&255](ag)|0)==-1){c[g>>2]=0;aS=0;break}else{aS=c[g>>2]|0;break}}}while(0);ag=(aS|0)==0;av=c[e>>2]|0;do{if((av|0)==0){aa=1358}else{if((c[av+12>>2]|0)!=(c[av+16>>2]|0)){if(ag){break}else{break L1590}}if((b2[c[(c[av>>2]|0)+36>>2]&255](av)|0)==-1){c[e>>2]=0;aa=1358;break}else{if(ag){break}else{break L1590}}}}while(0);if((aa|0)==1358){aa=0;if(ag){break}}av=c[g>>2]|0;$=c[av+12>>2]|0;if(($|0)==(c[av+16>>2]|0)){aT=(b2[c[(c[av>>2]|0)+36>>2]&255](av)|0)&255}else{aT=a[$]|0}$=aT<<24>>24;do{if((bu($|0)|0)==0){aa=1378}else{if((b[(c[f>>2]|0)+($<<1)>>1]&2048)==0){aa=1378;break}av=c[o>>2]|0;if((av|0)==(al|0)){aU=(c[V>>2]|0)!=196;aV=c[h>>2]|0;aW=al-aV|0;aX=aW>>>0<2147483647>>>0?aW<<1:-1;aY=nH(aU?aV:0,aX)|0;if((aY|0)==0){nR()}do{if(aU){c[h>>2]=aY;aZ=aY}else{aV=c[h>>2]|0;c[h>>2]=aY;if((aV|0)==0){aZ=aY;break}b$[c[V>>2]&511](aV);aZ=c[h>>2]|0}}while(0);c[V>>2]=92;aY=aZ+aW|0;c[o>>2]=aY;a_=(c[h>>2]|0)+aX|0;a$=aY}else{a_=al;a$=av}c[o>>2]=a$+1;a[a$]=aT;a0=au+1|0;a1=ai;a2=as;a3=at;a4=aC;a5=a_}}while(0);if((aa|0)==1378){aa=0;$=d[w]|0;if(((($&1|0)==0?$>>>1:c[U>>2]|0)|0)==0|(au|0)==0){break}if(aT<<24>>24!=(a[u]|0)){break}if((as|0)==(ai|0)){$=as-at|0;ag=$>>>0<2147483647>>>0?$<<1:-1;if((aC|0)==196){a6=0}else{a6=at}aY=nH(a6,ag)|0;aU=aY;if((aY|0)==0){nR()}a7=aU+(ag>>>2<<2)|0;a8=aU+($>>2<<2)|0;a9=aU;ba=92}else{a7=ai;a8=as;a9=at;ba=aC}c[a8>>2]=au;a0=0;a1=a7;a2=a8+4|0;a3=a9;a4=ba;a5=al}aU=c[g>>2]|0;$=aU+12|0;ag=c[$>>2]|0;if((ag|0)==(c[aU+16>>2]|0)){aY=c[(c[aU>>2]|0)+40>>2]|0;b2[aY&255](aU)|0;au=a0;ai=a1;as=a2;at=a3;aC=a4;al=a5;continue}else{c[$>>2]=ag+1;au=a0;ai=a1;as=a2;at=a3;aC=a4;al=a5;continue}}if((at|0)==(as|0)|(au|0)==0){bb=ai;bc=as;bd=at;be=aC}else{if((as|0)==(ai|0)){ag=as-at|0;$=ag>>>0<2147483647>>>0?ag<<1:-1;if((aC|0)==196){bf=0}else{bf=at}aU=nH(bf,$)|0;aY=aU;if((aU|0)==0){nR()}bg=aY+($>>>2<<2)|0;bh=aY+(ag>>2<<2)|0;bi=aY;bj=92}else{bg=ai;bh=as;bi=at;bj=aC}c[bh>>2]=au;bb=bg;bc=bh+4|0;bd=bi;be=bj}if((c[B>>2]|0)>0){aY=c[g>>2]|0;do{if((aY|0)==0){bk=0}else{if((c[aY+12>>2]|0)!=(c[aY+16>>2]|0)){bk=aY;break}if((b2[c[(c[aY>>2]|0)+36>>2]&255](aY)|0)==-1){c[g>>2]=0;bk=0;break}else{bk=c[g>>2]|0;break}}}while(0);aY=(bk|0)==0;au=c[e>>2]|0;do{if((au|0)==0){aa=1411}else{if((c[au+12>>2]|0)!=(c[au+16>>2]|0)){if(aY){bl=au;break}else{aa=1418;break L1441}}if((b2[c[(c[au>>2]|0)+36>>2]&255](au)|0)==-1){c[e>>2]=0;aa=1411;break}else{if(aY){bl=au;break}else{aa=1418;break L1441}}}}while(0);if((aa|0)==1411){aa=0;if(aY){aa=1418;break L1441}else{bl=0}}au=c[g>>2]|0;aC=c[au+12>>2]|0;if((aC|0)==(c[au+16>>2]|0)){bm=(b2[c[(c[au>>2]|0)+36>>2]&255](au)|0)&255}else{bm=a[aC]|0}if(bm<<24>>24!=(a[t]|0)){aa=1418;break L1441}aC=c[g>>2]|0;au=aC+12|0;at=c[au>>2]|0;if((at|0)==(c[aC+16>>2]|0)){as=c[(c[aC>>2]|0)+40>>2]|0;b2[as&255](aC)|0;bn=al;bo=bl}else{c[au>>2]=at+1;bn=al;bo=bl}while(1){at=c[g>>2]|0;do{if((at|0)==0){bp=0}else{if((c[at+12>>2]|0)!=(c[at+16>>2]|0)){bp=at;break}if((b2[c[(c[at>>2]|0)+36>>2]&255](at)|0)==-1){c[g>>2]=0;bp=0;break}else{bp=c[g>>2]|0;break}}}while(0);at=(bp|0)==0;do{if((bo|0)==0){aa=1434}else{if((c[bo+12>>2]|0)!=(c[bo+16>>2]|0)){if(at){bq=bo;break}else{aa=1443;break L1441}}if((b2[c[(c[bo>>2]|0)+36>>2]&255](bo)|0)==-1){c[e>>2]=0;aa=1434;break}else{if(at){bq=bo;break}else{aa=1443;break L1441}}}}while(0);if((aa|0)==1434){aa=0;if(at){aa=1443;break L1441}else{bq=0}}au=c[g>>2]|0;aC=c[au+12>>2]|0;if((aC|0)==(c[au+16>>2]|0)){br=(b2[c[(c[au>>2]|0)+36>>2]&255](au)|0)&255}else{br=a[aC]|0}aC=br<<24>>24;if((bu(aC|0)|0)==0){aa=1443;break L1441}if((b[(c[f>>2]|0)+(aC<<1)>>1]&2048)==0){aa=1443;break L1441}aC=c[o>>2]|0;if((aC|0)==(bn|0)){au=(c[V>>2]|0)!=196;as=c[h>>2]|0;ai=bn-as|0;ag=ai>>>0<2147483647>>>0?ai<<1:-1;$=nH(au?as:0,ag)|0;if(($|0)==0){nR()}do{if(au){c[h>>2]=$;bs=$}else{as=c[h>>2]|0;c[h>>2]=$;if((as|0)==0){bs=$;break}b$[c[V>>2]&511](as);bs=c[h>>2]|0}}while(0);c[V>>2]=92;$=bs+ai|0;c[o>>2]=$;bt=(c[h>>2]|0)+ag|0;bv=$}else{bt=bn;bv=aC}$=c[g>>2]|0;au=c[$+12>>2]|0;if((au|0)==(c[$+16>>2]|0)){at=(b2[c[(c[$>>2]|0)+36>>2]&255]($)|0)&255;bw=at;bx=c[o>>2]|0}else{bw=a[au]|0;bx=bv}c[o>>2]=bx+1;a[bx]=bw;au=(c[B>>2]|0)-1|0;c[B>>2]=au;at=c[g>>2]|0;$=at+12|0;as=c[$>>2]|0;if((as|0)==(c[at+16>>2]|0)){aU=c[(c[at>>2]|0)+40>>2]|0;b2[aU&255](at)|0}else{c[$>>2]=as+1}if((au|0)>0){bn=bt;bo=bq}else{by=bt;break}}}else{by=al}if((c[o>>2]|0)==(c[h>>2]|0)){aa=1463;break L1441}else{am=r;an=bb;ao=bc;ap=bd;aq=be;ar=by}break};default:{am=r;an=D;ao=X;ap=W;aq=p;ar=n}}}while(0);L1746:do{if((aa|0)==1234){aa=0;if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=1465;break L1441}else{bz=ab}while(1){Z=c[g>>2]|0;do{if((Z|0)==0){bA=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){bA=Z;break}if((b2[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)==-1){c[g>>2]=0;bA=0;break}else{bA=c[g>>2]|0;break}}}while(0);Z=(bA|0)==0;do{if((bz|0)==0){aa=1247}else{if((c[bz+12>>2]|0)!=(c[bz+16>>2]|0)){if(Z){bB=bz;break}else{am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1746}}if((b2[c[(c[bz>>2]|0)+36>>2]&255](bz)|0)==-1){c[e>>2]=0;aa=1247;break}else{if(Z){bB=bz;break}else{am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1746}}}}while(0);if((aa|0)==1247){aa=0;if(Z){am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1746}else{bB=0}}aC=c[g>>2]|0;ag=c[aC+12>>2]|0;if((ag|0)==(c[aC+16>>2]|0)){bC=(b2[c[(c[aC>>2]|0)+36>>2]&255](aC)|0)&255}else{bC=a[ag]|0}ag=bC<<24>>24;if((bu(ag|0)|0)==0){am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1746}if((b[(c[f>>2]|0)+(ag<<1)>>1]&8192)==0){am=r;an=D;ao=X;ap=W;aq=p;ar=n;break L1746}ag=c[g>>2]|0;aC=ag+12|0;ai=c[aC>>2]|0;if((ai|0)==(c[ag+16>>2]|0)){bD=(b2[c[(c[ag>>2]|0)+40>>2]&255](ag)|0)&255}else{c[aC>>2]=ai+1;bD=a[ai]|0}gK(A,bD);bz=bB}}}while(0);al=Y+1|0;if(al>>>0<4>>>0){n=ar;p=aq;W=ap;X=ao;D=an;r=am;Y=al}else{ac=aq;ad=ap;ae=ao;af=am;aa=1465;break}}L1784:do{if((aa|0)==1301){c[k>>2]=c[k>>2]|4;bE=0;bF=W;bG=p}else if((aa|0)==1233){c[k>>2]=c[k>>2]|4;bE=0;bF=W;bG=p}else if((aa|0)==1345){c[k>>2]=c[k>>2]|4;bE=0;bF=W;bG=p}else if((aa|0)==1418){c[k>>2]=c[k>>2]|4;bE=0;bF=bd;bG=be}else if((aa|0)==1443){c[k>>2]=c[k>>2]|4;bE=0;bF=bd;bG=be}else if((aa|0)==1463){c[k>>2]=c[k>>2]|4;bE=0;bF=bd;bG=be}else if((aa|0)==1465){L1792:do{if((af|0)!=0){am=af;ao=af+1|0;ap=af+8|0;aq=af+4|0;Y=1;L1794:while(1){r=d[am]|0;if((r&1|0)==0){bH=r>>>1}else{bH=c[aq>>2]|0}if(Y>>>0>=bH>>>0){break L1792}r=c[g>>2]|0;do{if((r|0)==0){bI=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){bI=r;break}if((b2[c[(c[r>>2]|0)+36>>2]&255](r)|0)==-1){c[g>>2]=0;bI=0;break}else{bI=c[g>>2]|0;break}}}while(0);r=(bI|0)==0;Z=c[e>>2]|0;do{if((Z|0)==0){aa=1483}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){if(r){break}else{break L1794}}if((b2[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)==-1){c[e>>2]=0;aa=1483;break}else{if(r){break}else{break L1794}}}}while(0);if((aa|0)==1483){aa=0;if(r){break}}Z=c[g>>2]|0;an=c[Z+12>>2]|0;if((an|0)==(c[Z+16>>2]|0)){bJ=(b2[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)&255}else{bJ=a[an]|0}if((a[am]&1)==0){bK=ao}else{bK=c[ap>>2]|0}if(bJ<<24>>24!=(a[bK+Y|0]|0)){break}an=Y+1|0;Z=c[g>>2]|0;D=Z+12|0;X=c[D>>2]|0;if((X|0)==(c[Z+16>>2]|0)){ar=c[(c[Z>>2]|0)+40>>2]|0;b2[ar&255](Z)|0;Y=an;continue}else{c[D>>2]=X+1;Y=an;continue}}c[k>>2]=c[k>>2]|4;bE=0;bF=ad;bG=ac;break L1784}}while(0);if((ad|0)==(ae|0)){bE=1;bF=ae;bG=ac;break}c[C>>2]=0;kJ(v,ad,ae,C);if((c[C>>2]|0)==0){bE=1;bF=ad;bG=ac;break}c[k>>2]=c[k>>2]|4;bE=0;bF=ad;bG=ac}}while(0);gF(A);gF(z);gF(y);gF(x);gF(v);if((bF|0)==0){i=q;return bE|0}b$[bG&511](bF);i=q;return bE|0}function kF(a){a=a|0;var b=0;b=bP(8)|0;gm(b,a);bl(b|0,18208,26)}function kG(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+160|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=196;u=m+100|0;gZ(p,h);m=p|0;v=c[m>>2]|0;if((c[6700]|0)!=-1){c[l>>2]=26800;c[l+4>>2]=14;c[l+8>>2]=0;gA(26800,l,110)}l=(c[6701]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(kE(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){a[k+1|0]=0;a[B]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){gK(k,b1[c[(c[B>>2]|0)+28>>2]&31](y,45)|0)}x=b1[c[(c[B>>2]|0)+28>>2]&31](y,48)|0;y=c[o>>2]|0;B=y-1|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((a[C]|0)==x<<24>>24){C=C+1|0}else{break}}kH(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){D=B;break}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){E=1541}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){break}else{E=1543;break}}if((b2[c[(c[A>>2]|0)+36>>2]&255](A)|0)==-1){c[z>>2]=0;E=1541;break}else{if(x^(A|0)==0){break}else{E=1543;break}}}}while(0);if((E|0)==1541){if(x){E=1543}}if((E|0)==1543){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;gg(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}b$[c[t>>2]&511](A);i=d;return}}while(0);d=bP(4)|0;nj(d);bl(d|0,18192,158)}function kH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=10;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g|0;if((e|0)==(d|0)){return b|0}if((k-j|0)>>>0<h>>>0){gN(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+1|0}else{n=c[b+8>>2]|0}m=e+(j-g)|0;g=d;d=n+j|0;while(1){a[d]=a[g]|0;l=g+1|0;if((l|0)==(e|0)){break}else{g=l;d=d+1|0}}a[n+m|0]=0;m=j+h|0;if((a[f]&1)==0){a[f]=m<<1&255;return b|0}else{c[b+4>>2]=m;return b|0}return 0}function kI(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[6818]|0)!=-1){c[p>>2]=27272;c[p+4>>2]=14;c[p+8>>2]=0;gA(27272,p,110)}p=(c[6819]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=bP(4)|0;L=K;nj(L);bl(K|0,18192,158)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=bP(4)|0;L=K;nj(L);bl(K|0,18192,158)}K=b;b0[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C&255;C=C>>8;a[L+1|0]=C&255;C=C>>8;a[L+2|0]=C&255;C=C>>8;a[L+3|0]=C&255;L=b;b0[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){a[l+1|0]=0;a[q]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gJ(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];nW(s|0,0,12)|0;gF(r);b0[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){a[k+1|0]=0;a[r]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gJ(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];nW(u|0,0,12)|0;gF(t);t=b;a[f]=b2[c[(c[t>>2]|0)+12>>2]&255](K)|0;a[g]=b2[c[(c[t>>2]|0)+16>>2]&255](K)|0;b0[c[(c[L>>2]|0)+20>>2]&127](v,K);t=h;if((a[t]&1)==0){a[h+1|0]=0;a[t]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gJ(h,0);c[t>>2]=c[w>>2];c[t+4>>2]=c[w+4>>2];c[t+8>>2]=c[w+8>>2];nW(w|0,0,12)|0;gF(v);b0[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gJ(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];nW(y|0,0,12)|0;gF(x);M=b2[c[(c[b>>2]|0)+36>>2]&255](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[6820]|0)!=-1){c[o>>2]=27280;c[o+4>>2]=14;c[o+8>>2]=0;gA(27280,o,110)}o=(c[6821]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=bP(4)|0;O=N;nj(O);bl(N|0,18192,158)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=bP(4)|0;O=N;nj(O);bl(N|0,18192,158)}N=K;b0[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C&255;C=C>>8;a[O+1|0]=C&255;C=C>>8;a[O+2|0]=C&255;C=C>>8;a[O+3|0]=C&255;O=K;b0[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){a[l+1|0]=0;a[z]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gJ(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];nW(B|0,0,12)|0;gF(A);b0[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){a[k+1|0]=0;a[A]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gJ(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];nW(E|0,0,12)|0;gF(D);D=K;a[f]=b2[c[(c[D>>2]|0)+12>>2]&255](N)|0;a[g]=b2[c[(c[D>>2]|0)+16>>2]&255](N)|0;b0[c[(c[O>>2]|0)+20>>2]&127](F,N);D=h;if((a[D]&1)==0){a[h+1|0]=0;a[D]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gJ(h,0);c[D>>2]=c[G>>2];c[D+4>>2]=c[G+4>>2];c[D+8>>2]=c[G+8>>2];nW(G|0,0,12)|0;gF(F);b0[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){a[j+1|0]=0;a[O]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gJ(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];nW(I|0,0,12)|0;gF(H);M=b2[c[(c[K>>2]|0)+36>>2]&255](N)|0;c[m>>2]=M;i=n;return}}function kJ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;h=b;i=a[h]|0;j=i&255;if((j&1|0)==0){k=j>>>1}else{k=c[b+4>>2]|0}if((k|0)==0){return}do{if((d|0)==(e|0)){l=i}else{k=e-4|0;if(k>>>0>d>>>0){m=d;n=k}else{l=i;break}do{k=c[m>>2]|0;c[m>>2]=c[n>>2];c[n>>2]=k;m=m+4|0;n=n-4|0;}while(m>>>0<n>>>0);l=a[h]|0}}while(0);if((l&1)==0){o=g+1|0}else{o=c[b+8>>2]|0}g=l&255;if((g&1|0)==0){p=g>>>1}else{p=c[b+4>>2]|0}b=e-4|0;e=a[o]|0;g=e<<24>>24;l=e<<24>>24<1|e<<24>>24==127;L2007:do{if(b>>>0>d>>>0){e=o+p|0;h=o;n=d;m=g;i=l;while(1){if(!i){if((m|0)!=(c[n>>2]|0)){break}}k=(e-h|0)>1?h+1|0:h;j=n+4|0;q=a[k]|0;r=q<<24>>24;s=q<<24>>24<1|q<<24>>24==127;if(j>>>0<b>>>0){h=k;n=j;m=r;i=s}else{t=r;u=s;break L2007}}c[f>>2]=4;return}else{t=g;u=l}}while(0);if(u){return}u=c[b>>2]|0;if(!(t>>>0<u>>>0|(u|0)==0)){return}c[f>>2]=4;return}function kK(a){a=a|0;ge(a|0);nM(a);return}function kL(a){a=a|0;ge(a|0);return}function kM(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+600|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=d+456|0;t=d+496|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=196;w=m+400|0;gZ(p,h);m=p|0;x=c[m>>2]|0;if((c[6698]|0)!=-1){c[l>>2]=26792;c[l+4>>2]=14;c[l+8>>2]=0;gA(26792,l,110)}l=(c[6699]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(kN(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+48>>2]|0;cc[D&15](A,11312,11322,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>392){H=nE((G>>2)+2|0)|0;if((H|0)!=0){I=H;J=H;break}nR();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+40|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((c[N>>2]|0)==(c[M>>2]|0)){O=N;break}else{N=N+4|0}}a[L]=a[11312+(O-H>>2)|0]|0;N=M+4|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=bF(D|0,9976,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}nF(J);break}M=bP(8)|0;gm(M,9256);bl(M|0,18208,26)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){S=b2[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{S=c[M>>2]|0}if((S|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){T=1710}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){U=b2[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{U=c[M>>2]|0}if((U|0)==-1){c[B>>2]=0;T=1710;break}else{if(A^(z|0)==0){break}else{T=1712;break}}}}while(0);if((T|0)==1710){if(A){T=1712}}if((T|0)==1712){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;gg(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}b$[c[v>>2]&511](z);i=d;return}}while(0);d=bP(4)|0;nj(d);bl(d|0,18192,158)}function kN(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0;p=i;i=i+448|0;q=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[q>>2];q=p|0;r=p+8|0;s=p+408|0;t=p+416|0;u=p+424|0;v=p+432|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;c[q>>2]=o;o=r|0;nW(w|0,0,12)|0;D=x;E=y;F=z;G=A;nW(D|0,0,12)|0;nW(E|0,0,12)|0;nW(F|0,0,12)|0;nW(G|0,0,12)|0;kQ(f,g,s,t,u,v,x,y,z,B);g=m|0;c[n>>2]=c[g>>2];f=b|0;b=e|0;e=l;H=z+4|0;I=z+8|0;J=y+4|0;K=y+8|0;L=(h&512|0)!=0;h=x+4|0;M=x+8|0;N=A+4|0;O=A+8|0;P=s+3|0;Q=v+4|0;R=196;S=o;T=o;o=r+400|0;r=0;U=0;L2091:while(1){V=c[f>>2]|0;do{if((V|0)==0){W=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){Y=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{Y=c[X>>2]|0}if((Y|0)==-1){c[f>>2]=0;W=1;break}else{W=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=1738}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){_=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{_=c[X>>2]|0}if((_|0)==-1){c[b>>2]=0;Z=1738;break}else{if(W^(V|0)==0){$=V;break}else{aa=R;ab=S;ac=T;ad=r;Z=1978;break L2091}}}}while(0);if((Z|0)==1738){Z=0;if(W){aa=R;ab=S;ac=T;ad=r;Z=1978;break}else{$=0}}L2115:do{switch(a[s+U|0]|0){case 1:{if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=1978;break L2091}V=c[f>>2]|0;X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){ae=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{ae=c[X>>2]|0}if(!(b4[c[(c[e>>2]|0)+12>>2]&63](l,8192,ae)|0)){Z=1762;break L2091}X=c[f>>2]|0;V=X+12|0;af=c[V>>2]|0;if((af|0)==(c[X+16>>2]|0)){ag=b2[c[(c[X>>2]|0)+40>>2]&255](X)|0}else{c[V>>2]=af+4;ag=c[af>>2]|0}gU(A,ag);Z=1763;break};case 0:{Z=1763;break};case 3:{af=a[E]|0;V=af&255;X=(V&1|0)==0;ah=a[F]|0;ai=ah&255;aj=(ai&1|0)==0;if(((X?V>>>1:c[J>>2]|0)|0)==(-(aj?ai>>>1:c[H>>2]|0)|0)){ak=r;al=o;am=T;an=S;ao=R;break L2115}do{if(((X?V>>>1:c[J>>2]|0)|0)!=0){if(((aj?ai>>>1:c[H>>2]|0)|0)==0){break}ap=c[f>>2]|0;aq=c[ap+12>>2]|0;if((aq|0)==(c[ap+16>>2]|0)){ar=b2[c[(c[ap>>2]|0)+36>>2]&255](ap)|0;as=ar;at=a[E]|0}else{as=c[aq>>2]|0;at=af}aq=c[f>>2]|0;ar=aq+12|0;ap=c[ar>>2]|0;au=(ap|0)==(c[aq+16>>2]|0);if((as|0)==(c[((at&1)==0?J:c[K>>2]|0)>>2]|0)){if(au){av=c[(c[aq>>2]|0)+40>>2]|0;b2[av&255](aq)|0}else{c[ar>>2]=ap+4}ar=d[E]|0;ak=((ar&1|0)==0?ar>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;al=o;am=T;an=S;ao=R;break L2115}if(au){aw=b2[c[(c[aq>>2]|0)+36>>2]&255](aq)|0}else{aw=c[ap>>2]|0}if((aw|0)!=(c[((a[F]&1)==0?H:c[I>>2]|0)>>2]|0)){Z=1828;break L2091}ap=c[f>>2]|0;aq=ap+12|0;au=c[aq>>2]|0;if((au|0)==(c[ap+16>>2]|0)){ar=c[(c[ap>>2]|0)+40>>2]|0;b2[ar&255](ap)|0}else{c[aq>>2]=au+4}a[k]=1;au=d[F]|0;ak=((au&1|0)==0?au>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;al=o;am=T;an=S;ao=R;break L2115}}while(0);ai=c[f>>2]|0;aj=c[ai+12>>2]|0;au=(aj|0)==(c[ai+16>>2]|0);if(((X?V>>>1:c[J>>2]|0)|0)==0){if(au){aq=b2[c[(c[ai>>2]|0)+36>>2]&255](ai)|0;ax=aq;ay=a[F]|0}else{ax=c[aj>>2]|0;ay=ah}if((ax|0)!=(c[((ay&1)==0?H:c[I>>2]|0)>>2]|0)){ak=r;al=o;am=T;an=S;ao=R;break L2115}aq=c[f>>2]|0;ap=aq+12|0;ar=c[ap>>2]|0;if((ar|0)==(c[aq+16>>2]|0)){av=c[(c[aq>>2]|0)+40>>2]|0;b2[av&255](aq)|0}else{c[ap>>2]=ar+4}a[k]=1;ar=d[F]|0;ak=((ar&1|0)==0?ar>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;al=o;am=T;an=S;ao=R;break L2115}if(au){au=b2[c[(c[ai>>2]|0)+36>>2]&255](ai)|0;az=au;aA=a[E]|0}else{az=c[aj>>2]|0;aA=af}if((az|0)!=(c[((aA&1)==0?J:c[K>>2]|0)>>2]|0)){a[k]=1;ak=r;al=o;am=T;an=S;ao=R;break L2115}aj=c[f>>2]|0;au=aj+12|0;ai=c[au>>2]|0;if((ai|0)==(c[aj+16>>2]|0)){ar=c[(c[aj>>2]|0)+40>>2]|0;b2[ar&255](aj)|0}else{c[au>>2]=ai+4}ai=d[E]|0;ak=((ai&1|0)==0?ai>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;al=o;am=T;an=S;ao=R;break};case 2:{if(!((r|0)!=0|U>>>0<2>>>0)){if((U|0)==2){aB=(a[P]|0)!=0}else{aB=0}if(!(L|aB)){ak=0;al=o;am=T;an=S;ao=R;break L2115}}ai=a[D]|0;au=(ai&1)==0?h:c[M>>2]|0;L2187:do{if((U|0)==0){aC=au;aD=ai;aE=$}else{if((d[s+(U-1)|0]|0)>>>0<2>>>0){aF=au;aG=ai}else{aC=au;aD=ai;aE=$;break}while(1){aj=aG&255;if((aF|0)==(((aG&1)==0?h:c[M>>2]|0)+(((aj&1|0)==0?aj>>>1:c[h>>2]|0)<<2)|0)){aH=aG;break}if(!(b4[c[(c[e>>2]|0)+12>>2]&63](l,8192,c[aF>>2]|0)|0)){Z=1839;break}aF=aF+4|0;aG=a[D]|0}if((Z|0)==1839){Z=0;aH=a[D]|0}aj=(aH&1)==0;ar=aF-(aj?h:c[M>>2]|0)>>2;ap=a[G]|0;aq=ap&255;av=(aq&1|0)==0;L2197:do{if(ar>>>0<=(av?aq>>>1:c[N>>2]|0)>>>0){aI=(ap&1)==0;aJ=(aI?N:c[O>>2]|0)+((av?aq>>>1:c[N>>2]|0)-ar<<2)|0;aK=(aI?N:c[O>>2]|0)+((av?aq>>>1:c[N>>2]|0)<<2)|0;if((aJ|0)==(aK|0)){aC=aF;aD=aH;aE=$;break L2187}else{aL=aJ;aM=aj?h:c[M>>2]|0}while(1){if((c[aL>>2]|0)!=(c[aM>>2]|0)){break L2197}aJ=aL+4|0;if((aJ|0)==(aK|0)){aC=aF;aD=aH;aE=$;break L2187}aL=aJ;aM=aM+4|0}}}while(0);aC=aj?h:c[M>>2]|0;aD=aH;aE=$}}while(0);L2204:while(1){ai=aD&255;if((aC|0)==(((aD&1)==0?h:c[M>>2]|0)+(((ai&1|0)==0?ai>>>1:c[h>>2]|0)<<2)|0)){break}ai=c[f>>2]|0;do{if((ai|0)==0){aN=1}else{au=c[ai+12>>2]|0;if((au|0)==(c[ai+16>>2]|0)){aO=b2[c[(c[ai>>2]|0)+36>>2]&255](ai)|0}else{aO=c[au>>2]|0}if((aO|0)==-1){c[f>>2]=0;aN=1;break}else{aN=(c[f>>2]|0)==0;break}}}while(0);do{if((aE|0)==0){Z=1860}else{ai=c[aE+12>>2]|0;if((ai|0)==(c[aE+16>>2]|0)){aP=b2[c[(c[aE>>2]|0)+36>>2]&255](aE)|0}else{aP=c[ai>>2]|0}if((aP|0)==-1){c[b>>2]=0;Z=1860;break}else{if(aN^(aE|0)==0){aQ=aE;break}else{break L2204}}}}while(0);if((Z|0)==1860){Z=0;if(aN){break}else{aQ=0}}ai=c[f>>2]|0;aj=c[ai+12>>2]|0;if((aj|0)==(c[ai+16>>2]|0)){aR=b2[c[(c[ai>>2]|0)+36>>2]&255](ai)|0}else{aR=c[aj>>2]|0}if((aR|0)!=(c[aC>>2]|0)){break}aj=c[f>>2]|0;ai=aj+12|0;au=c[ai>>2]|0;if((au|0)==(c[aj+16>>2]|0)){af=c[(c[aj>>2]|0)+40>>2]|0;b2[af&255](aj)|0}else{c[ai>>2]=au+4}aC=aC+4|0;aD=a[D]|0;aE=aQ}if(!L){ak=r;al=o;am=T;an=S;ao=R;break L2115}au=a[D]|0;ai=au&255;if((aC|0)==(((au&1)==0?h:c[M>>2]|0)+(((ai&1|0)==0?ai>>>1:c[h>>2]|0)<<2)|0)){ak=r;al=o;am=T;an=S;ao=R}else{Z=1872;break L2091}break};case 4:{ai=0;au=o;aj=T;af=S;ah=R;L2240:while(1){V=c[f>>2]|0;do{if((V|0)==0){aS=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aT=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{aT=c[X>>2]|0}if((aT|0)==-1){c[f>>2]=0;aS=1;break}else{aS=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=1886}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aU=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{aU=c[X>>2]|0}if((aU|0)==-1){c[b>>2]=0;Z=1886;break}else{if(aS^(V|0)==0){break}else{break L2240}}}}while(0);if((Z|0)==1886){Z=0;if(aS){break}}V=c[f>>2]|0;X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aV=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{aV=c[X>>2]|0}if(b4[c[(c[e>>2]|0)+12>>2]&63](l,2048,aV)|0){X=c[n>>2]|0;if((X|0)==(c[q>>2]|0)){kR(m,n,q);aW=c[n>>2]|0}else{aW=X}c[n>>2]=aW+4;c[aW>>2]=aV;aX=ai+1|0;aY=au;aZ=aj;a_=af;a$=ah}else{X=d[w]|0;if((((X&1|0)==0?X>>>1:c[Q>>2]|0)|0)==0|(ai|0)==0){break}if((aV|0)!=(c[u>>2]|0)){break}if((aj|0)==(au|0)){X=(ah|0)!=196;V=aj-af|0;aq=V>>>0<2147483647>>>0?V<<1:-1;if(X){a0=af}else{a0=0}X=nH(a0,aq)|0;av=X;if((X|0)==0){nR()}a1=av+(aq>>>2<<2)|0;a2=av+(V>>2<<2)|0;a3=av;a4=92}else{a1=au;a2=aj;a3=af;a4=ah}c[a2>>2]=ai;aX=0;aY=a1;aZ=a2+4|0;a_=a3;a$=a4}av=c[f>>2]|0;V=av+12|0;aq=c[V>>2]|0;if((aq|0)==(c[av+16>>2]|0)){X=c[(c[av>>2]|0)+40>>2]|0;b2[X&255](av)|0;ai=aX;au=aY;aj=aZ;af=a_;ah=a$;continue}else{c[V>>2]=aq+4;ai=aX;au=aY;aj=aZ;af=a_;ah=a$;continue}}if((af|0)==(aj|0)|(ai|0)==0){a5=au;a6=aj;a7=af;a8=ah}else{if((aj|0)==(au|0)){aq=(ah|0)!=196;V=aj-af|0;av=V>>>0<2147483647>>>0?V<<1:-1;if(aq){a9=af}else{a9=0}aq=nH(a9,av)|0;X=aq;if((aq|0)==0){nR()}ba=X+(av>>>2<<2)|0;bb=X+(V>>2<<2)|0;bc=X;bd=92}else{ba=au;bb=aj;bc=af;bd=ah}c[bb>>2]=ai;a5=ba;a6=bb+4|0;a7=bc;a8=bd}X=c[B>>2]|0;if((X|0)>0){V=c[f>>2]|0;do{if((V|0)==0){be=1}else{av=c[V+12>>2]|0;if((av|0)==(c[V+16>>2]|0)){bf=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bf=c[av>>2]|0}if((bf|0)==-1){c[f>>2]=0;be=1;break}else{be=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=1935}else{ai=c[V+12>>2]|0;if((ai|0)==(c[V+16>>2]|0)){bg=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bg=c[ai>>2]|0}if((bg|0)==-1){c[b>>2]=0;Z=1935;break}else{if(be^(V|0)==0){bh=V;break}else{Z=1941;break L2091}}}}while(0);if((Z|0)==1935){Z=0;if(be){Z=1941;break L2091}else{bh=0}}V=c[f>>2]|0;ai=c[V+12>>2]|0;if((ai|0)==(c[V+16>>2]|0)){bi=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bi=c[ai>>2]|0}if((bi|0)!=(c[t>>2]|0)){Z=1941;break L2091}ai=c[f>>2]|0;V=ai+12|0;ah=c[V>>2]|0;if((ah|0)==(c[ai+16>>2]|0)){af=c[(c[ai>>2]|0)+40>>2]|0;b2[af&255](ai)|0;bj=bh;bk=X}else{c[V>>2]=ah+4;bj=bh;bk=X}while(1){ah=c[f>>2]|0;do{if((ah|0)==0){bl=1}else{V=c[ah+12>>2]|0;if((V|0)==(c[ah+16>>2]|0)){bm=b2[c[(c[ah>>2]|0)+36>>2]&255](ah)|0}else{bm=c[V>>2]|0}if((bm|0)==-1){c[f>>2]=0;bl=1;break}else{bl=(c[f>>2]|0)==0;break}}}while(0);do{if((bj|0)==0){Z=1958}else{ah=c[bj+12>>2]|0;if((ah|0)==(c[bj+16>>2]|0)){bn=b2[c[(c[bj>>2]|0)+36>>2]&255](bj)|0}else{bn=c[ah>>2]|0}if((bn|0)==-1){c[b>>2]=0;Z=1958;break}else{if(bl^(bj|0)==0){bo=bj;break}else{Z=1965;break L2091}}}}while(0);if((Z|0)==1958){Z=0;if(bl){Z=1965;break L2091}else{bo=0}}ah=c[f>>2]|0;V=c[ah+12>>2]|0;if((V|0)==(c[ah+16>>2]|0)){bp=b2[c[(c[ah>>2]|0)+36>>2]&255](ah)|0}else{bp=c[V>>2]|0}if(!(b4[c[(c[e>>2]|0)+12>>2]&63](l,2048,bp)|0)){Z=1965;break L2091}if((c[n>>2]|0)==(c[q>>2]|0)){kR(m,n,q)}V=c[f>>2]|0;ah=c[V+12>>2]|0;if((ah|0)==(c[V+16>>2]|0)){bq=b2[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bq=c[ah>>2]|0}ah=c[n>>2]|0;c[n>>2]=ah+4;c[ah>>2]=bq;ah=bk-1|0;c[B>>2]=ah;V=c[f>>2]|0;ai=V+12|0;af=c[ai>>2]|0;if((af|0)==(c[V+16>>2]|0)){aj=c[(c[V>>2]|0)+40>>2]|0;b2[aj&255](V)|0}else{c[ai>>2]=af+4}if((ah|0)>0){bj=bo;bk=ah}else{break}}}if((c[n>>2]|0)==(c[g>>2]|0)){Z=1976;break L2091}else{ak=r;al=a5;am=a6;an=a7;ao=a8}break};default:{ak=r;al=o;am=T;an=S;ao=R}}}while(0);L2384:do{if((Z|0)==1763){Z=0;if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=1978;break L2091}else{br=$}while(1){X=c[f>>2]|0;do{if((X|0)==0){bs=1}else{ah=c[X+12>>2]|0;if((ah|0)==(c[X+16>>2]|0)){bt=b2[c[(c[X>>2]|0)+36>>2]&255](X)|0}else{bt=c[ah>>2]|0}if((bt|0)==-1){c[f>>2]=0;bs=1;break}else{bs=(c[f>>2]|0)==0;break}}}while(0);do{if((br|0)==0){Z=1777}else{X=c[br+12>>2]|0;if((X|0)==(c[br+16>>2]|0)){bu=b2[c[(c[br>>2]|0)+36>>2]&255](br)|0}else{bu=c[X>>2]|0}if((bu|0)==-1){c[b>>2]=0;Z=1777;break}else{if(bs^(br|0)==0){bv=br;break}else{ak=r;al=o;am=T;an=S;ao=R;break L2384}}}}while(0);if((Z|0)==1777){Z=0;if(bs){ak=r;al=o;am=T;an=S;ao=R;break L2384}else{bv=0}}X=c[f>>2]|0;ah=c[X+12>>2]|0;if((ah|0)==(c[X+16>>2]|0)){bw=b2[c[(c[X>>2]|0)+36>>2]&255](X)|0}else{bw=c[ah>>2]|0}if(!(b4[c[(c[e>>2]|0)+12>>2]&63](l,8192,bw)|0)){ak=r;al=o;am=T;an=S;ao=R;break L2384}ah=c[f>>2]|0;X=ah+12|0;af=c[X>>2]|0;if((af|0)==(c[ah+16>>2]|0)){bx=b2[c[(c[ah>>2]|0)+40>>2]&255](ah)|0}else{c[X>>2]=af+4;bx=c[af>>2]|0}gU(A,bx);br=bv}}}while(0);af=U+1|0;if(af>>>0<4>>>0){R=ao;S=an;T=am;o=al;r=ak;U=af}else{aa=ao;ab=an;ac=am;ad=ak;Z=1978;break}}L2421:do{if((Z|0)==1872){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==1976){c[j>>2]=c[j>>2]|4;by=0;bz=a7;bA=a8}else if((Z|0)==1978){L2425:do{if((ad|0)!=0){ak=ad;am=ad+4|0;an=ad+8|0;ao=1;L2427:while(1){U=d[ak]|0;if((U&1|0)==0){bB=U>>>1}else{bB=c[am>>2]|0}if(ao>>>0>=bB>>>0){break L2425}U=c[f>>2]|0;do{if((U|0)==0){bC=1}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bD=b2[c[(c[U>>2]|0)+36>>2]&255](U)|0}else{bD=c[r>>2]|0}if((bD|0)==-1){c[f>>2]=0;bC=1;break}else{bC=(c[f>>2]|0)==0;break}}}while(0);U=c[b>>2]|0;do{if((U|0)==0){Z=1997}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bE=b2[c[(c[U>>2]|0)+36>>2]&255](U)|0}else{bE=c[r>>2]|0}if((bE|0)==-1){c[b>>2]=0;Z=1997;break}else{if(bC^(U|0)==0){break}else{break L2427}}}}while(0);if((Z|0)==1997){Z=0;if(bC){break}}U=c[f>>2]|0;r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bF=b2[c[(c[U>>2]|0)+36>>2]&255](U)|0}else{bF=c[r>>2]|0}if((a[ak]&1)==0){bG=am}else{bG=c[an>>2]|0}if((bF|0)!=(c[bG+(ao<<2)>>2]|0)){break}r=ao+1|0;U=c[f>>2]|0;al=U+12|0;o=c[al>>2]|0;if((o|0)==(c[U+16>>2]|0)){T=c[(c[U>>2]|0)+40>>2]|0;b2[T&255](U)|0;ao=r;continue}else{c[al>>2]=o+4;ao=r;continue}}c[j>>2]=c[j>>2]|4;by=0;bz=ab;bA=aa;break L2421}}while(0);if((ab|0)==(ac|0)){by=1;bz=ac;bA=aa;break}c[C>>2]=0;kJ(v,ab,ac,C);if((c[C>>2]|0)==0){by=1;bz=ab;bA=aa;break}c[j>>2]=c[j>>2]|4;by=0;bz=ab;bA=aa}else if((Z|0)==1941){c[j>>2]=c[j>>2]|4;by=0;bz=a7;bA=a8}else if((Z|0)==1965){c[j>>2]=c[j>>2]|4;by=0;bz=a7;bA=a8}else if((Z|0)==1762){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==1828){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}}while(0);gQ(A);gQ(z);gQ(y);gQ(x);gF(v);if((bz|0)==0){i=p;return by|0}b$[bA&511](bz);i=p;return by|0}function kO(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+456|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=196;u=m+400|0;gZ(p,h);m=p|0;v=c[m>>2]|0;if((c[6698]|0)!=-1){c[l>>2]=26792;c[l+4>>2]=14;c[l+8>>2]=0;gA(26792,l,110)}l=(c[6699]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(kN(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){c[k+4>>2]=0;a[B]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){gU(k,b1[c[(c[B>>2]|0)+44>>2]&31](y,45)|0)}x=b1[c[(c[B>>2]|0)+44>>2]&31](y,48)|0;y=c[o>>2]|0;B=y-4|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((c[C>>2]|0)==(x|0)){C=C+4|0}else{break}}kP(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{E=c[B+12>>2]|0;if((E|0)==(c[B+16>>2]|0)){F=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{F=c[E>>2]|0}if((F|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){G=2052}else{B=c[A+12>>2]|0;if((B|0)==(c[A+16>>2]|0)){H=b2[c[(c[A>>2]|0)+36>>2]&255](A)|0}else{H=c[B>>2]|0}if((H|0)==-1){c[z>>2]=0;G=2052;break}else{if(x^(A|0)==0){break}else{G=2054;break}}}}while(0);if((G|0)==2052){if(x){G=2054}}if((G|0)==2054){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;gg(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}b$[c[t>>2]&511](A);i=d;return}}while(0);d=bP(4)|0;nj(d);bl(d|0,18192,158)}function kP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=1;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g>>2;if((h|0)==0){return b|0}if((k-j|0)>>>0<h>>>0){gW(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+4|0}else{n=c[b+8>>2]|0}m=n+(j<<2)|0;if((d|0)==(e|0)){o=m}else{l=j+((e-4+(-g|0)|0)>>>2)+1|0;g=d;d=m;while(1){c[d>>2]=c[g>>2];m=g+4|0;if((m|0)==(e|0)){break}else{g=m;d=d+4|0}}o=n+(l<<2)|0}c[o>>2]=0;o=j+h|0;if((a[f]&1)==0){a[f]=o<<1&255;return b|0}else{c[b+4>>2]=o;return b|0}return 0}function kQ(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[6814]|0)!=-1){c[p>>2]=27256;c[p+4>>2]=14;c[p+8>>2]=0;gA(27256,p,110)}p=(c[6815]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=bP(4)|0;L=K;nj(L);bl(K|0,18192,158)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=bP(4)|0;L=K;nj(L);bl(K|0,18192,158)}K=b;b0[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C&255;C=C>>8;a[L+1|0]=C&255;C=C>>8;a[L+2|0]=C&255;C=C>>8;a[L+3|0]=C&255;L=b;b0[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){c[l+4>>2]=0;a[q]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}gT(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];nW(s|0,0,12)|0;gQ(r);b0[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){c[k+4>>2]=0;a[r]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}gT(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];nW(u|0,0,12)|0;gQ(t);t=b;c[f>>2]=b2[c[(c[t>>2]|0)+12>>2]&255](K)|0;c[g>>2]=b2[c[(c[t>>2]|0)+16>>2]&255](K)|0;b0[c[(c[b>>2]|0)+20>>2]&127](v,K);b=h;if((a[b]&1)==0){a[h+1|0]=0;a[b]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gJ(h,0);c[b>>2]=c[w>>2];c[b+4>>2]=c[w+4>>2];c[b+8>>2]=c[w+8>>2];nW(w|0,0,12)|0;gF(v);b0[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){c[j+4>>2]=0;a[L]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}gT(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];nW(y|0,0,12)|0;gQ(x);M=b2[c[(c[t>>2]|0)+36>>2]&255](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[6816]|0)!=-1){c[o>>2]=27264;c[o+4>>2]=14;c[o+8>>2]=0;gA(27264,o,110)}o=(c[6817]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=bP(4)|0;O=N;nj(O);bl(N|0,18192,158)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=bP(4)|0;O=N;nj(O);bl(N|0,18192,158)}N=K;b0[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C&255;C=C>>8;a[O+1|0]=C&255;C=C>>8;a[O+2|0]=C&255;C=C>>8;a[O+3|0]=C&255;O=K;b0[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){c[l+4>>2]=0;a[z]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}gT(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];nW(B|0,0,12)|0;gQ(A);b0[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){c[k+4>>2]=0;a[A]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}gT(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];nW(E|0,0,12)|0;gQ(D);D=K;c[f>>2]=b2[c[(c[D>>2]|0)+12>>2]&255](N)|0;c[g>>2]=b2[c[(c[D>>2]|0)+16>>2]&255](N)|0;b0[c[(c[K>>2]|0)+20>>2]&127](F,N);K=h;if((a[K]&1)==0){a[h+1|0]=0;a[K]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gJ(h,0);c[K>>2]=c[G>>2];c[K+4>>2]=c[G+4>>2];c[K+8>>2]=c[G+8>>2];nW(G|0,0,12)|0;gF(F);b0[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){c[j+4>>2]=0;a[O]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}gT(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];nW(I|0,0,12)|0;gQ(H);M=b2[c[(c[D>>2]|0)+36>>2]&255](N)|0;c[m>>2]=M;i=n;return}}function kR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a+4|0;f=(c[e>>2]|0)!=196;g=a|0;a=c[g>>2]|0;h=a;i=(c[d>>2]|0)-h|0;j=i>>>0<2147483647>>>0?i<<1:-1;i=(c[b>>2]|0)-h>>2;if(f){k=a}else{k=0}a=nH(k,j)|0;k=a;if((a|0)==0){nR()}do{if(f){c[g>>2]=k;l=k}else{a=c[g>>2]|0;c[g>>2]=k;if((a|0)==0){l=k;break}b$[c[e>>2]&511](a);l=c[g>>2]|0}}while(0);c[e>>2]=92;c[b>>2]=l+(i<<2);c[d>>2]=(c[g>>2]|0)+(j>>>2<<2);return}function kS(a){a=a|0;ge(a|0);nM(a);return}function kT(a){a=a|0;ge(a|0);return}function kU(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;e=i;i=i+280|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+232|0;p=e+240|0;q=e+248|0;r=e+256|0;s=e+264|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+100|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=aY(D|0,100,8856,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);G=i4(n,c[6340]|0,8856,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){nR();I=c[n>>2]|0}else{I=H}H=nE(G)|0;if((H|0)!=0){J=H;K=G;L=I;M=H;break}nR();J=0;K=G;L=I;M=0}else{J=E;K=F;L=0;M=0}}while(0);gZ(o,j);F=o|0;E=c[F>>2]|0;if((c[6700]|0)!=-1){c[m>>2]=26800;c[m+4>>2]=14;c[m+8>>2]=0;gA(26800,m,110)}m=(c[6701]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}G=D;H=c[n>>2]|0;N=H+K|0;O=c[(c[D>>2]|0)+32>>2]|0;cc[O&15](G,H,N,J)|0;if((K|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}nW(t|0,0,12)|0;nW(v|0,0,12)|0;nW(x|0,0,12)|0;kV(g,P,o,p,q,r,s,u,w,y);N=z|0;H=c[y>>2]|0;if((K|0)>(H|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(K-H<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+H|0;do{if(O>>>0>100>>>0){D=nE(O)|0;if((D|0)!=0){V=D;W=D;break}nR();V=0;W=0}else{V=N;W=0}}while(0);kW(V,A,B,c[j+4>>2]|0,J,J+K|0,G,P,p,a[q]|0,a[r]|0,s,u,w,H);c[C>>2]=c[f>>2];fK(b,C,V,c[A>>2]|0,c[B>>2]|0,j,k);if((W|0)!=0){nF(W)}gF(w);gF(u);gF(s);N=c[F>>2]|0;gg(N)|0;if((M|0)!=0){nF(M)}if((L|0)==0){i=e;return}nF(L);i=e;return}}while(0);e=bP(4)|0;nj(e);bl(e|0,18192,158)}function kV(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[6818]|0)!=-1){c[p>>2]=27272;c[p+4>>2]=14;c[p+8>>2]=0;gA(27272,p,110)}p=(c[6819]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=bP(4)|0;R=Q;nj(R);bl(Q|0,18192,158)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=bP(4)|0;R=Q;nj(R);bl(Q|0,18192,158)}Q=e;R=c[e>>2]|0;if(d){b0[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C&255;C=C>>8;a[r+1|0]=C&255;C=C>>8;a[r+2|0]=C&255;C=C>>8;a[r+3|0]=C&255;b0[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){a[l+1|0]=0;a[r]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gJ(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];nW(t|0,0,12)|0;gF(s)}else{b0[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C&255;C=C>>8;a[v+1|0]=C&255;C=C>>8;a[v+2|0]=C&255;C=C>>8;a[v+3|0]=C&255;b0[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){a[l+1|0]=0;a[v]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gJ(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];nW(x|0,0,12)|0;gF(w)}w=e;a[g]=b2[c[(c[w>>2]|0)+12>>2]&255](Q)|0;a[h]=b2[c[(c[w>>2]|0)+16>>2]&255](Q)|0;w=e;b0[c[(c[w>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gJ(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];nW(z|0,0,12)|0;gF(y);b0[c[(c[w>>2]|0)+24>>2]&127](A,Q);w=k;if((a[w]&1)==0){a[k+1|0]=0;a[w]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gJ(k,0);c[w>>2]=c[B>>2];c[w+4>>2]=c[B+4>>2];c[w+8>>2]=c[B+8>>2];nW(B|0,0,12)|0;gF(A);S=b2[c[(c[e>>2]|0)+36>>2]&255](Q)|0;c[m>>2]=S;i=n;return}else{if((c[6820]|0)!=-1){c[o>>2]=27280;c[o+4>>2]=14;c[o+8>>2]=0;gA(27280,o,110)}o=(c[6821]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=bP(4)|0;U=T;nj(U);bl(T|0,18192,158)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=bP(4)|0;U=T;nj(U);bl(T|0,18192,158)}T=P;U=c[P>>2]|0;if(d){b0[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C&255;C=C>>8;a[E+1|0]=C&255;C=C>>8;a[E+2|0]=C&255;C=C>>8;a[E+3|0]=C&255;b0[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){a[l+1|0]=0;a[E]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gJ(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];nW(G|0,0,12)|0;gF(F)}else{b0[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C&255;C=C>>8;a[I+1|0]=C&255;C=C>>8;a[I+2|0]=C&255;C=C>>8;a[I+3|0]=C&255;b0[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){a[l+1|0]=0;a[I]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gJ(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];nW(K|0,0,12)|0;gF(J)}J=P;a[g]=b2[c[(c[J>>2]|0)+12>>2]&255](T)|0;a[h]=b2[c[(c[J>>2]|0)+16>>2]&255](T)|0;J=P;b0[c[(c[J>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gJ(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];nW(M|0,0,12)|0;gF(L);b0[c[(c[J>>2]|0)+24>>2]&127](N,T);J=k;if((a[J]&1)==0){a[k+1|0]=0;a[J]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gJ(k,0);c[J>>2]=c[O>>2];c[J+4>>2]=c[O+4>>2];c[J+8>>2]=c[O+8>>2];nW(O|0,0,12)|0;gF(N);S=b2[c[(c[P>>2]|0)+36>>2]&255](T)|0;c[m>>2]=S;i=n;return}}function kW(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=j+8|0;B=(r|0)>0;C=o;D=o+1|0;E=o+8|0;F=o+4|0;o=-r|0;G=h;h=0;while(1){L75:do{switch(a[l+h|0]|0){case 4:{H=c[f>>2]|0;I=k?G+1|0:G;J=I;while(1){if(J>>>0>=i>>>0){break}K=a[J]|0;if(K<<24>>24<0){break}if((b[(c[p>>2]|0)+(K<<24>>24<<1)>>1]&2048)==0){break}else{J=J+1|0}}K=J;if(B){if(J>>>0>I>>>0){L=I+(-K|0)|0;K=L>>>0<o>>>0?o:L;L=K+r|0;M=J;N=r;O=H;while(1){P=M-1|0;Q=a[P]|0;c[f>>2]=O+1;a[O]=Q;Q=N-1|0;R=(Q|0)>0;if(!(P>>>0>I>>>0&R)){break}M=P;N=Q;O=c[f>>2]|0}O=J+K|0;if(R){S=L;T=O;U=100}else{V=0;W=L;X=O}}else{S=r;T=J;U=100}if((U|0)==100){U=0;V=b1[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;W=S;X=T}O=c[f>>2]|0;c[f>>2]=O+1;if((W|0)>0){N=W;M=O;while(1){a[M]=V;Q=N-1|0;P=c[f>>2]|0;c[f>>2]=P+1;if((Q|0)>0){N=Q;M=P}else{Y=P;break}}}else{Y=O}a[Y]=m;Z=X}else{Z=J}if((Z|0)==(I|0)){M=b1[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;N=c[f>>2]|0;c[f>>2]=N+1;a[N]=M}else{M=a[C]|0;N=M&255;if((N&1|0)==0){_=N>>>1}else{_=c[F>>2]|0}if((_|0)==0){$=Z;aa=0;ab=0;ac=-1}else{if((M&1)==0){ad=D}else{ad=c[E>>2]|0}$=Z;aa=0;ab=0;ac=a[ad]|0}while(1){do{if((aa|0)==(ac|0)){M=c[f>>2]|0;c[f>>2]=M+1;a[M]=n;M=ab+1|0;N=a[C]|0;L=N&255;if((L&1|0)==0){ae=L>>>1}else{ae=c[F>>2]|0}if(M>>>0>=ae>>>0){af=ac;ag=M;ah=0;break}L=(N&1)==0;if(L){ai=D}else{ai=c[E>>2]|0}if((a[ai+M|0]|0)==127){af=-1;ag=M;ah=0;break}if(L){aj=D}else{aj=c[E>>2]|0}af=a[aj+M|0]|0;ag=M;ah=0}else{af=ac;ag=ab;ah=aa}}while(0);M=$-1|0;L=a[M]|0;N=c[f>>2]|0;c[f>>2]=N+1;a[N]=L;if((M|0)==(I|0)){break}else{$=M;aa=ah+1|0;ab=ag;ac=af}}}J=c[f>>2]|0;if((H|0)==(J|0)){ak=I;break L75}O=J-1|0;if(H>>>0<O>>>0){al=H;am=O}else{ak=I;break L75}while(1){O=a[al]|0;a[al]=a[am]|0;a[am]=O;O=al+1|0;J=am-1|0;if(O>>>0<J>>>0){al=O;am=J}else{ak=I;break}}break};case 2:{I=a[q]|0;H=I&255;J=(H&1|0)==0;if(J){an=H>>>1}else{an=c[z>>2]|0}if((an|0)==0|x){ak=G;break L75}if((I&1)==0){ao=y;ap=y}else{I=c[A>>2]|0;ao=I;ap=I}if(J){aq=H>>>1}else{aq=c[z>>2]|0}H=ao+aq|0;J=c[f>>2]|0;if((ap|0)==(H|0)){ar=J}else{I=ap;O=J;while(1){a[O]=a[I]|0;J=I+1|0;M=O+1|0;if((J|0)==(H|0)){ar=M;break}else{I=J;O=M}}}c[f>>2]=ar;ak=G;break};case 0:{c[e>>2]=c[f>>2];ak=G;break};case 1:{c[e>>2]=c[f>>2];O=b1[c[(c[s>>2]|0)+28>>2]&31](j,32)|0;I=c[f>>2]|0;c[f>>2]=I+1;a[I]=O;ak=G;break};case 3:{O=a[t]|0;I=O&255;if((I&1|0)==0){as=I>>>1}else{as=c[w>>2]|0}if((as|0)==0){ak=G;break L75}if((O&1)==0){at=u}else{at=c[v>>2]|0}O=a[at]|0;I=c[f>>2]|0;c[f>>2]=I+1;a[I]=O;ak=G;break};default:{ak=G}}}while(0);O=h+1|0;if(O>>>0<4>>>0){G=ak;h=O}else{break}}h=a[t]|0;t=h&255;ak=(t&1|0)==0;if(ak){au=t>>>1}else{au=c[w>>2]|0}if(au>>>0>1>>>0){if((h&1)==0){av=u;aw=u}else{u=c[v>>2]|0;av=u;aw=u}if(ak){ax=t>>>1}else{ax=c[w>>2]|0}w=av+ax|0;ax=c[f>>2]|0;av=aw+1|0;if((av|0)==(w|0)){ay=ax}else{aw=ax;ax=av;while(1){a[aw]=a[ax]|0;av=aw+1|0;t=ax+1|0;if((t|0)==(w|0)){ay=av;break}else{aw=av;ax=t}}}c[f>>2]=ay}ay=g&176;if((ay|0)==32){c[e>>2]=c[f>>2];return}else if((ay|0)==16){return}else{c[e>>2]=d;return}}function kX(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+100|0;i=i+7&-8;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;gZ(m,h);B=m|0;C=c[B>>2]|0;if((c[6700]|0)!=-1){c[l>>2]=26800;c[l+4>>2]=14;c[l+8>>2]=0;gA(26800,l,110)}l=(c[6701]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=k;I=a[H]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[k+4>>2]|0}if((K|0)==0){L=0}else{if((I&1)==0){M=G+1|0}else{M=c[k+8>>2]|0}I=a[M]|0;L=I<<24>>24==(b1[c[(c[E>>2]|0)+28>>2]&31](F,45)|0)<<24>>24}nW(r|0,0,12)|0;nW(t|0,0,12)|0;nW(v|0,0,12)|0;kV(g,L,m,n,o,p,q,s,u,w);E=x|0;I=a[H]|0;J=I&255;N=(J&1|0)==0;if(N){O=J>>>1}else{O=c[k+4>>2]|0}P=c[w>>2]|0;if((O|0)>(P|0)){if(N){Q=J>>>1}else{Q=c[k+4>>2]|0}J=d[v]|0;if((J&1|0)==0){R=J>>>1}else{R=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){S=J>>>1}else{S=c[s+4>>2]|0}T=(Q-P<<1|1)+R+S|0}else{J=d[v]|0;if((J&1|0)==0){U=J>>>1}else{U=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){V=J>>>1}else{V=c[s+4>>2]|0}T=U+2+V|0}J=T+P|0;do{if(J>>>0>100>>>0){N=nE(J)|0;if((N|0)!=0){W=N;X=N;Y=I;break}nR();W=0;X=0;Y=a[H]|0}else{W=E;X=0;Y=I}}while(0);if((Y&1)==0){Z=G+1|0;_=G+1|0}else{I=c[k+8>>2]|0;Z=I;_=I}I=Y&255;if((I&1|0)==0){$=I>>>1}else{$=c[k+4>>2]|0}kW(W,y,z,c[h+4>>2]|0,_,Z+$|0,F,L,n,a[o]|0,a[p]|0,q,s,u,P);c[A>>2]=c[f>>2];fK(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){gF(u);gF(s);gF(q);aa=c[B>>2]|0;ab=aa|0;ac=gg(ab)|0;i=e;return}nF(X);gF(u);gF(s);gF(q);aa=c[B>>2]|0;ab=aa|0;ac=gg(ab)|0;i=e;return}}while(0);e=bP(4)|0;nj(e);bl(e|0,18192,158)}function kY(a){a=a|0;ge(a|0);nM(a);return}function kZ(a){a=a|0;ge(a|0);return}function k_(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+576|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+528|0;p=e+536|0;q=e+544|0;r=e+552|0;s=e+560|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+400|0;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=aY(D|0,100,8856,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);G=i4(n,c[6340]|0,8856,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){nR();I=c[n>>2]|0}else{I=H}H=nE(G<<2)|0;J=H;if((H|0)!=0){K=J;L=G;M=I;N=J;break}nR();K=J;L=G;M=I;N=J}else{K=E;L=F;M=0;N=0}}while(0);gZ(o,j);F=o|0;E=c[F>>2]|0;if((c[6698]|0)!=-1){c[m>>2]=26792;c[m+4>>2]=14;c[m+8>>2]=0;gA(26792,m,110)}m=(c[6699]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}J=D;G=c[n>>2]|0;H=G+L|0;O=c[(c[D>>2]|0)+48>>2]|0;cc[O&15](J,G,H,K)|0;if((L|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}nW(t|0,0,12)|0;nW(v|0,0,12)|0;nW(x|0,0,12)|0;k$(g,P,o,p,q,r,s,u,w,y);H=z|0;G=c[y>>2]|0;if((L|0)>(G|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(L-G<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+G|0;do{if(O>>>0>100>>>0){D=nE(O<<2)|0;V=D;if((D|0)!=0){W=V;X=V;break}nR();W=V;X=V}else{W=H;X=0}}while(0);k0(W,A,B,c[j+4>>2]|0,K,K+(L<<2)|0,J,P,p,c[q>>2]|0,c[r>>2]|0,s,u,w,G);c[C>>2]=c[f>>2];jd(b,C,W,c[A>>2]|0,c[B>>2]|0,j,k);if((X|0)!=0){nF(X)}gQ(w);gQ(u);gF(s);H=c[F>>2]|0;gg(H)|0;if((N|0)!=0){nF(N)}if((M|0)==0){i=e;return}nF(M);i=e;return}}while(0);e=bP(4)|0;nj(e);bl(e|0,18192,158)}function k$(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[6814]|0)!=-1){c[p>>2]=27256;c[p+4>>2]=14;c[p+8>>2]=0;gA(27256,p,110)}p=(c[6815]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=bP(4)|0;R=Q;nj(R);bl(Q|0,18192,158)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=bP(4)|0;R=Q;nj(R);bl(Q|0,18192,158)}Q=e;R=c[e>>2]|0;if(d){b0[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C&255;C=C>>8;a[r+1|0]=C&255;C=C>>8;a[r+2|0]=C&255;C=C>>8;a[r+3|0]=C&255;b0[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){c[l+4>>2]=0;a[r]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}gT(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];nW(t|0,0,12)|0;gQ(s)}else{b0[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C&255;C=C>>8;a[v+1|0]=C&255;C=C>>8;a[v+2|0]=C&255;C=C>>8;a[v+3|0]=C&255;b0[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){c[l+4>>2]=0;a[v]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}gT(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];nW(x|0,0,12)|0;gQ(w)}w=e;c[g>>2]=b2[c[(c[w>>2]|0)+12>>2]&255](Q)|0;c[h>>2]=b2[c[(c[w>>2]|0)+16>>2]&255](Q)|0;b0[c[(c[e>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gJ(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];nW(z|0,0,12)|0;gF(y);b0[c[(c[e>>2]|0)+24>>2]&127](A,Q);e=k;if((a[e]&1)==0){c[k+4>>2]=0;a[e]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}gT(k,0);c[e>>2]=c[B>>2];c[e+4>>2]=c[B+4>>2];c[e+8>>2]=c[B+8>>2];nW(B|0,0,12)|0;gQ(A);S=b2[c[(c[w>>2]|0)+36>>2]&255](Q)|0;c[m>>2]=S;i=n;return}else{if((c[6816]|0)!=-1){c[o>>2]=27264;c[o+4>>2]=14;c[o+8>>2]=0;gA(27264,o,110)}o=(c[6817]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=bP(4)|0;U=T;nj(U);bl(T|0,18192,158)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=bP(4)|0;U=T;nj(U);bl(T|0,18192,158)}T=P;U=c[P>>2]|0;if(d){b0[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C&255;C=C>>8;a[E+1|0]=C&255;C=C>>8;a[E+2|0]=C&255;C=C>>8;a[E+3|0]=C&255;b0[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){c[l+4>>2]=0;a[E]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}gT(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];nW(G|0,0,12)|0;gQ(F)}else{b0[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C&255;C=C>>8;a[I+1|0]=C&255;C=C>>8;a[I+2|0]=C&255;C=C>>8;a[I+3|0]=C&255;b0[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){c[l+4>>2]=0;a[I]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}gT(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];nW(K|0,0,12)|0;gQ(J)}J=P;c[g>>2]=b2[c[(c[J>>2]|0)+12>>2]&255](T)|0;c[h>>2]=b2[c[(c[J>>2]|0)+16>>2]&255](T)|0;b0[c[(c[P>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gJ(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];nW(M|0,0,12)|0;gF(L);b0[c[(c[P>>2]|0)+24>>2]&127](N,T);P=k;if((a[P]&1)==0){c[k+4>>2]=0;a[P]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}gT(k,0);c[P>>2]=c[O>>2];c[P+4>>2]=c[O+4>>2];c[P+8>>2]=c[O+8>>2];nW(O|0,0,12)|0;gQ(N);S=b2[c[(c[J>>2]|0)+36>>2]&255](T)|0;c[m>>2]=S;i=n;return}}function k0(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=i;y=(q|0)>0;z=n;A=n+1|0;B=n+8|0;C=n+4|0;n=g;g=0;while(1){L396:do{switch(a[k+g|0]|0){case 0:{c[d>>2]=c[e>>2];D=n;break};case 2:{E=a[p]|0;F=E&255;G=(F&1|0)==0;if(G){H=F>>>1}else{H=c[w>>2]|0}if((H|0)==0|v){D=n;break L396}if((E&1)==0){I=w;J=w;K=w}else{E=c[x>>2]|0;I=E;J=E;K=E}if(G){L=F>>>1}else{L=c[w>>2]|0}F=I+(L<<2)|0;G=c[e>>2]|0;if((J|0)==(F|0)){M=G}else{E=(I+(L-1<<2)+(-K|0)|0)>>>2;N=J;O=G;while(1){c[O>>2]=c[N>>2];P=N+4|0;if((P|0)==(F|0)){break}N=P;O=O+4|0}M=G+(E+1<<2)|0}c[e>>2]=M;D=n;break};case 1:{c[d>>2]=c[e>>2];O=b1[c[(c[r>>2]|0)+44>>2]&31](i,32)|0;N=c[e>>2]|0;c[e>>2]=N+4;c[N>>2]=O;D=n;break};case 3:{O=a[s]|0;N=O&255;if((N&1|0)==0){Q=N>>>1}else{Q=c[t>>2]|0}if((Q|0)==0){D=n;break L396}if((O&1)==0){R=t}else{R=c[u>>2]|0}O=c[R>>2]|0;N=c[e>>2]|0;c[e>>2]=N+4;c[N>>2]=O;D=n;break};case 4:{O=c[e>>2]|0;N=j?n+4|0:n;F=N;while(1){if(F>>>0>=h>>>0){break}if(b4[c[(c[o>>2]|0)+12>>2]&63](i,2048,c[F>>2]|0)|0){F=F+4|0}else{break}}if(y){if(F>>>0>N>>>0){E=F;G=q;do{E=E-4|0;P=c[E>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=P;G=G-1|0;T=(G|0)>0;}while(E>>>0>N>>>0&T);if(T){U=G;V=E;W=376}else{X=0;Y=G;Z=E}}else{U=q;V=F;W=376}if((W|0)==376){W=0;X=b1[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;Y=U;Z=V}P=c[e>>2]|0;c[e>>2]=P+4;if((Y|0)>0){S=Y;_=P;while(1){c[_>>2]=X;$=S-1|0;aa=c[e>>2]|0;c[e>>2]=aa+4;if(($|0)>0){S=$;_=aa}else{ab=aa;break}}}else{ab=P}c[ab>>2]=l;ac=Z}else{ac=F}if((ac|0)==(N|0)){_=b1[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=_}else{_=a[z]|0;S=_&255;if((S&1|0)==0){ad=S>>>1}else{ad=c[C>>2]|0}if((ad|0)==0){ae=ac;af=0;ag=0;ah=-1}else{if((_&1)==0){ai=A}else{ai=c[B>>2]|0}ae=ac;af=0;ag=0;ah=a[ai]|0}while(1){do{if((af|0)==(ah|0)){_=c[e>>2]|0;c[e>>2]=_+4;c[_>>2]=m;_=ag+1|0;S=a[z]|0;E=S&255;if((E&1|0)==0){aj=E>>>1}else{aj=c[C>>2]|0}if(_>>>0>=aj>>>0){ak=ah;al=_;am=0;break}E=(S&1)==0;if(E){an=A}else{an=c[B>>2]|0}if((a[an+_|0]|0)==127){ak=-1;al=_;am=0;break}if(E){ao=A}else{ao=c[B>>2]|0}ak=a[ao+_|0]|0;al=_;am=0}else{ak=ah;al=ag;am=af}}while(0);_=ae-4|0;E=c[_>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=E;if((_|0)==(N|0)){break}else{ae=_;af=am+1|0;ag=al;ah=ak}}}F=c[e>>2]|0;if((O|0)==(F|0)){D=N;break L396}P=F-4|0;if(O>>>0<P>>>0){ap=O;aq=P}else{D=N;break L396}while(1){P=c[ap>>2]|0;c[ap>>2]=c[aq>>2];c[aq>>2]=P;P=ap+4|0;F=aq-4|0;if(P>>>0<F>>>0){ap=P;aq=F}else{D=N;break}}break};default:{D=n}}}while(0);N=g+1|0;if(N>>>0<4>>>0){n=D;g=N}else{break}}g=a[s]|0;s=g&255;D=(s&1|0)==0;if(D){ar=s>>>1}else{ar=c[t>>2]|0}if(ar>>>0>1>>>0){if((g&1)==0){as=t;at=t;au=t}else{g=c[u>>2]|0;as=g;at=g;au=g}if(D){av=s>>>1}else{av=c[t>>2]|0}t=as+(av<<2)|0;s=c[e>>2]|0;D=at+4|0;if((D|0)==(t|0)){aw=s}else{at=((as+(av-2<<2)+(-au|0)|0)>>>2)+1|0;au=s;av=D;while(1){c[au>>2]=c[av>>2];D=av+4|0;if((D|0)==(t|0)){break}else{au=au+4|0;av=D}}aw=s+(at<<2)|0}c[e>>2]=aw}aw=f&176;if((aw|0)==32){c[d>>2]=c[e>>2];return}else if((aw|0)==16){return}else{c[d>>2]=b;return}}function k1(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+400|0;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;gZ(m,h);B=m|0;C=c[B>>2]|0;if((c[6698]|0)!=-1){c[l>>2]=26792;c[l+4>>2]=14;c[l+8>>2]=0;gA(26792,l,110)}l=(c[6699]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=a[G]|0;I=H&255;if((I&1|0)==0){J=I>>>1}else{J=c[k+4>>2]|0}if((J|0)==0){K=0}else{if((H&1)==0){L=k+4|0}else{L=c[k+8>>2]|0}H=c[L>>2]|0;K=(H|0)==(b1[c[(c[E>>2]|0)+44>>2]&31](F,45)|0)}nW(r|0,0,12)|0;nW(t|0,0,12)|0;nW(v|0,0,12)|0;k$(g,K,m,n,o,p,q,s,u,w);E=x|0;H=a[G]|0;I=H&255;M=(I&1|0)==0;if(M){N=I>>>1}else{N=c[k+4>>2]|0}O=c[w>>2]|0;if((N|0)>(O|0)){if(M){P=I>>>1}else{P=c[k+4>>2]|0}I=d[v]|0;if((I&1|0)==0){Q=I>>>1}else{Q=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){R=I>>>1}else{R=c[s+4>>2]|0}S=(P-O<<1|1)+Q+R|0}else{I=d[v]|0;if((I&1|0)==0){T=I>>>1}else{T=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){U=I>>>1}else{U=c[s+4>>2]|0}S=T+2+U|0}I=S+O|0;do{if(I>>>0>100>>>0){M=nE(I<<2)|0;V=M;if((M|0)!=0){W=V;X=V;Y=H;break}nR();W=V;X=V;Y=a[G]|0}else{W=E;X=0;Y=H}}while(0);if((Y&1)==0){Z=k+4|0;_=k+4|0}else{H=c[k+8>>2]|0;Z=H;_=H}H=Y&255;if((H&1|0)==0){$=H>>>1}else{$=c[k+4>>2]|0}k0(W,y,z,c[h+4>>2]|0,_,Z+($<<2)|0,F,K,n,c[o>>2]|0,c[p>>2]|0,q,s,u,O);c[A>>2]=c[f>>2];jd(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){gQ(u);gQ(s);gF(q);aa=c[B>>2]|0;ab=aa|0;ac=gg(ab)|0;i=e;return}nF(X);gQ(u);gQ(s);gF(q);aa=c[B>>2]|0;ab=aa|0;ac=gg(ab)|0;i=e;return}}while(0);e=bP(4)|0;nj(e);bl(e|0,18192,158)}function k2(a){a=a|0;ge(a|0);nM(a);return}function k3(a){a=a|0;ge(a|0);return}function k4(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=bS(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function k5(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+16|0;j=d|0;k=j;nW(k|0,0,12)|0;l=b;m=h;n=a[h]|0;if((n&1)==0){o=m+1|0;p=m+1|0}else{m=c[h+8>>2]|0;o=m;p=m}m=n&255;if((m&1|0)==0){q=m>>>1}else{q=c[h+4>>2]|0}h=o+q|0;do{if(p>>>0<h>>>0){q=p;do{gK(j,a[q]|0);q=q+1|0;}while(q>>>0<h>>>0);q=(e|0)==-1?-1:e<<1;if((a[k]&1)==0){r=q;s=508;break}t=c[j+8>>2]|0;u=q}else{r=(e|0)==-1?-1:e<<1;s=508}}while(0);if((s|0)==508){t=j+1|0;u=r}r=a8(u|0,f|0,g|0,t|0)|0;nW(l|0,0,12)|0;l=nV(r|0)|0;t=r+l|0;if((l|0)>0){v=r}else{gF(j);i=d;return}do{gK(b,a[v]|0);v=v+1|0;}while(v>>>0<t>>>0);gF(j);i=d;return}function k6(a,b){a=a|0;b=b|0;bz(((b|0)==-1?-1:b<<1)|0)|0;return}function k7(a){a=a|0;ge(a|0);nM(a);return}function k8(a){a=a|0;ge(a|0);return}function k9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=bS(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function la(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+224|0;j=d|0;k=d+8|0;l=d+40|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+192|0;q=d+200|0;r=d+208|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;nW(s|0,0,12)|0;v=b;w=t|0;c[t+4>>2]=0;c[t>>2]=13344;x=a[h]|0;if((x&1)==0){y=h+4|0;z=h+4|0}else{A=c[h+8>>2]|0;y=A;z=A}A=x&255;if((A&1|0)==0){B=A>>>1}else{B=c[h+4>>2]|0}h=y+(B<<2)|0;L629:do{if(z>>>0<h>>>0){B=t;y=k|0;A=k+32|0;x=z;C=13344;while(1){c[m>>2]=x;D=(b8[c[C+12>>2]&31](w,j,x,h,m,y,A,l)|0)==2;E=c[m>>2]|0;if(D|(E|0)==(x|0)){break}if(y>>>0<(c[l>>2]|0)>>>0){D=y;do{gK(r,a[D]|0);D=D+1|0;}while(D>>>0<(c[l>>2]|0)>>>0);F=c[m>>2]|0}else{F=E}if(F>>>0>=h>>>0){break L629}x=F;C=c[B>>2]|0}B=bP(8)|0;gm(B,5608);bl(B|0,18208,26)}}while(0);ge(t|0);if((a[s]&1)==0){G=r+1|0}else{G=c[r+8>>2]|0}s=a8(((e|0)==-1?-1:e<<1)|0,f|0,g|0,G|0)|0;nW(v|0,0,12)|0;v=u|0;c[u+4>>2]=0;c[u>>2]=13288;G=nV(s|0)|0;g=s+G|0;if((G|0)<1){H=u|0;ge(H);gF(r);i=d;return}G=u;f=g;e=o|0;t=o+128|0;o=s;s=13288;while(1){c[q>>2]=o;F=(b8[c[s+16>>2]&31](v,n,o,(f-o|0)>32?o+32|0:g,q,e,t,p)|0)==2;h=c[q>>2]|0;if(F|(h|0)==(o|0)){break}if(e>>>0<(c[p>>2]|0)>>>0){F=e;do{gU(b,c[F>>2]|0);F=F+4|0;}while(F>>>0<(c[p>>2]|0)>>>0);I=c[q>>2]|0}else{I=h}if(I>>>0>=g>>>0){J=575;break}o=I;s=c[G>>2]|0}if((J|0)==575){H=u|0;ge(H);gF(r);i=d;return}d=bP(8)|0;gm(d,5608);bl(d|0,18208,26)}function lb(a,b){a=a|0;b=b|0;bz(((b|0)==-1?-1:b<<1)|0)|0;return}function lc(b){b=b|0;var d=0,e=0,f=0;c[b>>2]=12808;d=b+8|0;e=c[d>>2]|0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);if((e|0)==(c[6340]|0)){f=b|0;ge(f);return}a7(c[d>>2]|0);f=b|0;ge(f);return}function ld(a){a=a|0;a=bP(8)|0;gh(a,8688);c[a>>2]=11744;bl(a|0,18224,42)}function le(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+448|0;f=e|0;g=e+16|0;h=e+32|0;j=e+48|0;k=e+64|0;l=e+80|0;m=e+96|0;n=e+112|0;o=e+128|0;p=e+144|0;q=e+160|0;r=e+176|0;s=e+192|0;t=e+208|0;u=e+224|0;v=e+240|0;w=e+256|0;x=e+272|0;y=e+288|0;z=e+304|0;A=e+320|0;B=e+336|0;C=e+352|0;D=e+368|0;E=e+384|0;F=e+400|0;G=e+416|0;H=e+432|0;c[b+4>>2]=d-1;c[b>>2]=13064;d=b+8|0;I=b+12|0;a[b+136|0]=1;J=b+24|0;K=J;c[I>>2]=K;c[d>>2]=K;c[b+16>>2]=J+112;J=28;L=K;do{if((L|0)==0){M=0}else{c[L>>2]=0;M=c[I>>2]|0}L=M+4|0;c[I>>2]=L;J=J-1|0;}while((J|0)!=0);gD(b+144|0,8480,1);J=c[d>>2]|0;d=c[I>>2]|0;if((J|0)!=(d|0)){c[I>>2]=d+(~((d-4+(-J|0)|0)>>>2)<<2)}c[6373]=0;c[6372]=12768;if((c[6620]|0)!=-1){c[H>>2]=26480;c[H+4>>2]=14;c[H+8>>2]=0;gA(26480,H,110)}lf(b,25488,(c[6621]|0)-1|0);c[6371]=0;c[6370]=12728;if((c[6618]|0)!=-1){c[G>>2]=26472;c[G+4>>2]=14;c[G+8>>2]=0;gA(26472,G,110)}lf(b,25480,(c[6619]|0)-1|0);c[6423]=0;c[6422]=13176;c[6424]=0;a[25700]=0;c[6424]=c[(a6()|0)>>2];if((c[6700]|0)!=-1){c[F>>2]=26800;c[F+4>>2]=14;c[F+8>>2]=0;gA(26800,F,110)}lf(b,25688,(c[6701]|0)-1|0);c[6421]=0;c[6420]=13096;if((c[6698]|0)!=-1){c[E>>2]=26792;c[E+4>>2]=14;c[E+8>>2]=0;gA(26792,E,110)}lf(b,25680,(c[6699]|0)-1|0);c[6375]=0;c[6374]=12864;if((c[6624]|0)!=-1){c[D>>2]=26496;c[D+4>>2]=14;c[D+8>>2]=0;gA(26496,D,110)}lf(b,25496,(c[6625]|0)-1|0);c[2825]=0;c[2824]=12808;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);c[2826]=c[6340];if((c[6622]|0)!=-1){c[C>>2]=26488;c[C+4>>2]=14;c[C+8>>2]=0;gA(26488,C,110)}lf(b,11296,(c[6623]|0)-1|0);c[6377]=0;c[6376]=12920;if((c[6626]|0)!=-1){c[B>>2]=26504;c[B+4>>2]=14;c[B+8>>2]=0;gA(26504,B,110)}lf(b,25504,(c[6627]|0)-1|0);c[6379]=0;c[6378]=12976;if((c[6628]|0)!=-1){c[A>>2]=26512;c[A+4>>2]=14;c[A+8>>2]=0;gA(26512,A,110)}lf(b,25512,(c[6629]|0)-1|0);c[6353]=0;c[6352]=12272;a[25416]=46;a[25417]=44;nW(25420,0,12)|0;if((c[6604]|0)!=-1){c[z>>2]=26416;c[z+4>>2]=14;c[z+8>>2]=0;gA(26416,z,110)}lf(b,25408,(c[6605]|0)-1|0);c[2817]=0;c[2816]=12224;c[2818]=46;c[2819]=44;nW(11280,0,12)|0;if((c[6602]|0)!=-1){c[y>>2]=26408;c[y+4>>2]=14;c[y+8>>2]=0;gA(26408,y,110)}lf(b,11264,(c[6603]|0)-1|0);c[6369]=0;c[6368]=12656;if((c[6616]|0)!=-1){c[x>>2]=26464;c[x+4>>2]=14;c[x+8>>2]=0;gA(26464,x,110)}lf(b,25472,(c[6617]|0)-1|0);c[6367]=0;c[6366]=12584;if((c[6614]|0)!=-1){c[w>>2]=26456;c[w+4>>2]=14;c[w+8>>2]=0;gA(26456,w,110)}lf(b,25464,(c[6615]|0)-1|0);c[6365]=0;c[6364]=12520;if((c[6612]|0)!=-1){c[v>>2]=26448;c[v+4>>2]=14;c[v+8>>2]=0;gA(26448,v,110)}lf(b,25456,(c[6613]|0)-1|0);c[6363]=0;c[6362]=12456;if((c[6610]|0)!=-1){c[u>>2]=26440;c[u+4>>2]=14;c[u+8>>2]=0;gA(26440,u,110)}lf(b,25448,(c[6611]|0)-1|0);c[6433]=0;c[6432]=14104;if((c[6820]|0)!=-1){c[t>>2]=27280;c[t+4>>2]=14;c[t+8>>2]=0;gA(27280,t,110)}lf(b,25728,(c[6821]|0)-1|0);c[6431]=0;c[6430]=14040;if((c[6818]|0)!=-1){c[s>>2]=27272;c[s+4>>2]=14;c[s+8>>2]=0;gA(27272,s,110)}lf(b,25720,(c[6819]|0)-1|0);c[6429]=0;c[6428]=13976;if((c[6816]|0)!=-1){c[r>>2]=27264;c[r+4>>2]=14;c[r+8>>2]=0;gA(27264,r,110)}lf(b,25712,(c[6817]|0)-1|0);c[6427]=0;c[6426]=13912;if((c[6814]|0)!=-1){c[q>>2]=27256;c[q+4>>2]=14;c[q+8>>2]=0;gA(27256,q,110)}lf(b,25704,(c[6815]|0)-1|0);c[6351]=0;c[6350]=11928;if((c[6592]|0)!=-1){c[p>>2]=26368;c[p+4>>2]=14;c[p+8>>2]=0;gA(26368,p,110)}lf(b,25400,(c[6593]|0)-1|0);c[6349]=0;c[6348]=11888;if((c[6590]|0)!=-1){c[o>>2]=26360;c[o+4>>2]=14;c[o+8>>2]=0;gA(26360,o,110)}lf(b,25392,(c[6591]|0)-1|0);c[6347]=0;c[6346]=11848;if((c[6588]|0)!=-1){c[n>>2]=26352;c[n+4>>2]=14;c[n+8>>2]=0;gA(26352,n,110)}lf(b,25384,(c[6589]|0)-1|0);c[6345]=0;c[6344]=11808;if((c[6586]|0)!=-1){c[m>>2]=26344;c[m+4>>2]=14;c[m+8>>2]=0;gA(26344,m,110)}lf(b,25376,(c[6587]|0)-1|0);c[2813]=0;c[2812]=12128;c[2814]=12176;if((c[6600]|0)!=-1){c[l>>2]=26400;c[l+4>>2]=14;c[l+8>>2]=0;gA(26400,l,110)}lf(b,11248,(c[6601]|0)-1|0);c[2809]=0;c[2808]=12032;c[2810]=12080;if((c[6598]|0)!=-1){c[k>>2]=26392;c[k+4>>2]=14;c[k+8>>2]=0;gA(26392,k,110)}lf(b,11232,(c[6599]|0)-1|0);c[2805]=0;c[2804]=13032;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);c[2806]=c[6340];c[2804]=12e3;if((c[6596]|0)!=-1){c[j>>2]=26384;c[j+4>>2]=14;c[j+8>>2]=0;gA(26384,j,110)}lf(b,11216,(c[6597]|0)-1|0);c[2801]=0;c[2800]=13032;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);c[2802]=c[6340];c[2800]=11968;if((c[6594]|0)!=-1){c[h>>2]=26376;c[h+4>>2]=14;c[h+8>>2]=0;gA(26376,h,110)}lf(b,11200,(c[6595]|0)-1|0);c[6361]=0;c[6360]=12360;if((c[6608]|0)!=-1){c[g>>2]=26432;c[g+4>>2]=14;c[g+8>>2]=0;gA(26432,g,110)}lf(b,25440,(c[6609]|0)-1|0);c[6359]=0;c[6358]=12320;if((c[6606]|0)!=-1){c[f>>2]=26424;c[f+4>>2]=14;c[f+8>>2]=0;gA(26424,f,110)}lf(b,25432,(c[6607]|0)-1|0);i=e;return}function lf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;gf(b|0);e=a+8|0;f=a+12|0;a=c[f>>2]|0;g=e|0;h=c[g>>2]|0;i=a-h>>2;do{if(i>>>0>d>>>0){j=h}else{k=d+1|0;if(i>>>0<k>>>0){m$(e,k-i|0);j=c[g>>2]|0;break}if(i>>>0<=k>>>0){j=h;break}l=h+(k<<2)|0;if((l|0)==(a|0)){j=h;break}c[f>>2]=a+(~((a-4+(-l|0)|0)>>>2)<<2);j=h}}while(0);h=c[j+(d<<2)>>2]|0;if((h|0)==0){m=j;n=m+(d<<2)|0;c[n>>2]=b;return}gg(h|0)|0;m=c[g>>2]|0;n=m+(d<<2)|0;c[n>>2]=b;return}function lg(a){a=a|0;lh(a);nM(a);return}function lh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;c[b>>2]=13064;d=b+12|0;e=c[d>>2]|0;f=b+8|0;g=c[f>>2]|0;if((e|0)!=(g|0)){h=0;i=g;g=e;while(1){e=c[i+(h<<2)>>2]|0;if((e|0)==0){j=g;k=i}else{l=e|0;gg(l)|0;j=c[d>>2]|0;k=c[f>>2]|0}l=h+1|0;if(l>>>0<j-k>>2>>>0){h=l;i=k;g=j}else{break}}}gF(b+144|0);j=c[f>>2]|0;if((j|0)==0){m=b|0;ge(m);return}f=c[d>>2]|0;if((j|0)!=(f|0)){c[d>>2]=f+(~((f-4+(-j|0)|0)>>>2)<<2)}if((j|0)==(b+24|0)){a[b+136|0]=0;m=b|0;ge(m);return}else{nM(j);m=b|0;ge(m);return}}function li(){var b=0,d=0;if((a[27432]|0)!=0){b=c[6332]|0;return b|0}if((bc(27432)|0)==0){b=c[6332]|0;return b|0}do{if((a[27440]|0)==0){if((bc(27440)|0)==0){break}le(25520,1);c[6336]=25520;c[6334]=25344}}while(0);d=c[c[6334]>>2]|0;c[6338]=d;gf(d|0);c[6332]=25352;b=c[6332]|0;return b|0}function lj(a){a=a|0;var b=0;b=c[(li()|0)>>2]|0;c[a>>2]=b;gf(b|0);return}function lk(a,b){a=a|0;b=b|0;var d=0;d=c[b>>2]|0;c[a>>2]=d;gf(d|0);return}function ll(a){a=a|0;gg(c[a>>2]|0)|0;return}function lm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=c[a>>2]|0;a=b|0;if((c[a>>2]|0)!=-1){c[e>>2]=b;c[e+4>>2]=14;c[e+8>>2]=0;gA(a,e,110)}e=(c[b+4>>2]|0)-1|0;b=c[f+8>>2]|0;if((c[f+12>>2]|0)-b>>2>>>0<=e>>>0){g=bP(4)|0;h=g;nj(h);bl(g|0,18192,158);return 0}f=c[b+(e<<2)>>2]|0;if((f|0)==0){g=bP(4)|0;h=g;nj(h);bl(g|0,18192,158);return 0}else{i=d;return f|0}return 0}function ln(a){a=a|0;ge(a|0);nM(a);return}function lo(a){a=a|0;if((a|0)==0){return}b$[c[(c[a>>2]|0)+4>>2]&511](a);return}function lp(a){a=a|0;c[a+4>>2]=(I=c[6630]|0,c[6630]=I+1,I)+1;return}function lq(a){a=a|0;ge(a|0);nM(a);return}function lr(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128>>>0){f=0;return f|0}f=(b[(c[(a6()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function ls(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128>>>0){j=b[(c[(a6()|0)>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function lt(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128>>>0){if((b[(c[(a6()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=797;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=798;break}else{h=e}}if((i|0)==797){return g|0}else if((i|0)==798){return g|0}return 0}function lu(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a=e;while(1){if((a|0)==(f|0)){g=f;h=807;break}e=c[a>>2]|0;if(e>>>0>=128>>>0){g=a;h=809;break}if((b[(c[(a6()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16==0){g=a;h=808;break}else{a=a+4|0}}if((h|0)==807){return g|0}else if((h|0)==808){return g|0}else if((h|0)==809){return g|0}return 0}function lv(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(bT()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function lw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(bT()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function lx(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(bU()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function ly(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(bU()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function lz(a,b){a=a|0;b=b|0;return b<<24>>24|0}function lA(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function lB(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function lC(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=((e-4+(-d|0)|0)>>>2)+1|0;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128>>>0?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b<<2)|0;return h|0}function lD(b){b=b|0;var d=0;c[b>>2]=13176;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}nN(d)}}while(0);ge(b|0);nM(b);return}function lE(b){b=b|0;var d=0;c[b>>2]=13176;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}nN(d)}}while(0);ge(b|0);return}function lF(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(bT()|0)>>2]|0)+((b&255)<<2)>>2]&255;return d|0}function lG(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(bT()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function lH(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(bU()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return d|0}function lI(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(bU()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function lJ(a,b){a=a|0;b=b|0;return b|0}function lK(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function lL(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24<0?c:b)|0}function lM(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24<0?e:f;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function lN(a){a=a|0;ge(a|0);nM(a);return}function lO(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function lP(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function lQ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function lR(a){a=a|0;return 1}function lS(a){a=a|0;return 1}function lT(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function lU(a){a=a|0;return 1}function lV(a){a=a|0;lc(a);nM(a);return}function lW(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+8|0;m=l|0;n=m;o=i;i=i+4|0;i=i+7&-8;p=e;while(1){if((p|0)==(f|0)){q=f;break}if((c[p>>2]|0)==0){q=p;break}else{p=p+4|0}}c[k>>2]=h;c[g>>2]=e;L1047:do{if((e|0)==(f|0)|(h|0)==(j|0)){r=e}else{p=d;s=j;t=b+8|0;u=o|0;v=h;w=e;x=q;while(1){y=c[p+4>>2]|0;c[m>>2]=c[p>>2];c[m+4>>2]=y;y=bD(c[t>>2]|0)|0;z=nc(v,g,x-w>>2,s-v|0,d)|0;if((y|0)!=0){bD(y|0)|0}if((z|0)==(-1|0)){A=931;break}else if((z|0)==0){B=1;A=967;break}y=(c[k>>2]|0)+z|0;c[k>>2]=y;if((y|0)==(j|0)){A=964;break}if((x|0)==(f|0)){C=f;D=y;E=c[g>>2]|0}else{y=bD(c[t>>2]|0)|0;z=nb(u,0,d)|0;if((y|0)!=0){bD(y|0)|0}if((z|0)==-1){B=2;A=970;break}y=c[k>>2]|0;if(z>>>0>(s-y|0)>>>0){B=1;A=971;break}L1066:do{if((z|0)!=0){F=z;G=u;H=y;while(1){I=a[G]|0;c[k>>2]=H+1;a[H]=I;I=F-1|0;if((I|0)==0){break L1066}F=I;G=G+1|0;H=c[k>>2]|0}}}while(0);y=(c[g>>2]|0)+4|0;c[g>>2]=y;z=y;while(1){if((z|0)==(f|0)){J=f;break}if((c[z>>2]|0)==0){J=z;break}else{z=z+4|0}}C=J;D=c[k>>2]|0;E=y}if((E|0)==(f|0)|(D|0)==(j|0)){r=E;break L1047}else{v=D;w=E;x=C}}if((A|0)==931){c[k>>2]=v;L1078:do{if((w|0)==(c[g>>2]|0)){K=w}else{x=w;u=v;while(1){s=c[x>>2]|0;p=bD(c[t>>2]|0)|0;z=nb(u,s,n)|0;if((p|0)!=0){bD(p|0)|0}if((z|0)==-1){K=x;break L1078}p=(c[k>>2]|0)+z|0;c[k>>2]=p;z=x+4|0;if((z|0)==(c[g>>2]|0)){K=z;break}else{x=z;u=p}}}}while(0);c[g>>2]=K;B=2;i=l;return B|0}else if((A|0)==967){i=l;return B|0}else if((A|0)==970){i=l;return B|0}else if((A|0)==971){i=l;return B|0}else if((A|0)==964){r=c[g>>2]|0;break}}}while(0);B=(r|0)!=(f|0)|0;i=l;return B|0}function lX(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;l=i;i=i+8|0;m=l|0;n=m;o=e;while(1){if((o|0)==(f|0)){p=f;break}if((a[o]|0)==0){p=o;break}else{o=o+1|0}}c[k>>2]=h;c[g>>2]=e;L1099:do{if((e|0)==(f|0)|(h|0)==(j|0)){q=e}else{o=d;r=j;s=b+8|0;t=h;u=e;v=p;while(1){w=c[o+4>>2]|0;c[m>>2]=c[o>>2];c[m+4>>2]=w;x=v;w=bD(c[s>>2]|0)|0;y=m8(t,g,x-u|0,r-t>>2,d)|0;if((w|0)!=0){bD(w|0)|0}if((y|0)==(-1|0)){z=986;break}else if((y|0)==0){A=2;z=1021;break}w=(c[k>>2]|0)+(y<<2)|0;c[k>>2]=w;if((w|0)==(j|0)){z=1018;break}y=c[g>>2]|0;if((v|0)==(f|0)){B=f;C=w;D=y}else{E=bD(c[s>>2]|0)|0;F=m7(w,y,1,d)|0;if((E|0)!=0){bD(E|0)|0}if((F|0)!=0){A=2;z=1025;break}c[k>>2]=(c[k>>2]|0)+4;F=(c[g>>2]|0)+1|0;c[g>>2]=F;E=F;while(1){if((E|0)==(f|0)){G=f;break}if((a[E]|0)==0){G=E;break}else{E=E+1|0}}B=G;C=c[k>>2]|0;D=F}if((D|0)==(f|0)|(C|0)==(j|0)){q=D;break L1099}else{t=C;u=D;v=B}}if((z|0)==986){c[k>>2]=t;L1123:do{if((u|0)==(c[g>>2]|0)){H=u}else{v=t;r=u;while(1){o=bD(c[s>>2]|0)|0;E=m7(v,r,x-r|0,n)|0;if((o|0)!=0){bD(o|0)|0}if((E|0)==0){I=r+1|0}else if((E|0)==(-1|0)){z=997;break}else if((E|0)==(-2|0)){z=998;break}else{I=r+E|0}E=(c[k>>2]|0)+4|0;c[k>>2]=E;if((I|0)==(c[g>>2]|0)){H=I;break L1123}else{v=E;r=I}}if((z|0)==997){c[g>>2]=r;A=2;i=l;return A|0}else if((z|0)==998){c[g>>2]=r;A=1;i=l;return A|0}}}while(0);c[g>>2]=H;A=(H|0)!=(f|0)|0;i=l;return A|0}else if((z|0)==1018){q=c[g>>2]|0;break}else if((z|0)==1025){i=l;return A|0}else if((z|0)==1021){i=l;return A|0}}}while(0);A=(q|0)!=(f|0)|0;i=l;return A|0}function lY(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+8|0;c[g>>2]=e;e=h|0;j=bD(c[b+8>>2]|0)|0;b=nb(e,0,d)|0;if((j|0)!=0){bD(j|0)|0}if((b|0)==(-1|0)|(b|0)==0){k=2;i=h;return k|0}j=b-1|0;b=c[g>>2]|0;if(j>>>0>(f-b|0)>>>0){k=1;i=h;return k|0}if((j|0)==0){k=0;i=h;return k|0}else{l=j;m=e;n=b}while(1){b=a[m]|0;c[g>>2]=n+1;a[n]=b;b=l-1|0;if((b|0)==0){k=0;break}l=b;m=m+1|0;n=c[g>>2]|0}i=h;return k|0}function lZ(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;a=bD(c[b>>2]|0)|0;d=na(0,0,4)|0;if((a|0)!=0){bD(a|0)|0}if((d|0)!=0){e=-1;return e|0}d=c[b>>2]|0;if((d|0)==0){e=1;return e|0}b=bD(d|0)|0;if((b|0)==0){e=0;return e|0}bD(b|0)|0;e=0;return e|0}function l_(a){a=a|0;return 0}function l$(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=d;d=0;j=0;while(1){k=bD(c[i>>2]|0)|0;l=m6(a,h-a|0,b)|0;if((k|0)!=0){bD(k|0)|0}if((l|0)==0){m=1;n=a+1|0}else if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;o=1084;break}else{m=l;n=a+l|0}l=m+d|0;k=j+1|0;if(k>>>0>=f>>>0|(n|0)==(e|0)){g=l;o=1083;break}else{a=n;d=l;j=k}}if((o|0)==1084){return g|0}else if((o|0)==1083){return g|0}return 0}function l0(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=bD(b|0)|0;if((a|0)==0){d=4;break}bD(a|0)|0;d=4}}while(0);return d|0}function l1(a){a=a|0;ge(a|0);nM(a);return}function l2(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=l3(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function l3(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0;c[g>>2]=d;c[j>>2]=h;do{if((l&2|0)!=0){if((i-h|0)<3){m=1;return m|0}else{c[j>>2]=h+1;a[h]=-17;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-69;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-65;break}}}while(0);h=f;l=c[g>>2]|0;if(l>>>0>=f>>>0){m=0;return m|0}d=i;i=l;L1216:while(1){l=b[i>>1]|0;n=l&65535;if(n>>>0>k>>>0){m=2;o=1120;break}do{if((l&65535)>>>0<128>>>0){p=c[j>>2]|0;if((d-p|0)<1){m=1;o=1125;break L1216}c[j>>2]=p+1;a[p]=l&255}else{if((l&65535)>>>0<2048>>>0){p=c[j>>2]|0;if((d-p|0)<2){m=1;o=1123;break L1216}c[j>>2]=p+1;a[p]=(n>>>6|192)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0<55296>>>0){p=c[j>>2]|0;if((d-p|0)<3){m=1;o=1126;break L1216}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0>=56320>>>0){if((l&65535)>>>0<57344>>>0){m=2;o=1122;break L1216}p=c[j>>2]|0;if((d-p|0)<3){m=1;o=1131;break L1216}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((h-i|0)<4){m=1;o=1127;break L1216}p=i+2|0;q=e[p>>1]|0;if((q&64512|0)!=56320){m=2;o=1128;break L1216}if((d-(c[j>>2]|0)|0)<4){m=1;o=1129;break L1216}r=n&960;if(((r<<10)+65536|n<<10&64512|q&1023)>>>0>k>>>0){m=2;o=1121;break L1216}c[g>>2]=p;p=(r>>>6)+1|0;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(p>>>2|240)&255;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(n>>>2&15|p<<4&48|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n<<4&48|q>>>6&15|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(q&63|128)&255}}while(0);n=(c[g>>2]|0)+2|0;c[g>>2]=n;if(n>>>0<f>>>0){i=n}else{m=0;o=1132;break}}if((o|0)==1120){return m|0}else if((o|0)==1121){return m|0}else if((o|0)==1122){return m|0}else if((o|0)==1123){return m|0}else if((o|0)==1125){return m|0}else if((o|0)==1126){return m|0}else if((o|0)==1127){return m|0}else if((o|0)==1128){return m|0}else if((o|0)==1129){return m|0}else if((o|0)==1131){return m|0}else if((o|0)==1132){return m|0}return 0}function l4(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=l5(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=b;return l|0}function l5(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;c[g>>2]=e;c[j>>2]=h;h=c[g>>2]|0;do{if((l&4|0)==0){m=h}else{if((f-h|0)<=2){m=h;break}if((a[h]|0)!=-17){m=h;break}if((a[h+1|0]|0)!=-69){m=h;break}if((a[h+2|0]|0)!=-65){m=h;break}e=h+3|0;c[g>>2]=e;m=e}}while(0);L1262:do{if(m>>>0<f>>>0){h=f;l=i;e=c[j>>2]|0;n=m;L1264:while(1){if(e>>>0>=i>>>0){o=n;break L1262}p=a[n]|0;q=p&255;if(q>>>0>k>>>0){r=2;s=1195;break}do{if(p<<24>>24>-1){b[e>>1]=p&255;c[g>>2]=(c[g>>2]|0)+1}else{if((p&255)>>>0<194>>>0){r=2;s=1175;break L1264}if((p&255)>>>0<224>>>0){if((h-n|0)<2){r=1;s=1176;break L1264}t=d[n+1|0]|0;if((t&192|0)!=128){r=2;s=1177;break L1264}u=t&63|q<<6&1984;if(u>>>0>k>>>0){r=2;s=1178;break L1264}b[e>>1]=u&65535;c[g>>2]=(c[g>>2]|0)+2;break}if((p&255)>>>0<240>>>0){if((h-n|0)<3){r=1;s=1179;break L1264}u=a[n+1|0]|0;t=a[n+2|0]|0;if((q|0)==224){if((u&-32)<<24>>24!=-96){r=2;s=1180;break L1264}}else if((q|0)==237){if((u&-32)<<24>>24!=-128){r=2;s=1181;break L1264}}else{if((u&-64)<<24>>24!=-128){r=2;s=1182;break L1264}}v=t&255;if((v&192|0)!=128){r=2;s=1183;break L1264}t=(u&255)<<6&4032|q<<12|v&63;if((t&65535)>>>0>k>>>0){r=2;s=1184;break L1264}b[e>>1]=t&65535;c[g>>2]=(c[g>>2]|0)+3;break}if((p&255)>>>0>=245>>>0){r=2;s=1185;break L1264}if((h-n|0)<4){r=1;s=1186;break L1264}t=a[n+1|0]|0;v=a[n+2|0]|0;u=a[n+3|0]|0;if((q|0)==240){if((t+112&255)>>>0>=48>>>0){r=2;s=1187;break L1264}}else if((q|0)==244){if((t&-16)<<24>>24!=-128){r=2;s=1188;break L1264}}else{if((t&-64)<<24>>24!=-128){r=2;s=1189;break L1264}}w=v&255;if((w&192|0)!=128){r=2;s=1190;break L1264}v=u&255;if((v&192|0)!=128){r=2;s=1191;break L1264}if((l-e|0)<4){r=1;s=1192;break L1264}u=q&7;x=t&255;t=w<<6;y=v&63;if((x<<12&258048|u<<18|t&4032|y)>>>0>k>>>0){r=2;s=1193;break L1264}b[e>>1]=(x<<2&60|w>>>4&3|((x>>>4&3|u<<2)<<6)+16320|55296)&65535;u=(c[j>>2]|0)+2|0;c[j>>2]=u;b[u>>1]=(y|t&960|56320)&65535;c[g>>2]=(c[g>>2]|0)+4}}while(0);q=(c[j>>2]|0)+2|0;c[j>>2]=q;p=c[g>>2]|0;if(p>>>0<f>>>0){e=q;n=p}else{o=p;break L1262}}if((s|0)==1175){return r|0}else if((s|0)==1176){return r|0}else if((s|0)==1177){return r|0}else if((s|0)==1178){return r|0}else if((s|0)==1179){return r|0}else if((s|0)==1180){return r|0}else if((s|0)==1181){return r|0}else if((s|0)==1182){return r|0}else if((s|0)==1183){return r|0}else if((s|0)==1184){return r|0}else if((s|0)==1185){return r|0}else if((s|0)==1186){return r|0}else if((s|0)==1187){return r|0}else if((s|0)==1188){return r|0}else if((s|0)==1189){return r|0}else if((s|0)==1190){return r|0}else if((s|0)==1191){return r|0}else if((s|0)==1192){return r|0}else if((s|0)==1193){return r|0}else if((s|0)==1195){return r|0}}else{o=m}}while(0);r=o>>>0<f>>>0|0;return r|0}function l6(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function l7(a){a=a|0;return 0}function l8(a){a=a|0;return 0}function l9(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ma(c,d,e,1114111,0)|0}function ma(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L1335:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=0;j=h;L1337:while(1){k=a[j]|0;l=k&255;if(l>>>0>f>>>0){m=j;break L1335}do{if(k<<24>>24>-1){n=j+1|0;o=i}else{if((k&255)>>>0<194>>>0){m=j;break L1335}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L1335}p=d[j+1|0]|0;if((p&192|0)!=128){m=j;break L1335}if((p&63|l<<6&1984)>>>0>f>>>0){m=j;break L1335}n=j+2|0;o=i;break}if((k&255)>>>0<240>>>0){q=j;if((g-q|0)<3){m=j;break L1335}p=a[j+1|0]|0;r=a[j+2|0]|0;if((l|0)==224){if((p&-32)<<24>>24!=-96){s=1220;break L1337}}else if((l|0)==237){if((p&-32)<<24>>24!=-128){s=1222;break L1337}}else{if((p&-64)<<24>>24!=-128){s=1224;break L1337}}t=r&255;if((t&192|0)!=128){m=j;break L1335}if(((p&255)<<6&4032|l<<12&61440|t&63)>>>0>f>>>0){m=j;break L1335}n=j+3|0;o=i;break}if((k&255)>>>0>=245>>>0){m=j;break L1335}u=j;if((g-u|0)<4){m=j;break L1335}if((e-i|0)>>>0<2>>>0){m=j;break L1335}t=a[j+1|0]|0;p=a[j+2|0]|0;r=a[j+3|0]|0;if((l|0)==240){if((t+112&255)>>>0>=48>>>0){s=1233;break L1337}}else if((l|0)==244){if((t&-16)<<24>>24!=-128){s=1235;break L1337}}else{if((t&-64)<<24>>24!=-128){s=1237;break L1337}}v=p&255;if((v&192|0)!=128){m=j;break L1335}p=r&255;if((p&192|0)!=128){m=j;break L1335}if(((t&255)<<12&258048|l<<18&1835008|v<<6&4032|p&63)>>>0>f>>>0){m=j;break L1335}n=j+4|0;o=i+1|0}}while(0);l=o+1|0;if(n>>>0<c>>>0&l>>>0<e>>>0){i=l;j=n}else{m=n;break L1335}}if((s|0)==1220){w=q-b|0;return w|0}else if((s|0)==1222){w=q-b|0;return w|0}else if((s|0)==1224){w=q-b|0;return w|0}else if((s|0)==1233){w=u-b|0;return w|0}else if((s|0)==1235){w=u-b|0;return w|0}else if((s|0)==1237){w=u-b|0;return w|0}}else{m=h}}while(0);w=m-b|0;return w|0}function mb(a){a=a|0;return 4}function mc(a){a=a|0;ge(a|0);nM(a);return}function md(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=me(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function me(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0;c[e>>2]=b;c[h>>2]=f;do{if((j&2|0)!=0){if((g-f|0)<3){k=1;return k|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);f=c[e>>2]|0;if(f>>>0>=d>>>0){k=0;return k|0}j=g;g=f;L1401:while(1){f=c[g>>2]|0;if((f&-2048|0)==55296|f>>>0>i>>>0){k=2;l=1274;break}do{if(f>>>0<128>>>0){b=c[h>>2]|0;if((j-b|0)<1){k=1;l=1277;break L1401}c[h>>2]=b+1;a[b]=f&255}else{if(f>>>0<2048>>>0){b=c[h>>2]|0;if((j-b|0)<2){k=1;l=1281;break L1401}c[h>>2]=b+1;a[b]=(f>>>6|192)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}b=c[h>>2]|0;m=j-b|0;if(f>>>0<65536>>>0){if((m|0)<3){k=1;l=1280;break L1401}c[h>>2]=b+1;a[b]=(f>>>12|224)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f>>>6&63|128)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f&63|128)&255;break}else{if((m|0)<4){k=1;l=1275;break L1401}c[h>>2]=b+1;a[b]=(f>>>18|240)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>12&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>6&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}}}while(0);f=(c[e>>2]|0)+4|0;c[e>>2]=f;if(f>>>0<d>>>0){g=f}else{k=0;l=1279;break}}if((l|0)==1275){return k|0}else if((l|0)==1280){return k|0}else if((l|0)==1281){return k|0}else if((l|0)==1279){return k|0}else if((l|0)==1274){return k|0}else if((l|0)==1277){return k|0}return 0}function mf(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=mg(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=b;return l|0}function mg(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;c[f>>2]=b;c[i>>2]=g;g=c[f>>2]|0;do{if((k&4|0)==0){l=g}else{if((e-g|0)<=2){l=g;break}if((a[g]|0)!=-17){l=g;break}if((a[g+1|0]|0)!=-69){l=g;break}if((a[g+2|0]|0)!=-65){l=g;break}b=g+3|0;c[f>>2]=b;l=b}}while(0);L1434:do{if(l>>>0<e>>>0){g=e;k=c[i>>2]|0;b=l;L1436:while(1){if(k>>>0>=h>>>0){m=b;break L1434}n=a[b]|0;o=n&255;do{if(n<<24>>24>-1){if(o>>>0>j>>>0){p=2;q=1325;break L1436}c[k>>2]=o;c[f>>2]=(c[f>>2]|0)+1}else{if((n&255)>>>0<194>>>0){p=2;q=1326;break L1436}if((n&255)>>>0<224>>>0){if((g-b|0)<2){p=1;q=1327;break L1436}r=d[b+1|0]|0;if((r&192|0)!=128){p=2;q=1328;break L1436}s=r&63|o<<6&1984;if(s>>>0>j>>>0){p=2;q=1329;break L1436}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+2;break}if((n&255)>>>0<240>>>0){if((g-b|0)<3){p=1;q=1330;break L1436}s=a[b+1|0]|0;r=a[b+2|0]|0;if((o|0)==224){if((s&-32)<<24>>24!=-96){p=2;q=1331;break L1436}}else if((o|0)==237){if((s&-32)<<24>>24!=-128){p=2;q=1332;break L1436}}else{if((s&-64)<<24>>24!=-128){p=2;q=1333;break L1436}}t=r&255;if((t&192|0)!=128){p=2;q=1334;break L1436}r=(s&255)<<6&4032|o<<12&61440|t&63;if(r>>>0>j>>>0){p=2;q=1342;break L1436}c[k>>2]=r;c[f>>2]=(c[f>>2]|0)+3;break}if((n&255)>>>0>=245>>>0){p=2;q=1337;break L1436}if((g-b|0)<4){p=1;q=1336;break L1436}r=a[b+1|0]|0;t=a[b+2|0]|0;s=a[b+3|0]|0;if((o|0)==244){if((r&-16)<<24>>24!=-128){p=2;q=1324;break L1436}}else if((o|0)==240){if((r+112&255)>>>0>=48>>>0){p=2;q=1341;break L1436}}else{if((r&-64)<<24>>24!=-128){p=2;q=1340;break L1436}}u=t&255;if((u&192|0)!=128){p=2;q=1338;break L1436}t=s&255;if((t&192|0)!=128){p=2;q=1339;break L1436}s=(r&255)<<12&258048|o<<18&1835008|u<<6&4032|t&63;if(s>>>0>j>>>0){p=2;q=1335;break L1436}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+4}}while(0);o=(c[i>>2]|0)+4|0;c[i>>2]=o;n=c[f>>2]|0;if(n>>>0<e>>>0){k=o;b=n}else{m=n;break L1434}}if((q|0)==1340){return p|0}else if((q|0)==1341){return p|0}else if((q|0)==1342){return p|0}else if((q|0)==1324){return p|0}else if((q|0)==1325){return p|0}else if((q|0)==1326){return p|0}else if((q|0)==1327){return p|0}else if((q|0)==1328){return p|0}else if((q|0)==1329){return p|0}else if((q|0)==1330){return p|0}else if((q|0)==1331){return p|0}else if((q|0)==1332){return p|0}else if((q|0)==1333){return p|0}else if((q|0)==1334){return p|0}else if((q|0)==1335){return p|0}else if((q|0)==1336){return p|0}else if((q|0)==1337){return p|0}else if((q|0)==1338){return p|0}else if((q|0)==1339){return p|0}}else{m=l}}while(0);p=m>>>0<e>>>0|0;return p|0}function mh(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function mi(a){a=a|0;return 0}function mj(a){a=a|0;return 0}function mk(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ml(c,d,e,1114111,0)|0}function ml(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L1505:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=1;j=h;L1507:while(1){k=a[j]|0;l=k&255;do{if(k<<24>>24>-1){if(l>>>0>f>>>0){m=j;break L1505}n=j+1|0}else{if((k&255)>>>0<194>>>0){m=j;break L1505}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L1505}o=d[j+1|0]|0;if((o&192|0)!=128){m=j;break L1505}if((o&63|l<<6&1984)>>>0>f>>>0){m=j;break L1505}n=j+2|0;break}if((k&255)>>>0<240>>>0){p=j;if((g-p|0)<3){m=j;break L1505}o=a[j+1|0]|0;q=a[j+2|0]|0;if((l|0)==224){if((o&-32)<<24>>24!=-96){r=1367;break L1507}}else if((l|0)==237){if((o&-32)<<24>>24!=-128){r=1369;break L1507}}else{if((o&-64)<<24>>24!=-128){r=1371;break L1507}}s=q&255;if((s&192|0)!=128){m=j;break L1505}if(((o&255)<<6&4032|l<<12&61440|s&63)>>>0>f>>>0){m=j;break L1505}n=j+3|0;break}if((k&255)>>>0>=245>>>0){m=j;break L1505}t=j;if((g-t|0)<4){m=j;break L1505}s=a[j+1|0]|0;o=a[j+2|0]|0;q=a[j+3|0]|0;if((l|0)==240){if((s+112&255)>>>0>=48>>>0){r=1379;break L1507}}else if((l|0)==244){if((s&-16)<<24>>24!=-128){r=1381;break L1507}}else{if((s&-64)<<24>>24!=-128){r=1383;break L1507}}u=o&255;if((u&192|0)!=128){m=j;break L1505}o=q&255;if((o&192|0)!=128){m=j;break L1505}if(((s&255)<<12&258048|l<<18&1835008|u<<6&4032|o&63)>>>0>f>>>0){m=j;break L1505}n=j+4|0}}while(0);if(!(n>>>0<c>>>0&i>>>0<e>>>0)){m=n;break L1505}i=i+1|0;j=n}if((r|0)==1367){v=p-b|0;return v|0}else if((r|0)==1369){v=p-b|0;return v|0}else if((r|0)==1371){v=p-b|0;return v|0}else if((r|0)==1379){v=t-b|0;return v|0}else if((r|0)==1381){v=t-b|0;return v|0}else if((r|0)==1383){v=t-b|0;return v|0}}else{m=h}}while(0);v=m-b|0;return v|0}function mm(a){a=a|0;return 4}function mn(a){a=a|0;ge(a|0);nM(a);return}function mo(a){a=a|0;ge(a|0);nM(a);return}function mp(a){a=a|0;c[a>>2]=12272;gF(a+12|0);ge(a|0);nM(a);return}function mq(a){a=a|0;c[a>>2]=12272;gF(a+12|0);ge(a|0);return}function mr(a){a=a|0;c[a>>2]=12224;gF(a+16|0);ge(a|0);nM(a);return}function ms(a){a=a|0;c[a>>2]=12224;gF(a+16|0);ge(a|0);return}function mt(b){b=b|0;return a[b+8|0]|0}function mu(a){a=a|0;return c[a+8>>2]|0}function mv(b){b=b|0;return a[b+9|0]|0}function mw(a){a=a|0;return c[a+12>>2]|0}function mx(a,b){a=a|0;b=b|0;gC(a,b+12|0);return}function my(a,b){a=a|0;b=b|0;gC(a,b+16|0);return}function mz(a,b){a=a|0;b=b|0;gD(a,7800,4);return}function mA(a,b){a=a|0;b=b|0;gO(a,7712,ne(7712)|0);return}function mB(a,b){a=a|0;b=b|0;gD(a,7656,5);return}function mC(a,b){a=a|0;b=b|0;gO(a,7552,ne(7552)|0);return}function mD(b){b=b|0;var d=0;if((a[27528]|0)!=0){d=c[6458]|0;return d|0}if((bc(27528)|0)==0){d=c[6458]|0;return d|0}do{if((a[27416]|0)==0){if((bc(27416)|0)==0){break}nW(24872,0,168)|0;a$(316,0,u|0)|0}}while(0);gG(24872,10200)|0;gG(24884,10168)|0;gG(24896,10136)|0;gG(24908,10120)|0;gG(24920,10088)|0;gG(24932,10080)|0;gG(24944,10064)|0;gG(24956,10056)|0;gG(24968,10048)|0;gG(24980,10016)|0;gG(24992,10008)|0;gG(25004,1e4)|0;gG(25016,9952)|0;gG(25028,9944)|0;c[6458]=24872;d=c[6458]|0;return d|0}function mE(b){b=b|0;var d=0;if((a[27472]|0)!=0){d=c[6436]|0;return d|0}if((bc(27472)|0)==0){d=c[6436]|0;return d|0}do{if((a[27392]|0)==0){if((bc(27392)|0)==0){break}nW(24128,0,168)|0;a$(106,0,u|0)|0}}while(0);gR(24128,10888)|0;gR(24140,10856)|0;gR(24152,10824)|0;gR(24164,10784)|0;gR(24176,10720)|0;gR(24188,10688)|0;gR(24200,10536)|0;gR(24212,10520)|0;gR(24224,10464)|0;gR(24236,10408)|0;gR(24248,10392)|0;gR(24260,10376)|0;gR(24272,10280)|0;gR(24284,10264)|0;c[6436]=24128;d=c[6436]|0;return d|0}function mF(b){b=b|0;var d=0;if((a[27520]|0)!=0){d=c[6456]|0;return d|0}if((bc(27520)|0)==0){d=c[6456]|0;return d|0}do{if((a[27408]|0)==0){if((bc(27408)|0)==0){break}nW(24584,0,288)|0;a$(200,0,u|0)|0}}while(0);gG(24584,760)|0;gG(24596,736)|0;gG(24608,632)|0;gG(24620,616)|0;gG(24632,608)|0;gG(24644,600)|0;gG(24656,592)|0;gG(24668,584)|0;gG(24680,520)|0;gG(24692,512)|0;gG(24704,344)|0;gG(24716,312)|0;gG(24728,248)|0;gG(24740,200)|0;gG(24752,144)|0;gG(24764,96)|0;gG(24776,608)|0;gG(24788,88)|0;gG(24800,80)|0;gG(24812,11120)|0;gG(24824,11096)|0;gG(24836,10960)|0;gG(24848,10944)|0;gG(24860,10936)|0;c[6456]=24584;d=c[6456]|0;return d|0}function mG(b){b=b|0;var d=0;if((a[27464]|0)!=0){d=c[6434]|0;return d|0}if((bc(27464)|0)==0){d=c[6434]|0;return d|0}do{if((a[27384]|0)==0){if((bc(27384)|0)==0){break}nW(23840,0,288)|0;a$(146,0,u|0)|0}}while(0);gR(23840,3336)|0;gR(23852,3232)|0;gR(23864,3160)|0;gR(23876,2984)|0;gR(23888,1248)|0;gR(23900,2648)|0;gR(23912,2560)|0;gR(23924,2368)|0;gR(23936,2208)|0;gR(23948,2112)|0;gR(23960,2008)|0;gR(23972,1888)|0;gR(23984,1824)|0;gR(23996,1672)|0;gR(24008,1576)|0;gR(24020,1328)|0;gR(24032,1248)|0;gR(24044,1112)|0;gR(24056,1040)|0;gR(24068,1024)|0;gR(24080,1008)|0;gR(24092,992)|0;gR(24104,976)|0;gR(24116,912)|0;c[6434]=23840;d=c[6434]|0;return d|0}function mH(b){b=b|0;var d=0;if((a[27536]|0)!=0){d=c[6460]|0;return d|0}if((bc(27536)|0)==0){d=c[6460]|0;return d|0}do{if((a[27424]|0)==0){if((bc(27424)|0)==0){break}nW(25040,0,288)|0;a$(144,0,u|0)|0}}while(0);gG(25040,3560)|0;gG(25052,3472)|0;c[6460]=25040;d=c[6460]|0;return d|0}function mI(b){b=b|0;var d=0;if((a[27480]|0)!=0){d=c[6438]|0;return d|0}if((bc(27480)|0)==0){d=c[6438]|0;return d|0}do{if((a[27400]|0)==0){if((bc(27400)|0)==0){break}nW(24296,0,288)|0;a$(284,0,u|0)|0}}while(0);gR(24296,4064)|0;gR(24308,3808)|0;c[6438]=24296;d=c[6438]|0;return d|0}function mJ(b){b=b|0;if((a[27544]|0)!=0){return 25848}if((bc(27544)|0)==0){return 25848}gD(25848,7144,8);a$(308,25848,u|0)|0;return 25848}function mK(b){b=b|0;if((a[27488]|0)!=0){return 25760}if((bc(27488)|0)==0){return 25760}gO(25760,7016,ne(7016)|0);a$(234,25760,u|0)|0;return 25760}function mL(b){b=b|0;if((a[27568]|0)!=0){return 25896}if((bc(27568)|0)==0){return 25896}gD(25896,6872,8);a$(308,25896,u|0)|0;return 25896}function mM(b){b=b|0;if((a[27512]|0)!=0){return 25808}if((bc(27512)|0)==0){return 25808}gO(25808,6744,ne(6744)|0);a$(234,25808,u|0)|0;return 25808}function mN(b){b=b|0;if((a[27560]|0)!=0){return 25880}if((bc(27560)|0)==0){return 25880}gD(25880,6576,20);a$(308,25880,u|0)|0;return 25880}function mO(b){b=b|0;if((a[27504]|0)!=0){return 25792}if((bc(27504)|0)==0){return 25792}gO(25792,6280,ne(6280)|0);a$(234,25792,u|0)|0;return 25792}function mP(b){b=b|0;if((a[27552]|0)!=0){return 25864}if((bc(27552)|0)==0){return 25864}gD(25864,6128,11);a$(308,25864,u|0)|0;return 25864}function mQ(b){b=b|0;if((a[27496]|0)!=0){return 25776}if((bc(27496)|0)==0){return 25776}gO(25776,5928,ne(5928)|0);a$(234,25776,u|0)|0;return 25776}function mR(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bx()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=+nU(b,g,c[6340]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function mS(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bx()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=+nU(b,g,c[6340]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function mT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bx()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);l=+nU(b,g,c[6340]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function mU(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=bx()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);n=aI(b|0,h|0,f|0,c[6340]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=K;k=n;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(K=j,k)|0}function mV(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bx()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);m=aI(b|0,h|0,f|0,c[6340]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function mW(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bx()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);m=aI(b|0,h|0,f|0,c[6340]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function mX(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bx()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);m=aI(b|0,h|0,f|0,c[6340]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function mY(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}l=bx()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);n=bL(b|0,h|0,f|0,c[6340]|0)|0;f=K;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}if((b|0)!=34){j=f;k=n;i=g;return(K=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&n>>>0>0>>>0;j=b?2147483647:-2147483648;k=b?-1:0;i=g;return(K=j,k)|0}function mZ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=bx()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);m=bL(b|0,h|0,f|0,c[6340]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&m>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&m>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function m_(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+4|0;d=(c[a>>2]|0)+(c[b+4>>2]|0)|0;a=d;e=c[b>>2]|0;if((e&1|0)==0){f=e;b$[f&511](a);return}else{f=c[(c[d>>2]|0)+(e-1)>>2]|0;b$[f&511](a);return}}function m$(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(h-i>>2>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[f>>2]|0}k=l+4|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b+16|0;k=b|0;l=c[k>>2]|0;g=i-l>>2;i=g+d|0;if(i>>>0>1073741823>>>0){ld(0)}m=h-l|0;do{if(m>>2>>>0>536870910>>>0){n=1073741823;o=1827}else{l=m>>1;h=l>>>0<i>>>0?i:l;if((h|0)==0){p=0;q=0;break}l=b+128|0;if(!((a[l]&1)==0&h>>>0<29>>>0)){n=h;o=1827;break}a[l]=1;p=j;q=h}}while(0);if((o|0)==1827){p=nK(n<<2)|0;q=n}n=d;d=p+(g<<2)|0;do{if((d|0)==0){r=0}else{c[d>>2]=0;r=d}d=r+4|0;n=n-1|0;}while((n|0)!=0);n=p+(q<<2)|0;q=c[k>>2]|0;r=(c[f>>2]|0)-q|0;o=p+(g-(r>>2)<<2)|0;g=o;p=q;nX(g|0,p|0,r)|0;c[k>>2]=o;c[f>>2]=d;c[e>>2]=n;if((q|0)==0){return}if((q|0)==(j|0)){a[b+128|0]=0;return}else{nM(p);return}}function m0(a){a=a|0;gQ(24572);gQ(24560);gQ(24548);gQ(24536);gQ(24524);gQ(24512);gQ(24500);gQ(24488);gQ(24476);gQ(24464);gQ(24452);gQ(24440);gQ(24428);gQ(24416);gQ(24404);gQ(24392);gQ(24380);gQ(24368);gQ(24356);gQ(24344);gQ(24332);gQ(24320);gQ(24308);gQ(24296);return}function m1(a){a=a|0;gF(25316);gF(25304);gF(25292);gF(25280);gF(25268);gF(25256);gF(25244);gF(25232);gF(25220);gF(25208);gF(25196);gF(25184);gF(25172);gF(25160);gF(25148);gF(25136);gF(25124);gF(25112);gF(25100);gF(25088);gF(25076);gF(25064);gF(25052);gF(25040);return}function m2(a){a=a|0;gQ(24116);gQ(24104);gQ(24092);gQ(24080);gQ(24068);gQ(24056);gQ(24044);gQ(24032);gQ(24020);gQ(24008);gQ(23996);gQ(23984);gQ(23972);gQ(23960);gQ(23948);gQ(23936);gQ(23924);gQ(23912);gQ(23900);gQ(23888);gQ(23876);gQ(23864);gQ(23852);gQ(23840);return}function m3(a){a=a|0;gF(24860);gF(24848);gF(24836);gF(24824);gF(24812);gF(24800);gF(24788);gF(24776);gF(24764);gF(24752);gF(24740);gF(24728);gF(24716);gF(24704);gF(24692);gF(24680);gF(24668);gF(24656);gF(24644);gF(24632);gF(24620);gF(24608);gF(24596);gF(24584);return}function m4(a){a=a|0;gQ(24284);gQ(24272);gQ(24260);gQ(24248);gQ(24236);gQ(24224);gQ(24212);gQ(24200);gQ(24188);gQ(24176);gQ(24164);gQ(24152);gQ(24140);gQ(24128);return}function m5(a){a=a|0;gF(25028);gF(25016);gF(25004);gF(24992);gF(24980);gF(24968);gF(24956);gF(24944);gF(24932);gF(24920);gF(24908);gF(24896);gF(24884);gF(24872);return}function m6(a,b,c){a=a|0;b=b|0;c=c|0;return m7(0,a,b,(c|0)!=0?c:23320)|0}function m7(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;j=((f|0)==0?23312:f)|0;f=c[j>>2]|0;L2054:do{if((d|0)==0){if((f|0)==0){k=0}else{break}i=g;return k|0}else{if((b|0)==0){l=h;c[h>>2]=l;m=l}else{m=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){l=a[d]|0;n=l&255;if(l<<24>>24>-1){c[m>>2]=n;k=l<<24>>24!=0|0;i=g;return k|0}else{l=n-194|0;if(l>>>0>50>>>0){break L2054}o=d+1|0;p=c[t+(l<<2)>>2]|0;q=e-1|0;break}}else{o=d;p=f;q=e}}while(0);L2070:do{if((q|0)==0){r=p}else{l=a[o]|0;n=(l&255)>>>3;if((n-16|n+(p>>26))>>>0>7>>>0){break L2054}else{s=o;u=p;v=q;w=l}while(1){s=s+1|0;u=(w&255)-128|u<<6;v=v-1|0;if((u|0)>=0){break}if((v|0)==0){r=u;break L2070}w=a[s]|0;if(((w&255)-128|0)>>>0>63>>>0){break L2054}}c[j>>2]=0;c[m>>2]=u;k=e-v|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(bx()|0)>>2]=84;k=-1;i=g;return k|0}function m8(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;i=i+1032|0;h=g|0;j=g+1024|0;k=c[b>>2]|0;c[j>>2]=k;l=(a|0)!=0;m=l?e:256;e=l?a:h|0;L2085:do{if((k|0)==0|(m|0)==0){n=0;o=d;p=m;q=e;r=k}else{a=h|0;s=m;t=d;u=0;v=e;w=k;while(1){x=t>>>2;y=x>>>0>=s>>>0;if(!(y|t>>>0>131>>>0)){n=u;o=t;p=s;q=v;r=w;break L2085}z=y?s:x;A=t-z|0;x=m9(v,j,z,f)|0;if((x|0)==-1){break}if((v|0)==(a|0)){B=a;C=s}else{B=v+(x<<2)|0;C=s-x|0}z=x+u|0;x=c[j>>2]|0;if((x|0)==0|(C|0)==0){n=z;o=A;p=C;q=B;r=x;break L2085}else{s=C;t=A;u=z;v=B;w=x}}n=-1;o=A;p=0;q=v;r=c[j>>2]|0}}while(0);L2096:do{if((r|0)==0){D=n}else{if((p|0)==0|(o|0)==0){D=n;break}else{E=p;F=o;G=n;H=q;I=r}while(1){J=m7(H,I,F,f)|0;if((J+2|0)>>>0<3>>>0){break}A=(c[j>>2]|0)+J|0;c[j>>2]=A;B=E-1|0;C=G+1|0;if((B|0)==0|(F|0)==(J|0)){D=C;break L2096}else{E=B;F=F-J|0;G=C;H=H+4|0;I=A}}if((J|0)==(-1|0)){D=-1;break}else if((J|0)==0){c[j>>2]=0;D=G;break}else{c[f>>2]=0;D=G;break}}}while(0);if(!l){i=g;return D|0}c[b>>2]=c[j>>2];i=g;return D|0}function m9(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;h=c[e>>2]|0;do{if((g|0)==0){i=1897}else{j=g|0;k=c[j>>2]|0;if((k|0)==0){i=1897;break}if((b|0)==0){l=k;m=h;n=f;i=1908;break}c[j>>2]=0;o=k;p=h;q=b;r=f;i=1928}}while(0);if((i|0)==1897){if((b|0)==0){s=h;u=f;i=1899}else{v=h;w=b;x=f;i=1898}}L2117:while(1){if((i|0)==1908){i=0;h=(d[m]|0)>>>3;if((h-16|h+(l>>26))>>>0>7>>>0){i=1909;break}h=m+1|0;do{if((l&33554432|0)==0){y=h}else{if(((d[h]|0)-128|0)>>>0>63>>>0){i=1912;break L2117}g=m+2|0;if((l&524288|0)==0){y=g;break}if(((d[g]|0)-128|0)>>>0>63>>>0){i=1915;break L2117}y=m+3|0}}while(0);s=y;u=n-1|0;i=1899;continue}else if((i|0)==1928){i=0;h=d[p]|0;g=h>>>3;if((g-16|g+(o>>26))>>>0>7>>>0){i=1929;break}g=p+1|0;z=h-128|o<<6;do{if((z|0)<0){h=(d[g]|0)-128|0;if(h>>>0>63>>>0){i=1932;break L2117}k=p+2|0;A=h|z<<6;if((A|0)>=0){B=A;C=k;break}h=(d[k]|0)-128|0;if(h>>>0>63>>>0){i=1935;break L2117}B=h|A<<6;C=p+3|0}else{B=z;C=g}}while(0);c[q>>2]=B;v=C;w=q+4|0;x=r-1|0;i=1898;continue}else if((i|0)==1899){i=0;g=a[s]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((s&3|0)!=0){D=s;E=u;F=g;break}h=c[s>>2]|0;if(((h-16843009|h)&-2139062144|0)==0){G=u;H=s}else{D=s;E=u;F=h&255;break}do{H=H+4|0;G=G-4|0;I=c[H>>2]|0;}while(((I-16843009|I)&-2139062144|0)==0);D=H;E=G;F=I&255}else{D=s;E=u;F=g}}while(0);g=F&255;if((g-1|0)>>>0<127>>>0){s=D+1|0;u=E-1|0;i=1899;continue}h=g-194|0;if(h>>>0>50>>>0){J=E;K=b;L=D;i=1939;break}l=c[t+(h<<2)>>2]|0;m=D+1|0;n=E;i=1908;continue}else if((i|0)==1898){i=0;if((x|0)==0){M=f;i=1948;break}else{N=x;O=w;P=v}while(1){h=a[P]|0;do{if(((h&255)-1|0)>>>0<127>>>0){if((P&3|0)==0&N>>>0>3>>>0){Q=N;R=O;S=P}else{T=P;U=O;V=N;W=h;break}while(1){X=c[S>>2]|0;if(((X-16843009|X)&-2139062144|0)!=0){i=1922;break}c[R>>2]=X&255;c[R+4>>2]=d[S+1|0]|0;c[R+8>>2]=d[S+2|0]|0;Y=S+4|0;Z=R+16|0;c[R+12>>2]=d[S+3|0]|0;_=Q-4|0;if(_>>>0>3>>>0){Q=_;R=Z;S=Y}else{i=1923;break}}if((i|0)==1922){i=0;T=S;U=R;V=Q;W=X&255;break}else if((i|0)==1923){i=0;T=Y;U=Z;V=_;W=a[Y]|0;break}}else{T=P;U=O;V=N;W=h}}while(0);$=W&255;if(($-1|0)>>>0>=127>>>0){break}c[U>>2]=$;h=V-1|0;if((h|0)==0){M=f;i=1947;break L2117}else{N=h;O=U+4|0;P=T+1|0}}h=$-194|0;if(h>>>0>50>>>0){J=V;K=U;L=T;i=1939;break}o=c[t+(h<<2)>>2]|0;p=T+1|0;q=U;r=V;i=1928;continue}}if((i|0)==1947){return M|0}else if((i|0)==1948){return M|0}else if((i|0)==1915){aa=l;ab=m-1|0;ac=b;ad=n;i=1938}else if((i|0)==1912){aa=l;ab=m-1|0;ac=b;ad=n;i=1938}else if((i|0)==1935){aa=A;ab=p-1|0;ac=q;ad=r;i=1938}else if((i|0)==1909){aa=l;ab=m-1|0;ac=b;ad=n;i=1938}else if((i|0)==1929){aa=o;ab=p-1|0;ac=q;ad=r;i=1938}else if((i|0)==1932){aa=z;ab=p-1|0;ac=q;ad=r;i=1938}if((i|0)==1938){if((aa|0)==0){J=ad;K=ac;L=ab;i=1939}else{ae=ac;af=ab}}do{if((i|0)==1939){if((a[L]|0)!=0){ae=K;af=L;break}if((K|0)!=0){c[K>>2]=0;c[e>>2]=0}M=f-J|0;return M|0}}while(0);c[(bx()|0)>>2]=84;if((ae|0)==0){M=-1;return M|0}c[e>>2]=af;M=-1;return M|0}function na(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){k=h;c[h>>2]=k;l=k}else{l=b}k=a[e]|0;m=k&255;if(k<<24>>24>-1){c[l>>2]=m;j=k<<24>>24!=0|0;i=g;return j|0}k=m-194|0;if(k>>>0>50>>>0){break}m=e+1|0;n=c[t+(k<<2)>>2]|0;if(f>>>0<4>>>0){if((n&-2147483648>>>(((f*6|0)-6|0)>>>0)|0)!=0){break}}k=d[m]|0;m=k>>>3;if((m-16|m+(n>>26))>>>0>7>>>0){break}m=k-128|n<<6;if((m|0)>=0){c[l>>2]=m;j=2;i=g;return j|0}n=(d[e+2|0]|0)-128|0;if(n>>>0>63>>>0){break}k=n|m<<6;if((k|0)>=0){c[l>>2]=k;j=3;i=g;return j|0}m=(d[e+3|0]|0)-128|0;if(m>>>0>63>>>0){break}c[l>>2]=m|k<<6;j=4;i=g;return j|0}}while(0);c[(bx()|0)>>2]=84;j=-1;i=g;return j|0}function nb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((b|0)==0){f=1;return f|0}if(d>>>0<128>>>0){a[b]=d&255;f=1;return f|0}if(d>>>0<2048>>>0){a[b]=(d>>>6|192)&255;a[b+1|0]=(d&63|128)&255;f=2;return f|0}if(d>>>0<55296>>>0|(d-57344|0)>>>0<8192>>>0){a[b]=(d>>>12|224)&255;a[b+1|0]=(d>>>6&63|128)&255;a[b+2|0]=(d&63|128)&255;f=3;return f|0}if((d-65536|0)>>>0<1048576>>>0){a[b]=(d>>>18|240)&255;a[b+1|0]=(d>>>12&63|128)&255;a[b+2|0]=(d>>>6&63|128)&255;a[b+3|0]=(d&63|128)&255;f=4;return f|0}else{c[(bx()|0)>>2]=84;f=-1;return f|0}return 0}function nc(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+264|0;g=f|0;h=f+256|0;j=c[b>>2]|0;c[h>>2]=j;k=(a|0)!=0;l=k?e:256;e=k?a:g|0;L2238:do{if((j|0)==0|(l|0)==0){m=0;n=d;o=l;p=e;q=j}else{a=g|0;r=l;s=d;t=0;u=e;v=j;while(1){w=s>>>0>=r>>>0;if(!(w|s>>>0>32>>>0)){m=t;n=s;o=r;p=u;q=v;break L2238}x=w?r:s;y=s-x|0;w=nd(u,h,x,0)|0;if((w|0)==-1){break}if((u|0)==(a|0)){z=a;A=r}else{z=u+w|0;A=r-w|0}x=w+t|0;w=c[h>>2]|0;if((w|0)==0|(A|0)==0){m=x;n=y;o=A;p=z;q=w;break L2238}else{r=A;s=y;t=x;u=z;v=w}}m=-1;n=y;o=0;p=u;q=c[h>>2]|0}}while(0);L2249:do{if((q|0)==0){B=m}else{if((o|0)==0|(n|0)==0){B=m;break}else{C=o;D=n;E=m;F=p;G=q}while(1){H=nb(F,c[G>>2]|0,0)|0;if((H+1|0)>>>0<2>>>0){break}y=(c[h>>2]|0)+4|0;c[h>>2]=y;z=D-1|0;A=E+1|0;if((C|0)==(H|0)|(z|0)==0){B=A;break L2249}else{C=C-H|0;D=z;E=A;F=F+H|0;G=y}}if((H|0)!=0){B=-1;break}c[h>>2]=0;B=E}}while(0);if(!k){i=f;return B|0}c[b>>2]=c[h>>2];i=f;return B|0}function nd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+8|0;g=f|0;if((b|0)==0){h=c[d>>2]|0;j=g|0;k=c[h>>2]|0;if((k|0)==0){l=0;i=f;return l|0}else{m=0;n=h;o=k}while(1){if(o>>>0>127>>>0){k=nb(j,o,0)|0;if((k|0)==-1){l=-1;p=2039;break}else{q=k}}else{q=1}k=q+m|0;h=n+4|0;r=c[h>>2]|0;if((r|0)==0){l=k;p=2041;break}else{m=k;n=h;o=r}}if((p|0)==2041){i=f;return l|0}else if((p|0)==2039){i=f;return l|0}}L2275:do{if(e>>>0>3>>>0){o=e;n=b;m=c[d>>2]|0;while(1){q=c[m>>2]|0;if((q|0)==0){s=o;t=n;break L2275}if(q>>>0>127>>>0){j=nb(n,q,0)|0;if((j|0)==-1){l=-1;break}u=n+j|0;v=o-j|0;w=m}else{a[n]=q&255;u=n+1|0;v=o-1|0;w=c[d>>2]|0}q=w+4|0;c[d>>2]=q;if(v>>>0>3>>>0){o=v;n=u;m=q}else{s=v;t=u;break L2275}}i=f;return l|0}else{s=e;t=b}}while(0);L2287:do{if((s|0)==0){x=0}else{b=g|0;u=s;v=t;w=c[d>>2]|0;while(1){m=c[w>>2]|0;if((m|0)==0){p=2035;break}if(m>>>0>127>>>0){n=nb(b,m,0)|0;if((n|0)==-1){l=-1;p=2044;break}if(n>>>0>u>>>0){p=2031;break}o=c[w>>2]|0;nb(v,o,0)|0;y=v+n|0;z=u-n|0;A=w}else{a[v]=m&255;y=v+1|0;z=u-1|0;A=c[d>>2]|0}m=A+4|0;c[d>>2]=m;if((z|0)==0){x=0;break L2287}else{u=z;v=y;w=m}}if((p|0)==2044){i=f;return l|0}else if((p|0)==2035){a[v]=0;x=u;break}else if((p|0)==2031){l=e-u|0;i=f;return l|0}}}while(0);c[d>>2]=0;l=e-x|0;i=f;return l|0}function ne(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function nf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((d|0)==0){return a|0}else{e=b;f=d;g=a}while(1){d=f-1|0;c[g>>2]=c[e>>2];if((d|0)==0){break}else{e=e+4|0;f=d;g=g+4|0}}return a|0}function ng(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(e){return a|0}else{f=d}do{f=f-1|0;c[a+(f<<2)>>2]=c[b+(f<<2)>>2];}while((f|0)!=0);return a|0}else{if(e){return a|0}else{g=b;h=d;i=a}while(1){d=h-1|0;c[i>>2]=c[g>>2];if((d|0)==0){break}else{g=g+4|0;h=d;i=i+4|0}}return a|0}return 0}function nh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;if((d|0)==0){return a|0}else{e=d;f=a}while(1){d=e-1|0;c[f>>2]=b;if((d|0)==0){break}else{e=d;f=f+4|0}}return a|0}function ni(a){a=a|0;return}function nj(a){a=a|0;c[a>>2]=11680;return}function nk(a){a=a|0;nM(a);return}function nl(a){a=a|0;return}function nm(a){a=a|0;return 4320}function nn(a){a=a|0;ni(a|0);return}function no(a){a=a|0;return}function np(a){a=a|0;return}function nq(a){a=a|0;ni(a|0);nM(a);return}function nr(a){a=a|0;ni(a|0);nM(a);return}function ns(a){a=a|0;ni(a|0);nM(a);return}function nt(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=nx(b,19912,19896,-1)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}j=f;nW(j|0,0,56)|0;c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;ce[c[(c[h>>2]|0)+28>>2]&15](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function nu(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function nv(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;ce[c[(c[g>>2]|0)+28>>2]&15](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function nw(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;ce[c[(c[j>>2]|0)+28>>2]&15](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;ce[c[(c[j>>2]|0)+28>>2]&15](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=2136;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=2135;break}}if((m|0)==2135){return}else if((m|0)==2136){return}}function nx(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;o=(k|0)==(d|0);d=e;nW(d|0,0,39)|0;if(o){c[g+48>>2]=1;cb[c[(c[k>>2]|0)+20>>2]&63](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}bZ[c[(c[k>>2]|0)+24>>2]&15](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)!=0){p=0;i=f;return p|0}if((c[l>>2]|0)!=1){p=0;i=f;return p|0}if((c[m>>2]|0)==1){break}else{p=0}i=f;return p|0}}while(0);p=c[e>>2]|0;i=f;return p|0}else if((j|0)==0){if((c[n>>2]|0)!=1){p=0;i=f;return p|0}if((c[l>>2]|0)!=1){p=0;i=f;return p|0}p=(c[m>>2]|0)==1?c[b>>2]|0:0;i=f;return p|0}else{p=0;i=f;return p|0}return 0}function ny(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L2469:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L2471:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;cb[c[(c[v>>2]|0)+20>>2]&63](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L2471}else{z=1;A=r;break}}if((c[p>>2]|0)==1){B=2186;break L2469}if((c[o>>2]&2|0)==0){B=2186;break L2469}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if(y){C=x;B=2185}else{D=x;B=2182}}else{D=0;B=2182}}while(0);do{if((B|0)==2182){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){C=D;B=2185;break}if((c[d+24>>2]|0)!=2){C=D;B=2185;break}a[d+54|0]=1;if(D){B=2186}else{B=2187}}}while(0);if((B|0)==2185){if(C){B=2186}else{B=2187}}if((B|0)==2187){c[i>>2]=4;return}else if((B|0)==2186){c[i>>2]=3;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}C=c[b+12>>2]|0;D=b+16+(C<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;bZ[c[(c[y>>2]|0)+24>>2]&15](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((C|0)<=1){return}C=c[b+8>>2]|0;do{if((C&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((C&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){B=2214;break}if((c[b>>2]|0)==1){B=2225;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;bZ[c[(c[w>>2]|0)+24>>2]&15](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<D>>>0){A=z}else{B=2220;break}}if((B|0)==2214){return}else if((B|0)==2220){return}else if((B|0)==2225){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){B=2223;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){B=2224;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;bZ[c[(c[w>>2]|0)+24>>2]&15](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<D>>>0){i=z}else{B=2213;break}}if((B|0)==2213){return}else if((B|0)==2223){return}else if((B|0)==2224){return}}}while(0);G=d+54|0;F=e;C=x;while(1){if((a[G]&1)!=0){B=2219;break}x=c[C+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[C>>2]|0;bZ[c[(c[i>>2]|0)+24>>2]&15](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=C+8|0;if(x>>>0<D>>>0){C=x}else{B=2227;break}}if((B|0)==2219){return}else if((B|0)==2227){return}}function nz(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;bZ[c[(c[h>>2]|0)+24>>2]&15](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;cb[c[(c[l>>2]|0)+20>>2]&63](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=2242}else{if((a[j]&1)==0){m=1;n=2242}}L2571:do{if((n|0)==2242){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=2245;break}a[d+54|0]=1;if(m){break L2571}}else{n=2245}}while(0);if((n|0)==2245){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function nA(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function nB(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;cb[c[(c[p>>2]|0)+20>>2]&63](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L2620:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L2620}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L2620}}else{if((c[o>>2]|0)==1){break L2620}if((c[q>>2]&2|0)==0){break L2620}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;cb[c[(c[u>>2]|0)+20>>2]&63](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function nC(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;cb[c[(c[i>>2]|0)+20>>2]&63](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function nD(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function nE(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[5842]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=23408+(h<<2)|0;j=23408+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[5842]=e&~(1<<g)}else{if(l>>>0<(c[5846]|0)>>>0){bI();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{bI();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[5844]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=23408+(p<<2)|0;m=23408+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[5842]=e&~(1<<r)}else{if(l>>>0<(c[5846]|0)>>>0){bI();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{bI();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[5844]|0;if((l|0)!=0){q=c[5847]|0;d=l>>>3;l=d<<1;f=23408+(l<<2)|0;k=c[5842]|0;h=1<<d;do{if((k&h|0)==0){c[5842]=k|h;s=f;t=23408+(l+2<<2)|0}else{d=23408+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[5846]|0)>>>0){s=g;t=d;break}bI();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[5844]=m;c[5847]=e;n=i;return n|0}l=c[5843]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[23672+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[5846]|0;if(r>>>0<i>>>0){bI();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){bI();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){bI();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){bI();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){bI();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{bI();return 0}}}while(0);L2910:do{if((e|0)!=0){f=d+28|0;i=23672+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[5843]=c[5843]&~(1<<c[f>>2]);break L2910}else{if(e>>>0<(c[5846]|0)>>>0){bI();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L2910}}}while(0);if(v>>>0<(c[5846]|0)>>>0){bI();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[5844]|0;if((f|0)!=0){e=c[5847]|0;i=f>>>3;f=i<<1;q=23408+(f<<2)|0;k=c[5842]|0;g=1<<i;do{if((k&g|0)==0){c[5842]=k|g;y=q;z=23408+(f+2<<2)|0}else{i=23408+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[5846]|0)>>>0){y=l;z=i;break}bI();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[5844]=p;c[5847]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[5843]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[23672+(A<<2)>>2]|0;L2718:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L2718}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[23672+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[5844]|0)-g|0)>>>0){o=g;break}q=K;m=c[5846]|0;if(q>>>0<m>>>0){bI();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){bI();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){bI();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){bI();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){bI();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{bI();return 0}}}while(0);L2768:do{if((e|0)!=0){i=K+28|0;m=23672+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[5843]=c[5843]&~(1<<c[i>>2]);break L2768}else{if(e>>>0<(c[5846]|0)>>>0){bI();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L2768}}}while(0);if(L>>>0<(c[5846]|0)>>>0){bI();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=23408+(e<<2)|0;r=c[5842]|0;j=1<<i;do{if((r&j|0)==0){c[5842]=r|j;O=m;P=23408+(e+2<<2)|0}else{i=23408+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[5846]|0)>>>0){O=d;P=i;break}bI();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=23672+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[5843]|0;l=1<<Q;if((m&l|0)==0){c[5843]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=2502;break}else{l=l<<1;m=j}}if((T|0)==2502){if(S>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[5846]|0;if(m>>>0<i>>>0){bI();return 0}if(j>>>0<i>>>0){bI();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[5844]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[5847]|0;if(S>>>0>15>>>0){R=J;c[5847]=R+o;c[5844]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[5844]=0;c[5847]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[5845]|0;if(o>>>0<J>>>0){S=J-o|0;c[5845]=S;J=c[5848]|0;K=J;c[5848]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[5822]|0)==0){J=bG(30)|0;if((J-1&J|0)==0){c[5824]=J;c[5823]=J;c[5825]=-1;c[5826]=-1;c[5827]=0;c[5953]=0;c[5822]=(bX(0)|0)&-16^1431655768;break}else{bI();return 0}}}while(0);J=o+48|0;S=c[5824]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[5952]|0;do{if((O|0)!=0){P=c[5950]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2977:do{if((c[5953]&4|0)==0){O=c[5848]|0;L2979:do{if((O|0)==0){T=2532}else{L=O;P=23816;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=2532;break L2979}else{P=M}}if((P|0)==0){T=2532;break}L=R-(c[5845]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=bw(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=2541}}while(0);do{if((T|0)==2532){O=bw(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[5823]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[5950]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[5952]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=bw($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=2541}}while(0);L2999:do{if((T|0)==2541){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=2552;break L2977}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[5824]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((bw(O|0)|0)==-1){bw(m|0)|0;W=Y;break L2999}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=2552;break L2977}}}while(0);c[5953]=c[5953]|4;ad=W;T=2549}else{ad=0;T=2549}}while(0);do{if((T|0)==2549){if(S>>>0>=2147483647>>>0){break}W=bw(S|0)|0;Z=bw(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=2552}}}while(0);do{if((T|0)==2552){ad=(c[5950]|0)+aa|0;c[5950]=ad;if(ad>>>0>(c[5951]|0)>>>0){c[5951]=ad}ad=c[5848]|0;L3019:do{if((ad|0)==0){S=c[5846]|0;if((S|0)==0|ab>>>0<S>>>0){c[5846]=ab}c[5954]=ab;c[5955]=aa;c[5957]=0;c[5851]=c[5822];c[5850]=-1;S=0;do{Y=S<<1;ac=23408+(Y<<2)|0;c[23408+(Y+3<<2)>>2]=ac;c[23408+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[5848]=ab+ae;c[5845]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[5849]=c[5826]}else{S=23816;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=2564;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==2564){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[5848]|0;Y=(c[5845]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[5848]=Z+ai;c[5845]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[5849]=c[5826];break L3019}}while(0);if(ab>>>0<(c[5846]|0)>>>0){c[5846]=ab}S=ab+aa|0;Y=23816;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=2574;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==2574){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[5848]|0)){J=(c[5845]|0)+K|0;c[5845]=J;c[5848]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[5847]|0)){J=(c[5844]|0)+K|0;c[5844]=J;c[5847]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L3064:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=23408+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[5846]|0)>>>0){bI();return 0}if((c[U+12>>2]|0)==(Z|0)){break}bI();return 0}}while(0);if((Q|0)==(U|0)){c[5842]=c[5842]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[5846]|0)>>>0){bI();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}bI();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[5846]|0)>>>0){bI();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){bI();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{bI();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=23672+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[5843]=c[5843]&~(1<<c[P>>2]);break L3064}else{if(m>>>0<(c[5846]|0)>>>0){bI();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L3064}}}while(0);if(an>>>0<(c[5846]|0)>>>0){bI();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=23408+(V<<2)|0;P=c[5842]|0;m=1<<J;do{if((P&m|0)==0){c[5842]=P|m;as=X;at=23408+(V+2<<2)|0}else{J=23408+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[5846]|0)>>>0){as=U;at=J;break}bI();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=23672+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[5843]|0;Q=1<<au;if((X&Q|0)==0){c[5843]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=2647;break}else{Q=Q<<1;X=m}}if((T|0)==2647){if(aw>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[5846]|0;if(X>>>0<$>>>0){bI();return 0}if(m>>>0<$>>>0){bI();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=23816;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[5848]=ab+aB;c[5845]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[5849]=c[5826];c[ac+4>>2]=27;c[W>>2]=c[5954];c[W+4>>2]=c[5955];c[W+8>>2]=c[5956];c[W+12>>2]=c[5957];c[5954]=ab;c[5955]=aa;c[5957]=0;c[5956]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=23408+(K<<2)|0;S=c[5842]|0;m=1<<W;do{if((S&m|0)==0){c[5842]=S|m;aC=Z;aD=23408+(K+2<<2)|0}else{W=23408+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[5846]|0)>>>0){aC=Q;aD=W;break}bI();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215>>>0){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=23672+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[5843]|0;Q=1<<aE;if((Z&Q|0)==0){c[5843]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=2682;break}else{Q=Q<<1;Z=m}}if((T|0)==2682){if(aG>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[5846]|0;if(Z>>>0<m>>>0){bI();return 0}if(_>>>0<m>>>0){bI();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[5845]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[5845]=_;ad=c[5848]|0;Q=ad;c[5848]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(bx()|0)>>2]=12;n=0;return n|0}function nF(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[5846]|0;if(b>>>0<e>>>0){bI()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){bI()}h=f&-8;i=a+(h-8)|0;j=i;L3236:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){bI()}if((n|0)==(c[5847]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[5844]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=23408+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){bI()}if((c[k+12>>2]|0)==(n|0)){break}bI()}}while(0);if((s|0)==(k|0)){c[5842]=c[5842]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){bI()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}bI()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){bI()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){bI()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){bI()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{bI()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=23672+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[5843]=c[5843]&~(1<<c[v>>2]);q=n;r=o;break L3236}else{if(p>>>0<(c[5846]|0)>>>0){bI()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L3236}}}while(0);if(A>>>0<(c[5846]|0)>>>0){bI()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5846]|0)>>>0){bI()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[5846]|0)>>>0){bI()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){bI()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){bI()}do{if((e&2|0)==0){if((j|0)==(c[5848]|0)){B=(c[5845]|0)+r|0;c[5845]=B;c[5848]=q;c[q+4>>2]=B|1;if((q|0)!=(c[5847]|0)){return}c[5847]=0;c[5844]=0;return}if((j|0)==(c[5847]|0)){B=(c[5844]|0)+r|0;c[5844]=B;c[5847]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L3338:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=23408+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[5846]|0)>>>0){bI()}if((c[u+12>>2]|0)==(j|0)){break}bI()}}while(0);if((g|0)==(u|0)){c[5842]=c[5842]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[5846]|0)>>>0){bI()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}bI()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[5846]|0)>>>0){bI()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[5846]|0)>>>0){bI()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){bI()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{bI()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=23672+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[5843]=c[5843]&~(1<<c[t>>2]);break L3338}else{if(f>>>0<(c[5846]|0)>>>0){bI()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L3338}}}while(0);if(E>>>0<(c[5846]|0)>>>0){bI()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[5846]|0)>>>0){bI()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[5846]|0)>>>0){bI()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[5847]|0)){H=B;break}c[5844]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=23408+(d<<2)|0;A=c[5842]|0;E=1<<r;do{if((A&E|0)==0){c[5842]=A|E;I=e;J=23408+(d+2<<2)|0}else{r=23408+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[5846]|0)>>>0){I=h;J=r;break}bI()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=23672+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[5843]|0;d=1<<K;do{if((r&d|0)==0){c[5843]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=2859;break}else{A=A<<1;J=E}}if((N|0)==2859){if(M>>>0<(c[5846]|0)>>>0){bI()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[5846]|0;if(J>>>0<E>>>0){bI()}if(B>>>0<E>>>0){bI()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[5850]|0)-1|0;c[5850]=q;if((q|0)==0){O=23824}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[5850]=-1;return}function nG(a,b){a=a|0;b=b|0;var d=0,e=0;do{if((a|0)==0){d=0}else{e=ag(b,a)|0;if((b|a)>>>0<=65535>>>0){d=e;break}d=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}}while(0);b=nE(d)|0;if((b|0)==0){return b|0}if((c[b-4>>2]&3|0)==0){return b|0}nW(b|0,0,d|0)|0;return b|0}function nH(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=nE(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(bx()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=nI(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=nE(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;nX(f|0,a|0,e)|0;nF(a);d=f;return d|0}function nI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[5846]|0;if(g>>>0<j>>>0){bI();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){bI();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){bI();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[5824]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;nJ(g+b|0,k);n=a;return n|0}if((i|0)==(c[5848]|0)){k=(c[5845]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[5848]=g+b;c[5845]=l;n=a;return n|0}if((i|0)==(c[5847]|0)){l=(c[5844]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[5844]=q;c[5847]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L3537:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=23408+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){bI();return 0}if((c[l+12>>2]|0)==(i|0)){break}bI();return 0}}while(0);if((k|0)==(l|0)){c[5842]=c[5842]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){bI();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}bI();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){bI();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){bI();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){bI();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{bI();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=23672+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[5843]=c[5843]&~(1<<c[t>>2]);break L3537}else{if(s>>>0<(c[5846]|0)>>>0){bI();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L3537}}}while(0);if(y>>>0<(c[5846]|0)>>>0){bI();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[5846]|0)>>>0){bI();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;nJ(g+b|0,q);n=a;return n|0}return 0}function nJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L3613:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[5846]|0;if(i>>>0<l>>>0){bI()}if((j|0)==(c[5847]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[5844]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=23408+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){bI()}if((c[p+12>>2]|0)==(j|0)){break}bI()}}while(0);if((q|0)==(p|0)){c[5842]=c[5842]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){bI()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}bI()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){bI()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){bI()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){bI()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{bI()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=23672+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[5843]=c[5843]&~(1<<c[t>>2]);n=j;o=k;break L3613}else{if(m>>>0<(c[5846]|0)>>>0){bI()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L3613}}}while(0);if(y>>>0<(c[5846]|0)>>>0){bI()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5846]|0)>>>0){bI()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[5846]|0)>>>0){bI()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[5846]|0;if(e>>>0<a>>>0){bI()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[5848]|0)){A=(c[5845]|0)+o|0;c[5845]=A;c[5848]=n;c[n+4>>2]=A|1;if((n|0)!=(c[5847]|0)){return}c[5847]=0;c[5844]=0;return}if((f|0)==(c[5847]|0)){A=(c[5844]|0)+o|0;c[5844]=A;c[5847]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L3712:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=23408+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){bI()}if((c[g+12>>2]|0)==(f|0)){break}bI()}}while(0);if((t|0)==(g|0)){c[5842]=c[5842]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){bI()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}bI()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){bI()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){bI()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){bI()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{bI()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=23672+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[5843]=c[5843]&~(1<<c[l>>2]);break L3712}else{if(m>>>0<(c[5846]|0)>>>0){bI()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L3712}}}while(0);if(C>>>0<(c[5846]|0)>>>0){bI()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[5846]|0)>>>0){bI()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[5846]|0)>>>0){bI()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[5847]|0)){F=A;break}c[5844]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=23408+(z<<2)|0;C=c[5842]|0;b=1<<o;do{if((C&b|0)==0){c[5842]=C|b;G=y;H=23408+(z+2<<2)|0}else{o=23408+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[5846]|0)>>>0){G=d;H=o;break}bI()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=23672+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[5843]|0;z=1<<I;if((o&z|0)==0){c[5843]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=3149;break}else{I=I<<1;J=G}}if((L|0)==3149){if(K>>>0<(c[5846]|0)>>>0){bI()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[5846]|0;if(J>>>0<I>>>0){bI()}if(L>>>0<I>>>0){bI()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function nK(a){a=a|0;var b=0,d=0,e=0;b=(a|0)==0?1:a;while(1){d=nE(b)|0;if((d|0)!=0){e=3193;break}a=(I=c[6844]|0,c[6844]=I+0,I);if((a|0)==0){break}b7[a&3]()}if((e|0)==3193){return d|0}d=bP(4)|0;c[d>>2]=11648;bl(d|0,18176,40);return 0}function nL(a){a=a|0;return nK(a)|0}function nM(a){a=a|0;if((a|0)==0){return}nF(a);return}function nN(a){a=a|0;nM(a);return}function nO(a){a=a|0;nM(a);return}function nP(a){a=a|0;return}function nQ(a){a=a|0;return 6440}function nR(){var a=0;a=bP(4)|0;c[a>>2]=11648;bl(a|0,18176,40)}function nS(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0.0,R=0.0,S=0.0;e=b;while(1){f=e+1|0;if((aO(a[e]|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==43){i=f;j=0}else if((g<<24>>24|0)==45){i=f;j=1}else{i=e;j=0}e=-1;f=0;g=i;while(1){k=a[g]|0;if(((k<<24>>24)-48|0)>>>0<10>>>0){l=e}else{if(k<<24>>24!=46|(e|0)>-1){break}else{l=f}}e=l;f=f+1|0;g=g+1|0}l=g+(-f|0)|0;i=(e|0)<0;m=((i^1)<<31>>31)+f|0;n=(m|0)>18;o=(n?-18:-m|0)+(i?f:e)|0;e=n?18:m;do{if((e|0)==0){p=b;q=0.0}else{if((e|0)>9){m=l;n=e;f=0;while(1){i=a[m]|0;r=m+1|0;if(i<<24>>24==46){s=a[r]|0;t=m+2|0}else{s=i;t=r}u=(f*10|0)-48+(s<<24>>24)|0;r=n-1|0;if((r|0)>9){m=t;n=r;f=u}else{break}}v=+(u|0)*1.0e9;w=9;x=t;y=3224}else{if((e|0)>0){v=0.0;w=e;x=l;y=3224}else{z=0.0;A=0.0}}if((y|0)==3224){f=x;n=w;m=0;while(1){r=a[f]|0;i=f+1|0;if(r<<24>>24==46){B=a[i]|0;C=f+2|0}else{B=r;C=i}D=(m*10|0)-48+(B<<24>>24)|0;i=n-1|0;if((i|0)>0){f=C;n=i;m=D}else{break}}z=+(D|0);A=v}E=A+z;do{if((k<<24>>24|0)==69|(k<<24>>24|0)==101){m=g+1|0;n=a[m]|0;if((n<<24>>24|0)==43){F=g+2|0;G=0}else if((n<<24>>24|0)==45){F=g+2|0;G=1}else{F=m;G=0}m=a[F]|0;if(((m<<24>>24)-48|0)>>>0<10>>>0){H=F;I=0;J=m}else{K=0;L=F;M=G;break}while(1){m=(I*10|0)-48+(J<<24>>24)|0;n=H+1|0;f=a[n]|0;if(((f<<24>>24)-48|0)>>>0<10>>>0){H=n;I=m;J=f}else{K=m;L=n;M=G;break}}}else{K=0;L=g;M=0}}while(0);n=o+((M|0)==0?K:-K|0)|0;m=(n|0)<0?-n|0:n;if((m|0)>511){c[(bx()|0)>>2]=34;N=1.0;O=8;P=511;y=3241}else{if((m|0)==0){Q=1.0}else{N=1.0;O=8;P=m;y=3241}}if((y|0)==3241){while(1){y=0;if((P&1|0)==0){R=N}else{R=N*+h[O>>3]}m=P>>1;if((m|0)==0){Q=R;break}else{N=R;O=O+8|0;P=m;y=3241}}}if((n|0)>-1){p=L;q=E*Q;break}else{p=L;q=E/Q;break}}}while(0);if((d|0)!=0){c[d>>2]=p}if((j|0)==0){S=q;return+S}S=-0.0-q;return+S}function nT(a,b){a=a|0;b=b|0;return+(+nS(a,b))}function nU(a,b,c){a=a|0;b=b|0;c=c|0;return+(+nS(a,b))}function nV(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function nW(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function nX(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}
function cf(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function cg(){return i|0}function ch(a){a=a|0;i=a}function ci(a,b){a=a|0;b=b|0;if((x|0)==0){x=a;y=b}}function cj(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function ck(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function cl(a){a=a|0;K=a}function cm(a){a=a|0;L=a}function cn(a){a=a|0;M=a}function co(a){a=a|0;N=a}function cp(a){a=a|0;O=a}function cq(a){a=a|0;P=a}function cr(a){a=a|0;Q=a}function cs(a){a=a|0;R=a}function ct(a){a=a|0;S=a}function cu(a){a=a|0;T=a}function cv(){c[4540]=p+8;c[4542]=p+8;c[4544]=q+8;c[4548]=q+8;c[4552]=q+8;c[4556]=q+8;c[4560]=q+8;c[4564]=p+8;c[4598]=q+8;c[4602]=q+8;c[4666]=q+8;c[4670]=q+8;c[4690]=p+8;c[4692]=q+8;c[4728]=q+8;c[4732]=q+8;c[4768]=q+8;c[4772]=q+8;c[4792]=p+8;c[4794]=p+8;c[4796]=q+8;c[4800]=q+8;c[4804]=q+8;c[4808]=p+8;c[4810]=p+8;c[4812]=p+8;c[4814]=p+8;c[4816]=p+8;c[4818]=p+8;c[4820]=p+8;c[4846]=q+8;c[4850]=p+8;c[4852]=q+8;c[4856]=q+8;c[4860]=q+8;c[4864]=p+8;c[4866]=p+8;c[4868]=p+8;c[4870]=p+8;c[4904]=p+8;c[4906]=p+8;c[4908]=p+8;c[4910]=q+8;c[4914]=q+8;c[4918]=q+8;c[4922]=p+8;c[4924]=q+8;c[4928]=p+8;c[4930]=p+8;c[4932]=p+8;c[4934]=q+8;c[4938]=q+8;c[4942]=q+8;c[4946]=q+8;c[4950]=p+8;c[4952]=q+8;c[4964]=p+8;c[4966]=q+8;c[4970]=q+8;c[4974]=q+8;c[4978]=q+8}function cw(a,b){a=a|0;b=b|0;c[a>>2]=14344;c[a+4>>2]=b;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;c[a+16>>2]=0;c[a+20>>2]=0;c[a+24>>2]=0;b=a+32|0;nW(b|0,0,40)|0;return}function cx(a){a=a|0;cy(a);nM(a);return}function cy(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;c[a>>2]=14344;b=a+68|0;d=c[b>>2]|0;if((d|0)!=0){c[b>>2]=0;b=c[a+64>>2]|0;b0[c[c[b>>2]>>2]&127](b,d)}d=a+16|0;b=c[d>>2]|0;e=a+20|0;f=a+24|0;if((b|0)==0){return}g=c[f>>2]|0;h=c[e>>2]|0;c[d>>2]=0;c[e>>2]=0;c[f>>2]=0;f=c[a+28>>2]|0;a=b;cb[c[c[f>>2]>>2]&63](f,b,8,h-a>>3,g-a>>3,38);return}function cz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+16|0;e=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[e>>2];e=d|0;f=d+8|0;g=b|0;b=c[g>>2]|0;if((b|0)==0){h=a+32|0;i=d;return h|0}j=(c[a+68>>2]|0)==0?0:a+64|0;if((j|0)==0){cP(f,11176,126,0,0,0,5576,4200,g);fE(f);return 0}f=b-1|0;b=c[j+4>>2]|0;j=c[b>>2]|0;if(f>>>0<(c[b+4>>2]|0)-j>>3>>>0){h=c[j+(f<<3)+4>>2]|0;i=d;return h|0}else{cP(e,11176,123,0,0,7344,5576,4200,g);fE(e);return 0}return 0}function cA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=g;j=b+32|0;k=j|0;if((c[k>>2]|0)==0){l=c[b+4>>2]|0;b5[c[(c[l>>2]|0)+8>>2]&15](f,l,d);if((j|0)==0){m=c[b+52>>2]|0;n=c[b+40>>2]|0;o=c[b+44>>2]|0}else{l=c[f>>2]|0;p=c[f+4>>2]|0;c[k>>2]=b;c[b+36>>2]=0;k=b+40|0;c[k>>2]=l;c[k+4>>2]=p;c[b+48>>2]=b+8;c[b+52>>2]=l;m=l;n=l;o=p}c[a>>2]=j;if(n+(o<<3)-m>>3>>>0<d>>>0){q=0}else{c[b+52>>2]=m+(d<<3);q=m}c[a+4>>2]=q;i=e;return}q=b+52|0;m=c[q>>2]|0;do{if((c[b+40>>2]|0)+(c[b+44>>2]<<3)-m>>3>>>0>=d>>>0){c[q>>2]=m+(d<<3);if((m|0)==0){break}c[a>>2]=j;c[a+4>>2]=m;i=e;return}}while(0);m=b+64|0;j=b+68|0;q=c[j>>2]|0;o=(q|0)==0;n=o?0:m|0;do{if((n|0)==0){p=nK(32)|0;l=p;nW(p|0,0,32)|0;c[p>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;c[p+16>>2]=0;c[p+20>>2]=0;c[p+24>>2]=0;p=m|0;k=c[p>>2]|0;c[p>>2]=23280;c[j>>2]=l;if(o){r=l;break}b0[c[c[k>>2]>>2]&127](k,q);r=l}else{l=n+4|0;k=c[l>>2]|0;p=c[(c[k+4>>2]|0)-8+4>>2]|0;f=p+20|0;s=c[f>>2]|0;if((c[p+8>>2]|0)+(c[p+12>>2]<<3)-s>>3>>>0<d>>>0){r=k;break}c[f>>2]=s+(d<<3);if((s|0)==0){r=c[l>>2]|0;break}c[a>>2]=c[(c[(c[l>>2]|0)+4>>2]|0)-8+4>>2];c[a+4>>2]=s;i=e;return}}while(0);n=r+4|0;q=r|0;o=((c[n>>2]|0)-(c[q>>2]|0)>>3)+1|0;j=c[b+4>>2]|0;b5[c[(c[j>>2]|0)+8>>2]&15](h,j,d);j=nK(24)|0;h=j;m=c[g>>2]|0;s=c[g+4>>2]|0;c[j>>2]=b;c[j+4>>2]=o;o=j+8|0;g=o;c[g>>2]=m;c[g+4>>2]=s;c[j+16>>2]=b+8;b=j+20|0;c[b>>2]=m;m=c[n>>2]|0;if((m|0)==(c[r+8>>2]|0)){s=c[q>>2]|0;cO(r|0,(m|0)==(s|0)?4:m-s>>2);t=c[n>>2]|0}else{t=m}if((t|0)==0){u=0;v=h}else{c[t>>2]=23272;c[t+4>>2]=h;u=c[n>>2]|0;v=0}t=u+8|0;c[n>>2]=t;n=r+16|0;u=(t-(c[q>>2]|0)>>3)+1|0;q=c[r+24>>2]|0;t=n|0;m=c[t>>2]|0;s=q-m|0;if(s>>3>>>0<u>>>0){g=(q|0)==(m|0)?4:s>>2;cN(n,g>>>0<u>>>0?u:g);w=c[t>>2]|0}else{w=m}m=r+20|0;r=c[m>>2]|0;if(r-w>>3>>>0<u>>>0){g=r;n=w;while(1){if((g|0)==0){x=0;y=n}else{s=g;c[s>>2]=0;c[s+4>>2]=0;x=c[m>>2]|0;y=c[t>>2]|0}s=x+8|0;c[m>>2]=s;if(s-y>>3>>>0<u>>>0){g=s;n=y}else{z=s;A=y;break}}}else{z=r;A=w}w=A;if(z-w>>3>>>0>u>>>0){A=z;do{A=A-8|0;}while(A-w>>3>>>0>u>>>0);c[m>>2]=A}c[a>>2]=h;h=c[b>>2]|0;if((c[o>>2]|0)+(c[j+12>>2]<<3)-h>>3>>>0<d>>>0){B=0}else{c[b>>2]=h+(d<<3);B=h}c[a+4>>2]=B;if((v|0)==0){i=e;return}b0[c[c[5818]>>2]&127](23272,v);i=e;return}function cB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=(c[b+68>>2]|0)==0?0:b+64|0;if((d|0)!=0){e=d+4|0;d=c[e>>2]|0;f=c[d+16>>2]|0;g=(c[d+20>>2]|0)-f>>3;d=c[b+40>>2]|0;h=f;i=(c[b+52>>2]|0)-d>>3|0;c[h>>2]=d;c[h+4>>2]=i;i=c[e>>2]|0;e=c[i>>2]|0;h=c[i+4>>2]|0;if((e|0)!=(h|0)){i=e;e=1;while(1){d=c[i+4>>2]|0;j=c[d+8>>2]|0;k=f+(e<<3)|0;l=(c[d+20>>2]|0)-j>>3|0;c[k>>2]=j;c[k+4>>2]=l;l=i+8|0;if((l|0)==(h|0)){break}else{i=l;e=e+1|0}}}c[a>>2]=f;c[a+4>>2]=g;return}if((c[b+32>>2]|0)==0){c[a>>2]=0;c[a+4>>2]=0;return}else{g=b+56|0;f=c[b+40>>2]|0;e=g;i=(c[b+52>>2]|0)-f>>3|0;c[e>>2]=f;c[e+4>>2]=i;c[a>>2]=g;c[a+4>>2]=1;return}}function cC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[e>>2];e=c[b>>2]|0;if((e|0)==0){b=a+32|0;i=d;return((c[b>>2]|0)==0?0:b|0)|0}b=(c[a+68>>2]|0)==0?0:a+64|0;if((b|0)==0){f=0;i=d;return f|0}a=c[b+4>>2]|0;b=c[a>>2]|0;if(e>>>0>(c[a+4>>2]|0)-b>>3>>>0){f=0;i=d;return f|0}f=c[b+(e-1<<3)+4>>2]|0;i=d;return f|0}function cD(a){a=a|0;var b=0;a=i;i=i+8|0;b=a|0;cM(b,11176,238,1,0,0,3080,1728);fD(b);i=a;return}function cE(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=c[b+16>>2]|0;if((c[b+20>>2]|0)-g>>3>>>0<=d>>>0){c[a>>2]=0;c[a+4>>2]=0;i=e;return}b=c[g+(d<<3)+4>>2]|0;if((b|0)==0){c[a>>2]=0;c[a+4>>2]=0;i=e;return}else{b0[c[(c[b>>2]|0)+16>>2]&127](f,b);c[a>>2]=c[f>>2];b=f+4|0;c[a+4>>2]=c[b>>2];c[b>>2]=0;i=e;return}}function cF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;f=c[a+16>>2]|0;if((c[a+20>>2]|0)-f>>3>>>0<=b>>>0){cK(e,11176,260,1,0,928,536,11128);fD(e);i=d;return}e=f+(b<<3)|0;a=c[e>>2]|0;g=f+(b<<3)+4|0;b=c[g>>2]|0;c[e>>2]=0;c[g>>2]=0;if((b|0)==0){i=d;return}b0[c[c[a>>2]>>2]&127](a,b+(c[(c[b>>2]|0)-8>>2]|0)|0);i=d;return}function cG(a,b){a=a|0;b=b|0;if((b|0)==0){return}nM(b);return}function cH(a,b){a=a|0;b=b|0;if((b|0)==0){return}cI(b);nM(b);return}function cI(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=a+16|0;d=c[b>>2]|0;e=a+20|0;f=a+24|0;if((d|0)!=0){g=c[f>>2]|0;h=c[e>>2]|0;c[b>>2]=0;c[e>>2]=0;c[f>>2]=0;f=c[a+28>>2]|0;e=d;cb[c[c[f>>2]>>2]&63](f,d,8,h-e>>3,g-e>>3,0)}e=a|0;g=c[e>>2]|0;h=a+4|0;d=a+8|0;if((g|0)==0){return}f=c[d>>2]|0;b=c[h>>2]|0;c[e>>2]=0;c[h>>2]=0;c[d>>2]=0;d=c[a+12>>2]|0;a=g;cb[c[c[d>>2]>>2]&63](d,g,8,b-a>>3,f-a>>3,244);return}function cJ(a){a=a|0;var b=0,d=0;b=a+4|0;d=c[b>>2]|0;if((d|0)==0){return}c[b>>2]=0;b=c[a>>2]|0;b0[c[c[b>>2]>>2]&127](b,d);return}function cK(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function cL(a){a=a|0;var b=0,d=0;b=a+4|0;d=c[b>>2]|0;if((d|0)==0){return}c[b>>2]=0;b=c[a>>2]|0;b0[c[c[b>>2]>>2]&127](b,d+(c[(c[d>>2]|0)-8>>2]|0)|0);return}function cM(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function cN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=eP(8,0,b,0,0)|0;e=d+(b<<3)|0;f=a+4|0;g=a|0;h=c[g>>2]|0;i=(c[f>>2]|0)-h>>3;j=i>>>0>b>>>0?b:i;if((j|0)==0){k=d;l=h}else{i=d;b=0;m=h;while(1){if((i|0)==0){n=0;o=m}else{h=m+(b<<3)|0;p=i;q=c[h+4>>2]|0;c[p>>2]=c[h>>2];c[p+4>>2]=q;n=i;o=c[g>>2]|0}q=n+8|0;p=b+1|0;if(p>>>0<j>>>0){i=q;b=p;m=o}else{k=q;l=o;break}}}o=a+8|0;if((l|0)==0){r=a+12|0;c[g>>2]=d;c[f>>2]=k;c[o>>2]=e;c[r>>2]=23256;return}else{m=c[o>>2]|0;b=c[f>>2]|0;c[g>>2]=0;c[f>>2]=0;c[o>>2]=0;i=a+12|0;a=c[i>>2]|0;j=l;cb[c[c[a>>2]>>2]&63](a,l,8,b-j>>3,m-j>>3,0);r=i;c[g>>2]=d;c[f>>2]=k;c[o>>2]=e;c[r>>2]=23256;return}}function cO(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=eP(8,0,b,0,0)|0;e=d+(b<<3)|0;f=a+4|0;g=a|0;h=c[g>>2]|0;i=(c[f>>2]|0)-h>>3;j=i>>>0>b>>>0?b:i;if((j|0)==0){k=d;l=h}else{i=d;b=0;m=h;while(1){if((i|0)==0){n=0;o=m}else{c[i>>2]=c[m+(b<<3)>>2];h=m+(b<<3)+4|0;c[i+4>>2]=c[h>>2];c[h>>2]=0;n=i;o=c[g>>2]|0}h=n+8|0;p=b+1|0;if(p>>>0<j>>>0){i=h;b=p;m=o}else{k=h;l=o;break}}}o=a+8|0;if((l|0)==0){q=a+12|0;c[g>>2]=d;c[f>>2]=k;c[o>>2]=e;c[q>>2]=23256;return}else{m=c[o>>2]|0;b=c[f>>2]|0;c[g>>2]=0;c[f>>2]=0;c[o>>2]=0;i=a+12|0;a=c[i>>2]|0;j=l;cb[c[c[a>>2]>>2]&63](a,l,8,b-j>>3,m-j>>3,244);q=i;c[g>>2]=d;c[f>>2]=k;c[o>>2]=e;c[q>>2]=23256;return}}function cP(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;m=i;i=i+56|0;n=m|0;o=m+24|0;p=m+48|0;c[b>>2]=0;q=o|0;r=k|0;s=nV(r|0)|0;eR(q,s);if((c[o+4>>2]|0)==0){t=0}else{t=c[o>>2]|0}u=k+s|0;if((s|0)!=0){s=r;r=t;while(1){t=s+1|0;a[r]=a[s]|0;if((t|0)==(u|0)){break}else{s=t;r=r+1|0}}}r=o+12|0;eV(n,27360,c[l>>2]|0);l=n|0;eR(r,c[l>>2]|0);if((c[o+16>>2]|0)==0){v=0}else{v=c[r>>2]|0}r=c[l>>2]|0;l=n+4+r|0;if((r|0)!=0){r=n+4|0;n=v;while(1){v=r+1|0;a[n]=a[r]|0;if((v|0)==(l|0)){break}else{r=v;n=n+1|0}}}c[p>>2]=q;c[p+4>>2]=2;fF(b,d,e,f,g,h,j,p);p=o+12|0;j=c[p>>2]|0;h=o+16|0;g=c[h>>2]|0;if((j|0)!=0){c[p>>2]=0;c[h>>2]=0;h=c[o+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=o|0;j=c[g>>2]|0;h=o+4|0;p=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[o+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,p,p,0);i=m;return}function cQ(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function cR(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=f;f=i;i=i+6|0;i=i+7&-8;c[f>>2]=c[h>>2];b[f+4>>1]=b[h+4>>1]|0;h=g|0;j=c[e+4>>2]|0;k=c[e>>2]|0;e=b[f>>1]|0;l=b[f+2>>1]|0;f=e&65535;m=(l&65535)+f|0;n=j|0;o=j+4|0;if((c[o>>2]|c[n>>2]|0)!=0){cW(k,j)}L255:do{if((m|0)==0){c[n>>2]=-4;p=j;q=k;r=j}else{s=k+20|0;t=c[s>>2]|0;u=t;do{if((c[k+8>>2]|0)+(c[k+12>>2]<<3)-u>>3>>>0>=m>>>0){c[s>>2]=t+(m<<3);if((t|0)==0){break}c[n>>2]=(u-j>>1)-4;p=t;q=k;r=j;break L255}}while(0);cA(h,c[k>>2]|0,m+1|0);t=c[h>>2]|0;u=c[h+4>>2]|0;c[n>>2]=u-(c[t+8>>2]|0)|2;c[o>>2]=c[t+4>>2];c[u>>2]=0;p=u+8|0;q=t;r=u}}while(0);o=r+4|0;b[o>>1]=e;b[o+2>>1]=l;c[d>>2]=q;c[d+4>>2]=p;c[d+8>>2]=p+(f<<3);c[d+12>>2]=f<<6;b[d+16>>1]=l;a[d+18|0]=0;i=g;return}function cS(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;h=f;f=i;i=i+6|0;i=i+7&-8;c[f>>2]=c[h>>2];b[f+4>>1]=b[h+4>>1]|0;h=g|0;j=c[d+4>>2]|0;k=c[d>>2]|0;d=h;l=f;b[d>>1]=b[l>>1]|0;b[d+2>>1]=b[l+2>>1]|0;b[d+4>>1]=b[l+4>>1]|0;cT(a,j,k,e,h,0);i=g;return}function cT(d,e,f,g,h,j){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+32|0;l=h;h=i;i=i+6|0;i=i+7&-8;c[h>>2]=c[l>>2];b[h+4>>1]=b[l+4>>1]|0;l=k|0;m=k+8|0;n=k+16|0;o=k+24|0;c[n>>2]=e;c[o>>2]=f;p=a[h+4|0]|0;if(p<<24>>24==7){q=b[h>>1]|0;r=q&65535;s=b[h+2>>1]|0;h=(s&65535)+r|0;t=ag(h,g)|0;u=dv(n,o,t+1|0,1,j)|0;c[(c[n>>2]|0)+4>>2]=t<<3|7;c[u>>2]=g<<2;t=u+4|0;b[t>>1]=q;b[t+2>>1]=s;c[d>>2]=c[o>>2];c[d+4>>2]=u+8;c[d+8>>2]=g;c[d+12>>2]=h<<6;c[d+16>>2]=r<<6;b[d+20>>1]=s;i=k;return}else{c[l>>2]=e;c[m>>2]=f;f=p&255;e=c[22880+(f<<2)>>2]|0;s=p<<24>>24==6;p=e+((s&1)<<6)|0;r=n7(p,0,g,0)|0;h=nZ(r,K,63,0)|0;r=dv(l,m,h>>>6|K<<26,1,j)|0;c[(c[l>>2]|0)+4>>2]=f|g<<3;c[d>>2]=c[m>>2];c[d+4>>2]=r;c[d+8>>2]=g;c[d+12>>2]=p;c[d+16>>2]=e;b[d+20>>1]=s&1;i=k;return}}function cU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=i;i=i+8|0;e=b;b=i;i=i+8|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];e=d|0;f=c[a+4>>2]|0;g=c[a>>2]|0;a=b;b=c[a>>2]|0;h=c[a+4>>2]|0;a=0;j=h;k=(j+7|0)>>>3;l=f|0;m=f+4|0;if((c[m>>2]|c[l>>2]|0)!=0){cW(g,f)}n=g+20|0;o=c[n>>2]|0;p=o;do{if((c[g+8>>2]|0)+(c[g+12>>2]<<3)-p>>3>>>0>=k>>>0){c[n>>2]=o+(k<<3);if((o|0)==0){break}c[l>>2]=(p-f>>1)-4|1;q=o;r=f;s=h<<3|0>>>29;t=a<<3|h>>>29;u=s;v=u;w=v|2;x=r+4|0;c[x>>2]=w;y=q;z=j-1|0;nX(y|0,b|0,z)|0;i=d;return}}while(0);cA(e,c[g>>2]|0,k+1|0);k=c[e>>2]|0;g=c[e+4>>2]|0;c[l>>2]=g-(c[k+8>>2]|0)|2;c[m>>2]=c[k+4>>2];c[g>>2]=1;q=g+8|0;r=g;s=h<<3|0>>>29;t=a<<3|h>>>29;u=s;v=u;w=v|2;x=r+4|0;c[x>>2]=w;y=q;z=j-1|0;nX(y|0,b|0,z)|0;i=d;return}function cV(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+56|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=c[6826]|0;if((n|0)==0){dy(f,10760,1845,0,0,9896,9696,9504);fE(f)}f=c[d>>2]|0;o=c[d+4>>2]|0;if((o|f|0)==0){d=c[c[n>>2]>>2]|0;c[g>>2]=9440;c[g+4>>2]=33;b5[d&15](a,n,g);i=e;return}if((f|0)!=3){dx(h,10760,1851,0,0,0,9352,9272);fD(h);h=c[6826]|0;f=c[c[h>>2]>>2]|0;c[j>>2]=9176;c[j+4>>2]=60;b5[f&15](a,h,j);i=e;return}j=c[b>>2]|0;b5[c[(c[j>>2]|0)+16>>2]&15](k,j,o);o=c[k>>2]|0;j=k+4|0;k=c[j>>2]|0;c[j>>2]=0;if((k|0)!=0){c[a>>2]=o;c[a+4>>2]=k;i=e;return}dr(l,10760,1859,0,0,0,9128,9072);fD(l);l=c[6826]|0;k=c[c[l>>2]>>2]|0;c[m>>2]=9024;c[m+4>>2]=36;b5[k&15](a,l,m);i=e;return}function cW(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;h=b|0;j=c[h>>2]|0;k=j&3;if((k|0)==0|(k|0)==1){c9(a,b,b+((j>>2)+1<<3)|0);i=d;return}else if((k|0)==3){if((j|0)==3){cF(c[a>>2]|0,c[b+4>>2]|0);i=d;return}else{dw(g,10760,484,0,0,0,10176,10144);fD(g);i=d;return}}else if((k|0)==2){k=c[a>>2]|0;c[e>>2]=c[b+4>>2];b=cz(k,e)|0;e=c[h>>2]|0;h=e>>>3;k=c[b+8>>2]|0;a=k+(h<<3)|0;g=a;if((e&4|0)==0){cW(b,g);e=a|0;c[e>>2]=0;c[e+4>>2]=0;i=d;return}else{e=c[b>>2]|0;c[f>>2]=c[g+4>>2];g=cz(e,f)|0;c9(g,k+(h+1<<3)|0,(c[g+8>>2]|0)+((c[a>>2]|0)>>>3<<3)|0);g=a;nW(g|0,0,16)|0;i=d;return}}else{i=d;return}}function cX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[b+4>>2]|0;f=(e|0)==0?27312:e;c5(a,c[b>>2]|0,f,f+((c[f>>2]>>2)+1<<3)|0,d,c[b+8>>2]|0);return}function cY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=c[b+4>>2]|0;g=(f|0)==0?27312:f;c6(a,c[b>>2]|0,g,g+((c[g>>2]>>2)+1<<3)|0,e,d,c[b+8>>2]|0);return}function cZ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=c[b+4>>2]|0;g=(f|0)==0?27312:f;c7(a,c[b>>2]|0,g,g+((c[g>>2]>>2)+1<<3)|0,d,e);return}function c_(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=c[b+4>>2]|0;g=(f|0)==0?27312:f;c8(a,c[b>>2]|0,g,g+((c[g>>2]>>2)+1<<3)|0,d,e);return}function c$(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;cV(a,c[b>>2]|0,(d|0)==0?27312:d,0);return}function c0(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;if((c[a>>2]|0)==0){i=b;return c[a+4>>2]|0}dd(d,10760,2253,0,0,5232,3920,2744);fE(d);return 0}function c1(a){a=a|0;var b=0,d=0;b=c[a+4>>2]|0;if((b|0)==0){d=1;return d|0}d=(c[b+4>>2]|c[b>>2]|0)==0;return d|0}function c2(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[e+4>>2]|0;g=c[e+8>>2]|0;h=c[e+12>>2]|0;i=b[e+16>>1]|0;j=a[e+18|0]|0;c[d>>2]=c[e>>2];c[d+4>>2]=f;c[d+8>>2]=g;c[d+12>>2]=h;b[d+16>>1]=i;a[d+18|0]=j;c[d+20>>2]=2147483647;return}function c3(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=n7(c[e+12>>2]|0,0,f,0)|0;f=c[e+4>>2]|0;h=g>>>3|K<<29;i=c[e+16>>2]|0;j=b[e+20>>1]|0;c[d>>2]=c[e>>2];c[d+4>>2]=f+h;c[d+8>>2]=f+(h+(i>>>3));c[d+12>>2]=i;b[d+16>>1]=j;a[d+18|0]=g&7;return}function c4(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=c[e+24>>2]|0;if((j|0)>0){k=n7(c[e+12>>2]|0,0,f,0)|0;f=c[e+4>>2]|0;l=k>>>3|K<<29;m=c[e+16>>2]|0;n=b[e+20>>1]|0;c[d>>2]=c[e>>2];c[d+4>>2]=f+l;c[d+8>>2]=f+(l+(m>>>3));c[d+12>>2]=m;b[d+16>>1]=n;a[d+18|0]=k&7;c[d+20>>2]=j-1;i=g;return}else{df(h,10760,2477,0,0,9480,8872,8736);j=d+20|0;k=d;nW(k|0,0,19)|0;c[j>>2]=2147483647;fD(h);i=g;return}}function c5(d,e,f,g,h,j){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;k=i;i=i+40|0;l=k|0;m=k+8|0;n=k+16|0;o=k+24|0;p=k+32|0;c[l>>2]=e;c[m>>2]=f;if((c[f+4>>2]|c[f>>2]|0)==0){q=h;r=354}else{s=g;t=h}L345:while(1){if((r|0)==354){r=0;if((q|0)==0){r=356;break}h=q;g=q;if((c[h+4>>2]|c[g>>2]|0)==0){r=356;break}c[l>>2]=0;c[m>>2]=h;s=q+((c[g>>2]>>2)+1<<3)|0;t=0}if((j|0)<=0){df(n,10760,1811,0,0,9480,8872,8736);fD(n);q=t;r=354;continue}u=dg(m,s,l)|0;if((u|0)==0){q=t;r=354;continue}g=c[m>>2]|0;if((c[g>>2]&3|0)!=0){du(o,10760,1822,0,0,1688,1592,1344);fD(o);q=t;r=354;continue}h=c[l>>2]|0;f=g+4|0;g=b[f>>1]|0;e=b[f+2>>1]|0;f=(e&65535)+(g&65535)|0;if((h|0)==0){v=0;w=g;x=e;break}e=c[h+8>>2]|0;do{if(e>>>0<=u>>>0){if((e+(c[h+12>>2]<<3)|0)>>>0<(u+(f<<3)|0)>>>0){break}g=c[h>>2]|0;y=c[h+16>>2]|0;z=c[y>>2]|0;A=c[y+4>>2]|0;B=f;C=0;if(!(C>>>0>A>>>0|C>>>0==A>>>0&B>>>0>z>>>0)){r=368;break L345}b$[c[(c[g>>2]|0)+12>>2]&511](g)}}while(0);dt(p,10760,1827,0,0,1264,1152,1056);fD(p);q=t;r=354}if((r|0)==368){t=n_(z,A,B,C)|0;c[y>>2]=t;c[y+4>>2]=K;y=(c[m>>2]|0)+4|0;v=c[l>>2]|0;w=b[y>>1]|0;x=b[y+2>>1]|0}else if((r|0)==356){r=d+20|0;y=d;nW(y|0,0,19)|0;c[r>>2]=2147483647;i=k;return}r=w&65535;c[d>>2]=v;c[d+4>>2]=u;c[d+8>>2]=u+(r<<3);c[d+12>>2]=r<<6;b[d+16>>1]=x;a[d+18|0]=0;c[d+20>>2]=j-1;i=k;return}function c6(a,d,e,f,g,h,j){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;k=i;i=i+96|0;l=k|0;m=k+8|0;n=k+16|0;o=k+24|0;p=k+32|0;q=k+40|0;r=k+48|0;s=k+56|0;t=k+64|0;u=k+72|0;v=k+80|0;w=k+88|0;c[l>>2]=d;c[m>>2]=e;if((c[e+4>>2]|c[e>>2]|0)==0){x=g;y=375}else{z=f;A=g}L371:while(1){if((y|0)==375){y=0;if((x|0)==0){y=377;break}g=x;f=x;if((c[g+4>>2]|c[f>>2]|0)==0){y=377;break}c[l>>2]=0;c[m>>2]=g;z=x+((c[f>>2]>>2)+1<<3)|0;A=0}if((j|0)<=0){df(n,10760,1889,0,0,9480,8872,8736);fD(n);x=A;y=375;continue}B=dg(m,z,l)|0;if((B|0)==0){x=A;y=375;continue}f=c[m>>2]|0;if((c[f>>2]&3|0)!=1){ds(o,10760,1900,0,0,7928,4336,4248);fD(o);x=A;y=375;continue}g=c[f+4>>2]|0;f=g&7;if(f<<24>>24!=7){C=c[22880+((f&255)<<2)>>2]|0;D=f<<24>>24==6;E=C+((D&1)<<6)|0;f=c[l>>2]|0;e=n7(E,0,g>>>3,0)|0;d=nZ(e,K,63,0)|0;e=K;F=d>>>6|e<<26;d=e>>>6|0<<26;e=B+(F<<3)|0;L386:do{if((f|0)!=0){G=c[f+8>>2]|0;do{if(G>>>0<=B>>>0){if((G+(c[f+12>>2]<<3)|0)>>>0<e>>>0){break}H=c[f>>2]|0;I=c[f+16>>2]|0;J=c[I>>2]|0;L=c[I+4>>2]|0;M=F&536870911;N=d&0;if(N>>>0>L>>>0|N>>>0==L>>>0&M>>>0>J>>>0){b$[c[(c[H>>2]|0)+12>>2]&511](H);break}else{H=n_(J,L,M,N)|0;c[I>>2]=H;c[I+4>>2]=K;break L386}}}while(0);dr(u,10760,1983,0,0,2256,4080,3824);fD(u);x=A;y=375;continue L371}}while(0);if((c[22880+((h&255)<<2)>>2]|0)>>>0>C>>>0){dn(v,10760,1998,0,0,2144,2048,1928);fD(v);x=A;y=375;continue}if(!(h<<24>>24==6&(D^1))){y=414;break}dn(w,10760,2002,0,0,1840,2048,1928);fD(w);x=A;y=375;continue}d=g>>>3;F=B;f=B+8|0;e=c[l>>2]|0;G=d+1|0;I=B+(G<<3)|0;L401:do{if((e|0)!=0){H=c[e+8>>2]|0;do{if(H>>>0<=B>>>0){if((H+(c[e+12>>2]<<3)|0)>>>0<I>>>0){break}N=c[e>>2]|0;M=c[e+16>>2]|0;L=c[M>>2]|0;J=c[M+4>>2]|0;O=G;P=0;if(P>>>0>J>>>0|P>>>0==J>>>0&O>>>0>L>>>0){b$[c[(c[N>>2]|0)+12>>2]&511](N);break}else{N=n_(L,J,O,P)|0;c[M>>2]=N;c[M+4>>2]=K;break L401}}}while(0);dr(p,10760,1915,0,0,4128,4080,3824);fD(p);x=A;y=375;continue L371}}while(0);G=c[B>>2]|0;if((G&3|0)!=0){cQ(q,10760,1920,0,0,3768,3568,3488);fD(q);x=A;y=375;continue}Q=G>>>2;G=F+4|0;e=b[G>>1]|0;R=e&65535;S=b[G+2>>1]|0;T=(S&65535)+R|0;if((ag(T,Q)|0)>>>0>d>>>0){dq(r,10760,1928,0,0,3432,3368,3272);fD(r);x=A;y=375;continue}switch(h<<24>>24){case 1:case 2:case 3:case 4:case 5:{if(e<<16>>16!=0){U=f;break L371}ds(s,10760,1948,0,0,3184,3008,2912);fD(s);x=A;y=375;continue L371;break};case 6:{if(S<<16>>16!=0){y=400;break L371}dp(t,10760,1959,0,0,2672,2584,2400);fD(t);x=A;y=375;continue L371;break};default:{U=f;break L371}}}if((y|0)==414){A=(c[(c[m>>2]|0)+4>>2]|0)>>>3;c[a>>2]=c[l>>2];c[a+4>>2]=B;c[a+8>>2]=A;c[a+12>>2]=E;c[a+16>>2]=C;b[a+20>>1]=D&1;c[a+24>>2]=j-1;i=k;return}else if((y|0)==377){D=a+24|0;C=a;nW(C|0,0,22)|0;c[D>>2]=2147483647;i=k;return}else if((y|0)==400){U=B+(R+1<<3)|0}c[a>>2]=c[l>>2];c[a+4>>2]=U;c[a+8>>2]=Q;c[a+12>>2]=T<<6;c[a+16>>2]=R<<6;b[a+20>>1]=S;c[a+24>>2]=j-1;i=k;return}function c7(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;j=i;i=i+56|0;k=j|0;l=j+8|0;m=j+16|0;n=j+24|0;o=j+32|0;p=j+40|0;q=j+48|0;c[k>>2]=d;c[l>>2]=e;L431:do{if((c[e+4>>2]|c[e>>2]|0)!=0){d=dg(l,f,k)|0;if((d|0)==0){break}r=c[l>>2]|0;s=c[r+4>>2]|0;t=s>>>3;if((c[r>>2]&3|0)!=1){dj(m,10760,2035,0,0,7928,5024,4856);fD(m);break}if((s&7|0)!=2){di(n,10760,2040,0,0,7664,4672,4512);fD(n);break}s=c[k>>2]|0;r=(t+7|0)>>>3;u=d+(r<<3)|0;L440:do{if((s|0)!=0){v=c[s+8>>2]|0;do{if(v>>>0<=d>>>0){if((v+(c[s+12>>2]<<3)|0)>>>0<u>>>0){break}w=c[s>>2]|0;x=c[s+16>>2]|0;y=c[x>>2]|0;z=c[x+4>>2]|0;A=r;B=0;if(B>>>0>z>>>0|B>>>0==z>>>0&A>>>0>y>>>0){b$[c[(c[w>>2]|0)+12>>2]&511](w);break}else{w=n_(y,z,A,B)|0;c[x>>2]=w;c[x+4>>2]=K;break L440}}}while(0);dh(o,10760,2046,0,0,7232,4456,4408);fD(o);break L431}}while(0);if((t|0)==0){de(p,10760,2050,0,0,10968,10576,10208);fD(p);break}r=d;if((a[r+(t-1)|0]|0)!=0){de(q,10760,2057,0,0,10024,10576,10208);fD(q);break}c[b>>2]=r;c[b+4>>2]=t;i=j;return}}while(0);c[b>>2]=(g|0)==0?23336:g;c[b+4>>2]=h+1;i=j;return}function c8(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;h=i;i=i+40|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=h+32|0;c[j>>2]=b;c[k>>2]=d;L460:do{if((c[d+4>>2]|c[d>>2]|0)!=0){b=dg(k,e,j)|0;if((b|0)==0){break}o=c[k>>2]|0;p=c[o+4>>2]|0;q=p>>>3;if((c[o>>2]&3|0)!=1){dj(l,10760,2088,0,0,7928,7808,7736);fD(l);break}if((p&7|0)!=2){di(m,10760,2093,0,0,7664,7576,7480);fD(m);break}p=c[j>>2]|0;o=(q+7|0)>>>3;r=b+(o<<3)|0;L469:do{if((p|0)!=0){s=c[p+8>>2]|0;do{if(s>>>0<=b>>>0){if((s+(c[p+12>>2]<<3)|0)>>>0<r>>>0){break}t=c[p>>2]|0;u=c[p+16>>2]|0;v=c[u>>2]|0;w=c[u+4>>2]|0;x=o;y=0;if(y>>>0>w>>>0|y>>>0==w>>>0&x>>>0>v>>>0){b$[c[(c[t>>2]|0)+12>>2]&511](t);break}else{t=n_(v,w,x,y)|0;c[u>>2]=t;c[u+4>>2]=K;break L469}}}while(0);dh(n,10760,2099,0,0,7232,7096,6920);fD(n);break L460}}while(0);c[a>>2]=b;c[a+4>>2]=q;i=h;return}}while(0);c[a>>2]=f;c[a+4>>2]=g;i=h;return}function c9(a,d,f){a=a|0;d=d|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+24|0;h=g|0;j=g+8|0;k=g+16|0;l=c[d>>2]&3;if((l|0)==0){m=d+4|0;n=m;o=b[n>>1]|0;p=o&65535;q=m+2|0;m=b[q>>1]|0;r=m&65535;if(m<<16>>16==0){s=o;t=0}else{o=0;do{cW(a,f+(o+p<<3)|0);o=o+1|0;}while(o>>>0<r>>>0);s=b[n>>1]|0;t=e[q>>1]|0}q=f;n=t+(s&65535)<<3;nW(q|0,0,n|0)|0;i=g;return}else if((l|0)==3){da(k,10760,557,1,0,0,8e3,7968);fD(k);i=g;return}else if((l|0)==1){k=c[d+4>>2]|0;switch(k&7){case 7:{d=c[f>>2]|0;if((d&3|0)!=0){dc(h,10760,529,1,0,8568,8368,8224);fE(h)}h=f+4|0;n=h;q=b[n>>1]|0;s=q&65535;t=h+2|0;h=b[t>>1]|0;r=h&65535;o=f+8|0;p=d>>>2;do{if((p|0)==0){u=q;v=h}else{if(h<<16>>16==0){u=q;v=0;break}d=s+r|0;m=o;w=0;while(1){x=m+(s<<3)|0;y=0;while(1){cW(a,x);z=y+1|0;if(z>>>0<r>>>0){x=x+8|0;y=z}else{break}}y=w+1|0;if(y>>>0<p>>>0){m=m+(d<<3)|0;w=y}else{break}}u=b[n>>1]|0;v=b[t>>1]|0}}while(0);t=f;n=(ag(p<<3,(v&65535)+(u&65535)|0)|0)+8|0;nW(t|0,0,n|0)|0;i=g;return};case 1:case 2:case 3:case 4:case 5:{n=f;t=n7(k>>>3,0,c[22880+((k&7)<<2)>>2]|0,0)|0;u=nZ(t,K,63,0)|0;t=(u>>>6|K<<26)<<3|0>>>29;nW(n|0,0,t|0)|0;i=g;return};case 6:{t=k>>>3;if((t|0)!=0){k=0;do{cW(a,f+(k<<3)|0);k=k+1|0;}while(k>>>0<t>>>0)}k=f;f=t<<3;nW(k|0,0,f|0)|0;i=g;return};default:{i=g;return}}}else if((l|0)==2){db(j,10760,552,1,0,0,8160,8128);fD(j);i=g;return}else{i=g;return}}function da(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function db(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dc(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dd(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function de(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function df(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+40|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=c[d>>2]|0;if((l|0)==0){m=b;i=e;return m|0}n=c[a>>2]|0;if((c[n>>2]&3|0)!=2){m=b;i=e;return m|0}b=c[l>>2]|0;l=c[(c[b>>2]|0)+8>>2]|0;c[f>>2]=c[n+4>>2];n=b1[l&31](b,f)|0;c[d>>2]=n;if((n|0)==0){dm(g,10760,419,0,0,6848,6672,6456);fD(g);m=0;i=e;return m|0}g=c[n+8>>2]|0;f=c[c[a>>2]>>2]|0;b=f>>>3;l=g+(b<<3)|0;o=f>>>2&1;f=b+1|0;do{if((c[n+12>>2]|0)>=(f+o|0)){b=c[n>>2]|0;p=c[n+16>>2]|0;q=c[p>>2]|0;r=c[p+4>>2]|0;s=((o<<3)+8|0)>>>3;t=0;if(t>>>0>r>>>0|t>>>0==r>>>0&s>>>0>q>>>0){b$[c[(c[b>>2]|0)+12>>2]&511](b);break}b=n_(q,r,s,t)|0;c[p>>2]=b;c[p+4>>2]=K;p=l;if((c[c[a>>2]>>2]&4|0)==0){c[a>>2]=p;m=g+(f+(c[l>>2]>>2)<<3)|0;i=e;return m|0}c[a>>2]=g+(f<<3);b=c[c[d>>2]>>2]|0;t=c[(c[b>>2]|0)+8>>2]|0;c[j>>2]=c[p+4>>2];p=b1[t&31](b,j)|0;c[d>>2]=p;if((p|0)==0){dk(k,10760,444,0,0,6848,5720,5520);fD(k);m=0;i=e;return m|0}else{m=(c[p+8>>2]|0)+((c[l>>2]|0)>>>3<<3)|0;i=e;return m|0}}}while(0);dl(h,10760,427,0,0,6200,6040,5848);fD(h);m=0;i=e;return m|0}function dh(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function di(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dk(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dl(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dm(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dn(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dp(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dq(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dr(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function ds(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dt(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function du(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dv(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+16|0;h=g|0;j=g+8|0;if((f|0)!=0){cA(j,f,d);c[b>>2]=c[j>>2];c[c[a>>2]>>2]=e|-4;k=c[j+4>>2]|0;i=g;return k|0}j=c[a>>2]|0;if((c[j+4>>2]|c[j>>2]|0)!=0){cW(c[b>>2]|0,j)}if((e|d|0)==0){c[c[a>>2]>>2]=-4;k=c[a>>2]|0;i=g;return k|0}j=c[b>>2]|0;f=j+20|0;l=c[f>>2]|0;m=l;do{if((c[j+8>>2]|0)+(c[j+12>>2]<<3)-m>>3>>>0<d>>>0){n=j}else{c[f>>2]=l+(d<<3);if((l|0)==0){n=c[b>>2]|0;break}o=c[a>>2]|0;c[o>>2]=(m-o>>1)-4|e;k=l;i=g;return k|0}}while(0);cA(h,c[n>>2]|0,d+1|0);d=c[h>>2]|0;c[b>>2]=d;n=c[h+4>>2]|0;c[c[a>>2]>>2]=n-(c[d+8>>2]|0)|2;c[(c[a>>2]|0)+4>>2]=c[(c[b>>2]|0)+4>>2];c[a>>2]=n;c[n>>2]=e;k=n+8|0;i=g;return k|0}function dw(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dx(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dy(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dz(b){b=b|0;var d=0;c[b>>2]=14384;if((a[b+76|0]&1)==0){d=b;nM(d);return}cy(b+4|0);d=b;nM(d);return}function dA(b){b=b|0;c[b>>2]=14384;if((a[b+76|0]&1)==0){return}cy(b+4|0);return}function dB(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+32|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=b+76|0;k=b+4|0;l=k;if((a[j]&1)!=0){c[e>>2]=0;m=cz(l,e)|0;i=d;return m|0}if((k|0)!=0){cw(l,b)}a[j]=1;cA(f,l,1);l=c[f>>2]|0;if((c[l+4>>2]|0)!=0){dj(g,9e3,86,1,0,5176,4e3,2824);fE(g);return 0}if((c[f+4>>2]|0)==(c[l+8>>2]|0)){m=l;i=d;return m|0}dL(h,9e3,88,1,0,1504,816,432);fE(h);return 0}function dC(a,b){a=a|0;b=b|0;var d=0;d=dB(b)|0;b=c[d+8>>2]|0;c[a>>2]=d;c[a+4>>2]=b;return}function dD(b,d,e){b=b|0;d=d|0;e=e|0;a[b+76|0]=0;c[b>>2]=14312;c[b+80>>2]=d;a[b+84|0]=e;a[b+85|0]=1;a[b+86|0]=0;c[b+88>>2]=0;c[b+92>>2]=0;c[b+96>>2]=0;return}function dE(a){a=a|0;dF(a);nM(a);return}function dF(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=b|0;c[g>>2]=14312;do{if((a[b+86|0]&1)==0){h=b+96|0}else{do{if((a[b+85|0]&1)==0){if((a[b+76|0]&1)==0){c[e>>2]=0;c[e+4>>2]=0;break}cB(e,b+4|0);if((c[e+4>>2]|0)==0){break}j=c[e>>2]|0;k=c[j>>2]|0;if((k|0)==(c[b+88>>2]|0)){l=c[j+4>>2]<<3;nW(k|0,0,l|0)|0;break}dK(f,9e3,170,1,0,8696,8488,8288);fE(f)}else{nF(c[b+88>>2]|0)}}while(0);l=b+96|0;k=(c[l>>2]|0)==0?0:b+92|0;if((k|0)==0){h=l;break}j=c[k+4>>2]|0;k=c[j>>2]|0;m=c[j+4>>2]|0;if((k|0)==(m|0)){h=l;break}else{n=k}while(1){nF(c[n>>2]|0);k=n+4|0;if((k|0)==(m|0)){h=l;break}else{n=k}}}}while(0);n=c[h>>2]|0;if((n|0)!=0){c[h>>2]=0;h=c[b+92>>2]|0;b0[c[c[h>>2]>>2]&127](h,n)}c[g>>2]=14384;if((a[b+76|0]&1)==0){i=d;return}cy(b+4|0);i=d;return}function dG(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+24|0;g=f|0;h=f+8|0;j=f+16|0;k=d+86|0;l=(a[k]&1)==0;do{if(l){m=d+85|0;if((a[m]&1)!=0){break}n=c[d+80>>2]|0;if(n>>>0<e>>>0){a[m]=1;break}m=c[d+88>>2]|0;a[k]=1;o=b;c[o>>2]=m;c[o+4>>2]=n;i=f;return}}while(0);n=d+80|0;o=c[n>>2]|0;m=o>>>0>e>>>0?o:e;c[g>>2]=m;e=nG(m,8)|0;c[h>>2]=e;if((e|0)==0){dJ(j,9e3,200,2,12,8192,8152,g);fE(j)}do{if(l){c[d+88>>2]=e;a[k]=1;if((a[d+84|0]|0)!=1){break}c[n>>2]=m}else{j=d+92|0;g=d+96|0;o=c[g>>2]|0;p=(o|0)==0;q=p?0:j|0;do{if((q|0)==0){r=nK(12)|0;s=r;t=r;c[t>>2]=0;c[t+4>>2]=0;c[r>>2]=0;c[r+4>>2]=0;c[r+8>>2]=0;r=j|0;t=c[r>>2]|0;c[r>>2]=23264;c[g>>2]=s;if(p){u=s;break}b0[c[c[t>>2]>>2]&127](t,o);u=s}else{u=c[q+4>>2]|0}}while(0);q=u+4|0;o=c[q>>2]|0;if((o|0)==(c[u+8>>2]|0)){dI(u|0,h)}else{if((o|0)==0){v=0}else{c[o>>2]=e;v=c[q>>2]|0}c[q>>2]=v+4}if((a[d+84|0]|0)!=1){break}c[n>>2]=(c[n>>2]|0)+m}}while(0);c[b>>2]=c[h>>2];c[b+4>>2]=m;i=f;return}function dH(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((b|0)==0){return}a=c[b>>2]|0;d=a;if((a|0)!=0){e=b+4|0;f=c[e>>2]|0;if((a|0)!=(f|0)){c[e>>2]=f+(~((f-4+(-d|0)|0)>>>2)<<2)}nM(a)}nM(b);return}function dI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=f;h=(c[d>>2]|0)-g|0;i=h>>2;j=i+1|0;if(j>>>0>1073741823>>>0){ld(0)}k=a+8|0;a=(c[k>>2]|0)-g|0;if(a>>2>>>0>536870910>>>0){l=1073741823;m=1013}else{g=a>>1;a=g>>>0<j>>>0?j:g;if((a|0)==0){n=0;o=0}else{l=a;m=1013}}if((m|0)==1013){n=nK(l<<2)|0;o=l}l=n+(i<<2)|0;i=n+(o<<2)|0;if((l|0)!=0){c[l>>2]=c[b>>2]}b=n+(j<<2)|0;j=n;l=f;nX(j|0,l|0,h)|0;c[e>>2]=n;c[d>>2]=b;c[k>>2]=i;if((f|0)==0){return}nM(l);return}function dJ(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0;l=i;i=i+48|0;m=l|0;n=l+24|0;o=l+40|0;c[b>>2]=0;p=n|0;eV(m,27352,c[k>>2]|0);k=m|0;eR(p,c[k>>2]|0);if((c[n+4>>2]|0)==0){q=0}else{q=c[n>>2]|0}r=c[k>>2]|0;k=m+4+r|0;if((r|0)!=0){r=m+4|0;m=q;while(1){q=r+1|0;a[m]=a[r]|0;if((q|0)==(k|0)){break}else{r=q;m=m+1|0}}}c[o>>2]=p;c[o+4>>2]=1;fF(b,d,e,f,g,h,j,o);o=n|0;j=c[o>>2]|0;h=n+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[o>>2]=0;c[h>>2]=0;h=c[n+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dK(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dL(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dM(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function dN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+40|0;e=d|0;f=d+24|0;g=c[(c[b>>2]|0)+8>>2]|0;c[f>>2]=0;c[f+4>>2]=g;c[f+8>>2]=2147483647;g=e;cX(e,f,0);f=a;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];i=d;return}function dO(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=c[b>>2]|0;b=c[j+24>>2]|0;L1056:do{if((b|0)!=0){k=c[j+16>>2]|0;l=b;m=0;while(1){n=(m+l|0)>>>1;o=c[k+(n<<2)>>2]|0;p=o|0;q=c[p>>2]|0;r=c[p+4>>2]|0;if((q|0)==(d|0)&(r|0)==(e|0)){break}p=r>>>0<e>>>0|r>>>0==e>>>0&q>>>0<d>>>0;l=p?l:n;m=p?n+1|0:m;if(m>>>0>=l>>>0){break L1056}}l=c[o+40>>2]|0;if((l|0)==0){s=a|0;c[s>>2]=o;i=f;return}b0[c[c[l>>2]>>2]&127](l,o);s=a|0;c[s>>2]=o;i=f;return}}while(0);eS(h,d,e);d5(g,8424,213,0,0,0,10296,8032,h);fE(g)}function dP(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+112|0;f=e|0;g=e+16|0;h=e+40|0;j=e+56|0;k=e+80|0;l=e+96|0;m=e+104|0;n=d|0;d=c[(c[n>>2]|0)+8>>2]|0;c[k>>2]=0;c[k+4>>2]=d;c[k+8>>2]=2147483647;cX(j,k,0);do{if((c[j+12>>2]|0)>>>0>=112>>>0){if((b[(c[j+4>>2]|0)+12>>1]|0)!=1){break}c[a>>2]=c[n>>2];i=e;return}}while(0);j=c[(c[n>>2]|0)+8>>2]|0;c[h>>2]=0;c[h+4>>2]=j;c[h+8>>2]=2147483647;cX(g,h,0);h=(b[g+16>>1]|0)==0;j=h?2147483647:c[g+20>>2]|0;n=h?0:c[g+8>>2]|0;c[f>>2]=h?0:c[g>>2]|0;c[f+4>>2]=n;c[f+8>>2]=j;cZ(m,f,0,0);d4(l,8424,219,0,0,6984,5088,3872,m);c[a>>2]=23064;fD(l);i=e;return}function dQ(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+112|0;f=e|0;g=e+16|0;h=e+40|0;j=e+56|0;k=e+80|0;l=e+96|0;m=e+104|0;n=d|0;d=c[(c[n>>2]|0)+8>>2]|0;c[k>>2]=0;c[k+4>>2]=d;c[k+8>>2]=2147483647;cX(j,k,0);do{if((c[j+12>>2]|0)>>>0>=112>>>0){if((b[(c[j+4>>2]|0)+12>>1]|0)!=2){break}c[a>>2]=c[n>>2];i=e;return}}while(0);j=c[(c[n>>2]|0)+8>>2]|0;c[h>>2]=0;c[h+4>>2]=j;c[h+8>>2]=2147483647;cX(g,h,0);h=(b[g+16>>1]|0)==0;j=h?2147483647:c[g+20>>2]|0;n=h?0:c[g+8>>2]|0;c[f>>2]=h?0:c[g>>2]|0;c[f+4>>2]=n;c[f+8>>2]=j;cZ(m,f,0,0);d3(l,8424,227,0,0,2720,1416,768,m);c[a>>2]=23112;fD(l);i=e;return}function dR(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+112|0;f=e|0;g=e+16|0;h=e+40|0;j=e+56|0;k=e+80|0;l=e+96|0;m=e+104|0;n=d|0;d=c[(c[n>>2]|0)+8>>2]|0;c[k>>2]=0;c[k+4>>2]=d;c[k+8>>2]=2147483647;cX(j,k,0);do{if((c[j+12>>2]|0)>>>0>=112>>>0){if((b[(c[j+4>>2]|0)+12>>1]|0)!=3){break}c[a>>2]=c[n>>2];i=e;return}}while(0);j=c[(c[n>>2]|0)+8>>2]|0;c[h>>2]=0;c[h+4>>2]=j;c[h+8>>2]=2147483647;cX(g,h,0);h=(b[g+16>>1]|0)==0;j=h?2147483647:c[g+20>>2]|0;n=h?0:c[g+8>>2]|0;c[f>>2]=h?0:c[g>>2]|0;c[f+4>>2]=n;c[f+8>>2]=j;cZ(m,f,0,0);d2(l,8424,235,0,0,400,10984,10632,m);c[a>>2]=23016;fD(l);i=e;return}function dS(a,b){a=a|0;b=b|0;var d=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;i=i+120|0;f=d|0;g=d+32|0;h=d+48|0;j=d+72|0;k=b|0;b=c[(c[k>>2]|0)+8>>2]|0;c[j>>2]=0;c[j+4>>2]=b;c[j+8>>2]=2147483647;cX(h,j,0);j=c[h+4>>2]|0;b=c[h+12>>2]|0;l=c[k>>2]|0;if((e[h+16>>1]|0)>>>0>3>>>0){m=c[h>>2]|0;n=(c[h+8>>2]|0)+24|0;o=c[h+20>>2]|0}else{m=0;n=0;o=2147483647}c[g>>2]=m;c[g+4>>2]=n;c[g+8>>2]=o;o=f;cY(f,g,7,0);g=d+88|0;c[g>>2]=c[o>>2];c[g+4>>2]=c[o+4>>2];c[g+8>>2]=c[o+8>>2];c[g+12>>2]=c[o+12>>2];c[g+16>>2]=c[o+16>>2];c[g+20>>2]=c[o+20>>2];c[g+24>>2]=c[o+24>>2];o=c[(c[k>>2]|0)+32>>2]|0;if(b>>>0<256>>>0){p=0}else{p=e[j+30>>1]|0}c[a>>2]=l;l=a+4|0;c[l>>2]=c[g>>2];c[l+4>>2]=c[g+4>>2];c[l+8>>2]=c[g+8>>2];c[l+12>>2]=c[g+12>>2];c[l+16>>2]=c[g+16>>2];c[l+20>>2]=c[g+20>>2];c[l+24>>2]=c[g+24>>2];c[a+32>>2]=o;c[a+36>>2]=p;i=d;return}function dT(a,b){a=a|0;b=b|0;var d=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+104|0;f=d|0;g=d+32|0;h=d+48|0;j=d+72|0;k=b|0;b=c[(c[k>>2]|0)+8>>2]|0;c[j>>2]=0;c[j+4>>2]=b;c[j+8>>2]=2147483647;cX(h,j,0);j=c[h+4>>2]|0;b=c[h+12>>2]|0;if((e[h+16>>1]|0)>>>0>3>>>0){l=c[h>>2]|0;m=(c[h+8>>2]|0)+24|0;n=c[h+20>>2]|0}else{l=0;m=0;n=2147483647}c[g>>2]=l;c[g+4>>2]=m;c[g+8>>2]=n;cY(f,g,7,0);g=f;n=c[g>>2]|0;m=c[g+4>>2]|0;g=c[f+8>>2]|0;l=f+12|0;f=d+88|0;c[f>>2]=c[l>>2];c[f+4>>2]=c[l+4>>2];c[f+8>>2]=c[l+8>>2];c[f+12>>2]=c[l+12>>2];if(b>>>0<256>>>0){o=0}else{o=e[j+30>>1]|0}j=c[k>>2]|0;k=(c[j+32>>2]|0)+(o<<1)|0;c[a>>2]=j;j=a+4|0;c[j>>2]=n;c[j+4>>2]=m;c[a+12>>2]=g;m=a+16|0;c[m>>2]=c[f>>2];c[m+4>>2]=c[f+4>>2];c[m+8>>2]=c[f+8>>2];c[m+12>>2]=c[f+12>>2];c[a+32>>2]=k;c[a+36>>2]=g-o;i=d;return}function dU(b,d,f){b=b|0;d=d|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+232|0;h=g+24|0;j=g+48|0;k=g+80|0;l=g+96|0;m=g+120|0;n=g+168|0;o=g+136|0;p=d|0;d=c[(c[p>>2]|0)+8>>2]|0;c[m>>2]=0;c[m+4>>2]=d;c[m+8>>2]=2147483647;cX(l,m,0);m=c[l+4>>2]|0;d=c[l+12>>2]|0;q=c[p>>2]|0;if((e[l+16>>1]|0)>>>0>3>>>0){r=c[l>>2]|0;s=(c[l+8>>2]|0)+24|0;t=c[l+20>>2]|0}else{r=0;s=0;t=2147483647}c[k>>2]=r;c[k+4>>2]=s;c[k+8>>2]=t;t=j;cY(j,k,7,0);c[o>>2]=c[t>>2];c[o+4>>2]=c[t+4>>2];c[o+8>>2]=c[t+8>>2];c[o+12>>2]=c[t+12>>2];c[o+16>>2]=c[t+16>>2];c[o+20>>2]=c[t+20>>2];c[o+24>>2]=c[t+24>>2];t=c[(c[p>>2]|0)+32>>2]|0;if(d>>>0<256>>>0){u=0}else{u=e[m+30>>1]|0}c[n>>2]=q;m=n+4|0;c[m>>2]=c[o>>2];c[m+4>>2]=c[o+4>>2];c[m+8>>2]=c[o+8>>2];c[m+12>>2]=c[o+12>>2];c[m+16>>2]=c[o+16>>2];c[m+20>>2]=c[o+20>>2];c[m+24>>2]=c[o+24>>2];c[n+32>>2]=t;c[n+36>>2]=u;o=f&65535;if(o>>>0>=u>>>0){a[b|0]=0;i=g;return}u=g|0;f=e[t+(o<<1)>>1]|0;o=h;c4(h,n+4|0,f);c[u>>2]=c[o>>2];c[u+4>>2]=c[o+4>>2];c[u+8>>2]=c[o+8>>2];c[u+12>>2]=c[o+12>>2];c[u+16>>2]=c[o+16>>2];c[u+20>>2]=c[o+20>>2];o=g+208|0;c[o>>2]=c[u>>2];c[o+4>>2]=c[u+4>>2];c[o+8>>2]=c[u+8>>2];c[o+12>>2]=c[u+12>>2];c[o+16>>2]=c[u+16>>2];c[o+20>>2]=c[u+20>>2];a[b|0]=1;if((b+4|0)==0){i=g;return}c[b+4>>2]=q;c[b+8>>2]=f;f=b+12|0;c[f>>2]=c[o>>2];c[f+4>>2]=c[o+4>>2];c[f+8>>2]=c[o+8>>2];c[f+12>>2]=c[o+12>>2];c[f+16>>2]=c[o+16>>2];c[f+20>>2]=c[o+20>>2];i=g;return}function dV(a,b){a=a|0;b=b|0;var d=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+120|0;f=d|0;g=d+32|0;h=d+48|0;j=d+80|0;k=d+104|0;l=c[b>>2]|0;b=c[l+8>>2]|0;c[k>>2]=0;c[k+4>>2]=b;c[k+8>>2]=2147483647;cX(j,k,0);if((e[j+16>>1]|0)>>>0>3>>>0){m=c[j>>2]|0;n=(c[j+8>>2]|0)+24|0;o=c[j+20>>2]|0}else{m=0;n=0;o=2147483647}c[g>>2]=m;c[g+4>>2]=n;c[g+8>>2]=o;o=f;cY(f,g,7,0);g=h;c[g>>2]=c[o>>2];c[g+4>>2]=c[o+4>>2];c[g+8>>2]=c[o+8>>2];c[g+12>>2]=c[o+12>>2];c[g+16>>2]=c[o+16>>2];c[g+20>>2]=c[o+20>>2];c[g+24>>2]=c[o+24>>2];o=h;c[a>>2]=l;l=a+4|0;c[l>>2]=c[o>>2];c[l+4>>2]=c[o+4>>2];c[l+8>>2]=c[o+8>>2];c[l+12>>2]=c[o+12>>2];c[l+16>>2]=c[o+16>>2];c[l+20>>2]=c[o+20>>2];c[l+24>>2]=c[o+24>>2];i=d;return}function dW(d,e){d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=f+8|0;switch(e&65535|0){case 18:{d1(h,8424,522,0,0,0,7056,6888);fE(h);break};case 14:case 17:case 15:case 16:{cM(g,8424,518,0,0,0,7400,7160);fE(g);break};default:{b[d>>1]=e;a[d+2|0]=0;c[d+4>>2]=23184;i=f;return}}}function dX(d,f,g){d=d|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;h=i;i=i+136|0;j=f;f=i;i=i+24|0;c[f>>2]=c[j>>2];c[f+4>>2]=c[j+4>>2];c[f+8>>2]=c[j+8>>2];c[f+12>>2]=c[j+12>>2];c[f+16>>2]=c[j+16>>2];c[f+20>>2]=c[j+20>>2];j=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[j>>2];j=h|0;k=h+24|0;l=h+40|0;m=h+48|0;n=h+56|0;o=h+64|0;p=h+72|0;q=h+80|0;r=h+88|0;s=h+96|0;t=h+120|0;u=h+128|0;v=c[f+12>>2]|0;L1130:do{if(v>>>0<16>>>0){w=0}else{switch(e[c[f+4>>2]>>1]|0){case 15:{if(v>>>0<128>>>0){x=0;y=0}else{z=(c[f+4>>2]|0)+8|0;x=c[z+4>>2]|0;y=c[z>>2]|0}dO(o,g,y,x);dQ(n,o);z=c[n>>2]|0;b[d>>1]=15;a[d+2|0]=0;c[d+4>>2]=z;i=h;return};case 18:{d1(u,8424,560,0,0,0,7056,6888);fE(u);break};case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:case 8:case 9:case 10:case 11:case 12:case 13:{w=b[c[f+4>>2]>>1]|0;break L1130;break};case 14:{z=(b[f+16>>1]|0)==0;A=z?2147483647:c[f+20>>2]|0;B=z?0:c[f+8>>2]|0;c[k>>2]=z?0:c[f>>2]|0;c[k+4>>2]=B;c[k+8>>2]=A;A=j;cX(j,k,0);B=s;c[B>>2]=c[A>>2];c[B+4>>2]=c[A+4>>2];c[B+8>>2]=c[A+8>>2];c[B+12>>2]=c[A+12>>2];c[B+16>>2]=c[A+16>>2];c[B+20>>2]=c[A+20>>2];c[t>>2]=c[g>>2];dX(r,s,t);A=c[r+4>>2]|0;B=(a[r+2|0]|0)+1&255;b[d>>1]=b[r>>1]|0;a[d+2|0]=B;c[d+4>>2]=A;i=h;return};case 16:{if(v>>>0<128>>>0){C=0;D=0}else{A=(c[f+4>>2]|0)+8|0;C=c[A+4>>2]|0;D=c[A>>2]|0}dO(m,g,D,C);dP(l,m);A=c[l>>2]|0;b[d>>1]=16;a[d+2|0]=0;c[d+4>>2]=A;i=h;return};case 17:{if(v>>>0<128>>>0){E=0;F=0}else{A=(c[f+4>>2]|0)+8|0;E=c[A+4>>2]|0;F=c[A>>2]|0}dO(q,g,F,E);dR(p,q);A=c[p>>2]|0;b[d>>1]=17;a[d+2|0]=0;c[d+4>>2]=A;i=h;return};default:{b[d>>1]=b[c[f+4>>2]>>1]|0;a[d+2|0]=0;c[d+4>>2]=23184;i=h;return}}}}while(0);dW(d,w);i=h;return}function dY(c,d){c=c|0;d=d|0;var e=0,f=0;e=i;i=i+8|0;f=e|0;do{if((a[d+2|0]|0)==0){if((b[d>>1]|0)!=16){break}dP(c,d+4|0);i=e;return}}while(0);d0(f,8424,570,0,0,6784,6600,6368);fE(f)}function dZ(c,d){c=c|0;d=d|0;var e=0,f=0;e=i;i=i+8|0;f=e|0;do{if((a[d+2|0]|0)==0){if((b[d>>1]|0)!=15){break}dQ(c,d+4|0);i=e;return}}while(0);dp(f,8424,576,0,0,6144,5976,5784);fE(f)}function d_(c,d){c=c|0;d=d|0;var e=0,f=0;e=i;i=i+8|0;f=e|0;do{if((a[d+2|0]|0)==0){if((b[d>>1]|0)!=17){break}dR(c,d+4|0);i=e;return}}while(0);cM(f,8424,582,0,0,5632,5408,5256);fE(f)}function d$(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=a[e+2|0]|0;if(h<<24>>24!=0){j=c[e+4>>2]|0;b[d>>1]=b[e>>1]|0;a[d+2|0]=h-1&255;c[d+4>>2]=j;i=f;return}dp(g,8424,588,0,0,4920,4768,4592);fE(g)}function d0(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function d1(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function d2(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+32|0;n=m|0;o=m+24|0;c[b>>2]=0;p=n|0;q=k|0;r=nV(q|0)|0;eR(p,r);if((c[n+4>>2]|0)==0){s=0}else{s=c[n>>2]|0}t=k+r|0;if((r|0)!=0){r=q;q=s;while(1){s=r+1|0;a[q]=a[r]|0;if((s|0)==(t|0)){break}else{r=s;q=q+1|0}}}q=n+12|0;r=(c[l+4>>2]|0)-1|0;t=c[l>>2]|0;eR(q,r);if((c[n+16>>2]|0)==0){u=0}else{u=c[q>>2]|0}q=t+r|0;if((r|0)!=0){r=t;t=u;while(1){u=r+1|0;a[t]=a[r]|0;if((u|0)==(q|0)){break}else{r=u;t=t+1|0}}}c[o>>2]=p;c[o+4>>2]=2;fF(b,d,e,f,g,h,j,o);o=n+12|0;j=c[o>>2]|0;h=n+16|0;g=c[h>>2]|0;if((j|0)!=0){c[o>>2]=0;c[h>>2]=0;h=c[n+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=n|0;j=c[g>>2]|0;h=n+4|0;o=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[n+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,o,o,0);i=m;return}function d3(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+32|0;n=m|0;o=m+24|0;c[b>>2]=0;p=n|0;q=k|0;r=nV(q|0)|0;eR(p,r);if((c[n+4>>2]|0)==0){s=0}else{s=c[n>>2]|0}t=k+r|0;if((r|0)!=0){r=q;q=s;while(1){s=r+1|0;a[q]=a[r]|0;if((s|0)==(t|0)){break}else{r=s;q=q+1|0}}}q=n+12|0;r=(c[l+4>>2]|0)-1|0;t=c[l>>2]|0;eR(q,r);if((c[n+16>>2]|0)==0){u=0}else{u=c[q>>2]|0}q=t+r|0;if((r|0)!=0){r=t;t=u;while(1){u=r+1|0;a[t]=a[r]|0;if((u|0)==(q|0)){break}else{r=u;t=t+1|0}}}c[o>>2]=p;c[o+4>>2]=2;fF(b,d,e,f,g,h,j,o);o=n+12|0;j=c[o>>2]|0;h=n+16|0;g=c[h>>2]|0;if((j|0)!=0){c[o>>2]=0;c[h>>2]=0;h=c[n+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=n|0;j=c[g>>2]|0;h=n+4|0;o=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[n+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,o,o,0);i=m;return}function d4(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+32|0;n=m|0;o=m+24|0;c[b>>2]=0;p=n|0;q=k|0;r=nV(q|0)|0;eR(p,r);if((c[n+4>>2]|0)==0){s=0}else{s=c[n>>2]|0}t=k+r|0;if((r|0)!=0){r=q;q=s;while(1){s=r+1|0;a[q]=a[r]|0;if((s|0)==(t|0)){break}else{r=s;q=q+1|0}}}q=n+12|0;r=(c[l+4>>2]|0)-1|0;t=c[l>>2]|0;eR(q,r);if((c[n+16>>2]|0)==0){u=0}else{u=c[q>>2]|0}q=t+r|0;if((r|0)!=0){r=t;t=u;while(1){u=r+1|0;a[t]=a[r]|0;if((u|0)==(q|0)){break}else{r=u;t=t+1|0}}}c[o>>2]=p;c[o+4>>2]=2;fF(b,d,e,f,g,h,j,o);o=n+12|0;j=c[o>>2]|0;h=n+16|0;g=c[h>>2]|0;if((j|0)!=0){c[o>>2]=0;c[h>>2]=0;h=c[n+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=n|0;j=c[g>>2]|0;h=n+4|0;o=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[n+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,o,o,0);i=m;return}function d5(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+32|0;n=m|0;o=m+24|0;c[b>>2]=0;p=n|0;q=k|0;r=nV(q|0)|0;eR(p,r);if((c[n+4>>2]|0)==0){s=0}else{s=c[n>>2]|0}t=k+r|0;if((r|0)!=0){r=q;q=s;while(1){s=r+1|0;a[q]=a[r]|0;if((s|0)==(t|0)){break}else{r=s;q=q+1|0}}}q=n+12|0;r=c[l>>2]|0;eR(q,r);if((c[n+16>>2]|0)==0){u=0}else{u=c[q>>2]|0}q=l+4+r|0;if((r|0)!=0){r=l+4|0;l=u;while(1){u=r+1|0;a[l]=a[r]|0;if((u|0)==(q|0)){break}else{r=u;l=l+1|0}}}c[o>>2]=p;c[o+4>>2]=2;fF(b,d,e,f,g,h,j,o);o=n+12|0;j=c[o>>2]|0;h=n+16|0;g=c[h>>2]|0;if((j|0)!=0){c[o>>2]=0;c[h>>2]=0;h=c[n+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=n|0;j=c[g>>2]|0;h=n+4|0;o=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[n+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,o,o,0);i=m;return}function d6(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function d7(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+112|0;g=f+24|0;h=f+48|0;j=f+80|0;dV(h,e|0);k=b[e+4>>1]|0;e=k&65535;if(e>>>0>=(c[h+12>>2]|0)>>>0){a[d|0]=0;i=f;return}l=f|0;m=c[h>>2]|0;n=g;c4(g,h+4|0,e);c[l>>2]=c[n>>2];c[l+4>>2]=c[n+4>>2];c[l+8>>2]=c[n+8>>2];c[l+12>>2]=c[n+12>>2];c[l+16>>2]=c[n+16>>2];c[l+20>>2]=c[n+20>>2];n=j+2|0;nX(n|0,l|0,24)|0;l=d|0;a[l]=1;if((d+4|0)==0){i=f;return}c[d+4>>2]=m;b[d+8>>1]=k;k=l+10|0;l=j|0;nX(k|0,l|0,26)|0;i=f;return}function d8(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+104|0;f=d;d=i;i=i+32|0;nX(d,f,32)|0;f=e|0;g=e+16|0;h=e+32|0;j=e+56|0;k=e+64|0;l=e+72|0;m=e+80|0;if((c[d+20>>2]|0)>>>0<32>>>0){i=e;return}n=(c[d+12>>2]|0)+2|0;if((b[n>>1]|0)==0){i=e;return}o=a|0;dN(h,o);if((c[h+12>>2]|0)>>>0<288>>>0){p=0}else{p=c[(c[h+4>>2]|0)+32>>2]|0}if(((p<<4)+16|0)>>>0>(c[a+16>>2]|0)>>>0){q=0}else{q=b[(c[a+8>>2]|0)+(p<<1)>>1]|0}if(q<<16>>16==~b[n>>1]<<16>>16){i=e;return}e=(b[d+24>>1]|0)==0;n=e?2147483647:c[d+28>>2]|0;q=e?0:c[d+16>>2]|0;c[g>>2]=e?0:c[d+8>>2]|0;c[g+4>>2]=q;c[g+8>>2]=n;cZ(k,g,0,0);dN(m,o);if((b[m+16>>1]|0)==0){r=0;s=0;t=2147483647}else{r=c[m>>2]|0;s=c[m+8>>2]|0;t=c[m+20>>2]|0}c[f>>2]=r;c[f+4>>2]=s;c[f+8>>2]=t;cZ(l,f,0,0);es(j,6512,146,0,0,4744,3632,2464,k,l);fE(j)}function d9(f,j,l){f=f|0;j=j|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0.0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0;m=i;i=i+272|0;n=l;l=i;i=i+32|0;nX(l,n,32)|0;n=m|0;o=m+16|0;p=m+32|0;q=m+56|0;r=m+72|0;s=m+80|0;t=m+104|0;u=m+120|0;v=m+144|0;w=m+160|0;x=m+176|0;y=m+192|0;z=m+200|0;A=m+232|0;B=m+240|0;C=m+248|0;D=m+256|0;E=m+264|0;F=E;G=i;i=i+12|0;i=i+7&-8;H=i;i=i+8|0;I=i;i=i+8|0;J=I;K=i;i=i+12|0;i=i+7&-8;L=i;i=i+28|0;i=i+7&-8;M=i;i=i+8|0;N=M;O=i;i=i+24|0;P=i;i=i+4|0;i=i+7&-8;Q=i;i=i+12|0;i=i+7&-8;R=i;i=i+24|0;S=i;i=i+4|0;i=i+7&-8;T=i;i=i+4|0;i=i+7&-8;U=i;i=i+4|0;i=i+7&-8;V=i;i=i+12|0;i=i+7&-8;W=i;i=i+4|0;i=i+7&-8;X=i;i=i+4|0;i=i+7&-8;Y=i;i=i+4|0;i=i+7&-8;Z=i;i=i+8|0;_=i;i=i+12|0;i=i+7&-8;$=i;i=i+24|0;aa=i;i=i+4|0;i=i+7&-8;ab=i;i=i+4|0;i=i+7&-8;ac=c[l>>2]|0;ad=j|0;if((ac|0)!=(c[j>>2]|0)){d6(y,6512,177,0,0,1208,688,272);fE(y)}y=z;ae=l;nX(y|0,ae|0,32)|0;d8(j,z);z=c[l+8>>2]|0;ae=c[l+12>>2]|0;y=c[l+16>>2]|0;af=c[l+20>>2]|0;ag=b[l+24>>1]|0;ah=c[l+28>>2]|0;do{if(af>>>0>=80>>>0){l=e[ae+8>>1]|0;if((l|0)==0){break}else if((l|0)!=1){eN()}if(af>>>0<192>>>0){ai=0;aj=0}else{l=ae+16|0;ai=c[l+4>>2]|0;aj=c[l>>2]|0}dO(ab,ad,aj,ai);dP(aa,ab);l=j+4|0;ak=$;c[ak>>2]=c[l>>2];c[ak+4>>2]=c[l+4>>2];c[ak+8>>2]=c[l+8>>2];c[ak+12>>2]=c[l+12>>2];c[ak+16>>2]=c[l+16>>2];c[ak+20>>2]=c[l+20>>2];l=c[aa>>2]|0;ak=$;c[f>>2]=10;c[f+8>>2]=l;l=f+12|0;c[l>>2]=c[ak>>2];c[l+4>>2]=c[ak+4>>2];c[l+8>>2]=c[ak+8>>2];c[l+12>>2]=c[ak+12>>2];c[l+16>>2]=c[ak+16>>2];c[l+20>>2]=c[ak+20>>2];i=m;return}}while(0);if((ag&65535)>>>0>2>>>0){al=z;am=y+16|0;an=ah}else{al=0;am=0;an=2147483647}c[v>>2]=al;c[v+4>>2]=am;c[v+8>>2]=an;cX(u,v,0);v=c[u>>2]|0;an=c[u+4>>2]|0;am=c[u+8>>2]|0;al=c[u+12>>2]|0;$=b[u+16>>1]|0;aa=c[u+20>>2]|0;if((ag&65535)>>>0>3>>>0){ao=z;ap=y+24|0;aq=ah}else{ao=0;ap=0;aq=2147483647}c[t>>2]=ao;c[t+4>>2]=ap;c[t+8>>2]=aq;cX(s,t,0);t=c[s>>2]|0;aq=c[s+4>>2]|0;ap=c[s+8>>2]|0;ao=c[s+12>>2]|0;ah=b[s+16>>1]|0;y=c[s+20>>2]|0;L1372:do{if(al>>>0>=16>>>0){switch(e[an>>1]|0|0){case 0:{break L1372;break};case 1:{if(af>>>0<64>>>0){ar=0}else{ar=c[ae+4>>2]|0}if(ao>>>0>16>>>0){as=(a[aq+2|0]&1)!=0}else{as=0}if((c[j+16>>2]|0)>>>0>ar>>>0){if((ar|0)==0){at=d[j+22|0]|0}else{at=ar}au=((d[(c[j+8>>2]|0)+(at>>>3)|0]|0)&1<<(at&7)|0)!=0}else{au=0}c[f>>2]=2;a[f+8|0]=(au^as)&1;i=m;return};case 2:{if(af>>>0<64>>>0){av=0}else{av=c[ae+4>>2]|0}if(ao>>>0<24>>>0){aw=0}else{aw=a[aq+2|0]|0}if(((av<<3)+8|0)>>>0>(c[j+16>>2]|0)>>>0){ax=0}else{ax=a[(c[j+8>>2]|0)+av|0]|0}s=ax^aw;c[f>>2]=3;z=f+8|0;c[z>>2]=s<<24>>24;c[z+4>>2]=s<<24>>24<0|0?-1:0;i=m;return};case 3:{if(af>>>0<64>>>0){ay=0}else{ay=c[ae+4>>2]|0}if(ao>>>0<32>>>0){az=0}else{az=b[aq+2>>1]|0}if(((ay<<4)+16|0)>>>0>(c[j+16>>2]|0)>>>0){aA=0}else{aA=b[(c[j+8>>2]|0)+(ay<<1)>>1]|0}s=aA^az;c[f>>2]=3;z=f+8|0;c[z>>2]=s<<16>>16;c[z+4>>2]=s<<16>>16<0|0?-1:0;i=m;return};case 4:{if(af>>>0<64>>>0){aB=0}else{aB=c[ae+4>>2]|0}if(ao>>>0<64>>>0){aC=0}else{aC=c[aq+4>>2]|0}if(((aB<<5)+32|0)>>>0>(c[j+16>>2]|0)>>>0){aD=0}else{aD=c[(c[j+8>>2]|0)+(aB<<2)>>2]|0}s=aD^aC;c[f>>2]=3;z=f+8|0;c[z>>2]=s;c[z+4>>2]=(s|0)<0|0?-1:0;i=m;return};case 5:{if(af>>>0<64>>>0){aE=0}else{aE=c[ae+4>>2]|0}if(ao>>>0<128>>>0){aF=0;aG=0}else{s=aq+8|0;aF=c[s+4>>2]|0;aG=c[s>>2]|0}if(((aE<<6)+64|0)>>>0>(c[j+16>>2]|0)>>>0){aH=0;aI=0}else{s=(c[j+8>>2]|0)+(aE<<3)|0;aH=c[s+4>>2]|0;aI=c[s>>2]|0}c[f>>2]=3;s=f+8|0;c[s>>2]=aI^aG;c[s+4>>2]=aH^aF;i=m;return};case 6:{if(af>>>0<64>>>0){aJ=0}else{aJ=c[ae+4>>2]|0}if(ao>>>0<24>>>0){aK=0}else{aK=a[aq+2|0]|0}if(((aJ<<3)+8|0)>>>0>(c[j+16>>2]|0)>>>0){aL=0}else{aL=a[(c[j+8>>2]|0)+aJ|0]|0}c[f>>2]=4;s=f+8|0;c[s>>2]=(aL^aK)&255;c[s+4>>2]=0;i=m;return};case 7:{if(af>>>0<64>>>0){aM=0}else{aM=c[ae+4>>2]|0}if(ao>>>0<32>>>0){aN=0}else{aN=b[aq+2>>1]|0}if(((aM<<4)+16|0)>>>0>(c[j+16>>2]|0)>>>0){aO=0}else{aO=b[(c[j+8>>2]|0)+(aM<<1)>>1]|0}c[f>>2]=4;s=f+8|0;c[s>>2]=(aO^aN)&65535;c[s+4>>2]=0;i=m;return};case 8:{if(af>>>0<64>>>0){aP=0}else{aP=c[ae+4>>2]|0}if(ao>>>0<64>>>0){aQ=0}else{aQ=c[aq+4>>2]|0}if(((aP<<5)+32|0)>>>0>(c[j+16>>2]|0)>>>0){aR=0}else{aR=c[(c[j+8>>2]|0)+(aP<<2)>>2]|0}c[f>>2]=4;s=f+8|0;c[s>>2]=aR^aQ;c[s+4>>2]=0;i=m;return};case 9:{if(af>>>0<64>>>0){aS=0}else{aS=c[ae+4>>2]|0}if(ao>>>0<128>>>0){aT=0;aU=0}else{s=aq+8|0;aT=c[s+4>>2]|0;aU=c[s>>2]|0}if(((aS<<6)+64|0)>>>0>(c[j+16>>2]|0)>>>0){aV=0;aW=0}else{s=(c[j+8>>2]|0)+(aS<<3)|0;aV=c[s+4>>2]|0;aW=c[s>>2]|0}c[f>>2]=4;s=f+8|0;c[s>>2]=aW^aU;c[s+4>>2]=aV^aT;i=m;return};case 10:{if(af>>>0<64>>>0){aX=0}else{aX=c[ae+4>>2]|0}if(ao>>>0<64>>>0){aY=0}else{aY=(g[k>>2]=+g[aq+4>>2],c[k>>2]|0)}if(((aX<<5)+32|0)>>>0>(c[j+16>>2]|0)>>>0){aZ=0}else{aZ=c[(c[j+8>>2]|0)+(aX<<2)>>2]|0}a_=(c[k>>2]=aZ^aY,+g[k>>2]);c[f>>2]=5;h[f+8>>3]=a_;i=m;return};case 11:{if(af>>>0<64>>>0){a$=0}else{a$=c[ae+4>>2]|0}if(ao>>>0<128>>>0){a0=0;a1=0}else{s=aq+8|0;a0=c[s+4>>2]|0;a1=c[s>>2]|0}if(((a$<<6)+64|0)>>>0>(c[j+16>>2]|0)>>>0){a2=0;a3=0}else{s=(c[j+8>>2]|0)+(a$<<3)|0;a2=c[s+4>>2]|0;a3=c[s>>2]|0}a_=(c[k>>2]=a3^a1,c[k+4>>2]=a2^a0,+h[k>>3]);c[f>>2]=5;h[f+8>>3]=a_;i=m;return};case 15:{if(ao>>>0<32>>>0){a4=0}else{a4=b[aq+2>>1]|0}c[B>>2]=ac;if(al>>>0<128>>>0){a5=0;a6=0}else{s=an+8|0;a5=c[s+4>>2]|0;a6=c[s>>2]|0}dO(C,B|0,a6,a5);dQ(A,C);if(af>>>0<64>>>0){a7=0}else{a7=c[ae+4>>2]|0}if(((a7<<4)+16|0)>>>0>(c[j+16>>2]|0)>>>0){a8=0}else{a8=b[(c[j+8>>2]|0)+(a7<<1)>>1]|0}s=c[A>>2]|0;c[f>>2]=9;z=f+8|0;c[z>>2]=s;c[z+4>>2]=(a8^a4)&65535;i=m;return};case 12:{z=ah<<16>>16==0;c[n>>2]=z?0:t;c[n+4>>2]=z?0:ap;c[n+8>>2]=z?2147483647:y;cZ(D,n,0,0);if(af>>>0<64>>>0){a9=0}else{a9=c[ae+4>>2]|0}if((e[j+20>>1]|0)>>>0>a9>>>0){z=(c[j+12>>2]|0)+(a9<<3)|0;s=c[j+24>>2]|0;c[G>>2]=c[j+4>>2];c[G+4>>2]=z;c[G+8>>2]=s}else{c[G>>2]=0;c[G+4>>2]=0;c[G+8>>2]=2147483647}cZ(F,G,c[D>>2]|0,(c[D+4>>2]|0)-1|0);c[f>>2]=6;s=c[E+4>>2]|0;z=f+8|0;c[z>>2]=c[E>>2];c[z+4>>2]=s;i=m;return};case 13:{s=ah<<16>>16==0;c[o>>2]=s?0:t;c[o+4>>2]=s?0:ap;c[o+8>>2]=s?2147483647:y;c_(H,o,0,0);if(af>>>0<64>>>0){ba=0}else{ba=c[ae+4>>2]|0}if((e[j+20>>1]|0)>>>0>ba>>>0){s=(c[j+12>>2]|0)+(ba<<3)|0;z=c[j+24>>2]|0;c[K>>2]=c[j+4>>2];c[K+4>>2]=s;c[K+8>>2]=z}else{c[K>>2]=0;c[K+4>>2]=0;c[K+8>>2]=2147483647}c_(J,K,c[H>>2]|0,c[H+4>>2]|0);c[f>>2]=7;z=c[I+4>>2]|0;s=f+8|0;c[s>>2]=c[I>>2];c[s+4>>2]=z;i=m;return};case 14:{z=$<<16>>16==0;c[q>>2]=z?0:v;c[q+4>>2]=z?0:am;c[q+8>>2]=z?2147483647:aa;cX(p,q,0);z=c[p+4>>2]|0;s=c[p+8>>2]|0;ag=c[p+12>>2]|0;u=p+16|0;ab=c[u>>2]|0;ai=c[u+4>>2]|0;c[O>>2]=c[p>>2];c[O+4>>2]=z;c[O+8>>2]=s;c[O+12>>2]=ag;s=O+16|0;c[s>>2]=ab;c[s+4>>2]=ai;c[P>>2]=ac;dX(N,O,P);if(af>>>0<64>>>0){bb=0}else{bb=c[ae+4>>2]|0}if((e[j+20>>1]|0)>>>0>bb>>>0){ai=(c[j+12>>2]|0)+(bb<<3)|0;s=c[j+24>>2]|0;c[Q>>2]=c[j+4>>2];c[Q+4>>2]=ai;c[Q+8>>2]=s}else{c[Q>>2]=0;c[Q+4>>2]=0;c[Q+8>>2]=2147483647}L1539:do{if(ag>>>0<16>>>0){bc=0;bd=r}else{s=r;switch(e[z>>1]|0|0){case 1:{bc=1;bd=s;break L1539;break};case 2:{bc=2;bd=s;break L1539;break};case 3:{bc=3;bd=s;break L1539;break};case 4:{bc=4;bd=s;break L1539;break};case 5:{bc=5;bd=s;break L1539;break};case 6:{bc=2;bd=s;break L1539;break};case 7:{bc=3;bd=s;break L1539;break};case 8:{bc=4;bd=s;break L1539;break};case 9:{bc=5;bd=s;break L1539;break};case 10:{bc=4;bd=s;break L1539;break};case 11:{bc=5;bd=s;break L1539;break};case 12:{bc=6;bd=s;break L1539;break};case 13:{bc=6;bd=s;break L1539;break};case 14:{bc=6;bd=s;break L1539;break};case 15:{bc=3;bd=s;break L1539;break};case 16:{bc=7;bd=s;break L1539;break};case 17:{bc=6;bd=s;break L1539;break};case 18:{d1(r,6512,93,1,0,0,6088,5896);fE(r);break};default:{bc=0;bd=s;break L1539}}}}while(0);z=ah<<16>>16==0;c[w>>2]=z?0:t;c[w+4>>2]=z?0:ap;c[w+8>>2]=z?2147483647:y;cY(L,Q,bc,c0(w)|0);z=c[M>>2]|0;ag=c[M+4>>2]|0;s=L;c[f>>2]=8;ai=f+8|0;c[ai>>2]=z;c[ai+4>>2]=ag;ag=f+16|0;c[ag>>2]=c[s>>2];c[ag+4>>2]=c[s+4>>2];c[ag+8>>2]=c[s+8>>2];c[ag+12>>2]=c[s+12>>2];c[ag+16>>2]=c[s+16>>2];c[ag+20>>2]=c[s+20>>2];c[ag+24>>2]=c[s+24>>2];i=m;return};case 16:{c[T>>2]=ac;if(al>>>0<128>>>0){be=0;bf=0}else{s=an+8|0;be=c[s+4>>2]|0;bf=c[s>>2]|0}dO(U,T|0,bf,be);dP(S,U);if(af>>>0<64>>>0){bg=0}else{bg=c[ae+4>>2]|0}if((e[j+20>>1]|0)>>>0>bg>>>0){s=(c[j+12>>2]|0)+(bg<<3)|0;ag=c[j+24>>2]|0;c[V>>2]=c[j+4>>2];c[V+4>>2]=s;c[V+8>>2]=ag}else{c[V>>2]=0;c[V+4>>2]=0;c[V+8>>2]=2147483647}ag=ah<<16>>16==0;c[x>>2]=ag?0:t;c[x+4>>2]=ag?0:ap;c[x+8>>2]=ag?2147483647:y;cX(R,V,c0(x)|0);ag=c[S>>2]|0;s=R;c[f>>2]=10;c[f+8>>2]=ag;ag=f+12|0;c[ag>>2]=c[s>>2];c[ag+4>>2]=c[s+4>>2];c[ag+8>>2]=c[s+8>>2];c[ag+12>>2]=c[s+12>>2];c[ag+16>>2]=c[s+16>>2];c[ag+20>>2]=c[s+20>>2];i=m;return};case 18:{if(af>>>0<64>>>0){bh=0}else{bh=c[ae+4>>2]|0}if((e[j+20>>1]|0)>>>0>bh>>>0){bi=c[j+4>>2]|0;bj=(c[j+12>>2]|0)+(bh<<3)|0;bk=c[j+24>>2]|0}else{bi=0;bj=0;bk=2147483647}c[f>>2]=12;s=f+8|0;c[s>>2]=bi;c[s+4>>2]=bj;c[f+16>>2]=bk;i=m;return};case 17:{c[X>>2]=ac;if(al>>>0<128>>>0){bl=0;bm=0}else{s=an+8|0;bl=c[s+4>>2]|0;bm=c[s>>2]|0}dO(Y,X|0,bm,bl);dR(W,Y);if(af>>>0<64>>>0){bn=0}else{bn=c[ae+4>>2]|0}if((e[j+20>>1]|0)>>>0>bn>>>0){s=(c[j+12>>2]|0)+(bn<<3)|0;ag=c[j+24>>2]|0;c[_>>2]=c[j+4>>2];c[_+4>>2]=s;c[_+8>>2]=ag}else{c[_>>2]=0;c[_+4>>2]=0;c[_+8>>2]=2147483647}c$(Z,_);ag=c[W>>2]|0;s=c[Z>>2]|0;ai=Z+4|0;z=c[ai>>2]|0;c[ai>>2]=0;c[f>>2]=11;ai=f+8|0;c[ai>>2]=s;c[ai+4>>2]=z;c[f+16>>2]=ag;i=m;return};default:{eN()}}}}while(0);c[f>>2]=1;i=m;return}function ea(a,d){a=a|0;d=d|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+88|0;g=d;d=i;i=i+32|0;nX(d,g,32)|0;g=f|0;h=f+24|0;j=f+40|0;k=f+48|0;l=f+72|0;m=a|0;if((c[d>>2]|0)!=(c[a>>2]|0)){d6(j,6512,407,0,0,1208,688,272);fE(j);return 0}j=c[d+8>>2]|0;n=c[d+12>>2]|0;o=c[d+16>>2]|0;p=c[d+20>>2]|0;q=b[d+24>>1]|0;r=c[d+28>>2]|0;do{if(p>>>0>=32>>>0){d=n+2|0;do{if((b[d>>1]|0)!=0){dN(k,m);if((c[k+12>>2]|0)>>>0<288>>>0){s=0}else{s=c[(c[k+4>>2]|0)+32>>2]|0}if(((s<<4)+16|0)>>>0>(c[a+16>>2]|0)>>>0){t=0}else{t=b[(c[a+8>>2]|0)+(s<<1)>>1]|0}if(t<<16>>16==~b[d>>1]<<16>>16){break}else{u=0}i=f;return u|0}}while(0);if(p>>>0<80>>>0){break}if((b[n+8>>1]|0)==1){u=1}else{break}i=f;return u|0}}while(0);if((q&65535)>>>0>2>>>0){v=j;w=o+16|0;x=r}else{v=0;w=0;x=2147483647}c[h>>2]=v;c[h+4>>2]=w;c[h+8>>2]=x;cX(g,h,0);if((c[g+12>>2]|0)>>>0<16>>>0){u=1;i=f;return u|0}switch(e[c[g+4>>2]>>1]|0){case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:case 8:case 9:case 10:case 11:case 15:{u=1;i=f;return u|0};case 12:case 13:case 14:case 16:case 18:case 17:{if(p>>>0<64>>>0){y=0}else{y=c[n+4>>2]|0}if((e[a+20>>1]|0)>>>0>y>>>0){n=(c[a+12>>2]|0)+(y<<3)|0;y=c[a+24>>2]|0;c[l>>2]=c[a+4>>2];c[l+4>>2]=n;c[l+8>>2]=y}else{c[l>>2]=0;c[l+4>>2]=0;c[l+8>>2]=2147483647}u=(c1(l)|0)^1;i=f;return u|0};default:{u=0;i=f;return u|0}}return 0}function eb(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+24|0;g=f|0;dN(g,e|0);h=c[g+4>>2]|0;j=c[g+12>>2]|0;do{if(j>>>0>=256>>>0){if((b[h+30>>1]|0)==0){break}if(j>>>0<288>>>0){k=0}else{k=c[h+32>>2]|0}if(((k<<4)+16|0)>>>0>(c[e+16>>2]|0)>>>0){l=0}else{l=b[(c[e+8>>2]|0)+(k<<1)>>1]|0}dU(d,e|0,l);i=f;return}}while(0);a[d|0]=0;i=f;return}function ec(f,j,k){f=f|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+24|0;m=l|0;n=l+8|0;o=l+16|0;p=i;i=i+12|0;i=i+7&-8;q=i;i=i+8|0;r=i;i=i+12|0;i=i+7&-8;s=i;i=i+8|0;t=s;u=i;i=i+28|0;i=i+7&-8;v=i;i=i+12|0;i=i+7&-8;w=i;i=i+24|0;x=i;i=i+4|0;i=i+7&-8;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+8|0;B=i;i=i+12|0;i=i+7&-8;if((c[j+16>>2]|0)>>>0<=k>>>0){da(n,6512,968,0,0,6728,6544,6248);fE(n)}n=j|0;L1656:do{if((a[j+2|0]|0)==0){switch(e[j>>1]|0){case 12:{C=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;D=c[j+32>>2]|0;c[p>>2]=c[j+8>>2];c[p+4>>2]=C;c[p+8>>2]=D;cZ(o,p,0,0);c[f>>2]=6;D=c[o+4>>2]|0;C=f+8|0;c[C>>2]=c[o>>2];c[C+4>>2]=D;i=l;return};case 10:{E=+g[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>2];c[f>>2]=5;h[f+8>>3]=E;i=l;return};case 14:{break L1656;break};case 1:{D=ag(c[j+20>>2]|0,k)|0;C=(d[(c[j+12>>2]|0)+(D>>>3)|0]&1<<(D&7)|0)!=0;c[f>>2]=2;a[f+8|0]=C&1;i=l;return};case 0:{c[f>>2]=1;i=l;return};case 2:{C=a[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0]|0;c[f>>2]=3;D=f+8|0;c[D>>2]=C<<24>>24;c[D+4>>2]=C<<24>>24<0|0?-1:0;i=l;return};case 4:{C=c[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>2]|0;c[f>>2]=3;D=f+8|0;c[D>>2]=C;c[D+4>>2]=(C|0)<0|0?-1:0;i=l;return};case 3:{C=b[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>1]|0;c[f>>2]=3;D=f+8|0;c[D>>2]=C<<16>>16;c[D+4>>2]=C<<16>>16<0|0?-1:0;i=l;return};case 11:{E=+h[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>3];c[f>>2]=5;h[f+8>>3]=E;i=l;return};case 13:{C=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;D=c[j+32>>2]|0;c[r>>2]=c[j+8>>2];c[r+4>>2]=C;c[r+8>>2]=D;c_(q,r,0,0);c[f>>2]=7;D=c[q+4>>2]|0;C=f+8|0;c[C>>2]=c[q>>2];c[C+4>>2]=D;i=l;return};case 6:{D=a[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0]|0;c[f>>2]=4;C=f+8|0;c[C>>2]=D&255;c[C+4>>2]=0;i=l;return};case 7:{C=b[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>1]|0;c[f>>2]=4;D=f+8|0;c[D>>2]=C&65535;c[D+4>>2]=0;i=l;return};case 8:{D=c[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>2]|0;c[f>>2]=4;C=f+8|0;c[C>>2]=D;c[C+4>>2]=0;i=l;return};case 9:{C=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;D=c[C>>2]|0;F=c[C+4>>2]|0;c[f>>2]=4;C=f+8|0;c[C>>2]=D;c[C+4>>2]=F;i=l;return};case 16:{dY(x,n);c4(w,j+8|0,k);F=c[x>>2]|0;C=w;c[f>>2]=10;c[f+8>>2]=F;F=f+12|0;c[F>>2]=c[C>>2];c[F+4>>2]=c[C+4>>2];c[F+8>>2]=c[C+8>>2];c[F+12>>2]=c[C+12>>2];c[F+16>>2]=c[C+16>>2];c[F+20>>2]=c[C+20>>2];i=l;return};case 15:{dZ(y,n);C=b[(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)>>1]|0;F=c[y>>2]|0;c[f>>2]=9;D=f+8|0;c[D>>2]=F;c[D+4>>2]=C&65535;i=l;return};case 18:{C=c[j+8>>2]|0;D=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;F=c[j+32>>2]|0;c[f>>2]=12;G=f+8|0;c[G>>2]=C;c[G+4>>2]=D;c[f+16>>2]=F;i=l;return};case 17:{d_(z,n);F=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;D=c[j+32>>2]|0;c[B>>2]=c[j+8>>2];c[B+4>>2]=F;c[B+8>>2]=D;c$(A,B);D=c[z>>2]|0;F=c[A>>2]|0;G=A+4|0;C=c[G>>2]|0;c[G>>2]=0;c[f>>2]=11;G=f+8|0;c[G>>2]=F;c[G+4>>2]=C;c[f+16>>2]=D;i=l;return};case 5:{D=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;C=c[D>>2]|0;G=c[D+4>>2]|0;c[f>>2]=3;D=f+8|0;c[D>>2]=C;c[D+4>>2]=G;i=l;return};default:{c[f>>2]=0;i=l;return}}}}while(0);d$(t,n);n=c[s>>2]|0;A=c[s+4>>2]|0;s=(c[j+12>>2]|0)+((ag(c[j+20>>2]|0,k)|0)>>>3)|0;k=c[j+32>>2]|0;c[v>>2]=c[j+8>>2];c[v+4>>2]=s;c[v+8>>2]=k;L1698:do{if((a[t+2|0]|0)==0){k=m;switch(n&65535|0){case 17:{H=6;I=k;break L1698;break};case 18:{d1(m,6512,93,1,0,0,6088,5896);fE(m);break};case 14:{J=k;K=1690;break L1698;break};case 15:{H=3;I=k;break L1698;break};case 16:{H=7;I=k;break L1698;break};case 11:{H=5;I=k;break L1698;break};case 12:{H=6;I=k;break L1698;break};case 13:{H=6;I=k;break L1698;break};case 1:{H=1;I=k;break L1698;break};case 2:{H=2;I=k;break L1698;break};case 8:{H=4;I=k;break L1698;break};case 9:{H=5;I=k;break L1698;break};case 10:{H=4;I=k;break L1698;break};case 5:{H=5;I=k;break L1698;break};case 6:{H=2;I=k;break L1698;break};case 7:{H=3;I=k;break L1698;break};case 3:{H=3;I=k;break L1698;break};case 4:{H=4;I=k;break L1698;break};default:{H=0;I=k;break L1698}}}else{J=m;K=1690}}while(0);if((K|0)==1690){H=6;I=J}cY(u,v,H,0);H=u;c[f>>2]=8;u=f+8|0;c[u>>2]=n;c[u+4>>2]=A;A=f+16|0;c[A>>2]=c[H>>2];c[A+4>>2]=c[H+4>>2];c[A+8>>2]=c[H+8>>2];c[A+12>>2]=c[H+12>>2];c[A+16>>2]=c[H+16>>2];c[A+20>>2]=c[H+20>>2];c[A+24>>2]=c[H+24>>2];i=l;return}function ed(a){a=a|0;var b=0,d=0;if((c[a>>2]|0)!=11){return}b=a+8|0;a=b+4|0;d=c[a>>2]|0;if((d|0)==0){return}c[a>>2]=0;a=c[b>>2]|0;b0[c[c[a>>2]>>2]&127](a,d+(c[(c[d>>2]|0)-8>>2]|0)|0);return}function ee(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0;b=i;i=i+40|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;j=b+32|0;k=c[a>>2]|0;if((k|0)==3){l=a+8|0;m=c[l+4>>2]|0;n=c[l>>2]|0;i=b;return(K=m,n)|0}else if((k|0)==5){o=+h[a+8>>3];h[d>>3]=o;if(+(~~+o>>>0>>>0)+ +((J=+o,+V(J)>=1.0?J>0.0?(al(+U(J/4294967296.0),4294967295.0)|0)>>>0:~~+af((J- +(~~J>>>0))/4294967296.0)>>>0:0)|0)*4294967296.0==o){p=o}else{eo(e,6512,1652,0,0,224,152,104,d);fD(e);p=+h[d>>3]}m=(J=+p,+V(J)>=1.0?J>0.0?(al(+U(J/4294967296.0),4294967295.0)|0)>>>0:~~+af((J- +(~~J>>>0))/4294967296.0)>>>0:0);n=~~+p>>>0;i=b;return(K=m,n)|0}else if((k|0)==4){k=a+8|0;a=c[k>>2]|0;d=c[k+4>>2]|0;c[f>>2]=a;c[f+4>>2]=d;k=-1;if((d|0)>(k|0)|(d|0)==(k|0)&a>>>0>-1>>>0){m=d;n=a;i=b;return(K=m,n)|0}ep(g,6512,1643,0,0,11072,152,104,f);fD(g);m=c[f+4>>2]|0;n=c[f>>2]|0;i=b;return(K=m,n)|0}else{er(j,6512,1694,0,0,0,8664,8456);fD(j);m=0;n=0;i=b;return(K=m,n)|0}return 0}function ef(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0;b=i;i=i+40|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;j=b+32|0;k=c[a>>2]|0;if((k|0)==4){l=a+8|0;m=c[l+4>>2]|0;n=c[l>>2]|0;i=b;return(K=m,n)|0}else if((k|0)==3){l=a+8|0;o=c[l>>2]|0;p=c[l+4>>2]|0;c[f>>2]=o;c[f+4>>2]=p;l=-1;if((p|0)>(l|0)|(p|0)==(l|0)&o>>>0>-1>>>0){m=p;n=o;i=b;return(K=m,n)|0}eq(g,6512,1624,0,0,11104,152,104,f);fD(g);m=c[f+4>>2]|0;n=c[f>>2]|0;i=b;return(K=m,n)|0}else if((k|0)==5){q=+h[a+8>>3];h[d>>3]=q;if(+(~~+q>>>0>>>0)+ +((J=+q,+V(J)>=1.0?J>0.0?(al(+U(J/4294967296.0),4294967295.0)|0)>>>0:~~+af((J- +(~~J>>>0))/4294967296.0)>>>0:0)>>>0)*4294967296.0==q){r=q}else{eo(e,6512,1652,0,0,224,152,104,d);fD(e);r=+h[d>>3]}m=(J=+r,+V(J)>=1.0?J>0.0?(al(+U(J/4294967296.0),4294967295.0)|0)>>>0:~~+af((J- +(~~J>>>0))/4294967296.0)>>>0:0);n=~~+r>>>0;i=b;return(K=m,n)|0}else{er(j,6512,1698,0,0,0,8664,8456);fD(j);m=0;n=0;i=b;return(K=m,n)|0}return 0}function eg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0.0;b=i;i=i+8|0;d=b|0;e=c[a>>2]|0;if((e|0)==4){f=a+8|0;g=+((c[f>>2]|0)>>>0)+ +((c[f+4>>2]|0)>>>0)*4294967296.0;i=b;return+g}else if((e|0)==3){f=a+8|0;g=+((c[f>>2]|0)>>>0)+ +(c[f+4>>2]|0)*4294967296.0;i=b;return+g}else if((e|0)==5){g=+h[a+8>>3];i=b;return+g}else{er(d,6512,1699,0,0,0,8664,8456);fD(d);g=0.0;i=b;return+g}return 0.0}function eh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0.0;b=i;i=i+8|0;d=b|0;e=c[a>>2]|0;if((e|0)==4){f=a+8|0;g=+((c[f>>2]|0)>>>0)+ +((c[f+4>>2]|0)>>>0)*4294967296.0;i=b;return+g}else if((e|0)==3){f=a+8|0;g=+((c[f>>2]|0)>>>0)+ +(c[f+4>>2]|0)*4294967296.0;i=b;return+g}else if((e|0)==5){g=+h[a+8>>3];i=b;return+g}else{er(d,6512,1700,0,0,0,8664,8456);fD(d);g=0.0;i=b;return+g}return 0.0}function ei(b){b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;if((c[b>>2]|0)==2){f=(a[b+8|0]&1)!=0;i=d;return f|0}else{er(e,6512,1717,0,0,2888,8664,8456);fD(e);f=0;i=d;return f|0}return 0}function ej(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;if((c[b>>2]|0)==6){f=b+8|0;b=a;g=c[f+4>>2]|0;c[b>>2]=c[f>>2];c[b+4>>2]=g;i=d;return}else{er(e,6512,1719,0,0,2536,8664,8456);g=a;c[g>>2]=0;c[g+4>>2]=0;c[a>>2]=23328;c[a+4>>2]=1;fD(e);i=d;return}}function ek(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;if((c[b>>2]|0)==8){f=a;g=b+8|0;nX(f|0,g|0,36)|0;i=d;return}else{er(e,6512,1720,0,0,2184,8664,8456);g=a;nW(g|0,0,32)|0;c[a+4>>2]=23184;g=a+32|0;f=a+8|0;nW(f|0,0,22)|0;c[g>>2]=2147483647;fD(e);i=d;return}}function el(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;if((c[b>>2]|0)==10){f=a;g=b+8|0;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];c[f+24>>2]=c[g+24>>2];i=d;return}else{er(e,6512,1721,0,0,1984,8664,8456);g=a;nW(g|0,0,24)|0;c[a>>2]=23064;g=a+24|0;f=a+4|0;nW(f|0,0,19)|0;c[g>>2]=2147483647;fD(e);i=d;return}}function em(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;if((c[b>>2]|0)==9){f=b+8|0;b=a;g=c[f+4>>2]|0;c[b>>2]=c[f>>2];c[b+4>>2]=g;i=d;return}else{er(e,6512,1722,0,0,1800,8664,8456);g=a;c[g>>2]=0;c[g+4>>2]=0;c[a>>2]=23112;fD(e);i=d;return}}function en(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+8|0;e=d|0;f=c[b>>2]|0;if((f|0)==6){g=b+8|0;h=(c[g+4>>2]|0)-1|0;c[a>>2]=c[g>>2];c[a+4>>2]=h;i=d;return}else if((f|0)==7){f=b+8|0;b=a;h=c[f+4>>2]|0;c[b>>2]=c[f>>2];c[b+4>>2]=h;i=d;return}else{er(e,6512,1761,0,0,952,8664,8456);h=a;c[h>>2]=0;c[h+4>>2]=0;c[a>>2]=0;c[a+4>>2]=0;fD(e);i=d;return}}function eo(b,d,e,f,g,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;n=i;i=i+72|0;o=n|0;p=n+40|0;q=n+64|0;c[b>>2]=0;r=p|0;s=l|0;t=nV(s|0)|0;eR(r,t);if((c[p+4>>2]|0)==0){u=0}else{u=c[p>>2]|0}v=l+t|0;if((t|0)!=0){t=s;s=u;while(1){u=t+1|0;a[s]=a[t]|0;if((u|0)==(v|0)){break}else{t=u;s=s+1|0}}}s=p+12|0;e_(o,27336,+h[m>>3]);m=o|0;eR(s,c[m>>2]|0);if((c[p+16>>2]|0)==0){w=0}else{w=c[s>>2]|0}s=c[m>>2]|0;m=o+4+s|0;if((s|0)!=0){s=o+4|0;o=w;while(1){w=s+1|0;a[o]=a[s]|0;if((w|0)==(m|0)){break}else{s=w;o=o+1|0}}}c[q>>2]=r;c[q+4>>2]=2;fF(b,d,e,f,g,j,k,q);q=p+12|0;k=c[q>>2]|0;j=p+16|0;g=c[j>>2]|0;if((k|0)!=0){c[q>>2]=0;c[j>>2]=0;j=c[p+20>>2]|0;cb[c[c[j>>2]>>2]&63](j,k,1,g,g,0)}g=p|0;k=c[g>>2]|0;j=p+4|0;q=c[j>>2]|0;if((k|0)==0){i=n;return}c[g>>2]=0;c[j>>2]=0;j=c[p+8>>2]|0;cb[c[c[j>>2]>>2]&63](j,k,1,q,q,0);i=n;return}function ep(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;m=i;i=i+64|0;n=m|0;o=m+32|0;p=m+56|0;c[b>>2]=0;q=o|0;r=k|0;s=nV(r|0)|0;eR(q,s);if((c[o+4>>2]|0)==0){t=0}else{t=c[o>>2]|0}u=k+s|0;if((s|0)!=0){s=r;r=t;while(1){t=s+1|0;a[r]=a[s]|0;if((t|0)==(u|0)){break}else{s=t;r=r+1|0}}}r=o+12|0;eX(n,27336,c[l>>2]|0,c[l+4>>2]|0);l=n|0;eR(r,c[l>>2]|0);if((c[o+16>>2]|0)==0){v=0}else{v=c[r>>2]|0}r=c[l>>2]|0;l=n+4+r|0;if((r|0)!=0){r=n+4|0;n=v;while(1){v=r+1|0;a[n]=a[r]|0;if((v|0)==(l|0)){break}else{r=v;n=n+1|0}}}c[p>>2]=q;c[p+4>>2]=2;fF(b,d,e,f,g,h,j,p);p=o+12|0;j=c[p>>2]|0;h=o+16|0;g=c[h>>2]|0;if((j|0)!=0){c[p>>2]=0;c[h>>2]=0;h=c[o+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=o|0;j=c[g>>2]|0;h=o+4|0;p=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[o+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,p,p,0);i=m;return}function eq(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;m=i;i=i+64|0;n=m|0;o=m+32|0;p=m+56|0;c[b>>2]=0;q=o|0;r=k|0;s=nV(r|0)|0;eR(q,s);if((c[o+4>>2]|0)==0){t=0}else{t=c[o>>2]|0}u=k+s|0;if((s|0)!=0){s=r;r=t;while(1){t=s+1|0;a[r]=a[s]|0;if((t|0)==(u|0)){break}else{s=t;r=r+1|0}}}r=o+12|0;eW(n,27336,c[l>>2]|0,c[l+4>>2]|0);l=n|0;eR(r,c[l>>2]|0);if((c[o+16>>2]|0)==0){v=0}else{v=c[r>>2]|0}r=c[l>>2]|0;l=n+4+r|0;if((r|0)!=0){r=n+4|0;n=v;while(1){v=r+1|0;a[n]=a[r]|0;if((v|0)==(l|0)){break}else{r=v;n=n+1|0}}}c[p>>2]=q;c[p+4>>2]=2;fF(b,d,e,f,g,h,j,p);p=o+12|0;j=c[p>>2]|0;h=o+16|0;g=c[h>>2]|0;if((j|0)!=0){c[p>>2]=0;c[h>>2]=0;h=c[o+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=o|0;j=c[g>>2]|0;h=o+4|0;p=c[h>>2]|0;if((j|0)==0){i=m;return}c[g>>2]=0;c[h>>2]=0;h=c[o+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,p,p,0);i=m;return}function er(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=k|0;q=nV(p|0)|0;eR(o,q);if((c[m+4>>2]|0)==0){r=0}else{r=c[m>>2]|0}s=k+q|0;if((q|0)!=0){q=p;p=r;while(1){r=q+1|0;a[p]=a[q]|0;if((r|0)==(s|0)){break}else{q=r;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function es(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;n=i;i=i+48|0;o=n|0;p=n+40|0;c[b>>2]=0;q=o|0;r=k|0;s=nV(r|0)|0;eR(q,s);if((c[o+4>>2]|0)==0){t=0}else{t=c[o>>2]|0}u=k+s|0;if((s|0)!=0){s=r;r=t;while(1){t=s+1|0;a[r]=a[s]|0;if((t|0)==(u|0)){break}else{s=t;r=r+1|0}}}r=o+12|0;s=(c[l+4>>2]|0)-1|0;u=c[l>>2]|0;eR(r,s);if((c[o+16>>2]|0)==0){v=0}else{v=c[r>>2]|0}r=u+s|0;if((s|0)!=0){s=u;u=v;while(1){v=s+1|0;a[u]=a[s]|0;if((v|0)==(r|0)){break}else{s=v;u=u+1|0}}}u=o+24|0;s=(c[m+4>>2]|0)-1|0;r=c[m>>2]|0;eR(u,s);if((c[o+28>>2]|0)==0){w=0}else{w=c[u>>2]|0}u=r+s|0;if((s|0)!=0){s=r;r=w;while(1){w=s+1|0;a[r]=a[s]|0;if((w|0)==(u|0)){break}else{s=w;r=r+1|0}}}c[p>>2]=q;c[p+4>>2]=3;fF(b,d,e,f,g,h,j,p);p=o+24|0;j=c[p>>2]|0;h=o+28|0;g=c[h>>2]|0;if((j|0)!=0){c[p>>2]=0;c[h>>2]=0;h=c[o+32>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0)}g=o+12|0;j=c[g>>2]|0;h=o+16|0;p=c[h>>2]|0;if((j|0)!=0){c[g>>2]=0;c[h>>2]=0;h=c[o+20>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,p,p,0)}p=o|0;j=c[p>>2]|0;h=o+4|0;g=c[h>>2]|0;if((j|0)==0){i=n;return}c[p>>2]=0;c[h>>2]=0;h=c[o+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=n;return}function et(d,f,g,h,j){d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0.0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0;k=i;i=i+8|0;l=k|0;m=l|0;c[m>>2]=h;n=i;i=i+28|0;i=i+7&-8;o=i;i=i+48|0;p=i;i=i+1|0;i=i+7&-8;q=i;i=i+1|0;i=i+7&-8;r=i;i=i+8|0;s=i;i=i+8|0;t=i;i=i+24|0;u=i;i=i+12|0;i=i+7&-8;v=i;i=i+12|0;i=i+7&-8;w=i;i=i+24|0;x=i;i=i+8|0;y=i;i=i+8|0;z=i;i=i+24|0;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+12|0;i=i+7&-8;C=i;i=i+1|0;i=i+7&-8;D=i;i=i+12|0;i=i+7&-8;E=i;i=i+1|0;i=i+7&-8;F=i;i=i+8|0;G=i;i=i+12|0;i=i+7&-8;H=i;i=i+1|0;i=i+7&-8;I=i;i=i+1|0;i=i+7&-8;J=i;i=i+1|0;i=i+7&-8;L=i;i=i+8|0;M=i;i=i+1|0;i=i+7&-8;N=i;i=i+36|0;i=i+7&-8;O=i;i=i+28|0;i=i+7&-8;P=i;i=i+32|0;Q=i;i=i+32|0;R=i;i=i+8|0;S=i;i=i+8|0;T=i;i=i+8|0;U=i;i=i+8|0;V=i;i=i+8|0;W=i;i=i+8|0;X=i;i=i+8|0;Y=i;i=i+8|0;Z=i;i=i+16|0;_=i;i=i+36|0;i=i+7&-8;$=i;i=i+28|0;i=i+7&-8;aa=i;i=i+12|0;i=i+7&-8;ab=i;i=i+8|0;ac=i;i=i+36|0;i=i+7&-8;ad=i;i=i+36|0;i=i+7&-8;ae=i;i=i+8|0;af=i;i=i+28|0;i=i+7&-8;ag=i;i=i+40|0;ah=i;i=i+4|0;i=i+7&-8;ai=i;i=i+40|0;aj=i;i=i+4|0;i=i+7&-8;ak=i;i=i+16|0;al=i;i=i+36|0;i=i+7&-8;am=i;i=i+32|0;an=i;i=i+28|0;i=i+7&-8;ao=i;i=i+8|0;ap=i;i=i+28|0;i=i+7&-8;aq=i;i=i+48|0;ar=i;i=i+32|0;as=i;i=i+32|0;at=i;i=i+28|0;i=i+7&-8;au=i;i=i+8|0;av=i;i=i+28|0;i=i+7&-8;aw=i;i=i+48|0;ax=i;i=i+32|0;ay=i;i=i+12|0;i=i+7&-8;az=i;i=i+28|0;i=i+7&-8;aA=i;i=i+12|0;i=i+7&-8;switch(c[f>>2]|0){case 0:{c[T>>2]=4504;c[T+4>>2]=1;ew(d,T);i=k;return};case 1:{c[S>>2]=9064;c[S+4>>2]=4;ew(d,S);i=k;return};case 2:{S=ei(f)|0;T=S?7912:6536;S=nV(T|0)|0;c[R>>2]=T;c[R+4>>2]=S;ew(d,R);i=k;return};case 3:{eW(Q,27328,ee(f)|0,K);eL(d,Q);i=k;return};case 4:{eX(P,27328,ef(f)|0,K);eL(d,P);i=k;return};case 5:{if(g<<16>>16==10){aB=+eg(f);eZ(O,27328,aB);eK(d,O);i=k;return}else{aB=+eh(f);e_(N,27328,aB);eJ(d,N);i=k;return}break};case 7:{en(W,f);aC=c[W+4>>2]|0;aD=c[W>>2]|0;break};case 6:{ej(Y,f);W=(c[Y+4>>2]|0)-1|0;c[X>>2]=c[Y>>2];c[X+4>>2]=W;aC=c[X+4>>2]|0;aD=c[X>>2]|0;break};case 8:{ek(_,f);X=_;W=c[X>>2]|0;Y=(W&16711680|0)==0&(c[X+4>>2]&0|0)==0?W&65535:14;W=_+16|0;X=eP(28,0,c[W>>2]|0,0,0)|0;N=X;if((c[W>>2]|0)==0){aE=N}else{O=n+16|0;g=n+20|0;P=n+4|0;Q=n+8|0;R=n+12|0;S=n+24|0;T=n|0;aF=N;aG=0;while(1){ec(o,_,aG);aH=c[m>>2]|0;et(n,o,Y,(aH|0)==0?0:aH+1|0,0);do{if((aF|0)==0){aH=c[O>>2]|0;aI=c[g>>2]|0;if((aH|0)==0){aJ=28;break}c[O>>2]=0;c[g>>2]=0;aK=c[S>>2]|0;cb[c[c[aK>>2]>>2]&63](aK,aH,32,aI,aI,178);aJ=28}else{c[aF>>2]=c[T>>2];c[aF+4>>2]=c[P>>2];c[aF+8>>2]=c[Q>>2];c[aF+12>>2]=c[R>>2];c[P>>2]=0;c[Q>>2]=0;c[aF+16>>2]=c[O>>2];c[aF+20>>2]=c[g>>2];c[aF+24>>2]=c[S>>2];c[O>>2]=0;c[g>>2]=0;aJ=aF+28|0}}while(0);aI=c[P>>2]|0;aH=c[Q>>2]|0;if((aI|0)!=0){c[P>>2]=0;c[Q>>2]=0;aK=c[R>>2]|0;cb[c[c[aK>>2]>>2]&63](aK,aI,1,aH,aH,0)}ed(o);aH=aG+1|0;if((aH|0)==(c[W>>2]|0)){aE=aJ;break}else{aF=aJ;aG=aH}}}aG=aa|0;c[aG>>2]=N;N=aa+4|0;c[N>>2]=(aE-X|0)/28|0;X=aa+8|0;c[X>>2]=23256;ev($,l,aa,j,0);a[H|0]=91;a[I|0]=93;eG(d,H,$,I);I=$+16|0;H=c[I>>2]|0;aa=$+20|0;aE=c[aa>>2]|0;if((H|0)!=0){c[I>>2]=0;c[aa>>2]=0;aa=c[$+24>>2]|0;cb[c[c[aa>>2]>>2]&63](aa,H,32,aE,aE,178)}aE=$+4|0;H=c[aE>>2]|0;aa=$+8|0;I=c[aa>>2]|0;if((H|0)!=0){c[aE>>2]=0;c[aa>>2]=0;aa=c[$+12>>2]|0;cb[c[c[aa>>2]>>2]&63](aa,H,1,I,I,0)}I=c[aG>>2]|0;H=c[N>>2]|0;if((I|0)==0){i=k;return}c[aG>>2]=0;c[N>>2]=0;N=c[X>>2]|0;cb[c[c[N>>2]>>2]&63](N,I,28,H,H,248);i=k;return};case 9:{em(ab,f);d7(ad,ab);H=a[ad|0]&1;a[ac|0]=H;if(H<<24>>24==0){H=b[ab+4>>1]|0;a[C|0]=40;eT(D,27328,H);a[E|0]=41;eD(d,C,D,E);i=k;return}else{E=ac+4|0;D=ad+4|0;nX(E|0,D|0,32)|0;D=(b[ac+28>>1]|0)==0;E=D?2147483647:c[ac+32>>2]|0;ad=D?0:c[ac+20>>2]|0;c[G>>2]=D?0:c[ac+12>>2]|0;c[G+4>>2]=ad;c[G+8>>2]=E;cZ(ae,G,0,0);G=(c[ae+4>>2]|0)-1|0;c[F>>2]=c[ae>>2];c[F+4>>2]=G;ew(d,F);i=k;return}break};case 10:{el(af,f);f=af|0;c[ah>>2]=c[f>>2];dS(ag,ah);c[aj>>2]=c[f>>2];dT(ai,aj);aj=ai+36|0;f=((c[ag+36>>2]|0)!=0)+(c[aj>>2]|0)|0;ag=eP(28,0,f,0,0)|0;ah=ak|0;c[ah>>2]=ag;F=ak+4|0;c[F>>2]=ag;G=ak+8|0;c[G>>2]=ag+(f*28|0);f=ak+12|0;c[f>>2]=23256;eb(al,af);ae=0;E=0;ad=al|0;ac=(a[ad]&1)==0;D=ac?0:al+4|0;L59:do{if(ac){aL=0;aM=0;aN=0;aO=0;aP=0;aQ=0;aR=0}else{C=D+8|0;H=c[C>>2]|0;ab=D+12|0;I=D+16|0;N=c[I>>2]|0;X=D+20|0;aG=D+24|0;aa=b[aG>>1]|0;$=D+28|0;aE=c[$>>2]|0;do{if((c[X>>2]|0)>>>0>=32>>>0){if((b[(c[ab>>2]|0)+2>>1]|0)!=-1){break}aJ=am;aF=D;nX(aJ|0,aF|0,32)|0;if(ea(af,am)|0){break}if((a[ad]&1)==0){aL=0;aM=0;aN=0;aO=0;aP=0;aQ=0;aR=0;break L59}a[ad]=0;aL=0;aM=0;aN=0;aO=0;aP=0;aQ=0;aR=0;break L59}}while(0);aF=aa<<16>>16==0;c[B>>2]=aF?0:H;c[B+4>>2]=aF?0:N;c[B+8>>2]=aF?2147483647:aE;cZ(ao,B,0,0);aF=ar;aJ=D;nX(aF|0,aJ|0,32)|0;d9(aq,af,ar);aJ=c[C>>2]|0;aF=c[I>>2]|0;W=b[aG>>1]|0;o=c[$>>2]|0;do{if((c[X>>2]|0)>>>0<80>>>0){aS=168}else{R=e[(c[ab>>2]|0)+8>>1]|0;if((R|0)==0){aS=168;break}else if((R|0)==1){aT=16;break}eN()}}while(0);do{if((aS|0)==168){if((W&65535)>>>0>2>>>0){aU=aJ;aV=aF+16|0;aW=o}else{aU=0;aV=0;aW=2147483647}c[A>>2]=aU;c[A+4>>2]=aV;c[A+8>>2]=aW;cX(z,A,0);if((c[z+12>>2]|0)>>>0<16>>>0){aT=0;break}aT=b[c[z+4>>2]>>1]|0}}while(0);et(ap,aq,aT,(h|0)==0?0:h+1|0,1);o=(c[ao+4>>2]|0)-1|0;c[x>>2]=c[ao>>2];c[x+4>>2]=o;c[y>>2]=9120;c[y+4>>2]=3;eC(an,x,y,ap);o=c[an>>2]|0;aF=an+4|0;aJ=c[aF>>2]|0;W=an+8|0;ab=c[W>>2]|0;X=c[an+12>>2]|0;ae=X;c[aF>>2]=0;c[W>>2]=0;W=an+16|0;aF=c[W>>2]|0;$=an+20|0;aG=c[$>>2]|0;I=c[an+24>>2]|0;E=I;c[W>>2]=0;c[$>>2]=0;$=ap+16|0;W=c[$>>2]|0;C=ap+20|0;aE=c[C>>2]|0;if((W|0)!=0){c[$>>2]=0;c[C>>2]=0;C=c[ap+24>>2]|0;cb[c[c[C>>2]>>2]&63](C,W,32,aE,aE,178)}aE=ap+4|0;W=c[aE>>2]|0;C=ap+8|0;$=c[C>>2]|0;if((W|0)!=0){c[aE>>2]=0;c[C>>2]=0;C=c[ap+12>>2]|0;cb[c[c[C>>2]>>2]&63](C,W,1,$,$,0)}ed(aq);aL=o;aM=aJ;aN=ab;aO=aF;aP=aG;aQ=X;aR=I}}while(0);aq=c[aj>>2]|0;L91:do{if((aq|0)==0){aX=aP;aY=aO;aZ=aN;a_=aM;a$=ag}else{aj=ai|0;ap=ai+32|0;an=ai+4|0;y=w|0;x=w+4|0;ao=w+8|0;aT=w+12|0;z=w+16|0;A=w+18|0;aW=w+20|0;aV=as|0;aU=as+4|0;ar=as+8|0;D=as+12|0;B=as+16|0;am=as+20|0;ac=as+24|0;I=as+26|0;X=as+28|0;aG=v|0;aF=v+4|0;ab=v+8|0;aJ=ax|0;o=ax+4|0;$=ax+8|0;W=ax+12|0;C=ax+16|0;aE=ax+20|0;N=ax+24|0;H=ax+26|0;aa=ax+28|0;R=u|0;Q=u+4|0;P=u+8|0;g=t+4|0;O=t+12|0;S=(h|0)==0?0:h+1|0;T=au+4|0;Y=au|0;n=r|0;m=r+4|0;_=s|0;aH=s+4|0;aI=at+16|0;aK=at+20|0;a0=at+4|0;a1=at+8|0;a2=av+16|0;a3=av+20|0;a4=av+4|0;a5=av+8|0;a6=av+12|0;a7=av+24|0;a8=at+12|0;a9=at+24|0;ba=at|0;bb=aP;bc=aO;bd=aN;be=aM;bf=0;bg=ag;while(1){bh=c[aj>>2]|0;bi=e[(c[ap>>2]|0)+(bf<<1)>>1]|0;c4(w,an,bi);bj=c[y>>2]|0;bk=c[x>>2]|0;bl=c[ao>>2]|0;bm=c[aT>>2]|0;bn=b[z>>1]|0;bo=b[A>>1]|0;bp=c[aW>>2]|0;do{if((a[ad]&1)==0){bq=be;br=bd;bs=bc;bt=bb;bu=bg}else{if((c[al+8>>2]|0)>>>0>=bi>>>0){bq=be;br=bd;bs=bc;bt=bb;bu=bg;break}if((bg|0)==(c[G>>2]|0)){bv=c[ah>>2]|0;eB(ak,(bg|0)==(bv|0)?4:((bg-bv|0)/28|0)<<1);bw=c[F>>2]|0}else{bw=bg}if((bw|0)==0){bx=0;by=be;bz=bd;bA=bc;bB=bb}else{c[bw>>2]=aL;c[bw+4>>2]=be;c[bw+8>>2]=bd;c[bw+12>>2]=aQ;c[bw+16>>2]=bc;c[bw+20>>2]=bb;c[bw+24>>2]=aR;bx=c[F>>2]|0;by=0;bz=0;bA=0;bB=0}bv=bx+28|0;c[F>>2]=bv;if((a[ad]&1)==0){bq=by;br=bz;bs=bA;bt=bB;bu=bv;break}a[ad]=0;bq=by;br=bz;bs=bA;bt=bB;bu=bv}}while(0);c[aV>>2]=bh;c[aU>>2]=bi;c[ar>>2]=bj;c[D>>2]=bk;c[B>>2]=bl;c[am>>2]=bm;b[ac>>1]=bn;b[I>>1]=bo;c[X>>2]=bp;if(ea(af,as)|0){bv=bn<<16>>16==0;c[aG>>2]=bv?0:bj;c[aF>>2]=bv?0:bl;c[ab>>2]=bv?2147483647:bp;cZ(au,v,0,0);c[aJ>>2]=bh;c[o>>2]=bi;c[$>>2]=bj;c[W>>2]=bk;c[C>>2]=bl;c[aE>>2]=bm;b[N>>1]=bn;b[H>>1]=bo;c[aa>>2]=bp;d9(aw,af,ax);if(bm>>>0<80>>>0){aS=216}else{bv=e[bk+8>>1]|0;if((bv|0)==0){aS=216}else if((bv|0)==1){bC=16}else{break}}do{if((aS|0)==216){aS=0;if((bn&65535)>>>0>2>>>0){bD=bj;bE=bl+16|0;bF=bp}else{bD=0;bE=0;bF=2147483647}c[R>>2]=bD;c[Q>>2]=bE;c[P>>2]=bF;cX(t,u,0);if((c[O>>2]|0)>>>0<16>>>0){bC=0;break}bC=b[c[g>>2]>>1]|0}}while(0);et(av,aw,bC,S,1);bp=(c[T>>2]|0)-1|0;c[n>>2]=c[Y>>2];c[m>>2]=bp;c[_>>2]=9120;c[aH>>2]=3;eC(at,r,s,av);if((bu|0)==(c[G>>2]|0)){bp=c[ah>>2]|0;eB(ak,(bu|0)==(bp|0)?4:((bu-bp|0)/28|0)<<1);bG=c[F>>2]|0}else{bG=bu}do{if((bG|0)==0){bp=c[aI>>2]|0;bl=c[aK>>2]|0;c[F>>2]=28;if((bp|0)==0){bH=28;break}c[aI>>2]=0;c[aK>>2]=0;bj=c[a9>>2]|0;cb[c[c[bj>>2]>>2]&63](bj,bp,32,bl,bl,178);bH=28}else{c[bG>>2]=c[ba>>2];c[bG+4>>2]=c[a0>>2];c[bG+8>>2]=c[a1>>2];c[bG+12>>2]=c[a8>>2];c[a0>>2]=0;c[a1>>2]=0;c[bG+16>>2]=c[aI>>2];c[bG+20>>2]=c[aK>>2];c[bG+24>>2]=c[a9>>2];c[aI>>2]=0;c[aK>>2]=0;bl=(c[F>>2]|0)+28|0;c[F>>2]=bl;bH=bl}}while(0);bl=c[a0>>2]|0;bp=c[a1>>2]|0;if((bl|0)!=0){c[a0>>2]=0;c[a1>>2]=0;bj=c[a8>>2]|0;cb[c[c[bj>>2]>>2]&63](bj,bl,1,bp,bp,0)}bp=c[a2>>2]|0;bl=c[a3>>2]|0;if((bp|0)!=0){c[a2>>2]=0;c[a3>>2]=0;bj=c[a7>>2]|0;cb[c[c[bj>>2]>>2]&63](bj,bp,32,bl,bl,178)}bl=c[a4>>2]|0;bp=c[a5>>2]|0;if((bl|0)!=0){c[a4>>2]=0;c[a5>>2]=0;bj=c[a6>>2]|0;cb[c[c[bj>>2]>>2]&63](bj,bl,1,bp,bp,0)}ed(aw);bI=bH}else{bI=bu}bp=bf+1|0;if((bp|0)==(aq|0)){aX=bt;aY=bs;aZ=br;a_=bq;a$=bI;break L91}else{bb=bt;bc=bs;bd=br;be=bq;bf=bp;bg=bI}}eN()}}while(0);if((a[ad]&1)==0){bJ=a_;bK=aZ;bL=aY;bM=aX;bN=a$;bO=aQ;bP=aR}else{if((a$|0)==(c[G>>2]|0)){ad=c[ah>>2]|0;eB(ak,(a$|0)==(ad|0)?4:((a$-ad|0)/28|0)<<1);bQ=c[F>>2]|0}else{bQ=a$}if((bQ|0)==0){bR=0;bS=a_;bT=aZ;bU=aY;bV=aX;bW=aQ;bX=aR}else{c[bQ>>2]=aL;c[bQ+4>>2]=a_;c[bQ+8>>2]=aZ;aZ=ae;c[bQ+12>>2]=aZ;c[bQ+16>>2]=aY;c[bQ+20>>2]=aX;aX=E;c[bQ+24>>2]=aX;bR=c[F>>2]|0;bS=0;bT=0;bU=0;bV=0;bW=aZ;bX=aX}aX=bR+28|0;c[F>>2]=aX;bJ=bS;bK=bT;bL=bU;bM=bV;bN=aX;bO=bW;bP=bX}bX=(bN|0)==(c[G>>2]|0);do{if((j|0)==2){if(bX){bY=bN}else{eB(ak,(bN-(c[ah>>2]|0)|0)/28|0);bY=c[F>>2]|0}bW=c[ah>>2]|0;aX=c[f>>2]|0;bV=ay|0;c[bV>>2]=bW;bU=ay+4|0;c[bU>>2]=(bY-bW|0)/28|0;bW=ay+8|0;c[bW>>2]=aX;c[ah>>2]=0;c[F>>2]=0;c[G>>2]=0;ev(d,l,ay,2,1);aX=c[bV>>2]|0;bT=c[bU>>2]|0;if((aX|0)==0){break}c[bV>>2]=0;c[bU>>2]=0;bU=c[bW>>2]|0;cb[c[c[bU>>2]>>2]&63](bU,aX,28,bT,bT,248)}else{if(bX){bZ=bN}else{eB(ak,(bN-(c[ah>>2]|0)|0)/28|0);bZ=c[F>>2]|0}bT=c[ah>>2]|0;aX=c[f>>2]|0;bU=aA|0;c[bU>>2]=bT;bW=aA+4|0;c[bW>>2]=(bZ-bT|0)/28|0;bT=aA+8|0;c[bT>>2]=aX;c[ah>>2]=0;c[F>>2]=0;c[G>>2]=0;ev(az,l,aA,j,1);a[p|0]=40;a[q|0]=41;eG(d,p,az,q);aX=az+16|0;bV=c[aX>>2]|0;bS=az+20|0;bR=c[bS>>2]|0;if((bV|0)!=0){c[aX>>2]=0;c[bS>>2]=0;bS=c[az+24>>2]|0;cb[c[c[bS>>2]>>2]&63](bS,bV,32,bR,bR,178)}bR=az+4|0;bV=c[bR>>2]|0;bS=az+8|0;aX=c[bS>>2]|0;if((bV|0)!=0){c[bR>>2]=0;c[bS>>2]=0;bS=c[az+12>>2]|0;cb[c[c[bS>>2]>>2]&63](bS,bV,1,aX,aX,0)}aX=c[bU>>2]|0;bV=c[bW>>2]|0;if((aX|0)==0){break}c[bU>>2]=0;c[bW>>2]=0;bW=c[bT>>2]|0;cb[c[c[bW>>2]>>2]&63](bW,aX,28,bV,bV,248)}}while(0);if((bL|0)!=0){cb[c[c[bP>>2]>>2]&63](bP,bL,32,bM,bM,178)}if((bJ|0)==0){i=k;return}cb[c[c[bO>>2]>>2]&63](bO,bJ,1,bK,bK,0);i=k;return};case 11:{c[U>>2]=8824;c[U+4>>2]=21;ew(d,U);i=k;return};case 12:{c[V>>2]=8640;c[V+4>>2]=16;ew(d,V);i=k;return};default:{eN()}}V=aD;aD=eP(1,0,aC,0,0)|0;U=Z|0;c[U>>2]=aD;bK=Z+4|0;c[bK>>2]=aD;bJ=Z+8|0;c[bJ>>2]=aD+aC;bO=Z+12|0;c[bO>>2]=23256;bM=V+aC|0;if((aC|0)==0){b_=aD;b$=aD}else{aC=V;V=aD;while(1){aD=a[aC]|0;L196:do{switch(aD<<24>>24|0){case 7:{bL=c[U>>2]|0;bP=bL;az=V-bP+2|0;q=c[bJ>>2]|0;p=q-bP|0;if(az>>>0>p>>>0){bP=(q|0)==(bL|0)?4:p<<1;eI(Z,bP>>>0<az>>>0?az:bP);b0=c[bK>>2]|0}else{b0=V}bP=b0+1|0;if((b0|0)!=0){a[b0]=92}if((bP|0)!=0){a[bP]=97}bP=b0+2|0;c[bK>>2]=bP;b1=bP;break};case 8:{bP=c[U>>2]|0;az=bP;p=V-az+2|0;bL=c[bJ>>2]|0;q=bL-az|0;if(p>>>0>q>>>0){az=(bL|0)==(bP|0)?4:q<<1;eI(Z,az>>>0<p>>>0?p:az);b2=c[bK>>2]|0}else{b2=V}az=b2+1|0;if((b2|0)!=0){a[b2]=92}if((az|0)!=0){a[az]=98}az=b2+2|0;c[bK>>2]=az;b1=az;break};case 12:{az=c[U>>2]|0;p=az;q=V-p+2|0;bP=c[bJ>>2]|0;bL=bP-p|0;if(q>>>0>bL>>>0){p=(bP|0)==(az|0)?4:bL<<1;eI(Z,p>>>0<q>>>0?q:p);b3=c[bK>>2]|0}else{b3=V}p=b3+1|0;if((b3|0)!=0){a[b3]=92}if((p|0)!=0){a[p]=102}p=b3+2|0;c[bK>>2]=p;b1=p;break};case 10:{p=c[U>>2]|0;q=p;bL=V-q+2|0;az=c[bJ>>2]|0;bP=az-q|0;if(bL>>>0>bP>>>0){q=(az|0)==(p|0)?4:bP<<1;eI(Z,q>>>0<bL>>>0?bL:q);b4=c[bK>>2]|0}else{b4=V}q=b4+1|0;if((b4|0)!=0){a[b4]=92}if((q|0)!=0){a[q]=110}q=b4+2|0;c[bK>>2]=q;b1=q;break};case 13:{q=c[U>>2]|0;bL=q;bP=V-bL+2|0;p=c[bJ>>2]|0;az=p-bL|0;if(bP>>>0>az>>>0){bL=(p|0)==(q|0)?4:az<<1;eI(Z,bL>>>0<bP>>>0?bP:bL);b5=c[bK>>2]|0}else{b5=V}bL=b5+1|0;if((b5|0)!=0){a[b5]=92}if((bL|0)!=0){a[bL]=114}bL=b5+2|0;c[bK>>2]=bL;b1=bL;break};case 9:{bL=c[U>>2]|0;bP=bL;az=V-bP+2|0;q=c[bJ>>2]|0;p=q-bP|0;if(az>>>0>p>>>0){bP=(q|0)==(bL|0)?4:p<<1;eI(Z,bP>>>0<az>>>0?az:bP);b6=c[bK>>2]|0}else{b6=V}bP=b6+1|0;if((b6|0)!=0){a[b6]=92}if((bP|0)!=0){a[bP]=116}bP=b6+2|0;c[bK>>2]=bP;b1=bP;break};case 11:{bP=c[U>>2]|0;az=bP;p=V-az+2|0;bL=c[bJ>>2]|0;q=bL-az|0;if(p>>>0>q>>>0){az=(bL|0)==(bP|0)?4:q<<1;eI(Z,az>>>0<p>>>0?p:az);b7=c[bK>>2]|0}else{b7=V}az=b7+1|0;if((b7|0)!=0){a[b7]=92}if((az|0)!=0){a[az]=118}az=b7+2|0;c[bK>>2]=az;b1=az;break};case 39:{az=c[U>>2]|0;p=az;q=V-p+2|0;bP=c[bJ>>2]|0;bL=bP-p|0;if(q>>>0>bL>>>0){p=(bP|0)==(az|0)?4:bL<<1;eI(Z,p>>>0<q>>>0?q:p);b8=c[bK>>2]|0}else{b8=V}p=b8+1|0;if((b8|0)!=0){a[b8]=92}if((p|0)!=0){a[p]=39}p=b8+2|0;c[bK>>2]=p;b1=p;break};case 34:{p=c[U>>2]|0;q=p;bL=V-q+2|0;az=c[bJ>>2]|0;bP=az-q|0;if(bL>>>0>bP>>>0){q=(az|0)==(p|0)?4:bP<<1;eI(Z,q>>>0<bL>>>0?bL:q);b9=c[bK>>2]|0}else{b9=V}q=b9+1|0;if((b9|0)!=0){a[b9]=92}if((q|0)!=0){a[q]=34}q=b9+2|0;c[bK>>2]=q;b1=q;break};case 92:{q=c[U>>2]|0;bL=q;bP=V-bL+2|0;p=c[bJ>>2]|0;az=p-bL|0;if(bP>>>0>az>>>0){bL=(p|0)==(q|0)?4:az<<1;eI(Z,bL>>>0<bP>>>0?bP:bL);ca=c[bK>>2]|0}else{ca=V}bL=ca+1|0;if((ca|0)!=0){a[ca]=92}if((bL|0)!=0){a[bL]=92}bL=ca+2|0;c[bK>>2]=bL;b1=bL;break};default:{bL=(V|0)==(c[bJ>>2]|0);if(aD<<24>>24>=32){if(bL){bP=c[U>>2]|0;eI(Z,(V|0)==(bP|0)?4:V-bP<<1);cc=c[bK>>2]|0}else{cc=V}if((cc|0)==0){cd=0}else{a[cc]=aD;cd=c[bK>>2]|0}bP=cd+1|0;c[bK>>2]=bP;b1=bP;break L196}if(bL){bL=c[U>>2]|0;eI(Z,(V|0)==(bL|0)?4:V-bL<<1);ce=c[bK>>2]|0}else{ce=V}if((ce|0)==0){cf=0}else{a[ce]=92;cf=c[bK>>2]|0}bL=cf+1|0;c[bK>>2]=bL;if((bL|0)==(c[bJ>>2]|0)){bP=c[U>>2]|0;eI(Z,(bL|0)==(bP|0)?4:bL-bP<<1);cg=c[bK>>2]|0}else{cg=bL}if((cg|0)==0){ch=0}else{a[cg]=120;ch=cg}bL=ch+1|0;c[bK>>2]=bL;bP=aD&255;if((bL|0)==(c[bJ>>2]|0)){az=c[U>>2]|0;eI(Z,(bL|0)==(az|0)?4:bL-az<<1);ci=c[bK>>2]|0}else{ci=bL}if((ci|0)==0){cj=0}else{a[ci]=a[23232+(bP>>>4)|0]|0;cj=ci}bL=cj+1|0;c[bK>>2]=bL;if((bL|0)==(c[bJ>>2]|0)){az=c[U>>2]|0;eI(Z,(bL|0)==(az|0)?4:bL-az<<1);ck=c[bK>>2]|0}else{ck=bL}if((ck|0)==0){cl=0}else{a[ck]=a[23232+(bP&15)|0]|0;cl=ck}bP=cl+1|0;c[bK>>2]=bP;b1=bP}}}while(0);aD=aC+1|0;if((aD|0)==(bM|0)){break}else{aC=aD;V=b1}}b_=c[U>>2]|0;b$=b1}a[J|0]=34;b1=b_;V=b$-b1|0;c[L>>2]=b1;c[L+4>>2]=V;a[M|0]=34;eH(d,J,L,M);if((b_|0)==0){i=k;return}M=c[bJ>>2]|0;c[U>>2]=0;c[bK>>2]=0;c[bJ>>2]=0;bJ=c[bO>>2]|0;cb[c[c[bJ>>2]>>2]&63](bJ,b_,1,V,M-b1|0,0);i=k;return}function eu(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+48|0;f=b;b=i;i=i+24|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];c[b+16>>2]=c[f+16>>2];c[b+20>>2]=c[f+20>>2];f=e|0;g=b;c[f>>2]=10;c[f+8>>2]=d;d=f+12|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];c[d+16>>2]=c[g+16>>2];c[d+20>>2]=c[g+20>>2];et(a,f,16,0,0);ed(f);i=e;return}function ev(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=i;i=i+96|0;j=h|0;k=h+8|0;l=h+16|0;m=h+48|0;n=h+56|0;o=h+88|0;p=d|0;L357:do{if((c[p>>2]|0)!=0){d=c[e>>2]|0;q=c[e+4>>2]|0;r=d+(q*28|0)|0;s=l|0;if((q|0)==0){break}L360:do{if((g|0)==1){q=d;t=0;while(1){u=q|0;if((c[u>>2]|0)>>>0>24>>>0){break L360}e0(q,s);a[l+(c[u>>2]|0)|0]=0;if((a1(s|0,10)|0)!=0){break L360}t=(c[u>>2]|0)+t|0;if(t>>>0>64>>>0){break L360}q=q+28|0;if((q|0)==(r|0)){break L357}}}else{q=d;while(1){t=q|0;if((c[t>>2]|0)>>>0>24>>>0){break L360}e0(q,s);a[l+(c[t>>2]|0)|0]=0;if((a1(s|0,10)|0)!=0){break L360}q=q+28|0;if((q|0)==(r|0)){break L357}}}}while(0);r=(c[p>>2]<<1)+3|0;s=bi()|0;d=i;i=i+r|0;i=i+7&-8;a[d]=44;r=d+1|0;a[r]=10;q=d+2|0;t=c[p>>2]<<1;nW(q|0,32,t|0)|0;a[d+(t+2)|0]=0;q=(f|0)==0?8280:r;c[o>>2]=d;c[o+4>>2]=t+3;e$(n,e,o);t=nV(q|0)|0;c[j>>2]=q;c[j+4>>2]=t;a[k|0]=32;eE(b,j,n,k);t=n+16|0;q=c[t>>2]|0;d=n+20|0;r=c[d>>2]|0;if((q|0)!=0){c[t>>2]=0;c[d>>2]=0;d=c[n+24>>2]|0;cb[c[c[d>>2]>>2]&63](d,q,32,r,r,178)}r=n+4|0;q=c[r>>2]|0;d=n+8|0;t=c[d>>2]|0;if((q|0)!=0){c[r>>2]=0;c[d>>2]=0;d=c[n+12>>2]|0;cb[c[c[d>>2]>>2]&63](d,q,1,t,t,0)}aL(s|0);i=h;return}}while(0);c[m>>2]=8448;c[m+4>>2]=3;e$(b,e,m);i=h;return}function ew(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+16|0;f=e|0;g=b;nW(g|0,0,28)|0;g=d+4|0;h=c[g>>2]|0;c[b>>2]=h;eR(f,h);h=b+4|0;j=b+8|0;k=f|0;c[h>>2]=c[k>>2];l=f+4|0;c[j>>2]=c[l>>2];c[b+12>>2]=c[f+8>>2];c[k>>2]=0;c[l>>2]=0;l=eP(32,0,0,118,254)|0;k=b+16|0;f=c[k>>2]|0;m=b+20|0;n=c[m>>2]|0;if((f|0)==0){o=b+24|0}else{c[k>>2]=0;c[m>>2]=0;p=b+24|0;b=c[p>>2]|0;cb[c[c[b>>2]>>2]&63](b,f,32,n,n,178);o=p}c[k>>2]=l;c[m>>2]=0;c[o>>2]=23256;if((c[j>>2]|0)==0){q=0}else{q=c[h>>2]|0}h=c[d>>2]|0;d=c[g>>2]|0;g=h+d|0;if((d|0)==0){i=e;return}else{r=h;s=q}while(1){q=r+1|0;a[s]=a[r]|0;if((q|0)==(g|0)){break}else{r=q;s=s+1|0}}i=e;return}function ex(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+20|0;d=c[b>>2]|0;e=a+24|0;f=c[e>>2]|0;if((d|0)!=0){c[b>>2]=0;c[e>>2]=0;e=c[a+28>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,32,f,f,178)}f=a+8|0;d=c[f>>2]|0;e=a+12|0;b=c[e>>2]|0;if((d|0)==0){return}c[f>>2]=0;c[e>>2]=0;e=c[a+16>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,b,b,0);return}function ey(a){a=a|0;if((a|0)==0){return}nW(a|0,0,32)|0;return}function ez(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+20|0;d=c[b>>2]|0;e=a+24|0;f=c[e>>2]|0;if((d|0)!=0){c[b>>2]=0;c[e>>2]=0;e=c[a+28>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,32,f,f,178)}f=a+8|0;d=c[f>>2]|0;e=a+12|0;b=c[e>>2]|0;if((d|0)==0){return}c[f>>2]=0;c[e>>2]=0;e=c[a+16>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,b,b,0);return}function eA(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+16|0;d=c[b>>2]|0;e=a+20|0;f=c[e>>2]|0;if((d|0)!=0){c[b>>2]=0;c[e>>2]=0;e=c[a+24>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,32,f,f,178)}f=a+4|0;d=c[f>>2]|0;e=a+8|0;b=c[e>>2]|0;if((d|0)==0){return}c[f>>2]=0;c[e>>2]=0;e=c[a+12>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,b,b,0);return}function eB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=eP(28,0,b,0,0)|0;e=d+(b*28|0)|0;f=a+4|0;g=a|0;h=c[g>>2]|0;i=((c[f>>2]|0)-h|0)/28|0;j=i>>>0>b>>>0?b:i;if((j|0)==0){k=d;l=h}else{i=d;b=0;m=h;while(1){if((i|0)==0){n=0;o=m}else{c[i>>2]=c[m+(b*28|0)>>2];h=m+(b*28|0)+4|0;c[i+4>>2]=c[h>>2];p=m+(b*28|0)+8|0;c[i+8>>2]=c[p>>2];c[i+12>>2]=c[m+(b*28|0)+12>>2];c[h>>2]=0;c[p>>2]=0;p=m+(b*28|0)+16|0;c[i+16>>2]=c[p>>2];h=m+(b*28|0)+20|0;c[i+20>>2]=c[h>>2];c[i+24>>2]=c[m+(b*28|0)+24>>2];c[p>>2]=0;c[h>>2]=0;n=i;o=c[g>>2]|0}h=n+28|0;p=b+1|0;if(p>>>0<j>>>0){i=h;b=p;m=o}else{k=h;l=o;break}}}o=a+8|0;if((l|0)==0){q=a+12|0;c[g>>2]=d;c[f>>2]=k;c[o>>2]=e;c[q>>2]=23256;return}else{m=c[o>>2]|0;b=c[f>>2]|0;c[g>>2]=0;c[f>>2]=0;c[o>>2]=0;i=a+12|0;a=c[i>>2]|0;j=l;cb[c[c[a>>2]>>2]&63](a,l,28,(b-j|0)/28|0,(m-j|0)/28|0,248);q=i;c[g>>2]=d;c[f>>2]=k;c[o>>2]=e;c[q>>2]=23256;return}}function eC(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=i;i=i+16|0;h=g|0;j=b;nW(j|0,0,28)|0;j=d+4|0;k=e+4|0;l=f|0;m=(c[k>>2]|0)+(c[j>>2]|0)|0;c[b>>2]=(c[l>>2]|0)+m;eR(h,m);m=b+4|0;n=b+8|0;o=h|0;c[m>>2]=c[o>>2];p=h+4|0;c[n>>2]=c[p>>2];c[b+12>>2]=c[h+8>>2];c[o>>2]=0;c[p>>2]=0;p=eP(32,1,1,118,254)|0;o=b+16|0;h=c[o>>2]|0;q=b+20|0;r=c[q>>2]|0;if((h|0)==0){s=b+24|0}else{c[o>>2]=0;c[q>>2]=0;t=b+24|0;b=c[t>>2]|0;cb[c[c[b>>2]>>2]&63](b,h,32,r,r,178);s=t}c[o>>2]=p;c[q>>2]=1;c[s>>2]=23256;if((c[n>>2]|0)==0){u=0}else{u=c[m>>2]|0}s=c[d>>2]|0;d=c[j>>2]|0;j=s+d|0;if((d|0)==0){v=u}else{q=s;s=u;while(1){p=q+1|0;a[s]=a[q]|0;if((p|0)==(j|0)){break}else{q=p;s=s+1|0}}v=u+d|0}d=c[e>>2]|0;e=c[k>>2]|0;k=d+e|0;if((e|0)==0){w=v}else{u=d;d=v;while(1){s=u+1|0;a[d]=a[u]|0;if((s|0)==(k|0)){break}else{u=s;d=d+1|0}}w=v+e|0}if((c[n>>2]|0)==0){x=0}else{x=c[m>>2]|0}m=c[o>>2]|0;c[m>>2]=w-x;c[m+4>>2]=c[l>>2];l=m+8|0;x=c[l>>2]|0;w=m+12|0;o=c[w>>2]|0;if((x|0)==0){y=m+16|0}else{c[l>>2]=0;c[w>>2]=0;n=m+16|0;e=c[n>>2]|0;cb[c[c[e>>2]>>2]&63](e,x,1,o,o,0);y=n}n=f+4|0;c[l>>2]=c[n>>2];l=f+8|0;c[w>>2]=c[l>>2];c[y>>2]=c[f+12>>2];c[n>>2]=0;c[l>>2]=0;l=m+20|0;n=c[l>>2]|0;y=m+24|0;w=c[y>>2]|0;if((n|0)==0){z=m+28|0;A=f+16|0;B=c[A>>2]|0;c[l>>2]=B;C=f+20|0;D=c[C>>2]|0;c[y>>2]=D;E=f+24|0;F=c[E>>2]|0;c[z>>2]=F;c[A>>2]=0;c[C>>2]=0;i=g;return}else{c[l>>2]=0;c[y>>2]=0;o=m+28|0;m=c[o>>2]|0;cb[c[c[m>>2]>>2]&63](m,n,32,w,w,178);z=o;A=f+16|0;B=c[A>>2]|0;c[l>>2]=B;C=f+20|0;D=c[C>>2]|0;c[y>>2]=D;E=f+24|0;F=c[E>>2]|0;c[z>>2]=F;c[A>>2]=0;c[C>>2]=0;i=g;return}}function eD(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+16|0;h=g|0;j=b;nW(j|0,0,28)|0;j=e|0;k=(c[j>>2]|0)+2|0;c[b>>2]=k;eR(h,k);k=b+4|0;l=h|0;c[k>>2]=c[l>>2];m=h+4|0;c[b+8>>2]=c[m>>2];c[b+12>>2]=c[h+8>>2];c[l>>2]=0;c[m>>2]=0;m=eP(32,0,0,118,254)|0;l=b+16|0;h=c[l>>2]|0;n=b+20|0;o=c[n>>2]|0;if((h|0)==0){p=b+24|0}else{c[l>>2]=0;c[n>>2]=0;q=b+24|0;b=c[q>>2]|0;cb[c[c[b>>2]>>2]&63](b,h,32,o,o,178);p=q}c[l>>2]=m;c[n>>2]=0;c[p>>2]=23256;p=c[k>>2]|0;a[p]=a[d|0]|0;d=p+1|0;k=c[j>>2]|0;j=e+4+k|0;if((k|0)==0){r=d;s=f|0;t=a[s]|0;a[r]=t;i=g;return}n=e+4|0;e=d;while(1){d=n+1|0;a[e]=a[n]|0;if((d|0)==(j|0)){break}else{n=d;e=e+1|0}}r=p+(k+1)|0;s=f|0;t=a[s]|0;a[r]=t;i=g;return}function eE(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+16|0;h=g|0;j=b;nW(j|0,0,28)|0;j=d+4|0;k=c[j>>2]|0;c[b>>2]=(c[e>>2]|0)+k+1;eR(h,k+1|0);k=b+4|0;l=b+8|0;m=h|0;c[k>>2]=c[m>>2];n=h+4|0;c[l>>2]=c[n>>2];c[b+12>>2]=c[h+8>>2];c[m>>2]=0;c[n>>2]=0;n=eP(32,1,1,118,254)|0;m=b+16|0;h=c[m>>2]|0;o=b+20|0;p=c[o>>2]|0;if((h|0)==0){q=b+24|0}else{c[m>>2]=0;c[o>>2]=0;r=b+24|0;s=c[r>>2]|0;cb[c[c[s>>2]>>2]&63](s,h,32,p,p,178);q=r}c[m>>2]=n;c[o>>2]=1;c[q>>2]=23256;if((c[l>>2]|0)==0){t=0}else{t=c[k>>2]|0}k=c[d>>2]|0;d=c[j>>2]|0;j=k+d|0;if((d|0)==0){u=t}else{l=k;k=t;while(1){q=l+1|0;a[k]=a[l]|0;if((q|0)==(j|0)){break}else{l=q;k=k+1|0}}u=t+d|0}eF(b,u,0,e,f);i=g;return}function eF(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((c[b+8>>2]|0)==0){h=0}else{h=c[b+4>>2]|0}i=b+16|0;c[(c[i>>2]|0)+(e<<5)>>2]=d-h;h=c[i>>2]|0;c[h+(e<<5)+4>>2]=c[f>>2];i=h+(e<<5)+8|0;b=c[i>>2]|0;j=h+(e<<5)+12|0;k=c[j>>2]|0;if((b|0)==0){l=h+(e<<5)+16|0}else{c[i>>2]=0;c[j>>2]=0;m=h+(e<<5)+16|0;n=c[m>>2]|0;cb[c[c[n>>2]>>2]&63](n,b,1,k,k,0);l=m}m=f+4|0;c[i>>2]=c[m>>2];i=f+8|0;c[j>>2]=c[i>>2];c[l>>2]=c[f+12>>2];c[m>>2]=0;c[i>>2]=0;i=h+(e<<5)+20|0;m=c[i>>2]|0;l=h+(e<<5)+24|0;j=c[l>>2]|0;if((m|0)==0){o=h+(e<<5)+28|0;p=f+16|0;q=c[p>>2]|0;c[i>>2]=q;r=f+20|0;s=c[r>>2]|0;c[l>>2]=s;t=f+24|0;u=c[t>>2]|0;c[o>>2]=u;c[p>>2]=0;c[r>>2]=0;v=g|0;w=a[v]|0;a[d]=w;return}else{c[i>>2]=0;c[l>>2]=0;k=h+(e<<5)+28|0;e=c[k>>2]|0;cb[c[c[e>>2]>>2]&63](e,m,32,j,j,178);o=k;p=f+16|0;q=c[p>>2]|0;c[i>>2]=q;r=f+20|0;s=c[r>>2]|0;c[l>>2]=s;t=f+24|0;u=c[t>>2]|0;c[o>>2]=u;c[p>>2]=0;c[r>>2]=0;v=g|0;w=a[v]|0;a[d]=w;return}}function eG(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+16|0;h=g|0;j=b;nW(j|0,0,28)|0;c[b>>2]=(c[e>>2]|0)+2;eR(h,2);j=b+4|0;k=h|0;c[j>>2]=c[k>>2];l=h+4|0;c[b+8>>2]=c[l>>2];c[b+12>>2]=c[h+8>>2];c[k>>2]=0;c[l>>2]=0;l=eP(32,1,1,118,254)|0;k=b+16|0;h=c[k>>2]|0;m=b+20|0;n=c[m>>2]|0;if((h|0)==0){o=b+24|0}else{c[k>>2]=0;c[m>>2]=0;p=b+24|0;q=c[p>>2]|0;cb[c[c[q>>2]>>2]&63](q,h,32,n,n,178);o=p}c[k>>2]=l;c[m>>2]=1;c[o>>2]=23256;o=c[j>>2]|0;a[o]=a[d|0]|0;eF(b,o+1|0,0,e,f);i=g;return}function eH(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+16|0;h=g|0;j=b;nW(j|0,0,28)|0;j=e+4|0;k=(c[j>>2]|0)+2|0;c[b>>2]=k;eR(h,k);k=b+4|0;l=h|0;c[k>>2]=c[l>>2];m=h+4|0;c[b+8>>2]=c[m>>2];c[b+12>>2]=c[h+8>>2];c[l>>2]=0;c[m>>2]=0;m=eP(32,0,0,118,254)|0;l=b+16|0;h=c[l>>2]|0;n=b+20|0;o=c[n>>2]|0;if((h|0)==0){p=b+24|0}else{c[l>>2]=0;c[n>>2]=0;q=b+24|0;b=c[q>>2]|0;cb[c[c[b>>2]>>2]&63](b,h,32,o,o,178);p=q}c[l>>2]=m;c[n>>2]=0;c[p>>2]=23256;p=c[k>>2]|0;a[p]=a[d|0]|0;d=p+1|0;k=c[e>>2]|0;e=c[j>>2]|0;j=k+e|0;if((e|0)==0){r=d;s=f|0;t=a[s]|0;a[r]=t;i=g;return}else{u=k;v=d}while(1){d=u+1|0;a[v]=a[u]|0;if((d|0)==(j|0)){break}else{u=d;v=v+1|0}}r=p+(e+1)|0;s=f|0;t=a[s]|0;a[r]=t;i=g;return}function eI(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=eP(1,0,d,0,0)|0;f=e+d|0;g=b+4|0;h=b|0;i=c[h>>2]|0;j=(c[g>>2]|0)-i|0;k=j>>>0>d>>>0?d:j;if((k|0)==0){l=e;m=i}else{j=e;d=0;n=i;while(1){if((j|0)==0){o=0;p=n}else{a[j]=a[n+d|0]|0;o=j;p=c[h>>2]|0}i=o+1|0;q=d+1|0;if(q>>>0<k>>>0){j=i;d=q;n=p}else{l=i;m=p;break}}}p=b+8|0;if((m|0)==0){r=b+12|0;c[h>>2]=e;c[g>>2]=l;c[p>>2]=f;c[r>>2]=23256;return}else{n=c[p>>2]|0;d=c[g>>2]|0;c[h>>2]=0;c[g>>2]=0;c[p>>2]=0;j=b+12|0;b=c[j>>2]|0;k=m;cb[c[c[b>>2]>>2]&63](b,m,1,d-k|0,n-k|0,0);r=j;c[h>>2]=e;c[g>>2]=l;c[p>>2]=f;c[r>>2]=23256;return}}function eJ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+16|0;f=e|0;g=b;nW(g|0,0,28)|0;g=d|0;h=c[g>>2]|0;c[b>>2]=h;eR(f,h);h=b+4|0;j=b+8|0;k=f|0;c[h>>2]=c[k>>2];l=f+4|0;c[j>>2]=c[l>>2];c[b+12>>2]=c[f+8>>2];c[k>>2]=0;c[l>>2]=0;l=eP(32,0,0,118,254)|0;k=b+16|0;f=c[k>>2]|0;m=b+20|0;n=c[m>>2]|0;if((f|0)==0){o=b+24|0}else{c[k>>2]=0;c[m>>2]=0;p=b+24|0;b=c[p>>2]|0;cb[c[c[b>>2]>>2]&63](b,f,32,n,n,178);o=p}c[k>>2]=l;c[m>>2]=0;c[o>>2]=23256;if((c[j>>2]|0)==0){q=0}else{q=c[h>>2]|0}h=c[g>>2]|0;g=d+4+h|0;if((h|0)==0){i=e;return}h=d+4|0;d=q;while(1){q=h+1|0;a[d]=a[h]|0;if((q|0)==(g|0)){break}else{h=q;d=d+1|0}}i=e;return}function eK(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+16|0;f=e|0;g=b;nW(g|0,0,28)|0;g=d|0;h=c[g>>2]|0;c[b>>2]=h;eR(f,h);h=b+4|0;j=b+8|0;k=f|0;c[h>>2]=c[k>>2];l=f+4|0;c[j>>2]=c[l>>2];c[b+12>>2]=c[f+8>>2];c[k>>2]=0;c[l>>2]=0;l=eP(32,0,0,118,254)|0;k=b+16|0;f=c[k>>2]|0;m=b+20|0;n=c[m>>2]|0;if((f|0)==0){o=b+24|0}else{c[k>>2]=0;c[m>>2]=0;p=b+24|0;b=c[p>>2]|0;cb[c[c[b>>2]>>2]&63](b,f,32,n,n,178);o=p}c[k>>2]=l;c[m>>2]=0;c[o>>2]=23256;if((c[j>>2]|0)==0){q=0}else{q=c[h>>2]|0}h=c[g>>2]|0;g=d+4+h|0;if((h|0)==0){i=e;return}h=d+4|0;d=q;while(1){q=h+1|0;a[d]=a[h]|0;if((q|0)==(g|0)){break}else{h=q;d=d+1|0}}i=e;return}function eL(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+16|0;f=e|0;g=b;nW(g|0,0,28)|0;g=d|0;h=c[g>>2]|0;c[b>>2]=h;eR(f,h);h=b+4|0;j=b+8|0;k=f|0;c[h>>2]=c[k>>2];l=f+4|0;c[j>>2]=c[l>>2];c[b+12>>2]=c[f+8>>2];c[k>>2]=0;c[l>>2]=0;l=eP(32,0,0,118,254)|0;k=b+16|0;f=c[k>>2]|0;m=b+20|0;n=c[m>>2]|0;if((f|0)==0){o=b+24|0}else{c[k>>2]=0;c[m>>2]=0;p=b+24|0;b=c[p>>2]|0;cb[c[c[b>>2]>>2]&63](b,f,32,n,n,178);o=p}c[k>>2]=l;c[m>>2]=0;c[o>>2]=23256;if((c[j>>2]|0)==0){q=0}else{q=c[h>>2]|0}h=c[g>>2]|0;g=d+4+h|0;if((h|0)==0){i=e;return}h=d+4|0;d=q;while(1){q=h+1|0;a[d]=a[h]|0;if((q|0)==(g|0)){break}else{h=q;d=d+1|0}}i=e;return}function eM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+32|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;c[j>>2]=f;if((f|0)==0){c[k>>2]=0;c[h>>2]=g;c[h+4>>2]=0;fF(k,a,b,0,0,d,e,h);fE(k)}else{eO(l,a,b,0,0,d,e,j);fE(l)}}function eN(){var a=0,b=0;a=i;i=i+8|0;b=a|0;dM(b,4224,54,1,0,0,8952,7872);fE(b)}function eO(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0;l=i;i=i+24|0;m=l|0;n=l+16|0;c[b>>2]=0;o=m|0;p=c[k>>2]|0;k=nV(p|0)|0;eR(o,k);if((c[m+4>>2]|0)==0){q=0}else{q=c[m>>2]|0}r=p+k|0;if((k|0)!=0){k=p;p=q;while(1){q=k+1|0;a[p]=a[k]|0;if((q|0)==(r|0)){break}else{k=q;p=p+1|0}}}c[n>>2]=o;c[n+4>>2]=1;fF(b,d,e,f,g,h,j,n);n=m|0;j=c[n>>2]|0;h=m+4|0;g=c[h>>2]|0;if((j|0)==0){i=l;return}c[n>>2]=0;c[h>>2]=0;h=c[m+8>>2]|0;cb[c[c[h>>2]>>2]&63](h,j,1,g,g,0);i=l;return}function eP(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=nK(ag(c,a)|0)|0;if((d|0)==0){return f|0}c=(b|0)==0;if((e|0)==0){if(c){return f|0}else{g=f;h=b}while(1){b$[d&511](g);e=h-1|0;if((e|0)==0){break}else{g=g+a|0;h=e}}return f|0}else{if(c){return f|0}else{i=b;j=f;k=0}while(1){b$[d&511](j);b=i-1|0;if((b|0)==0){break}else{i=b;j=j+a|0;k=k+1|0}}return f|0}return 0}function eQ(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0;if((f|0)==0|(d|0)==0){nM(b);return}e=-c|0;a=d;g=b+(ag(d,c)|0)|0;do{g=g+e|0;a=a-1|0;b$[f&511](g);}while((a|0)!=0);nM(b);return}function eR(b,d){b=b|0;d=d|0;var e=0,f=0;e=d+1|0;f=eP(1,e,e,0,0)|0;a[f+d|0]=0;c[b>>2]=f;c[b+4>>2]=e;c[b+8>>2]=23256;return}function eS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=a|0;c[f>>2]=17;g=a5(a+4|0,7392,(a=i,i=i+16|0,c[a>>2]=b,c[a+8>>2]=d,a)|0)|0;i=a;c[f>>2]=g;i=e;return}function eT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;e=a|0;c[e>>2]=8;f=a5(a+4|0,2248,(a=i,i=i+8|0,c[a>>2]=d&65535,a)|0)|0;i=a;c[e>>2]=f;i=b;return}function eU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;e=a|0;c[e>>2]=14;f=a5(a+4|0,3480,(a=i,i=i+8|0,c[a>>2]=d,a)|0)|0;i=a;c[e>>2]=f;i=b;return}function eV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;e=a|0;c[e>>2]=14;f=a5(a+4|0,2248,(a=i,i=i+8|0,c[a>>2]=d,a)|0)|0;i=a;c[e>>2]=f;i=b;return}function eW(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;b=i;f=a|0;c[f>>2]=26;g=a5(a+4|0,208,(a=i,i=i+16|0,c[a>>2]=d,c[a+8>>2]=e,a)|0)|0;i=a;c[f>>2]=g;i=b;return}function eX(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;b=i;f=a|0;c[f>>2]=26;g=a5(a+4|0,10920,(a=i,i=i+16|0,c[a>>2]=d,c[a+8>>2]=e,a)|0)|0;i=a;c[f>>2]=g;i=b;return}function eY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;e=a|0;c[e>>2]=14;f=a5(a+4|0,10424,(a=i,i=i+8|0,c[a>>2]=d,a)|0)|0;i=a;c[e>>2]=f;i=b;return}function eZ(b,d,e){b=b|0;d=d|0;e=+e;var f=0,g=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0,r=0;d=i;i=i+8|0;f=d|0;g=b|0;c[g>>2]=24;j=b+4|0;if(e==w){c[j>>2]=6712937;k=nV(j|0)|0;c[g>>2]=k;i=d;return}if(e==-w){a[j]=a[9928]|0;a[j+1|0]=a[9929]|0;a[j+2|0]=a[9930]|0;a[j+3|0]=a[9931]|0;a[j+4|0]=a[9932]|0;k=nV(j|0)|0;c[g>>2]=k;i=d;return}l=e;if(e!=e|(bY=0.0,bY!=bY)){c[j>>2]=7233902;k=nV(j|0)|0;c[g>>2]=k;i=d;return}aY(j|0,24,8816,(b=i,i=i+16|0,c[b>>2]=6,h[b+8>>3]=l,b)|0)|0;i=b;m=bx()|0;c[m>>2]=0;n=+nT(j,f);do{if((a[j]|0)==0){o=753}else{if((a[c[f>>2]|0]|0)!=0){o=753;break}if((c[m>>2]|0)!=0|n!=e){o=753}}}while(0);if((o|0)==753){aY(j|0,24,8816,(b=i,i=i+16|0,c[b>>2]=8,h[b+8>>3]=l,b)|0)|0;i=b}L671:do{if((a1(j|0,46)|0)==0){b=j;L672:while(1){o=a[b]|0;if((o-48&255)>>>0>=10>>>0){switch(o<<24>>24){case 101:case 69:case 43:case 45:{break};case 0:{break L671;break};default:{break L672}}}b=b+1|0}a[b]=46;o=b+1|0;m=a[o]|0;if((m-48&255)>>>0<10>>>0){break}switch(m<<24>>24){case 101:case 69:case 43:case 45:case 0:{break L671;break};default:{p=o}}L679:while(1){q=p+1|0;m=a[q]|0;if((m-48&255)>>>0<10>>>0){break}switch(m<<24>>24){case 101:case 69:case 43:case 45:case 0:{break L679;break};default:{p=q}}}b=(nV(q|0)|0)+1|0;nY(o|0,q|0,b|0)|0}}while(0);q=a1(j|0,43)|0;if((q|0)==0){k=nV(j|0)|0;c[g>>2]=k;i=d;return}else{r=q}do{q=r+1|0;p=(nV(q|0)|0)+1|0;nY(r|0,q|0,p|0)|0;r=a1(r|0,43)|0;}while((r|0)!=0);k=nV(j|0)|0;c[g>>2]=k;i=d;return}function e_(b,d,e){b=b|0;d=d|0;e=+e;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+8|0;f=d|0;g=b|0;c[g>>2]=32;j=b+4|0;do{if(e==w){c[j>>2]=6712937}else{if(e==-w){a[j]=a[9928]|0;a[j+1|0]=a[9929]|0;a[j+2|0]=a[9930]|0;a[j+3|0]=a[9931]|0;a[j+4|0]=a[9932]|0;break}if(e!=e|(J=0.0,J!=J)){c[j>>2]=7233902;break}aY(j|0,32,8816,(b=i,i=i+16|0,c[b>>2]=15,h[b+8>>3]=e,b)|0)|0;i=b;h[f>>3]=+nS(j,0);if(+h[f>>3]!=e){aY(j|0,32,8816,(b=i,i=i+16|0,c[b>>2]=17,h[b+8>>3]=e,b)|0)|0;i=b}L701:do{if((a1(j|0,46)|0)==0){b=j;L702:while(1){k=a[b]|0;if((k-48&255)>>>0>=10>>>0){switch(k<<24>>24){case 101:case 69:case 43:case 45:{break};case 0:{break L701;break};default:{break L702}}}b=b+1|0}a[b]=46;k=b+1|0;l=a[k]|0;if((l-48&255)>>>0<10>>>0){break}switch(l<<24>>24){case 101:case 69:case 43:case 45:case 0:{break L701;break};default:{m=k}}L709:while(1){n=m+1|0;l=a[n]|0;if((l-48&255)>>>0<10>>>0){break}switch(l<<24>>24){case 101:case 69:case 43:case 45:case 0:{break L709;break};default:{m=n}}}b=(nV(n|0)|0)+1|0;nY(k|0,n|0,b|0)|0}}while(0);b=a1(j|0,43)|0;if((b|0)==0){break}else{o=b}do{b=o+1|0;l=(nV(b|0)|0)+1|0;nY(o|0,b|0,l|0)|0;o=a1(o|0,43)|0;}while((o|0)!=0)}}while(0);c[g>>2]=nV(j|0)|0;i=d;return}function e$(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+16|0;f=d;d=i;i=i+8|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];f=e|0;g=a|0;h=a+4|0;j=a+8|0;k=a+12|0;l=b+4|0;m=a;nW(m|0,0,16)|0;m=c[l>>2]|0;n=eP(32,m,m,118,254)|0;o=a+16|0;c[o>>2]=n;c[a+20>>2]=m;c[a+24>>2]=23256;a=c[l>>2]|0;if((a|0)==0){i=e;return}do{if(a>>>0>1>>>0){m=(c[d+4>>2]|0)-1|0;if((m|0)==0){p=n;break}eR(f,ag(m,a-1|0)|0);m=c[h>>2]|0;q=c[j>>2]|0;if((m|0)!=0){c[h>>2]=0;c[j>>2]=0;r=c[k>>2]|0;cb[c[c[r>>2]>>2]&63](r,m,1,q,q,0)}q=f|0;c[h>>2]=c[q>>2];m=f+4|0;r=c[m>>2]|0;c[j>>2]=r;c[k>>2]=c[f+8>>2];c[q>>2]=0;c[m>>2]=0;c[g>>2]=(r|0)==0?0:r-1|0;p=c[o>>2]|0}else{p=n}}while(0);c[p>>2]=0;p=c[o>>2]|0;n=b|0;b=c[n>>2]|0;c[p+4>>2]=c[b>>2];f=p+8|0;k=c[f>>2]|0;a=p+12|0;r=c[a>>2]|0;if((k|0)==0){s=p+16|0}else{c[f>>2]=0;c[a>>2]=0;m=p+16|0;q=c[m>>2]|0;cb[c[c[q>>2]>>2]&63](q,k,1,r,r,0);s=m}m=b+4|0;c[f>>2]=c[m>>2];f=b+8|0;c[a>>2]=c[f>>2];c[s>>2]=c[b+12>>2];c[m>>2]=0;c[f>>2]=0;f=p+20|0;m=c[f>>2]|0;s=p+24|0;a=c[s>>2]|0;if((m|0)==0){t=p+28|0}else{c[f>>2]=0;c[s>>2]=0;r=p+28|0;p=c[r>>2]|0;cb[c[c[p>>2]>>2]&63](p,m,32,a,a,178);t=r}r=b+16|0;c[f>>2]=c[r>>2];f=b+20|0;c[s>>2]=c[f>>2];c[t>>2]=c[b+24>>2];c[r>>2]=0;c[f>>2]=0;c[g>>2]=(c[g>>2]|0)+(c[c[n>>2]>>2]|0);if((c[l>>2]|0)>>>0<=1>>>0){i=e;return}f=c[d+4>>2]|0;r=f-1|0;b=c[d>>2]|0;if((f|0)==1){f=1;do{d=ag(r,f)|0;c[(c[o>>2]|0)+(f<<5)>>2]=d;d=c[o>>2]|0;t=c[n>>2]|0;c[d+(f<<5)+4>>2]=c[t+(f*28|0)>>2];s=d+(f<<5)+8|0;a=c[s>>2]|0;m=d+(f<<5)+12|0;p=c[m>>2]|0;if((a|0)==0){u=d+(f<<5)+16|0}else{c[s>>2]=0;c[m>>2]=0;k=d+(f<<5)+16|0;q=c[k>>2]|0;cb[c[c[q>>2]>>2]&63](q,a,1,p,p,0);u=k}k=t+(f*28|0)+4|0;c[s>>2]=c[k>>2];s=t+(f*28|0)+8|0;c[m>>2]=c[s>>2];c[u>>2]=c[t+(f*28|0)+12>>2];c[k>>2]=0;c[s>>2]=0;s=d+(f<<5)+20|0;k=c[s>>2]|0;m=d+(f<<5)+24|0;p=c[m>>2]|0;if((k|0)==0){v=d+(f<<5)+28|0}else{c[s>>2]=0;c[m>>2]=0;a=d+(f<<5)+28|0;d=c[a>>2]|0;cb[c[c[d>>2]>>2]&63](d,k,32,p,p,178);v=a}a=t+(f*28|0)+16|0;c[s>>2]=c[a>>2];s=t+(f*28|0)+20|0;c[m>>2]=c[s>>2];c[v>>2]=c[t+(f*28|0)+24>>2];c[a>>2]=0;c[s>>2]=0;c[g>>2]=(c[g>>2]|0)+(c[(c[n>>2]|0)+(f*28|0)>>2]|0);f=f+1|0;}while(f>>>0<(c[l>>2]|0)>>>0);i=e;return}else{w=1}do{if((c[j>>2]|0)==0){x=0}else{x=c[h>>2]|0}f=x+(ag(r,w-1|0)|0)|0;nX(f|0,b|0,r)|0;f=ag(r,w)|0;c[(c[o>>2]|0)+(w<<5)>>2]=f;f=c[o>>2]|0;v=c[n>>2]|0;c[f+(w<<5)+4>>2]=c[v+(w*28|0)>>2];u=f+(w<<5)+8|0;s=c[u>>2]|0;a=f+(w<<5)+12|0;t=c[a>>2]|0;if((s|0)==0){y=f+(w<<5)+16|0}else{c[u>>2]=0;c[a>>2]=0;m=f+(w<<5)+16|0;p=c[m>>2]|0;cb[c[c[p>>2]>>2]&63](p,s,1,t,t,0);y=m}m=v+(w*28|0)+4|0;c[u>>2]=c[m>>2];u=v+(w*28|0)+8|0;c[a>>2]=c[u>>2];c[y>>2]=c[v+(w*28|0)+12>>2];c[m>>2]=0;c[u>>2]=0;u=f+(w<<5)+20|0;m=c[u>>2]|0;a=f+(w<<5)+24|0;t=c[a>>2]|0;if((m|0)==0){z=f+(w<<5)+28|0}else{c[u>>2]=0;c[a>>2]=0;s=f+(w<<5)+28|0;f=c[s>>2]|0;cb[c[c[f>>2]>>2]&63](f,m,32,t,t,178);z=s}s=v+(w*28|0)+16|0;c[u>>2]=c[s>>2];u=v+(w*28|0)+20|0;c[a>>2]=c[u>>2];c[z>>2]=c[v+(w*28|0)+24>>2];c[s>>2]=0;c[u>>2]=0;c[g>>2]=(c[g>>2]|0)+(c[(c[n>>2]|0)+(w*28|0)>>2]|0);w=w+1|0;}while(w>>>0<(c[l>>2]|0)>>>0);i=e;return}function e0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;i=i+16|0;e=d|0;f=d+8|0;c[e>>2]=b;b=f|0;c[b>>2]=e;e=c[a+16>>2]|0;g=c[a+20>>2]|0;h=e+(g<<5)|0;j=a+8|0;if((g|0)==0){k=0}else{g=a+4|0;l=e;e=0;while(1){m=l|0;n=c[m>>2]|0;if(n>>>0>e>>>0){if((c[j>>2]|0)==0){o=0}else{o=c[g>>2]|0}p=o+e|0;q=n-e|0;n=c[b>>2]|0;r=c[n>>2]|0;nX(r|0,p|0,q)|0;c[n>>2]=(c[n>>2]|0)+q;s=c[m>>2]|0}else{s=e}e1(l+4|0,f);m=l+32|0;if((m|0)==(h|0)){k=s;break}else{l=m;e=s}}}s=c[j>>2]|0;j=(s|0)==0;e=j?0:s-1|0;if(e>>>0<=k>>>0){i=d;return}if(j){t=0}else{t=c[a+4>>2]|0}a=t+k|0;t=e-k|0;k=c[b>>2]|0;b=c[k>>2]|0;nX(b|0,a|0,t)|0;c[k>>2]=(c[k>>2]|0)+t;i=d;return}function e1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=c[a+16>>2]|0;e=c[a+20>>2]|0;f=d+(e<<5)|0;g=a+8|0;if((e|0)==0){h=0}else{e=b|0;i=a+4|0;j=d;d=0;while(1){k=j|0;l=c[k>>2]|0;if(l>>>0>d>>>0){if((c[g>>2]|0)==0){m=0}else{m=c[i>>2]|0}n=m+d|0;o=l-d|0;l=c[c[e>>2]>>2]|0;nX(l|0,n|0,o)|0;n=c[e>>2]|0;c[n>>2]=(c[n>>2]|0)+o;p=c[k>>2]|0}else{p=d}e1(j+4|0,b);k=j+32|0;if((k|0)==(f|0)){h=p;break}else{j=k;d=p}}}p=c[g>>2]|0;g=(p|0)==0;d=g?0:p-1|0;if(d>>>0<=h>>>0){return}if(g){q=0}else{q=c[a+4>>2]|0}a=q+h|0;q=d-h|0;h=b|0;b=c[c[h>>2]>>2]|0;nX(b|0,a|0,q)|0;a=c[h>>2]|0;c[a>>2]=(c[a>>2]|0)+q;return}function e2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;f=i;i=i+144|0;g=d;d=i;i=i+1|0;i=i+7&-8;a[d]=a[g]|0;g=f|0;d=f+16|0;h=f+32|0;j=f+48|0;k=f+56|0;l=f+64|0;m=f+72|0;n=f+80|0;o=f+88|0;p=f+96|0;q=f+104|0;r=f+120|0;s=f+128|0;t=e+40|0;u=e+44|0;v=(c[u>>2]|0)==0?0:t;do{if((v|0)==0){w=0}else{x=c[v+4>>2]|0;if((x|0)==0){w=0;break}else{y=x;z=0}while(1){x=z+1|0;A=c[y+24>>2]|0;if((A|0)==0){w=x;break}else{y=A;z=x}}}}while(0);z=eP(12,w,w,60,222)|0;y=g|0;c[y>>2]=z;v=g+4|0;c[v>>2]=w;w=g+8|0;c[w>>2]=23256;x=(c[u>>2]|0)==0?0:t;L812:do{if((x|0)!=0){t=c[x+4>>2]|0;if((t|0)==0){break}u=d|0;A=d+4|0;B=d+8|0;C=t;t=0;D=z;while(1){e3(d,C|0,752,C+4|0,328,C+8|0,10952);E=D+(t*12|0)|0;F=c[E>>2]|0;G=D+(t*12|0)+4|0;H=c[G>>2]|0;if((F|0)==0){I=D+(t*12|0)+8|0}else{c[E>>2]=0;c[G>>2]=0;J=D+(t*12|0)+8|0;K=c[J>>2]|0;cb[c[c[K>>2]>>2]&63](K,F,1,H,H,0);I=J}c[E>>2]=c[u>>2];c[G>>2]=c[A>>2];c[I>>2]=c[B>>2];c[u>>2]=0;c[A>>2]=0;G=c[C+24>>2]|0;if((G|0)==0){break L812}C=G;t=t+1|0;D=c[y>>2]|0}}}while(0);e5(h,g,23360);c[j>>2]=c[e+12>>2];c[k>>2]=c[e+16>>2];c[l>>2]=c[e+20>>2];c[m>>2]=(c[e+24>>2]|0)==1?9984:23360;g=c[e+32>>2]|0;c[n>>2]=g>>>0<2>>>0?23360:10104;I=(g|0)==0;if(I){L=0}else{L=c[e+28>>2]|0}c[o>>2]=L;c[o+4>>2]=I?1:g;g=c[e+112>>2]|0;c[p>>2]=(g|0)!=0?9240:23360;c[r>>2]=e+48;c[r+4>>2]=g;e6(q,r,8848);r=s|0;c[r>>2]=0;g=s+4|0;c[g>>2]=0;e=s+8|0;c[e>>2]=0;e4(b,h,j,752,k,10104,l,m,n,o,p,q,s);s=c[r>>2]|0;p=c[g>>2]|0;if((s|0)!=0){c[r>>2]=0;c[g>>2]=0;g=c[e>>2]|0;cb[c[c[g>>2]>>2]&63](g,s,1,p,p,0)}p=q|0;s=c[p>>2]|0;g=q+4|0;e=c[g>>2]|0;if((s|0)!=0){c[p>>2]=0;c[g>>2]=0;g=c[q+8>>2]|0;cb[c[c[g>>2]>>2]&63](g,s,1,e,e,0)}e=h|0;s=c[e>>2]|0;g=h+4|0;q=c[g>>2]|0;if((s|0)!=0){c[e>>2]=0;c[g>>2]=0;g=c[h+8>>2]|0;cb[c[c[g>>2]>>2]&63](g,s,1,q,q,0)}q=c[y>>2]|0;s=c[v>>2]|0;if((q|0)==0){i=f;return}c[y>>2]=0;c[v>>2]=0;v=c[w>>2]|0;cb[c[c[v>>2]>>2]&63](v,q,12,s,s,210);i=f;return}function e3(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;k=i;i=i+24|0;l=k|0;m=c[d>>2]|0;d=nV(m|0)|0;n=e|0;o=nV(n|0)|0;eU(l,27320,c[f>>2]|0);f=g|0;p=nV(f|0)|0;q=c[h+4>>2]|0;if((q|0)==0){r=0;s=0}else{r=c[h>>2]|0;s=q-1|0}q=j|0;h=nV(q|0)|0;t=l|0;eR(b,o+d+p+s+h+(c[t>>2]|0)|0);if((c[b+4>>2]|0)==0){u=0}else{u=c[b>>2]|0}b=m+d|0;if((d|0)==0){v=u}else{w=m;m=u;while(1){x=w+1|0;a[m]=a[w]|0;if((x|0)==(b|0)){break}else{w=x;m=m+1|0}}v=u+d|0}d=e+o|0;if((o|0)==0){y=v}else{e=n;n=v;while(1){u=e+1|0;a[n]=a[e]|0;if((u|0)==(d|0)){break}else{e=u;n=n+1|0}}y=v+o|0}o=c[t>>2]|0;t=l+4+o|0;if((o|0)==0){z=y}else{v=l+4|0;l=y;while(1){n=v+1|0;a[l]=a[v]|0;if((n|0)==(t|0)){break}else{v=n;l=l+1|0}}z=y+o|0}o=g+p|0;if((p|0)==0){A=z}else{g=f;f=z;while(1){y=g+1|0;a[f]=a[g]|0;if((y|0)==(o|0)){break}else{g=y;f=f+1|0}}A=z+p|0}p=r+s|0;if((s|0)==0){B=A}else{z=r;r=A;while(1){f=z+1|0;a[r]=a[z]|0;if((f|0)==(p|0)){break}else{z=f;r=r+1|0}}B=A+s|0}s=j+h|0;if((h|0)==0){i=k;return}else{C=q;D=B}while(1){B=C+1|0;a[D]=a[C]|0;if((B|0)==(s|0)){break}else{C=B;D=D+1|0}}i=k;return}function e4(a,b,d,e,f,g,h,j,k,l,m,n,o){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;p=i;i=i+112|0;q=p|0;r=p+8|0;s=p+16|0;t=p+24|0;u=p+48|0;v=p+56|0;w=p+64|0;x=p+72|0;y=p+80|0;z=p+88|0;A=p+96|0;B=p+104|0;C=c[b+4>>2]|0;if((C|0)==0){c[q>>2]=0;c[q+4>>2]=0}else{c[q>>2]=c[b>>2];c[q+4>>2]=C-1}C=c[d>>2]|0;d=nV(C|0)|0;c[r>>2]=C;c[r+4>>2]=d;d=e|0;e=nV(d|0)|0;c[s>>2]=d;c[s+4>>2]=e;eU(t,27320,c[f>>2]|0);f=g|0;g=nV(f|0)|0;c[u>>2]=f;c[u+4>>2]=g;g=c[11616+(c[h>>2]<<2)>>2]|0;h=nV(g|0)|0;c[v>>2]=g;c[v+4>>2]=h;h=c[j>>2]|0;j=nV(h|0)|0;c[w>>2]=h;c[w+4>>2]=j;j=c[k>>2]|0;k=nV(j|0)|0;c[x>>2]=j;c[x+4>>2]=k;k=(c[l+4>>2]|0)-1|0;c[y>>2]=c[l>>2];c[y+4>>2]=k;k=c[m>>2]|0;m=nV(k|0)|0;c[z>>2]=k;c[z+4>>2]=m;m=c[n+4>>2]|0;if((m|0)==0){c[A>>2]=0;c[A+4>>2]=0}else{c[A>>2]=c[n>>2];c[A+4>>2]=m-1}m=c[o+4>>2]|0;if((m|0)==0){c[B>>2]=0;c[B+4>>2]=0;fl(a,q,r,s,t,u,v,w,x,y,z,A,B);i=p;return}else{c[B>>2]=c[o>>2];c[B+4>>2]=m-1;fl(a,q,r,s,t,u,v,w,x,y,z,A,B);i=p;return}}function e5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+64|0;g=f|0;h=nV(e|0)|0;j=d+4|0;k=c[j>>2]|0;c[g>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[g+16>>2]=0;c[g+20>>2]=0;c[g+24>>2]=0;c[g+28>>2]=0;c[g+32>>2]=0;c[g+36>>2]=0;c[g+40>>2]=0;c[g+44>>2]=0;c[g+48>>2]=0;c[g+52>>2]=0;c[g+56>>2]=0;c[g+60>>2]=0;if(k>>>0<9>>>0){l=g|0;m=0;n=0;o=0;p=k}else{g=eP(8,k,k,174,156)|0;l=g;m=23256;n=k;o=g;p=c[j>>2]|0}if((p|0)==0){q=0}else{p=d|0;d=0;g=0;while(1){k=c[p>>2]|0;r=c[k+(g*12|0)+4>>2]|0;if((r|0)==0){s=0;t=0;u=0;v=0}else{s=0;t=c[k+(g*12|0)>>2]|0;u=r-1|0;v=0}r=l+(g<<3)|0;c[r>>2]=t|v;c[r+4>>2]=s|u;r=((g|0)==0?0:h)+d+(c[l+(g<<3)+4>>2]|0)|0;k=g+1|0;if(k>>>0<(c[j>>2]|0)>>>0){d=r;g=k}else{q=r;break}}}eR(b,q);if((c[b+4>>2]|0)==0){w=0}else{w=c[b>>2]|0}if((c[j>>2]|0)!=0){b=w;w=0;while(1){if((w|0)==0){x=b}else{nX(b|0,e|0,h)|0;x=b+h|0}q=c[l+(w<<3)>>2]|0;g=c[l+(w<<3)+4>>2]|0;d=q+g|0;if((g|0)==0){y=x}else{u=q;q=x;while(1){s=u+1|0;a[q]=a[u]|0;if((s|0)==(d|0)){break}else{u=s;q=q+1|0}}y=x+g|0}q=w+1|0;if(q>>>0<(c[j>>2]|0)>>>0){b=y;w=q}else{break}}}if((o|0)==0){i=f;return}cb[c[c[m>>2]>>2]&63](m,o,8,n,n,0);i=f;return}function e6(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+184|0;h=g|0;j=g+160|0;k=nV(f|0)|0;l=e+4|0;m=c[l>>2]|0;c[h>>2]=14;c[h+20>>2]=14;c[h+40>>2]=14;c[h+60>>2]=14;c[h+80>>2]=14;c[h+100>>2]=14;c[h+120>>2]=14;c[h+140>>2]=14;if(m>>>0<9>>>0){n=h|0;o=0;p=0;q=0;r=m}else{h=eP(20,m,m,232,226)|0;n=h;o=23256;p=m;q=h;r=c[l>>2]|0}if((r|0)==0){s=0}else{r=e|0;e=j;h=0;m=0;while(1){t=n+(m*20|0)|0;eY(j,27320,c[(c[r>>2]|0)+(m<<2)>>2]|0);u=t;c[u>>2]=c[e>>2];c[u+4>>2]=c[e+4>>2];c[u+8>>2]=c[e+8>>2];c[u+12>>2]=c[e+12>>2];b[u+16>>1]=b[e+16>>1]|0;u=((m|0)==0?0:k)+h+(c[t>>2]|0)|0;t=m+1|0;if(t>>>0<(c[l>>2]|0)>>>0){h=u;m=t}else{s=u;break}}}eR(d,s);if((c[d+4>>2]|0)==0){v=0}else{v=c[d>>2]|0}if((c[l>>2]|0)!=0){d=v;v=0;while(1){if((v|0)==0){w=d}else{nX(d|0,f|0,k)|0;w=d+k|0}s=c[n+(v*20|0)>>2]|0;m=n+(v*20|0)+4+s|0;if((s|0)==0){x=w}else{h=n+(v*20|0)+4|0;e=w;while(1){r=h+1|0;a[e]=a[h]|0;if((r|0)==(m|0)){break}else{h=r;e=e+1|0}}x=w+s|0}e=v+1|0;if(e>>>0<(c[l>>2]|0)>>>0){d=x;v=e}else{break}}}if((q|0)==0){i=g;return}cb[c[c[o>>2]>>2]&63](o,q,20,p,p,0);i=g;return}function e7(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;c[a>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;c[a+12>>2]=e;c[a+16>>2]=f;c[a+20>>2]=b;c[a+24>>2]=d;d=g|0;c[a+28>>2]=c[d>>2];b=g+4|0;c[a+32>>2]=c[b>>2];c[a+36>>2]=c[g+8>>2];c[d>>2]=0;c[b>>2]=0;c[a+40>>2]=0;c[a+44>>2]=0;c[a+112>>2]=0;return}function e8(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+44|0;d=c[b>>2]|0;if((d|0)!=0){c[b>>2]=0;b=c[a+40>>2]|0;b0[c[c[b>>2]>>2]&127](b,d)}d=a+28|0;b=c[d>>2]|0;e=a+32|0;f=c[e>>2]|0;if((b|0)!=0){c[d>>2]=0;c[e>>2]=0;e=c[a+36>>2]|0;cb[c[c[e>>2]>>2]&63](e,b,1,f,f,0)}f=a|0;b=c[f>>2]|0;e=a+4|0;d=c[e>>2]|0;if((b|0)==0){return}c[f>>2]=0;c[e>>2]=0;e=c[a+8>>2]|0;cb[c[c[e>>2]>>2]&63](e,b,1,d,d,0);return}function e9(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+24|0;d=b+8|0;e2(d,b|0,a+4|0);e=c[d>>2]|0;f=c[d+4>>2]|0;g=c[d+8>>2]|0;d=a+120|0;h=c[d>>2]|0;j=a+124|0;k=c[j>>2]|0;if((h|0)==0){l=a+128|0}else{c[d>>2]=0;c[j>>2]=0;m=a+128|0;a=c[m>>2]|0;cb[c[c[a>>2]>>2]&63](a,h,1,k,k,0);l=m}c[d>>2]=e;c[j>>2]=f;c[l>>2]=g;if((c[j>>2]|0)==0){n=0;i=b;return n|0}n=c[d>>2]|0;i=b;return n|0}function fa(){var b=0;do{if((a[27576]|0)==0){if((bc(27576)|0)==0){break}c[6479]=25912;c[6478]=14552;a$(298,25912,u|0)|0}}while(0);b=c[6842]|0;return((b|0)!=0?b:25912)|0}function fb(a){a=a|0;var b=0,d=0;c[a>>2]=14512;b=c[a+4>>2]|0;if((b|0)==(a|0)){d=a;nM(d);return}c[6842]=b;d=a;nM(d);return}function fc(a){a=a|0;var b=0;c[a>>2]=14512;b=c[a+4>>2]|0;if((b|0)==(a|0)){return}c[6842]=b;return}function fd(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;b0[c[(c[d>>2]|0)+8>>2]&127](d,b);return}function fe(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;b0[c[(c[d>>2]|0)+12>>2]&127](d,b);return}function ff(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=c[a+4>>2]|0;bZ[c[(c[g>>2]|0)+16>>2]&15](g,b,d,e,f);return}function fg(a){a=a|0;var b=0;c[a>>2]=14512;b=c[a+4>>2]|0;if((b|0)==(a|0)){return}c[6842]=b;return}function fh(b){b=b|0;var d=0,e=0;do{if((a[27576]|0)==0){if((bc(27576)|0)==0){break}c[6479]=25912;c[6478]=14552;a$(298,25912,u|0)|0}}while(0);d=c[6842]|0;e=(d|0)!=0?d:25912;b0[c[(c[e>>2]|0)+12>>2]&127](e,b);bI()}function fi(b){b=b|0;var d=0,e=0;do{if((a[27576]|0)==0){if((bc(27576)|0)==0){break}c[6479]=25912;c[6478]=14552;a$(298,25912,u|0)|0}}while(0);d=c[6842]|0;e=(d|0)!=0?d:25912;b0[c[(c[e>>2]|0)+8>>2]&127](e,b);return}function fj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;c[a>>2]=14592;b=a+120|0;d=c[b>>2]|0;e=a+124|0;f=c[e>>2]|0;if((d|0)==0){g=a+4|0;e8(g);return}c[b>>2]=0;c[e>>2]=0;e=c[a+128>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,f,f,0);g=a+4|0;e8(g);return}function fk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;c[a>>2]=14592;b=a+120|0;d=c[b>>2]|0;e=a+124|0;f=c[e>>2]|0;if((d|0)==0){g=a+4|0;e8(g);h=a;nM(h);return}c[b>>2]=0;c[e>>2]=0;e=c[a+128>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,f,f,0);g=a+4|0;e8(g);h=a;nM(h);return}function fl(b,d,e,f,g,h,j,k,l,m,n,o,p){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;q=i;i=i+48|0;r=q|0;s=d+4|0;t=c[s>>2]|0;c[r>>2]=t;u=c[e+4>>2]|0;c[r+4>>2]=u;v=c[f+4>>2]|0;c[r+8>>2]=v;w=c[g>>2]|0;c[r+12>>2]=w;x=c[h+4>>2]|0;c[r+16>>2]=x;y=c[j+4>>2]|0;c[r+20>>2]=y;z=c[k+4>>2]|0;c[r+24>>2]=z;c[r+28>>2]=c[l+4>>2];c[r+32>>2]=c[m+4>>2];c[r+36>>2]=c[n+4>>2];c[r+40>>2]=c[o+4>>2];A=c[p+4>>2]|0;c[r+44>>2]=A;eR(b,A+((c[r+40>>2]|0)+((c[r+36>>2]|0)+((c[r+32>>2]|0)+((c[r+28>>2]|0)+(z+(y+(x+(w+(v+(u+t))))))))))|0);if((c[b+4>>2]|0)==0){B=0}else{B=c[b>>2]|0}b=c[d>>2]|0;d=c[s>>2]|0;s=b+d|0;if((d|0)==0){C=B;D=fm(C,e,f,g,h,j,k,l,m,n,o,p)|0;i=q;return}else{E=b;F=B}while(1){b=E+1|0;a[F]=a[E]|0;if((b|0)==(s|0)){break}else{E=b;F=F+1|0}}C=B+d|0;D=fm(C,e,f,g,h,j,k,l,m,n,o,p)|0;i=q;return}function fm(b,d,e,f,g,h,i,j,k,l,m,n){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;o=c[d>>2]|0;p=c[d+4>>2]|0;d=o+p|0;if((p|0)==0){q=b}else{r=o;o=b;while(1){s=r+1|0;a[o]=a[r]|0;if((s|0)==(d|0)){break}else{r=s;o=o+1|0}}q=b+p|0}p=c[e>>2]|0;b=c[e+4>>2]|0;e=p+b|0;if((b|0)==0){t=q}else{o=p;p=q;while(1){r=o+1|0;a[p]=a[o]|0;if((r|0)==(e|0)){break}else{o=r;p=p+1|0}}t=q+b|0}b=c[f>>2]|0;q=f+4+b|0;if((b|0)==0){u=t}else{p=f+4|0;f=t;while(1){o=p+1|0;a[f]=a[p]|0;if((o|0)==(q|0)){break}else{p=o;f=f+1|0}}u=t+b|0}b=c[g>>2]|0;t=c[g+4>>2]|0;g=b+t|0;if((t|0)==0){v=u}else{f=b;b=u;while(1){p=f+1|0;a[b]=a[f]|0;if((p|0)==(g|0)){break}else{f=p;b=b+1|0}}v=u+t|0}t=c[h>>2]|0;u=c[h+4>>2]|0;h=t+u|0;if((u|0)==0){w=v;x=fn(w,i,j,k,l,m,n)|0;return x|0}else{y=t;z=v}while(1){t=y+1|0;a[z]=a[y]|0;if((t|0)==(h|0)){break}else{y=t;z=z+1|0}}w=v+u|0;x=fn(w,i,j,k,l,m,n)|0;return x|0}function fn(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=c[d>>2]|0;k=c[d+4>>2]|0;d=j+k|0;if((k|0)==0){l=b}else{m=j;j=b;while(1){n=m+1|0;a[j]=a[m]|0;if((n|0)==(d|0)){break}else{m=n;j=j+1|0}}l=b+k|0}k=c[e>>2]|0;b=c[e+4>>2]|0;e=k+b|0;if((b|0)==0){o=l}else{j=k;k=l;while(1){m=j+1|0;a[k]=a[j]|0;if((m|0)==(e|0)){break}else{j=m;k=k+1|0}}o=l+b|0}b=c[f>>2]|0;l=c[f+4>>2]|0;f=b+l|0;if((l|0)==0){p=o}else{k=b;b=o;while(1){j=k+1|0;a[b]=a[k]|0;if((j|0)==(f|0)){break}else{k=j;b=b+1|0}}p=o+l|0}l=c[g>>2]|0;o=c[g+4>>2]|0;g=l+o|0;if((o|0)==0){q=p}else{b=l;l=p;while(1){k=b+1|0;a[l]=a[b]|0;if((k|0)==(g|0)){break}else{b=k;l=l+1|0}}q=p+o|0}o=c[h>>2]|0;p=c[h+4>>2]|0;h=o+p|0;if((p|0)==0){r=q}else{l=o;o=q;while(1){b=l+1|0;a[o]=a[l]|0;if((b|0)==(h|0)){break}else{l=b;o=o+1|0}}r=q+p|0}p=c[i>>2]|0;q=c[i+4>>2]|0;i=p+q|0;if((q|0)==0){s=r;return s|0}else{t=p;u=r}while(1){p=t+1|0;a[u]=a[t]|0;if((p|0)==(i|0)){break}else{t=p;u=u+1|0}}s=r+q|0;return s|0}function fo(a){a=a|0;if((a|0)==0){return}c[a>>2]=14;return}function fp(a){a=a|0;return}function fq(a){a=a|0;if((a|0)==0){return}c[a>>2]=0;c[a+4>>2]=0;return}function fr(a){a=a|0;return}function fs(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;d=c[b>>2]|0;e=a+4|0;f=c[e>>2]|0;if((d|0)==0){return}c[b>>2]=0;c[e>>2]=0;e=c[a+8>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,f,f,0);return}function ft(a){a=a|0;var b=0;if((a|0)==0){return}b=a;c[b>>2]=0;c[b+4>>2]=0;c[a>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;return}function fu(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;d=c[b>>2]|0;e=a+4|0;f=c[e>>2]|0;if((d|0)==0){return}c[b>>2]=0;c[e>>2]=0;e=c[a+8>>2]|0;cb[c[c[e>>2]>>2]&63](e,d,1,f,f,0);return}function fv(a){a=a|0;var b=0,d=0;c[a>>2]=14512;b=c[a+4>>2]|0;if((b|0)==(a|0)){d=a;nM(d);return}c[6842]=b;d=a;nM(d);return}function fw(a,b){a=a|0;b=b|0;var d=0,e=0;if(bg()|0){fA(0,b);return}else{a=bP(132)|0;d=b|0;c[a+4>>2]=c[d>>2];e=b+4|0;c[a+8>>2]=c[e>>2];c[a+12>>2]=c[b+8>>2];c[d>>2]=0;c[e>>2]=0;c[a+16>>2]=c[b+12>>2];c[a+20>>2]=c[b+16>>2];c[a+24>>2]=c[b+20>>2];c[a+28>>2]=c[b+24>>2];e=b+28|0;c[a+32>>2]=c[e>>2];d=b+32|0;c[a+36>>2]=c[d>>2];c[a+40>>2]=c[b+36>>2];c[e>>2]=0;c[d>>2]=0;c[a+44>>2]=c[b+40>>2];d=b+44|0;c[a+48>>2]=c[d>>2];c[d>>2]=0;d=a+52|0;e=b+48|0;nX(d|0,e|0,64)|0;c[a+116>>2]=c[b+112>>2];c[a>>2]=14592;c[a+120>>2]=0;c[a+124>>2]=0;c[a+128>>2]=0;bl(a|0,19824,68)}}function fx(a,b){a=a|0;b=b|0;var d=0,e=0;a=bP(132)|0;d=b|0;c[a+4>>2]=c[d>>2];e=b+4|0;c[a+8>>2]=c[e>>2];c[a+12>>2]=c[b+8>>2];c[d>>2]=0;c[e>>2]=0;c[a+16>>2]=c[b+12>>2];c[a+20>>2]=c[b+16>>2];c[a+24>>2]=c[b+20>>2];c[a+28>>2]=c[b+24>>2];e=b+28|0;c[a+32>>2]=c[e>>2];d=b+32|0;c[a+36>>2]=c[d>>2];c[a+40>>2]=c[b+36>>2];c[e>>2]=0;c[d>>2]=0;c[a+44>>2]=c[b+40>>2];d=b+44|0;c[a+48>>2]=c[d>>2];c[d>>2]=0;d=a+52|0;e=b+48|0;nX(d|0,e|0,64)|0;c[a+116>>2]=c[b+112>>2];c[a>>2]=14592;c[a+120>>2]=0;c[a+124>>2]=0;c[a+128>>2]=0;bl(a|0,19824,68)}function fy(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+40|0;h=b|0;j=b+8|0;k=b+16|0;l=b+32|0;c[h>>2]=d;c[j>>2]=e;a[l|0]=95;c[l+4>>2]=f;fz(k,l,h,752,j,10104,g);j=g|0;h=c[j>>2]|0;l=g+4|0;f=c[l>>2]|0;if((h|0)==0){m=g+8|0}else{c[j>>2]=0;c[l>>2]=0;e=g+8|0;g=c[e>>2]|0;cb[c[c[g>>2]>>2]&63](g,h,1,f,f,0);m=e}e=k|0;c[j>>2]=c[e>>2];f=k+4|0;c[l>>2]=c[f>>2];c[m>>2]=c[k+8>>2];c[e>>2]=0;c[f>>2]=0;f=c[l>>2]|0;e=(f|0)==0;if(e){i=b;return}if(f>>>0<=1>>>0){i=b;return}k=e?1:f;f=c[j>>2]|0;while(1){j=bO(3,f|0,k-1|0)|0;if((j|0)<1){n=1192;break}if((c[l>>2]|0)>>>0>1>>>0){k=k-j|0;f=f+j|0}else{n=1190;break}}if((n|0)==1190){i=b;return}else if((n|0)==1192){i=b;return}}function fz(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;k=i;i=i+24|0;l=k|0;m=d;d=c[m>>2]&255;n=c[m+4>>2]|0;m=c[e>>2]|0;e=nV(m|0)|0;o=f|0;p=nV(o|0)|0;eU(l,27320,c[g>>2]|0);g=h|0;q=nV(g|0)|0;r=c[j+4>>2]|0;if((r|0)==0){s=0;t=0}else{s=c[j>>2]|0;t=r-1|0}r=l|0;eR(b,e+n+p+q+t+(c[r>>2]|0)|0);if((c[b+4>>2]|0)==0){u=0}else{u=c[b>>2]|0}if((n|0)==0){v=u}else{nW(u|0,d|0,n|0)|0;v=u+n|0}n=m+e|0;if((e|0)==0){w=v}else{u=m;m=v;while(1){d=u+1|0;a[m]=a[u]|0;if((d|0)==(n|0)){break}else{u=d;m=m+1|0}}w=v+e|0}e=f+p|0;if((p|0)==0){x=w}else{f=o;o=w;while(1){v=f+1|0;a[o]=a[f]|0;if((v|0)==(e|0)){break}else{f=v;o=o+1|0}}x=w+p|0}p=c[r>>2]|0;r=l+4+p|0;if((p|0)==0){y=x}else{w=l+4|0;l=x;while(1){o=w+1|0;a[l]=a[w]|0;if((o|0)==(r|0)){break}else{w=o;l=l+1|0}}y=x+p|0}p=h+q|0;if((q|0)==0){z=y}else{h=g;g=y;while(1){x=h+1|0;a[g]=a[h]|0;if((x|0)==(p|0)){break}else{h=x;g=g+1|0}}z=y+q|0}q=s+t|0;if((t|0)==0){i=k;return}else{A=s;B=z}while(1){z=A+1|0;a[B]=a[A]|0;if((z|0)==(q|0)){break}else{A=z;B=B+1|0}}i=k;return}function fA(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0;b=i;i=i+96|0;e=b|0;f=b+16|0;g=b+24|0;h=b+32|0;j=b+40|0;k=b+48|0;l=b+56|0;m=b+72|0;n=b+80|0;do{if((a[27576]|0)==0){if((bc(27576)|0)==0){break}c[6479]=25912;c[6478]=14552;a$(298,25912,u|0)|0}}while(0);o=c[6842]|0;p=(o|0)!=0?o:25912;o=c[(c[p>>2]|0)+16>>2]|0;q=c[d+12>>2]|0;r=c[d+16>>2]|0;c[f>>2]=c[d+20>>2];c[g>>2]=(c[d+24>>2]|0)==1?9984:23360;s=c[d+32>>2]|0;c[h>>2]=s>>>0<2>>>0?23360:10104;t=(s|0)==0;if(t){v=0}else{v=c[d+28>>2]|0}c[j>>2]=v;c[j+4>>2]=t?1:s;s=c[d+112>>2]|0;c[k>>2]=(s|0)!=0?9240:23360;c[m>>2]=d+48;c[m+4>>2]=s;e6(l,m,8848);m=n|0;c[m>>2]=0;s=n+4|0;c[s>>2]=0;d=n+8|0;c[d>>2]=0;fB(e,f,g,h,j,k,l,n,10952);bZ[o&15](p,q,r,0,e);r=e|0;q=c[r>>2]|0;p=e+4|0;o=c[p>>2]|0;if((q|0)!=0){c[r>>2]=0;c[p>>2]=0;p=c[e+8>>2]|0;cb[c[c[p>>2]>>2]&63](p,q,1,o,o,0)}o=c[m>>2]|0;q=c[s>>2]|0;if((o|0)!=0){c[m>>2]=0;c[s>>2]=0;s=c[d>>2]|0;cb[c[c[s>>2]>>2]&63](s,o,1,q,q,0)}q=l|0;o=c[q>>2]|0;s=l+4|0;d=c[s>>2]|0;if((o|0)==0){i=b;return}c[q>>2]=0;c[s>>2]=0;s=c[l+8>>2]|0;cb[c[c[s>>2]>>2]&63](s,o,1,d,d,0);i=b;return}function fB(b,d,e,f,g,h,i,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;l=c[11616+(c[d>>2]<<2)>>2]|0;d=nV(l|0)|0;m=c[e>>2]|0;e=nV(m|0)|0;n=c[f>>2]|0;f=nV(n|0)|0;o=(c[g+4>>2]|0)-1|0;p=c[g>>2]|0;g=c[h>>2]|0;h=nV(g|0)|0;q=c[i+4>>2]|0;if((q|0)==0){r=0;s=0}else{r=c[i>>2]|0;s=q-1|0}q=c[j+4>>2]|0;if((q|0)==0){t=0;u=0}else{t=c[j>>2]|0;u=q-1|0}q=k|0;j=nV(q|0)|0;eR(b,e+d+f+o+h+s+u+j|0);if((c[b+4>>2]|0)==0){v=0}else{v=c[b>>2]|0}b=l+d|0;if((d|0)==0){w=v}else{i=l;l=v;while(1){x=i+1|0;a[l]=a[i]|0;if((x|0)==(b|0)){break}else{i=x;l=l+1|0}}w=v+d|0}d=m+e|0;if((e|0)==0){y=w}else{v=m;m=w;while(1){l=v+1|0;a[m]=a[v]|0;if((l|0)==(d|0)){break}else{v=l;m=m+1|0}}y=w+e|0}e=n+f|0;if((f|0)==0){z=y}else{w=n;n=y;while(1){m=w+1|0;a[n]=a[w]|0;if((m|0)==(e|0)){break}else{w=m;n=n+1|0}}z=y+f|0}f=p+o|0;if((o|0)==0){A=z}else{y=p;p=z;while(1){n=y+1|0;a[p]=a[y]|0;if((n|0)==(f|0)){break}else{y=n;p=p+1|0}}A=z+o|0}o=g+h|0;if((h|0)==0){B=A}else{z=g;g=A;while(1){p=z+1|0;a[g]=a[z]|0;if((p|0)==(o|0)){break}else{z=p;g=g+1|0}}B=A+h|0}h=r+s|0;if((s|0)==0){C=B}else{A=r;r=B;while(1){g=A+1|0;a[r]=a[A]|0;if((g|0)==(h|0)){break}else{A=g;r=r+1|0}}C=B+s|0}s=t+u|0;if((u|0)==0){D=C}else{B=t;t=C;while(1){r=B+1|0;a[t]=a[B]|0;if((r|0)==(s|0)){break}else{B=r;t=t+1|0}}D=C+u|0}u=k+j|0;if((j|0)==0){return}else{E=q;F=D}while(1){D=E+1|0;a[F]=a[E]|0;if((D|0)==(u|0)){break}else{E=D;F=F+1|0}}return}function fC(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0;j=i;i=i+360|0;k=j|0;l=j+8|0;m=j+72|0;n=j+88|0;o=j+96|0;p=j+104|0;c[k>>2]=g;q=h+4|0;r=c[q>>2]|0;c[l>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;c[l+12>>2]=0;c[l+16>>2]=0;c[l+20>>2]=0;c[l+24>>2]=0;c[l+28>>2]=0;c[l+32>>2]=0;c[l+36>>2]=0;c[l+40>>2]=0;c[l+44>>2]=0;c[l+48>>2]=0;c[l+52>>2]=0;c[l+56>>2]=0;c[l+60>>2]=0;if(r>>>0<9>>>0){s=l|0;t=0;u=0;v=0;w=r}else{l=eP(8,r,r,174,156)|0;s=l;t=23256;u=r;v=l;w=c[q>>2]|0}do{if((w|0)!=0){l=g;while(1){if((aO(a[l]|0)|0)==0){break}else{l=l+1|0}}r=a[l]|0;if(r<<24>>24==0){x=0;y=l;z=l}else{A=0;B=l;C=0;D=0;E=l;F=r;while(1){r=E+1|0;do{if(D){if((F<<24>>24|0)==92){G=1;H=C;I=(a[r]|0)==0?r:E+2|0;J=B;K=A;break}else if((F<<24>>24|0)==34){G=0;H=C;I=r;J=B;K=A;break}else{G=1;H=C;I=r;J=B;K=A;break}}else{if((F<<24>>24|0)==40){G=0;H=C+1|0;I=r;J=B;K=A;break}else if((F<<24>>24|0)==34){G=1;H=C;I=r;J=B;K=A;break}else if((F<<24>>24|0)==41){G=0;H=C-1|0;I=r;J=B;K=A;break}else{if(!(F<<24>>24==44&(C|0)==0)){G=0;H=C;I=r;J=B;K=A;break}if(A>>>0<(c[q>>2]|0)>>>0){L=B;M=s+(A<<3)|0;c[M>>2]=L;c[M+4>>2]=E-L}L=A+1|0;M=r;while(1){if((aO(a[M]|0)|0)==0){G=0;H=0;I=M;J=M;K=L;break}else{M=M+1|0}}}}}while(0);r=a[I]|0;if(r<<24>>24==0){x=K;y=J;z=I;break}else{A=K;B=J;C=H;D=G;E=I;F=r}}}F=c[q>>2]|0;if(x>>>0<F>>>0){E=y;D=s+(x<<3)|0;c[D>>2]=E;c[D+4>>2]=z-E;N=c[q>>2]|0}else{N=F}if((x+1|0)==(N|0)){break}F=fa()|0;E=c[(c[F>>2]|0)+16>>2]|0;c[n>>2]=c[q>>2];a[o]=10;fG(m,640,n,256,k,o);bZ[E&15](F,1128,97,0,m);F=m|0;E=c[F>>2]|0;D=m+4|0;C=c[D>>2]|0;if((E|0)==0){break}c[F>>2]=0;c[D>>2]=0;D=c[m+8>>2]|0;cb[c[c[D>>2]>>2]&63](D,E,1,C,C,0)}}while(0);L1293:do{if((d|0)==2){m=a1(e|0,61)|0;if((m|0)==0){O=e;break}o=m+1|0;m=a[o]|0;if(m<<24>>24==61){O=e;break}else{P=o;Q=m}while(1){m=P+1|0;if((aO(Q<<24>>24|0)|0)==0){O=P;break L1293}P=m;Q=a[m]|0}}else{O=e}}while(0);e=(d|0)==1&(O|0)==0?0:d;do{if((e|0)==0){R=0;S=23352;T=0;U=0;V=23352}else{d=nV(O|0)|0;if((e|0)==1){R=d+9|0;S=23352;T=0;U=d;V=O;break}else if((e|0)!=2){R=0;S=23352;T=0;U=d;V=O;break}Q=p|0;bW(f|0,Q|0,256)|0;P=nV(Q|0)|0;R=d+2+P|0;S=Q;T=P;U=d;V=O}}while(0);O=c[q>>2]|0;if((O|0)==0){W=R}else{f=c[h>>2]|0;p=R;R=0;while(1){d=(R|e|0)==0?p:p+2|0;P=c[s+(R<<3)+4>>2]|0;do{if((P|0)==0){X=d}else{if((a[c[s+(R<<3)>>2]|0]|0)==34){X=d;break}X=d+3+P|0}}while(0);P=c[f+(R*12|0)+4>>2]|0;d=((P|0)==0?0:P-1|0)+X|0;P=R+1|0;if(P>>>0<O>>>0){p=d;R=P}else{W=d;break}}}eR(b,W);if((c[b+4>>2]|0)==0){Y=0}else{Y=c[b>>2]|0}do{if((e|0)==1){a[Y]=101;a[Y+1|0]=120;a[Y+2|0]=112;a[Y+3|0]=101;a[Y+4|0]=99;a[Y+5|0]=116;a[Y+6|0]=101;a[Y+7|0]=100;a[Y+8|0]=32;b=Y+9|0;W=V+U|0;if((U|0)==0){Z=b;break}else{_=V;$=b}while(1){b=_+1|0;a[$]=a[_]|0;if((b|0)==(W|0)){break}else{_=b;$=$+1|0}}Z=Y+(U+9)|0}else if((e|0)==2){W=V+U|0;if((U|0)==0){aa=Y}else{b=V;R=Y;while(1){p=b+1|0;a[R]=a[b]|0;if((p|0)==(W|0)){break}else{b=p;R=R+1|0}}aa=Y+U|0}a[aa]=58;a[aa+1|0]=32;R=aa+2|0;b=S+T|0;if((T|0)==0){Z=R;break}else{ab=S;ac=R}while(1){R=ab+1|0;a[ac]=a[ab]|0;if((R|0)==(b|0)){break}else{ab=R;ac=ac+1|0}}Z=aa+(T+2)|0}else{Z=Y}}while(0);if((c[q>>2]|0)!=0){Y=h|0;h=Z;Z=0;while(1){if((Z|e|0)==0){ad=h}else{a[h]=59;a[h+1|0]=32;ad=h+2|0}T=c[s+(Z<<3)+4>>2]|0;do{if((T|0)==0){ae=ad}else{aa=c[s+(Z<<3)>>2]|0;ac=a[aa]|0;if(ac<<24>>24==34){ae=ad;break}ab=aa+T|0;S=aa;aa=ad;U=ac;while(1){ac=S+1|0;a[aa]=U;if((ac|0)==(ab|0)){break}S=ac;aa=aa+1|0;U=a[ac]|0}a[ad+T|0]=32;a[ad+(T+1)|0]=61;a[ad+(T+2)|0]=32;ae=ad+(T+3)|0}}while(0);T=c[Y>>2]|0;U=c[T+(Z*12|0)+4>>2]|0;do{if((U|0)==0){af=ae}else{aa=c[T+(Z*12|0)>>2]|0;S=U-1|0;ab=aa+S|0;if((S|0)==0){af=ae;break}else{ag=aa;ah=ae}while(1){aa=ag+1|0;a[ah]=a[ag]|0;if((aa|0)==(ab|0)){break}else{ag=aa;ah=ah+1|0}}af=ae+(U-1)|0}}while(0);U=Z+1|0;if(U>>>0<(c[q>>2]|0)>>>0){h=af;Z=U}else{break}}}if((v|0)==0){i=j;return}cb[c[c[t>>2]>>2]&63](t,v,8,u,u,0);i=j;return}function fD(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+120|0;d=b|0;e=a|0;a=c[e>>2]|0;if((a|0)==0){i=b;return}f=a|0;c[d>>2]=c[f>>2];g=a+4|0;c[d+4>>2]=c[g>>2];c[d+8>>2]=c[a+8>>2];c[f>>2]=0;c[g>>2]=0;c[d+12>>2]=c[a+12>>2];c[d+16>>2]=c[a+16>>2];c[d+20>>2]=c[a+20>>2];c[d+24>>2]=c[a+24>>2];g=a+28|0;c[d+28>>2]=c[g>>2];f=a+32|0;c[d+32>>2]=c[f>>2];c[d+36>>2]=c[a+36>>2];c[g>>2]=0;c[f>>2]=0;c[d+40>>2]=c[a+40>>2];f=a+44|0;c[d+44>>2]=c[f>>2];c[f>>2]=0;f=d+48|0;g=a+48|0;nX(f|0,g|0,64)|0;c[d+112>>2]=c[a+112>>2];a=c[e>>2]|0;if((a|0)!=0){e8(a);nM(a)}fi(d);e8(d);i=b;return}function fE(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+120|0;d=b|0;b=a|0;a=c[b>>2]|0;e=a|0;c[d>>2]=c[e>>2];f=a+4|0;c[d+4>>2]=c[f>>2];c[d+8>>2]=c[a+8>>2];c[e>>2]=0;c[f>>2]=0;c[d+12>>2]=c[a+12>>2];c[d+16>>2]=c[a+16>>2];c[d+20>>2]=c[a+20>>2];c[d+24>>2]=c[a+24>>2];f=a+28|0;c[d+28>>2]=c[f>>2];e=a+32|0;c[d+32>>2]=c[e>>2];c[d+36>>2]=c[a+36>>2];c[f>>2]=0;c[e>>2]=0;c[d+40>>2]=c[a+40>>2];e=a+44|0;c[d+44>>2]=c[e>>2];c[e>>2]=0;e=d+48|0;f=a+48|0;nX(e|0,f|0,64)|0;c[d+112>>2]=c[a+112>>2];a=c[b>>2]|0;if((a|0)!=0){e8(a);nM(a)}c[b>>2]=0;fh(d)}function fF(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+24|0;l=k|0;m=k+16|0;n=nK(116)|0;c[m>>2]=c[j>>2];c[m+4>>2]=c[j+4>>2];fC(l,(e|0)==2?2:1,g,f,h,m);e7(n,e,0,b,d,l);c[a>>2]=n;n=l|0;a=c[n>>2]|0;d=l+4|0;b=c[d>>2]|0;if((a|0)==0){i=k;return}c[n>>2]=0;c[d>>2]=0;d=c[l+8>>2]|0;cb[c[c[d>>2]>>2]&63](d,a,1,b,b,0);i=k;return}function fG(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=i;i=i+24|0;k=j|0;l=d|0;m=nV(l|0)|0;eV(k,27344,c[e>>2]|0);e=f|0;n=nV(e|0)|0;o=c[g>>2]|0;g=nV(o|0)|0;p=a[h]|0;h=k|0;eR(b,m+1+n+g+(c[h>>2]|0)|0);if((c[b+4>>2]|0)==0){q=0}else{q=c[b>>2]|0}b=d+m|0;if((m|0)==0){r=q}else{d=l;l=q;while(1){s=d+1|0;a[l]=a[d]|0;if((s|0)==(b|0)){break}else{d=s;l=l+1|0}}r=q+m|0}m=c[h>>2]|0;h=k+4+m|0;if((m|0)==0){t=r}else{q=k+4|0;k=r;while(1){l=q+1|0;a[k]=a[q]|0;if((l|0)==(h|0)){break}else{q=l;k=k+1|0}}t=r+m|0}m=f+n|0;if((n|0)==0){u=t}else{f=e;e=t;while(1){r=f+1|0;a[e]=a[f]|0;if((r|0)==(m|0)){break}else{f=r;e=e+1|0}}u=t+n|0}n=o+g|0;if((g|0)==0){v=u;a[v]=p;i=j;return}else{w=o;x=u}while(1){o=w+1|0;a[x]=a[w]|0;if((o|0)==(n|0)){break}else{w=o;x=x+1|0}}v=u+g|0;a[v]=p;i=j;return}function fH(d){d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;d=i;i=i+704|0;e=d|0;f=d+24|0;g=d+32|0;h=d+40|0;j=d+64|0;k=d+88|0;l=d+96|0;m=d+104|0;n=d+128|0;o=d+136|0;p=d+160|0;q=d+168|0;r=d+176|0;s=d+184|0;t=d+192|0;u=d+200|0;v=d+224|0;w=d+232|0;x=d+240|0;y=d+264|0;z=d+272|0;A=d+280|0;B=d+304|0;C=d+312|0;D=d+336|0;E=d+344|0;F=d+352|0;G=d+360|0;H=d+368|0;I=d+376|0;J=d+400|0;K=d+408|0;L=d+432|0;M=d+440|0;N=d+464|0;O=d+472|0;P=d+480|0;Q=d+488|0;R=d+592|0;S=d+616|0;T=d+640|0;U=d+664|0;V=d+688|0;dD(Q,1024,1);dC(P,Q|0);c[O>>2]=c[P>>2];c[O+4>>2]=c[P+4>>2];P=N;b[P>>1]=b[11588]|0;b[P+2>>1]=b[11589]|0;b[P+4>>1]=b[11590]|0;cR(M,O,N);N=c[M+8>>2]|0;c[L>>2]=c[M>>2];c[L+4>>2]=N;N=J;b[N>>1]=b[11580]|0;b[N+2>>1]=b[11581]|0;b[N+4>>1]=b[11582]|0;cS(K,L,2,J);c[R>>2]=c[K>>2];c[R+4>>2]=c[K+4>>2];J=R+8|0;L=c[K+8>>2]|0;c[J>>2]=L;c[R+12>>2]=c[K+12>>2];c[R+16>>2]=c[K+16>>2];b[R+20>>1]=b[K+20>>1]|0;if((L|0)==0){eM(4832,238,4656,23344,0)}L=R|0;c3(I,L,0);R=c[I>>2]|0;K=c[I+4>>2]|0;N=c[I+8>>2]|0;c[K>>2]=123;c[H>>2]=R;c[H+4>>2]=N;c[G>>2]=8864;c[G+4>>2]=6;cU(H,G);G=N;c[F>>2]=R;c[F+4>>2]=G+8;c[E>>2]=10432;c[E+4>>2]=18;cU(F,E);c[D>>2]=R;c[D+4>>2]=G+16;E=B;b[E>>1]=b[11584]|0;b[E+2>>1]=b[11585]|0;b[E+4>>1]=b[11586]|0;cS(C,D,1,B);c[S>>2]=c[C>>2];c[S+4>>2]=c[C+4>>2];B=S+8|0;D=c[C+8>>2]|0;c[B>>2]=D;c[S+12>>2]=c[C+12>>2];c[S+16>>2]=c[C+16>>2];b[S+20>>1]=b[C+20>>1]|0;if((D|0)==0){eM(4832,238,4656,23344,0)}D=S|0;c3(A,D,0);S=c[A+8>>2]|0;c[z>>2]=c[A>>2];c[z+4>>2]=S;c[y>>2]=8096;c[y+4>>2]=9;cU(z,y);if((c[B>>2]|0)==0){eM(4832,238,4656,23344,0)}c3(x,D,0);b[c[x+4>>2]>>1]=0;b[K+4>>1]=2;c[w>>2]=R;c[w+4>>2]=G+24;c[v>>2]=7008;c[v+4>>2]=4;cU(w,v);if((c[J>>2]|0)>>>0<=1>>>0){eM(4832,238,4656,23344,0)}c3(u,L,1);L=c[u>>2]|0;c[T>>2]=L;J=c[u+4>>2]|0;c[T+4>>2]=J;v=c[u+8>>2]|0;c[T+8>>2]=v;c[T+12>>2]=c[u+12>>2];b[T+16>>1]=b[u+16>>1]|0;a[T+18|0]=a[u+18|0]|0;c[J>>2]=456;c[t>>2]=L;c[t+4>>2]=v;c[s>>2]=5168;c[s+4>>2]=4;cU(t,s);s=v;c[r>>2]=L;c[r+4>>2]=s+8;c[q>>2]=3984;c[q+4>>2]=16;cU(r,q);c[p>>2]=L;c[p+4>>2]=s+16;s=n;b[s>>1]=b[11584]|0;b[s+2>>1]=b[11585]|0;b[s+4>>1]=b[11586]|0;cS(o,p,2,n);c[U>>2]=c[o>>2];c[U+4>>2]=c[o+4>>2];n=U+8|0;p=c[o+8>>2]|0;c[n>>2]=p;c[U+12>>2]=c[o+12>>2];c[U+16>>2]=c[o+16>>2];b[U+20>>1]=b[o+20>>1]|0;if((p|0)==0){eM(4832,238,4656,23344,0)}p=U|0;c3(m,p,0);U=c[m+8>>2]|0;c[l>>2]=c[m>>2];c[l+4>>2]=U;c[k>>2]=2808;c[k+4>>2]=9;cU(l,k);if((c[n>>2]|0)==0){eM(4832,238,4656,23344,0)}c3(j,p,0);b[c[j+4>>2]>>1]=1;if((c[n>>2]|0)>>>0<=1>>>0){eM(4832,238,4656,23344,0)}c3(h,p,1);j=c[h+8>>2]|0;c[g>>2]=c[h>>2];c[g+4>>2]=j;c[f>>2]=1488;c[f+4>>2]=9;cU(g,f);if((c[n>>2]|0)>>>0<=1>>>0){eM(4832,238,4656,23344,0)}c3(e,p,1);b[c[e+4>>2]>>1]=2;b[J+4>>1]=0;fI(V,T);T=V+4|0;J=V|0;bn(((c[T>>2]|0)==0?23344:c[J>>2]|0)|0,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;e=c[J>>2]|0;p=c[T>>2]|0;if((e|0)==0){dF(Q);i=d;return}c[J>>2]=0;c[T>>2]=0;T=c[V+8>>2]|0;cb[c[c[T>>2]>>2]&63](T,e,1,p,p,0);dF(Q);i=d;return}function fI(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+104|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;c[j>>2]=c[e>>2];c[j+4>>2]=c[e+4>>2];c[j+8>>2]=c[e+8>>2];c[j+12>>2]=c[e+12>>2];b[j+16>>1]=b[e+16>>1]|0;a[j+18|0]=a[e+18|0]|0;e=h;c2(h,j|0);j=g;c[j>>2]=c[e>>2];c[j+4>>2]=c[e+4>>2];c[j+8>>2]=c[e+8>>2];c[j+12>>2]=c[e+12>>2];c[j+16>>2]=c[e+16>>2];c[j+20>>2]=c[e+20>>2];eu(k,g,22400);eR(d,c[k>>2]|0);if((c[d+4>>2]|0)==0){l=0}else{l=c[d>>2]|0}e0(k,l);l=k+16|0;d=c[l>>2]|0;g=k+20|0;e=c[g>>2]|0;if((d|0)!=0){c[l>>2]=0;c[g>>2]=0;g=c[k+24>>2]|0;cb[c[c[g>>2]>>2]&63](g,d,32,e,e,178)}e=k+4|0;d=c[e>>2]|0;g=k+8|0;l=c[g>>2]|0;if((d|0)==0){i=f;return}c[e>>2]=0;c[g>>2]=0;g=c[k+12>>2]|0;cb[c[c[g>>2]>>2]&63](g,d,1,l,l,0);i=f;return}function fJ(a,b){a=a|0;b=b|0;if((c[5586]|0)==0){fH(0);return 0}else{eM(5696,126,5488,5328,4944);return 0}return 0}function fK(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g|0;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;do{if((h|0)>0){if((b4[c[(c[d>>2]|0)+48>>2]&63](d,e,h)|0)==(h|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){if(q>>>0<11>>>0){h=q<<1&255;e=l;a[e]=h;r=l+1|0;s=h;t=e}else{e=q+16&-16;h=nK(e)|0;c[l+8>>2]=h;g=e|1;c[l>>2]=g;c[l+4>>2]=q;r=h;s=g&255;t=l}nW(r|0,j|0,q|0)|0;a[r+q|0]=0;if((s&1)==0){u=l+1|0}else{u=c[l+8>>2]|0}if((b4[c[(c[d>>2]|0)+48>>2]&63](d,u,q)|0)==(q|0)){if((a[t]&1)==0){break}nM(c[l+8>>2]|0);break}c[m>>2]=0;c[b>>2]=0;if((a[t]&1)==0){i=k;return}nM(c[l+8>>2]|0);i=k;return}}while(0);l=n-o|0;do{if((l|0)>0){if((b4[c[(c[d>>2]|0)+48>>2]&63](d,f,l)|0)==(l|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function fL(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+32|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=c[o>>2]|0;f5(26168,h,26296);c[6790]=13692;c[6792]=13712;c[6791]=0;g_(27168,26168);c[6810]=0;c[6811]=-1;j=c[s>>2]|0;c[6518]=13472;lj(26076);nW(26080,0,24)|0;c[6518]=13840;c[6526]=j;lk(g,26076);k=lm(g,26496)|0;l=k;ll(g);c[6527]=l;c[6528]=26304;a[26116]=(b2[c[(c[k>>2]|0)+28>>2]&255](l)|0)&1;c[6724]=13596;c[6725]=13616;g_(26900,26072);c[6743]=0;c[6744]=-1;l=c[r>>2]|0;c[6530]=13472;lj(26124);nW(26128,0,24)|0;c[6530]=13840;c[6538]=l;lk(f,26124);k=lm(f,26496)|0;g=k;ll(f);c[6539]=g;c[6540]=26312;a[26164]=(b2[c[(c[k>>2]|0)+28>>2]&255](g)|0)&1;c[6768]=13596;c[6769]=13616;g_(27076,26120);c[6787]=0;c[6788]=-1;g=c[(c[(c[6768]|0)-12>>2]|0)+27096>>2]|0;c[6746]=13596;c[6747]=13616;g_(26988,g);c[6765]=0;c[6766]=-1;c[(c[(c[6790]|0)-12>>2]|0)+27232>>2]=26896;g=(c[(c[6768]|0)-12>>2]|0)+27076|0;c[g>>2]=c[g>>2]|8192;c[(c[(c[6768]|0)-12>>2]|0)+27144>>2]=26896;fT(26016,h,26320);c[6702]=13644;c[6704]=13664;c[6703]=0;g_(26816,26016);c[6722]=0;c[6723]=-1;c[6480]=13400;lj(25924);nW(25928,0,24)|0;c[6480]=13768;c[6488]=j;lk(e,25924);j=lm(e,26488)|0;h=j;ll(e);c[6489]=h;c[6490]=26328;a[25964]=(b2[c[(c[j>>2]|0)+28>>2]&255](h)|0)&1;c[6632]=13548;c[6633]=13568;g_(26532,25920);c[6651]=0;c[6652]=-1;c[6492]=13400;lj(25972);nW(25976,0,24)|0;c[6492]=13768;c[6500]=l;lk(d,25972);l=lm(d,26488)|0;h=l;ll(d);c[6501]=h;c[6502]=26336;a[26012]=(b2[c[(c[l>>2]|0)+28>>2]&255](h)|0)&1;c[6676]=13548;c[6677]=13568;g_(26708,25968);c[6695]=0;c[6696]=-1;h=c[(c[(c[6676]|0)-12>>2]|0)+26728>>2]|0;c[6654]=13548;c[6655]=13568;g_(26620,h);c[6673]=0;c[6674]=-1;c[(c[(c[6702]|0)-12>>2]|0)+26880>>2]=26528;h=(c[(c[6676]|0)-12>>2]|0)+26708|0;c[h>>2]=c[h>>2]|8192;c[(c[(c[6676]|0)-12>>2]|0)+26776>>2]=26528;i=b;return}function fM(a){a=a|0;hv(26896)|0;hv(26984)|0;hA(26528)|0;hA(26616)|0;return}function fN(a){a=a|0;c[a>>2]=13400;ll(a+4|0);return}function fO(a){a=a|0;c[a>>2]=13400;ll(a+4|0);nM(a);return}function fP(b,d){b=b|0;d=d|0;var e=0;b2[c[(c[b>>2]|0)+24>>2]&255](b)|0;e=lm(d,26488)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(b2[c[(c[e>>2]|0)+28>>2]&255](d)|0)&1;return}function fQ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=cd[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((aM(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=1566;break}if((l|0)==2){m=-1;n=1567;break}else if((l|0)!=1){n=1563;break}}if((n|0)==1563){m=((aJ(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==1567){i=b;return m|0}else if((n|0)==1566){i=b;return m|0}return 0}function fR(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if((a[b+44|0]&1)!=0){f=aM(d|0,4,e|0,c[b+32>>2]|0)|0;return f|0}g=b;if((e|0)>0){h=d;i=0}else{f=0;return f|0}while(1){if((b1[c[(c[g>>2]|0)+52>>2]&31](b,c[h>>2]|0)|0)==-1){f=i;j=1575;break}d=i+1|0;if((d|0)<(e|0)){h=h+4|0;i=d}else{f=d;j=1576;break}}if((j|0)==1576){return f|0}else if((j|0)==1575){return f|0}return 0}function fS(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L1564:do{if(!k){c[g>>2]=d;if((a[b+44|0]&1)!=0){if((aM(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+4|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=b8[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=1591;break}if((v|0)==3){w=1584;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=1592;break}v=(c[h>>2]|0)-r|0;if((aM(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=1594;break}if(u){t=u?c[j>>2]|0:t}else{break L1564}}if((w|0)==1592){i=e;return l|0}else if((w|0)==1591){i=e;return l|0}else if((w|0)==1594){i=e;return l|0}else if((w|0)==1584){if((aM(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function fT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=13400;j=b+4|0;lj(j);k=b+8|0;nW(k|0,0,24)|0;c[h>>2]=14168;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;lk(g,j);j=lm(g,26488)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=b2[c[(c[j>>2]|0)+24>>2]&255](e)|0;e=c[d>>2]|0;a[b+53|0]=(b2[c[(c[e>>2]|0)+28>>2]&255](e)|0)&1;if((c[h>>2]|0)<=8){ll(g);i=f;return}kF(360);ll(g);i=f;return}function fU(a){a=a|0;c[a>>2]=13400;ll(a+4|0);return}function fV(a){a=a|0;c[a>>2]=13400;ll(a+4|0);nM(a);return}function fW(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=lm(d,26488)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=b2[c[(c[e>>2]|0)+24>>2]&255](d)|0;d=c[f>>2]|0;a[b+53|0]=(b2[c[(c[d>>2]|0)+28>>2]&255](d)|0)&1;if((c[g>>2]|0)<=8){return}kF(360);return}function fX(a){a=a|0;return f_(a,0)|0}function fY(a){a=a|0;return f_(a,1)|0}function fZ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L1607:do{if(l){c[h>>2]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=b8[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+4|0,j,p,f+8|0,g)|0;if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}else if((q|0)==3){a[p]=c[n>>2]&255;c[g>>2]=f+1}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L1607}r=o-1|0;c[g>>2]=r;if((bC(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function f_(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;if((a[k]&1)!=0){l=b+48|0;m=c[l>>2]|0;if(!d){n=m;i=e;return n|0}c[l>>2]=-1;a[k]=0;n=m;i=e;return n|0}m=c[b+44>>2]|0;k=(m|0)>1?m:1;L1627:do{if((k|0)>0){m=b+32|0;l=0;while(1){o=aZ(c[m>>2]|0)|0;if((o|0)==-1){n=-1;break}a[f+l|0]=o&255;l=l+1|0;if((l|0)>=(k|0)){break L1627}}i=e;return n|0}}while(0);L1634:do{if((a[b+53|0]&1)==0){l=b+40|0;m=b+36|0;o=f|0;p=g+4|0;q=b+32|0;r=k;while(1){s=c[l>>2]|0;t=s;u=c[t>>2]|0;v=c[t+4>>2]|0;t=c[m>>2]|0;w=f+r|0;x=b8[c[(c[t>>2]|0)+16>>2]&31](t,s,o,w,h,g,p,j)|0;if((x|0)==3){y=1641;break}else if((x|0)==2){n=-1;y=1658;break}else if((x|0)!=1){z=r;break L1634}x=c[l>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((r|0)==8){n=-1;y=1656;break}v=aZ(c[q>>2]|0)|0;if((v|0)==-1){n=-1;y=1655;break}a[w]=v&255;r=r+1|0}if((y|0)==1641){c[g>>2]=a[o]|0;z=r;break}else if((y|0)==1655){i=e;return n|0}else if((y|0)==1656){i=e;return n|0}else if((y|0)==1658){i=e;return n|0}}else{c[g>>2]=a[f|0]|0;z=k}}while(0);if(d){d=c[g>>2]|0;c[b+48>>2]=d;n=d;i=e;return n|0}d=b+32|0;b=z;while(1){if((b|0)<=0){break}z=b-1|0;if((bC(a[f+z|0]|0,c[d>>2]|0)|0)==-1){n=-1;y=1650;break}else{b=z}}if((y|0)==1650){i=e;return n|0}n=c[g>>2]|0;i=e;return n|0}function f$(a){a=a|0;c[a>>2]=13472;ll(a+4|0);return}function f0(a){a=a|0;c[a>>2]=13472;ll(a+4|0);nM(a);return}function f1(b,d){b=b|0;d=d|0;var e=0;b2[c[(c[b>>2]|0)+24>>2]&255](b)|0;e=lm(d,26496)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(b2[c[(c[e>>2]|0)+28>>2]&255](d)|0)&1;return}function f2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=cd[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((aM(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=1667;break}if((l|0)==2){m=-1;n=1669;break}else if((l|0)!=1){n=1665;break}}if((n|0)==1667){i=b;return m|0}else if((n|0)==1665){m=((aJ(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==1669){i=b;return m|0}return 0}function f3(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((a[b+44|0]&1)!=0){g=aM(e|0,1,f|0,c[b+32>>2]|0)|0;return g|0}h=b;if((f|0)>0){i=e;j=0}else{g=0;return g|0}while(1){if((b1[c[(c[h>>2]|0)+52>>2]&31](b,d[i]|0)|0)==-1){g=j;k=1679;break}e=j+1|0;if((e|0)<(f|0)){i=i+1|0;j=e}else{g=e;k=1677;break}}if((k|0)==1679){return g|0}else if((k|0)==1677){return g|0}return 0}function f4(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L1685:do{if(!k){a[g]=d&255;if((a[b+44|0]&1)!=0){if((aM(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+1|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=b8[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=1696;break}if((v|0)==3){w=1686;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=1692;break}v=(c[h>>2]|0)-r|0;if((aM(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=1695;break}if(u){t=u?c[j>>2]|0:t}else{break L1685}}if((w|0)==1692){i=e;return l|0}else if((w|0)==1686){if((aM(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==1695){i=e;return l|0}else if((w|0)==1696){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function f5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=13472;j=b+4|0;lj(j);k=b+8|0;nW(k|0,0,24)|0;c[h>>2]=14240;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;lk(g,j);j=lm(g,26496)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=b2[c[(c[j>>2]|0)+24>>2]&255](e)|0;e=c[d>>2]|0;a[b+53|0]=(b2[c[(c[e>>2]|0)+28>>2]&255](e)|0)&1;if((c[h>>2]|0)<=8){ll(g);i=f;return}kF(360);ll(g);i=f;return}function f6(a){a=a|0;c[a>>2]=13472;ll(a+4|0);return}function f7(a){a=a|0;c[a>>2]=13472;ll(a+4|0);nM(a);return}function f8(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=lm(d,26496)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=b2[c[(c[e>>2]|0)+24>>2]&255](d)|0;d=c[f>>2]|0;a[b+53|0]=(b2[c[(c[d>>2]|0)+28>>2]&255](d)|0)&1;if((c[g>>2]|0)<=8){return}kF(360);return}function f9(a){a=a|0;return gc(a,0)|0}function ga(a){a=a|0;return gc(a,1)|0}function gb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L1728:do{if(l){a[h]=c[n>>2]&255;o=c[b+36>>2]|0;p=f|0;q=b8[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+1|0,j,p,f+8|0,g)|0;if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}else if((q|0)==3){a[p]=c[n>>2]&255;c[g>>2]=f+1}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L1728}r=o-1|0;c[g>>2]=r;if((bC(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function gc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=b+52|0;if((a[l]&1)!=0){m=b+48|0;n=c[m>>2]|0;if(!e){o=n;i=f;return o|0}c[m>>2]=-1;a[l]=0;o=n;i=f;return o|0}n=c[b+44>>2]|0;l=(n|0)>1?n:1;L1748:do{if((l|0)>0){n=b+32|0;m=0;while(1){p=aZ(c[n>>2]|0)|0;if((p|0)==-1){o=-1;break}a[g+m|0]=p&255;m=m+1|0;if((m|0)>=(l|0)){break L1748}}i=f;return o|0}}while(0);L1755:do{if((a[b+53|0]&1)==0){m=b+40|0;n=b+36|0;p=g|0;q=h+1|0;r=b+32|0;s=l;while(1){t=c[m>>2]|0;u=t;v=c[u>>2]|0;w=c[u+4>>2]|0;u=c[n>>2]|0;x=g+s|0;y=b8[c[(c[u>>2]|0)+16>>2]&31](u,t,p,x,j,h,q,k)|0;if((y|0)==2){o=-1;z=1756;break}else if((y|0)==3){z=1743;break}else if((y|0)!=1){A=s;break L1755}y=c[m>>2]|0;c[y>>2]=v;c[y+4>>2]=w;if((s|0)==8){o=-1;z=1754;break}w=aZ(c[r>>2]|0)|0;if((w|0)==-1){o=-1;z=1758;break}a[x]=w&255;s=s+1|0}if((z|0)==1758){i=f;return o|0}else if((z|0)==1754){i=f;return o|0}else if((z|0)==1756){i=f;return o|0}else if((z|0)==1743){a[h]=a[p]|0;A=s;break}}else{a[h]=a[g|0]|0;A=l}}while(0);do{if(e){l=a[h]|0;c[b+48>>2]=l&255;B=l}else{l=b+32|0;k=A;while(1){if((k|0)<=0){z=1750;break}j=k-1|0;if((bC(d[g+j|0]|0|0,c[l>>2]|0)|0)==-1){o=-1;z=1755;break}else{k=j}}if((z|0)==1750){B=a[h]|0;break}else if((z|0)==1755){i=f;return o|0}}}while(0);o=B&255;i=f;return o|0}function gd(){fL(0);a$(166,27248,u|0)|0;return}function ge(a){a=a|0;return}function gf(a){a=a|0;var b=0;b=a+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function gg(a){a=a|0;var b=0,d=0;b=a+4|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){d=0;return d|0}b$[c[(c[a>>2]|0)+8>>2]&511](a);d=1;return d|0}function gh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=11776;d=a+4|0;if((d|0)==0){return}a=nV(b|0)|0;e=a+1|0;f=nL(a+13|0)|0;c[f+4>>2]=a;c[f>>2]=a;a=f+12|0;c[d>>2]=a;c[f+8>>2]=0;nX(a|0,b|0,e)|0;return}function gi(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=11776;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;nM(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;nM(e);return}nN(d);e=a;nM(e);return}function gj(a){a=a|0;var b=0;c[a>>2]=11776;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}nN(a);return}function gk(a){a=a|0;return c[a+4>>2]|0}function gl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;c[b>>2]=11712;e=b+4|0;if((e|0)==0){return}if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=nV(f|0)|0;b=d+1|0;g=nL(d+13|0)|0;c[g+4>>2]=d;c[g>>2]=d;d=g+12|0;c[e>>2]=d;c[g+8>>2]=0;nX(d|0,f|0,b)|0;return}function gm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=11712;d=a+4|0;if((d|0)==0){return}a=nV(b|0)|0;e=a+1|0;f=nL(a+13|0)|0;c[f+4>>2]=a;c[f>>2]=a;a=f+12|0;c[d>>2]=a;c[f+8>>2]=0;nX(a|0,b|0,e)|0;return}function gn(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=11712;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;nM(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;nM(e);return}nN(d);e=a;nM(e);return}function go(a){a=a|0;var b=0;c[a>>2]=11712;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}nN(a);return}function gp(a){a=a|0;return c[a+4>>2]|0}function gq(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=11776;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;nM(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;nM(e);return}nN(d);e=a;nM(e);return}function gr(a){a=a|0;return}function gs(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function gt(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;b5[c[(c[a>>2]|0)+12>>2]&15](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function gu(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[b+4>>2]|0)!=(a|0)){e=0;return e|0}e=(c[b>>2]|0)==(d|0);return e|0}function gv(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;d=by(e|0)|0;e=nV(d|0)|0;if(e>>>0>4294967279>>>0){gB(0)}if(e>>>0<11>>>0){a[b]=e<<1&255;f=b+1|0;nX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=nK(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;nX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function gw(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;h=f;j=i;i=i+12|0;i=i+7&-8;k=e|0;l=c[k>>2]|0;do{if((l|0)!=0){m=d[h]|0;if((m&1|0)==0){n=m>>>1}else{n=c[f+4>>2]|0}if((n|0)==0){o=l}else{gL(f,7920,2)|0;o=c[k>>2]|0}m=c[e+4>>2]|0;b5[c[(c[m>>2]|0)+24>>2]&15](j,m,o);m=j;p=a[m]|0;if((p&1)==0){q=j+1|0}else{q=c[j+8>>2]|0}r=p&255;if((r&1|0)==0){s=r>>>1}else{s=c[j+4>>2]|0}gL(f,q,s)|0;if((a[m]&1)==0){break}nM(c[j+8>>2]|0)}}while(0);j=b;c[j>>2]=c[h>>2];c[j+4>>2]=c[h+4>>2];c[j+8>>2]=c[h+8>>2];nW(h|0,0,12)|0;i=g;return}function gx(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;g=d;d=i;i=i+8|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];g=f|0;h=f+16|0;j=nV(e|0)|0;if(j>>>0>4294967279>>>0){gB(0)}if(j>>>0<11>>>0){a[h]=j<<1&255;k=h+1|0}else{l=j+16&-16;m=nK(l)|0;c[h+8>>2]=m;c[h>>2]=l|1;c[h+4>>2]=j;k=m}nX(k|0,e|0,j)|0;a[k+j|0]=0;gw(g,d,h);gl(b|0,g);if((a[g]&1)!=0){nM(c[g+8>>2]|0)}if((a[h]&1)!=0){nM(c[h+8>>2]|0)}c[b>>2]=13736;h=d;d=b+8|0;b=c[h+4>>2]|0;c[d>>2]=c[h>>2];c[d+4>>2]=b;i=f;return}function gy(a){a=a|0;go(a|0);nM(a);return}function gz(a){a=a|0;go(a|0);return}function gA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e;if((c[a>>2]|0)==1){do{aT(26248,26224)|0;}while((c[a>>2]|0)==1)}if((c[a>>2]|0)!=0){f;return}c[a>>2]=1;g;b$[d&511](b);h;c[a>>2]=-1;i;bs(26248)|0;return}function gB(a){a=a|0;a=bP(8)|0;gh(a,896);c[a>>2]=11744;bl(a|0,18224,42)}function gC(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;if((a[e]&1)==0){f=b;c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];return}e=c[d+8>>2]|0;f=c[d+4>>2]|0;if(f>>>0>4294967279>>>0){gB(0)}if(f>>>0<11>>>0){a[b]=f<<1&255;g=b+1|0}else{d=f+16&-16;h=nK(d)|0;c[b+8>>2]=h;c[b>>2]=d|1;c[b+4>>2]=f;g=h}nX(g|0,e|0,f)|0;a[g+f|0]=0;return}function gD(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if(e>>>0>4294967279>>>0){gB(0)}if(e>>>0<11>>>0){a[b]=e<<1&255;f=b+1|0;nX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=nK(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;nX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function gE(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if(d>>>0>4294967279>>>0){gB(0)}if(d>>>0<11>>>0){a[b]=d<<1&255;f=b+1|0}else{g=d+16&-16;h=nK(g)|0;c[b+8>>2]=h;c[b>>2]=g|1;c[b+4>>2]=d;f=h}nW(f|0,e|0,d|0)|0;a[f+d|0]=0;return}function gF(b){b=b|0;if((a[b]&1)==0){return}nM(c[b+8>>2]|0);return}function gG(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=nV(d|0)|0;f=b;g=b;h=a[g]|0;if((h&1)==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}if(i>>>0<e>>>0){h=j&255;if((h&1|0)==0){k=h>>>1}else{k=c[b+4>>2]|0}gM(b,i,e-i|0,k,0,k,e,d);return b|0}if((j&1)==0){l=f+1|0}else{l=c[b+8>>2]|0}nY(l|0,d|0,e|0)|0;a[l+e|0]=0;if((a[g]&1)==0){a[g]=e<<1&255;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function gH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;g=a[f]|0;h=g&255;if((h&1|0)==0){i=h>>>1}else{i=c[b+4>>2]|0}if(i>>>0<d>>>0){h=d-i|0;gI(b,h,e)|0;return}if((g&1)==0){a[b+1+d|0]=0;a[f]=d<<1&255;return}else{a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;return}}function gI(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){return b|0}f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<d>>>0){gN(b,h,d-h+j|0,j,j,0,0);k=a[f]|0}else{k=i}if((k&1)==0){l=b+1|0}else{l=c[b+8>>2]|0}k=l+j|0;nW(k|0,e|0,d|0)|0;e=j+d|0;if((a[f]&1)==0){a[f]=e<<1&255}else{c[b+4>>2]=e}a[l+e|0]=0;return b|0}function gJ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if(d>>>0>4294967279>>>0){gB(0)}e=b;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}g=j>>>0>d>>>0?j:d;if(g>>>0<11>>>0){k=11}else{k=g+16&-16}g=k-1|0;if((g|0)==(h|0)){return}if((g|0)==10){l=e+1|0;m=c[b+8>>2]|0;n=1;o=0}else{if(g>>>0>h>>>0){p=nK(k)|0}else{p=nK(k)|0}h=i&1;if(h<<24>>24==0){q=e+1|0}else{q=c[b+8>>2]|0}l=p;m=q;n=h<<24>>24!=0;o=1}h=i&255;if((h&1|0)==0){r=h>>>1}else{r=c[b+4>>2]|0}h=r+1|0;nX(l|0,m|0,h)|0;if(n){nM(m)}if(o){c[b>>2]=k|1;c[b+4>>2]=j;c[b+8>>2]=l;return}else{a[f]=j<<1&255;return}}function gK(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=10}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){gN(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2&255;j=b+1|0;k=g+1|0;l=j+g|0;a[l]=d;m=j+k|0;a[m]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+g|0;a[l]=d;m=j+k|0;a[m]=0;return}}function gL(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<e>>>0){gM(b,h,e-h+j|0,j,j,0,e,d);return b|0}if((e|0)==0){return b|0}if((i&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}i=k+j|0;nX(i|0,d|0,e)|0;d=j+e|0;if((a[f]&1)==0){a[f]=d<<1&255}else{c[b+4>>2]=d}a[k+d|0]=0;return b|0}function gM(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((-18-d|0)>>>0<e>>>0){gB(0)}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<11>>>0){o=11;break}o=n+16&-16}else{o=-17}}while(0);e=nK(o)|0;if((g|0)!=0){nX(e|0,k|0,g)|0}if((i|0)!=0){n=e+g|0;nX(n|0,j|0,i)|0}j=f-h|0;if((j|0)!=(g|0)){f=j-g|0;n=e+(i+g)|0;l=k+(h+g)|0;nX(n|0,l|0,f)|0}if((d|0)==10){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}nM(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}function gN(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((-17-d|0)>>>0<e>>>0){gB(0)}if((a[b]&1)==0){j=b+1|0}else{j=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<11>>>0){n=11;break}n=m+16&-16}else{n=-17}}while(0);e=nK(n)|0;if((g|0)!=0){nX(e|0,j|0,g)|0}m=f-h|0;if((m|0)!=(g|0)){f=m-g|0;m=e+(i+g)|0;i=j+(h+g)|0;nX(m|0,i|0,f)|0}if((d|0)==10){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}nM(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function gO(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(e>>>0>1073741807>>>0){gB(0)}if(e>>>0<2>>>0){a[b]=e<<1&255;f=b+4|0;g=nf(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}else{i=e+4&-4;j=nK(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=e;f=j;g=nf(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}}function gP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(d>>>0>1073741807>>>0){gB(0)}if(d>>>0<2>>>0){a[b]=d<<1&255;f=b+4|0;g=nh(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}else{i=d+4&-4;j=nK(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=d;f=j;g=nh(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}}function gQ(b){b=b|0;if((a[b]&1)==0){return}nM(c[b+8>>2]|0);return}function gR(a,b){a=a|0;b=b|0;return gS(a,b,ne(b)|0)|0}function gS(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=1;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}if(h>>>0<e>>>0){g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}gV(b,h,e-h|0,j,0,j,e,d);return b|0}if((i&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}ng(k,d,e)|0;c[k+(e<<2)>>2]=0;if((a[f]&1)==0){a[f]=e<<1&255;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function gT(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if(d>>>0>1073741807>>>0){gB(0)}e=b;f=a[e]|0;if((f&1)==0){g=1;h=f}else{f=c[b>>2]|0;g=(f&-2)-1|0;h=f&255}f=h&255;if((f&1|0)==0){i=f>>>1}else{i=c[b+4>>2]|0}f=i>>>0>d>>>0?i:d;if(f>>>0<2>>>0){j=2}else{j=f+4&-4}f=j-1|0;if((f|0)==(g|0)){return}if((f|0)==1){k=b+4|0;l=c[b+8>>2]|0;m=1;n=0}else{d=j<<2;if(f>>>0>g>>>0){o=nK(d)|0}else{o=nK(d)|0}d=h&1;if(d<<24>>24==0){p=b+4|0}else{p=c[b+8>>2]|0}k=o;l=p;m=d<<24>>24!=0;n=1}d=k;k=h&255;if((k&1|0)==0){q=k>>>1}else{q=c[b+4>>2]|0}nf(d,l,q+1|0)|0;if(m){nM(l)}if(n){c[b>>2]=j|1;c[b+4>>2]=i;c[b+8>>2]=d;return}else{a[e]=i<<1&255;return}}function gU(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=1}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){gW(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2&255;j=b+4|0;k=g+1|0;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}}function gV(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((1073741806-d|0)>>>0<e>>>0){gB(0)}if((a[b]&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<2>>>0){o=2;break}o=n+4&-4}else{o=1073741807}}while(0);e=nK(o<<2)|0;if((g|0)!=0){nf(e,k,g)|0}if((i|0)!=0){n=e+(g<<2)|0;nf(n,j,i)|0}j=f-h|0;if((j|0)!=(g|0)){f=j-g|0;n=e+(i+g<<2)|0;l=k+(h+g<<2)|0;nf(n,l,f)|0}if((d|0)==1){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}nM(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}function gW(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((1073741807-d|0)>>>0<e>>>0){gB(0)}if((a[b]&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<2>>>0){n=2;break}n=m+4&-4}else{n=1073741807}}while(0);e=nK(n<<2)|0;if((g|0)!=0){nf(e,j,g)|0}m=f-h|0;if((m|0)!=(g|0)){f=m-g|0;m=e+(i+g<<2)|0;i=j+(h+g<<2)|0;nf(m,i,f)|0}if((d|0)==1){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}nM(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function gX(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=(c[b+24>>2]|0)==0;if(g){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((g&1|d)&c[b+20>>2]|0)==0){i=e;return}e=bP(16)|0;do{if((a[27456]|0)==0){if((bc(27456)|0)==0){break}c[6342]=13240;a$(80,25368,u|0)|0}}while(0);b=n$(25368,0,32)|0;c[f>>2]=b&0|1;c[f+4>>2]=K|0;gx(e,f,8112);c[e>>2]=12424;bl(e|0,18768,34)}function gY(a){a=a|0;var b=0,d=0,e=0,f=0;c[a>>2]=12400;b=c[a+40>>2]|0;d=a+32|0;e=a+36|0;if((b|0)!=0){f=b;do{f=f-1|0;b5[c[(c[d>>2]|0)+(f<<2)>>2]&15](0,a,c[(c[e>>2]|0)+(f<<2)>>2]|0);}while((f|0)!=0)}ll(a+28|0);nF(c[d>>2]|0);nF(c[e>>2]|0);nF(c[a+48>>2]|0);nF(c[a+60>>2]|0);return}function gZ(a,b){a=a|0;b=b|0;lk(a,b+28|0);return}function g_(a,b){a=a|0;b=b|0;var d=0,e=0;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;b=a+28|0;d=(b|0)==0;e=a+32|0;nW(e|0,0,40)|0;if(d){return}lj(b);return}function g$(a){a=a|0;c[a>>2]=13472;ll(a+4|0);nM(a);return}function g0(a){a=a|0;c[a>>2]=13472;ll(a+4|0);return}function g1(a,b){a=a|0;b=b|0;return}function g2(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function g3(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function g4(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function g5(a){a=a|0;return 0}function g6(a){a=a|0;return 0}function g7(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+12|0;i=b+16|0;j=d;d=0;while(1){k=c[h>>2]|0;if(k>>>0<(c[i>>2]|0)>>>0){c[h>>2]=k+1;l=a[k]|0}else{k=b2[c[(c[f>>2]|0)+40>>2]&255](b)|0;if((k|0)==-1){g=d;m=2237;break}l=k&255}a[j]=l;k=d+1|0;if((k|0)<(e|0)){j=j+1|0;d=k}else{g=k;m=2239;break}}if((m|0)==2237){return g|0}else if((m|0)==2239){return g|0}return 0}function g8(a){a=a|0;return-1|0}function g9(a){a=a|0;var b=0,e=0;if((b2[c[(c[a>>2]|0)+36>>2]&255](a)|0)==-1){b=-1;return b|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1;b=d[a]|0;return b|0}function ha(a,b){a=a|0;b=b|0;return-1|0}function hb(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=b;if((f|0)<=0){h=0;return h|0}i=b+24|0;j=b+28|0;k=0;l=e;while(1){e=c[i>>2]|0;if(e>>>0<(c[j>>2]|0)>>>0){m=a[l]|0;c[i>>2]=e+1;a[e]=m}else{if((b1[c[(c[g>>2]|0)+52>>2]&31](b,d[l]|0)|0)==-1){h=k;n=2255;break}}m=k+1|0;if((m|0)<(f|0)){k=m;l=l+1|0}else{h=m;n=2256;break}}if((n|0)==2256){return h|0}else if((n|0)==2255){return h|0}return 0}function hc(a,b){a=a|0;b=b|0;return-1|0}function hd(a){a=a|0;c[a>>2]=13400;ll(a+4|0);nM(a);return}function he(a){a=a|0;c[a>>2]=13400;ll(a+4|0);return}function hf(a,b){a=a|0;b=b|0;return}function hg(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function hh(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function hi(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function hj(a){a=a|0;return 0}function hk(a){a=a|0;return 0}function hl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+12|0;h=a+16|0;i=b;b=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+4;k=c[j>>2]|0}else{j=b2[c[(c[e>>2]|0)+40>>2]&255](a)|0;if((j|0)==-1){f=b;l=2273;break}else{k=j}}c[i>>2]=k;j=b+1|0;if((j|0)<(d|0)){i=i+4|0;b=j}else{f=j;l=2274;break}}if((l|0)==2274){return f|0}else if((l|0)==2273){return f|0}return 0}function hm(a){a=a|0;return-1|0}function hn(a){a=a|0;var b=0,d=0;if((b2[c[(c[a>>2]|0)+36>>2]&255](a)|0)==-1){b=-1;return b|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4;b=c[a>>2]|0;return b|0}function ho(a,b){a=a|0;b=b|0;return-1|0}function hp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+24|0;h=a+28|0;i=0;j=b;while(1){b=c[g>>2]|0;if(b>>>0<(c[h>>2]|0)>>>0){k=c[j>>2]|0;c[g>>2]=b+4;c[b>>2]=k}else{if((b1[c[(c[e>>2]|0)+52>>2]&31](a,c[j>>2]|0)|0)==-1){f=i;l=2291;break}}k=i+1|0;if((k|0)<(d|0)){i=k;j=j+4|0}else{f=k;l=2290;break}}if((l|0)==2290){return f|0}else if((l|0)==2291){return f|0}return 0}function hq(a,b){a=a|0;b=b|0;return-1|0}function hr(a){a=a|0;gY(a+8|0);nM(a);return}function hs(a){a=a|0;gY(a+8|0);return}function ht(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;gY(b+(d+8)|0);nM(b+d|0);return}function hu(a){a=a|0;gY(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function hv(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){hv(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((b2[c[(c[k>>2]|0)+24>>2]&255](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;gX(h+k|0,c[h+(k+16)>>2]|1)}}while(0);hF(e);i=d;return b|0}function hw(a){a=a|0;gY(a+8|0);nM(a);return}function hx(a){a=a|0;gY(a+8|0);return}function hy(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;gY(b+(d+8)|0);nM(b+d|0);return}function hz(a){a=a|0;gY(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function hA(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){hA(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((b2[c[(c[k>>2]|0)+24>>2]&255](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;gX(h+k|0,c[h+(k+16)>>2]|1)}}while(0);hK(e);i=d;return b|0}function hB(a){a=a|0;gY(a+4|0);nM(a);return}function hC(a){a=a|0;gY(a+4|0);return}function hD(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;gY(b+(d+4)|0);nM(b+d|0);return}function hE(a){a=a|0;gY(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function hF(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bg()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((b2[c[(c[e>>2]|0)+24>>2]&255](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;gX(d+b|0,c[d+(b+16)>>2]|1);return}function hG(a){a=a|0;gY(a+4|0);nM(a);return}function hH(a){a=a|0;gY(a+4|0);return}function hI(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;gY(b+(d+4)|0);nM(b+d|0);return}function hJ(a){a=a|0;gY(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function hK(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bg()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((b2[c[(c[e>>2]|0)+24>>2]&255](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;gX(d+b|0,c[d+(b+16)>>2]|1);return}function hL(a){a=a|0;return 9960}function hM(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)==1){gD(a,10480,35);return}else{gv(a,b|0,c);return}}function hN(a){a=a|0;gr(a|0);return}function hO(a){a=a|0;gz(a|0);nM(a);return}function hP(a){a=a|0;gz(a|0);return}function hQ(a){a=a|0;gY(a);nM(a);return}function hR(a){a=a|0;gr(a|0);nM(a);return}function hS(a){a=a|0;ge(a|0);nM(a);return}function hT(a){a=a|0;ge(a|0);return}function hU(a){a=a|0;ge(a|0);return}function hV(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L2493:do{if((e|0)==(f|0)){g=c}else{b=c;h=e;while(1){if((b|0)==(d|0)){i=-1;j=2407;break}k=a[b]|0;l=a[h]|0;if(k<<24>>24<l<<24>>24){i=-1;j=2406;break}if(l<<24>>24<k<<24>>24){i=1;j=2405;break}k=b+1|0;l=h+1|0;if((l|0)==(f|0)){g=k;break L2493}else{b=k;h=l}}if((j|0)==2407){return i|0}else if((j|0)==2406){return i|0}else if((j|0)==2405){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function hW(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;if(g>>>0>4294967279>>>0){gB(b)}if(g>>>0<11>>>0){a[b]=g<<1&255;h=b+1|0}else{i=g+16&-16;j=nK(i)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=g;h=j}if((e|0)==(f|0)){k=h;a[k]=0;return}j=f+(-d|0)|0;d=h;g=e;while(1){a[d]=a[g]|0;e=g+1|0;if((e|0)==(f|0)){break}else{d=d+1|0;g=e}}k=h+j|0;a[k]=0;return}function hX(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if((c|0)==(d|0)){e=0;return e|0}else{f=c;g=0}while(1){c=(a[f]|0)+(g<<4)|0;b=c&-268435456;h=(b>>>24|b)^c;c=f+1|0;if((c|0)==(d|0)){e=h;break}else{f=c;g=h}}return e|0}function hY(a){a=a|0;ge(a|0);nM(a);return}function hZ(a){a=a|0;ge(a|0);return}function h_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L2529:do{if((e|0)==(f|0)){g=b}else{a=b;h=e;while(1){if((a|0)==(d|0)){i=-1;j=2434;break}k=c[a>>2]|0;l=c[h>>2]|0;if((k|0)<(l|0)){i=-1;j=2437;break}if((l|0)<(k|0)){i=1;j=2435;break}k=a+4|0;l=h+4|0;if((l|0)==(f|0)){g=k;break L2529}else{a=k;h=l}}if((j|0)==2437){return i|0}else if((j|0)==2434){return i|0}else if((j|0)==2435){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function h$(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741807>>>0){gB(b)}if(h>>>0<2>>>0){a[b]=g>>>1&255;i=b+4|0}else{g=h+4&-4;j=nK(g<<2)|0;c[b+8>>2]=j;c[b>>2]=g|1;c[b+4>>2]=h;i=j}if((e|0)==(f|0)){k=i;c[k>>2]=0;return}j=(f-4+(-d|0)|0)>>>2;d=i;h=e;while(1){c[d>>2]=c[h>>2];e=h+4|0;if((e|0)==(f|0)){break}else{d=d+4|0;h=e}}k=i+(j+1<<2)|0;c[k>>2]=0;return}function h0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((b|0)==(d|0)){e=0;return e|0}else{f=b;g=0}while(1){b=(c[f>>2]|0)+(g<<4)|0;a=b&-268435456;h=(a>>>24|a)^b;b=f+4|0;if((b|0)==(d|0)){e=h;break}else{f=b;g=h}}return e|0}function h1(a){a=a|0;ge(a|0);nM(a);return}function h2(a){a=a|0;ge(a|0);return}function h3(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];b_[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==0){a[j]=0}else if((w|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}gZ(r,g);q=r|0;r=c[q>>2]|0;if((c[6700]|0)!=-1){c[m>>2]=26800;c[m+4>>2]=14;c[m+8>>2]=0;gA(26800,m,110)}m=(c[6701]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[q>>2]|0;gg(n)|0;gZ(s,g);n=s|0;p=c[n>>2]|0;if((c[6604]|0)!=-1){c[l>>2]=26416;c[l+4>>2]=14;c[l+8>>2]=0;gA(26416,l,110)}d=(c[6605]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;z=c[n>>2]|0;gg(z)|0;z=t|0;A=x;b0[c[(c[A>>2]|0)+24>>2]&127](z,y);b0[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(h4(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];gF(t+12|0);gF(t|0);i=k;return}}while(0);o=bP(4)|0;nj(o);bl(o|0,18192,158)}}while(0);k=bP(4)|0;nj(k);bl(k|0,18192,158)}function h4(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=nE(m)|0;if((o|0)!=0){p=o;q=o;break}nR();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){z=r;break}if((b2[c[(c[r>>2]|0)+36>>2]&255](r)|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){A=z;B=0}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if((b2[c[(c[m>>2]|0)+36>>2]&255](m)|0)!=-1){C=m;break}c[b>>2]=0;C=0}else{C=m}}while(0);A=c[u>>2]|0;B=C}D=(B|0)==0;if(!((r^D)&(s|0)!=0)){break}m=c[A+12>>2]|0;if((m|0)==(c[A+16>>2]|0)){E=(b2[c[(c[A>>2]|0)+36>>2]&255](A)|0)&255}else{E=a[m]|0}if(k){F=E}else{F=b1[c[(c[e>>2]|0)+12>>2]&31](h,E)|0}do{if(n){G=x;H=s}else{m=t+1|0;L46:do{if(k){y=s;o=x;w=p;v=0;I=f;while(1){do{if((a[w]|0)==1){J=I;if((a[J]&1)==0){K=I+1|0}else{K=c[I+8>>2]|0}if(F<<24>>24!=(a[K+t|0]|0)){a[w]=0;L=v;M=o;N=y-1|0;break}O=d[J]|0;if((O&1|0)==0){P=O>>>1}else{P=c[I+4>>2]|0}if((P|0)!=(m|0)){L=1;M=o;N=y;break}a[w]=2;L=1;M=o+1|0;N=y-1|0}else{L=v;M=o;N=y}}while(0);O=I+12|0;if((O|0)==(g|0)){Q=N;R=M;S=L;break L46}y=N;o=M;w=w+1|0;v=L;I=O}}else{I=s;v=x;w=p;o=0;y=f;while(1){do{if((a[w]|0)==1){O=y;if((a[O]&1)==0){T=y+1|0}else{T=c[y+8>>2]|0}if(F<<24>>24!=(b1[c[(c[e>>2]|0)+12>>2]&31](h,a[T+t|0]|0)|0)<<24>>24){a[w]=0;U=o;V=v;W=I-1|0;break}J=d[O]|0;if((J&1|0)==0){X=J>>>1}else{X=c[y+4>>2]|0}if((X|0)!=(m|0)){U=1;V=v;W=I;break}a[w]=2;U=1;V=v+1|0;W=I-1|0}else{U=o;V=v;W=I}}while(0);J=y+12|0;if((J|0)==(g|0)){Q=W;R=V;S=U;break L46}I=W;v=V;w=w+1|0;o=U;y=J}}}while(0);if(!S){G=R;H=Q;break}m=c[u>>2]|0;y=m+12|0;o=c[y>>2]|0;if((o|0)==(c[m+16>>2]|0)){w=c[(c[m>>2]|0)+40>>2]|0;b2[w&255](m)|0}else{c[y>>2]=o+1}if((R+Q|0)>>>0<2>>>0|n){G=R;H=Q;break}o=t+1|0;y=R;m=p;w=f;while(1){do{if((a[m]|0)==2){v=d[w]|0;if((v&1|0)==0){Y=v>>>1}else{Y=c[w+4>>2]|0}if((Y|0)==(o|0)){Z=y;break}a[m]=0;Z=y-1|0}else{Z=y}}while(0);v=w+12|0;if((v|0)==(g|0)){G=Z;H=Q;break}else{y=Z;m=m+1|0;w=v}}}}while(0);t=t+1|0;x=G;s=H}do{if((A|0)==0){_=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){_=A;break}if((b2[c[(c[A>>2]|0)+36>>2]&255](A)|0)==-1){c[u>>2]=0;_=0;break}else{_=c[u>>2]|0;break}}}while(0);u=(_|0)==0;do{if(D){$=93}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(u){break}else{$=95;break}}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)==-1){c[b>>2]=0;$=93;break}else{if(u^(B|0)==0){break}else{$=95;break}}}}while(0);if(($|0)==93){if(u){$=95}}if(($|0)==95){c[j>>2]=c[j>>2]|2}L125:do{if(n){$=100}else{u=f;B=p;while(1){if((a[B]|0)==2){aa=u;break L125}b=u+12|0;if((b|0)==(g|0)){$=100;break L125}u=b;B=B+1|0}}}while(0);if(($|0)==100){c[j>>2]=c[j>>2]|4;aa=g}if((q|0)==0){i=l;return aa|0}nF(q);i=l;return aa|0}function h5(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];h6(a,0,j,k,f,g,h);i=b;return}function h6(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;iQ(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L149:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b2[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=128}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L149}}if((b2[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=128;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L149}}}}while(0);if((E|0)==128){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}gH(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}gH(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{R=a[K]|0}if((iq(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;b2[Q&255](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=mZ(H,c[q>>2]|0,j,v)|0;kJ(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L209:do{if(J){E=169}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b2[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=169;break L209}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}}while(0);do{if((E|0)==169){if(h){break}U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}function h7(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];h8(a,0,j,k,f,g,h);i=b;return}function h8(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;iQ(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L234:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b2[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=197}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L234}}if((b2[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=197;break}else{L=(D|0)==0;if(C^L){F=D;G=L;break}else{H=m;I=D;J=L;break L234}}}}while(0);if((E|0)==197){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;L=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((L?D>>>1:c[z>>2]|0)|0)){if(L){M=D>>>1;N=D>>>1}else{D=c[z>>2]|0;M=D;N=D}gH(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}gH(o,O,0);if((a[p]&1)==0){P=x}else{P=c[y>>2]|0}c[q>>2]=P+N;Q=P}else{Q=m}D=B+12|0;L=c[D>>2]|0;R=B+16|0;if((L|0)==(c[R>>2]|0)){S=(b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{S=a[L]|0}if((iq(S,v,Q,q,t,A,n,l,s,u)|0)!=0){H=Q;I=F;J=G;break}L=c[D>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[B>>2]|0)+40>>2]|0;b2[R&255](B)|0;m=Q;w=B;continue}else{c[D>>2]=L+1;m=Q;w=B;continue}}w=d[n]|0;if((w&1|0)==0){T=w>>>1}else{T=c[n+4>>2]|0}do{if((T|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}Q=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=Q}}while(0);t=mY(H,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;kJ(n,l,c[s>>2]|0,j);do{if(C){U=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){U=B;break}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){U=B;break}c[h>>2]=0;U=0}}while(0);h=(U|0)==0;L294:do{if(J){E=238}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b2[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=238;break L294}}while(0);if(!(h^(I|0)==0)){break}V=b|0;c[V>>2]=U;gF(o);gF(n);i=e;return}}while(0);do{if((E|0)==238){if(h){break}V=b|0;c[V>>2]=U;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;gF(o);gF(n);i=e;return}function h9(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ia(a,0,j,k,f,g,h);i=b;return}function ia(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;f=i;i=i+72|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+32|0;o=f+40|0;p=f+56|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}v=m|0;iQ(o,j,v,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=a[n]|0;n=x;x=c[j>>2]|0;L319:while(1){do{if((x|0)==0){C=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){C=x;break}if((b2[c[(c[x>>2]|0)+36>>2]&255](x)|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);D=(C|0)==0;E=c[g>>2]|0;do{if((E|0)==0){F=266}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){if(D){G=E;H=0;break}else{I=n;J=E;K=0;break L319}}if((b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)==-1){c[g>>2]=0;F=266;break}else{L=(E|0)==0;if(D^L){G=E;H=L;break}else{I=n;J=E;K=L;break L319}}}}while(0);if((F|0)==266){F=0;if(D){I=n;J=0;K=1;break}else{G=0;H=1}}E=d[q]|0;L=(E&1|0)==0;if(((c[r>>2]|0)-n|0)==((L?E>>>1:c[A>>2]|0)|0)){if(L){M=E>>>1;N=E>>>1}else{E=c[A>>2]|0;M=E;N=E}gH(p,M<<1,0);if((a[q]&1)==0){O=10}else{O=(c[h>>2]&-2)-1|0}gH(p,O,0);if((a[q]&1)==0){P=y}else{P=c[z>>2]|0}c[r>>2]=P+N;Q=P}else{Q=n}E=C+12|0;L=c[E>>2]|0;R=C+16|0;if((L|0)==(c[R>>2]|0)){S=(b2[c[(c[C>>2]|0)+36>>2]&255](C)|0)&255}else{S=a[L]|0}if((iq(S,w,Q,r,u,B,o,m,t,v)|0)!=0){I=Q;J=G;K=H;break}L=c[E>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[C>>2]|0)+40>>2]|0;b2[R&255](C)|0;n=Q;x=C;continue}else{c[E>>2]=L+1;n=Q;x=C;continue}}x=d[o]|0;if((x&1|0)==0){T=x>>>1}else{T=c[o+4>>2]|0}do{if((T|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}Q=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=Q}}while(0);b[l>>1]=mX(I,c[r>>2]|0,k,w)|0;kJ(o,m,c[t>>2]|0,k);do{if(D){U=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){U=C;break}if((b2[c[(c[C>>2]|0)+36>>2]&255](C)|0)!=-1){U=C;break}c[j>>2]=0;U=0}}while(0);j=(U|0)==0;L379:do{if(K){F=307}else{do{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b2[c[(c[J>>2]|0)+36>>2]&255](J)|0)!=-1){break}c[g>>2]=0;F=307;break L379}}while(0);if(!(j^(J|0)==0)){break}V=e|0;c[V>>2]=U;gF(p);gF(o);i=f;return}}while(0);do{if((F|0)==307){if(j){break}V=e|0;c[V>>2]=U;gF(p);gF(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;V=e|0;c[V>>2]=U;gF(p);gF(o);i=f;return}function ib(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ic(a,0,j,k,f,g,h);i=b;return}function ic(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;iQ(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L404:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b2[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=335}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L404}}if((b2[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=335;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L404}}}}while(0);if((E|0)==335){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}gH(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}gH(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{R=a[K]|0}if((iq(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;b2[Q&255](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=mW(H,c[q>>2]|0,j,v)|0;kJ(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L464:do{if(J){E=376}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b2[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=376;break L464}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}}while(0);do{if((E|0)==376){if(h){break}U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}function id(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ie(a,0,j,k,f,g,h);i=b;return}function ie(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;iQ(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L489:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b2[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=404}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L489}}if((b2[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=404;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L489}}}}while(0);if((E|0)==404){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}gH(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}gH(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{R=a[K]|0}if((iq(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;b2[Q&255](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=mV(H,c[q>>2]|0,j,v)|0;kJ(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L549:do{if(J){E=445}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b2[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=445;break L549}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}}while(0);do{if((E|0)==445){if(h){break}U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;gF(o);gF(n);i=e;return}function ig(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ih(a,0,j,k,f,g,h);i=b;return}function ih(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;iQ(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L574:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b2[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=473}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L574}}if((b2[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=473;break}else{L=(D|0)==0;if(C^L){F=D;G=L;break}else{H=m;I=D;J=L;break L574}}}}while(0);if((E|0)==473){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;L=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((L?D>>>1:c[z>>2]|0)|0)){if(L){M=D>>>1;N=D>>>1}else{D=c[z>>2]|0;M=D;N=D}gH(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}gH(o,O,0);if((a[p]&1)==0){P=x}else{P=c[y>>2]|0}c[q>>2]=P+N;Q=P}else{Q=m}D=B+12|0;L=c[D>>2]|0;R=B+16|0;if((L|0)==(c[R>>2]|0)){S=(b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{S=a[L]|0}if((iq(S,v,Q,q,t,A,n,l,s,u)|0)!=0){H=Q;I=F;J=G;break}L=c[D>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[B>>2]|0)+40>>2]|0;b2[R&255](B)|0;m=Q;w=B;continue}else{c[D>>2]=L+1;m=Q;w=B;continue}}w=d[n]|0;if((w&1|0)==0){T=w>>>1}else{T=c[n+4>>2]|0}do{if((T|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}Q=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=Q}}while(0);t=mU(H,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;kJ(n,l,c[s>>2]|0,j);do{if(C){U=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){U=B;break}if((b2[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){U=B;break}c[h>>2]=0;U=0}}while(0);h=(U|0)==0;L634:do{if(J){E=514}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b2[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=514;break L634}}while(0);if(!(h^(I|0)==0)){break}V=b|0;c[V>>2]=U;gF(o);gF(n);i=e;return}}while(0);do{if((E|0)==514){if(h){break}V=b|0;c[V>>2]=U;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;gF(o);gF(n);i=e;return}function ii(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ij(a,0,j,k,f,g,h);i=b;return}function ij(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;iR(o,j,x,m,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L654:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((b2[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=538}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L654}}if((b2[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[f>>2]=0;H=538;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L654}}}}while(0);if((H|0)==538){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}gH(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}gH(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)&255}else{U=a[N]|0}if((iS(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;b2[T&255](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);g[l>>2]=+mT(K,c[r>>2]|0,k);kJ(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L715:do{if(M){H=580}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b2[c[(c[L>>2]|0)+36>>2]&255](L)|0)!=-1){break}c[f>>2]=0;H=580;break L715}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}}while(0);do{if((H|0)==580){if(j){break}X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}function ik(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];il(a,0,j,k,f,g,h);i=b;return}function il(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;iR(o,j,x,m,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L735:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((b2[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=604}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L735}}if((b2[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[f>>2]=0;H=604;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L735}}}}while(0);if((H|0)==604){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}gH(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gH(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)&255}else{U=a[N]|0}if((iS(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;b2[T&255](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);h[l>>3]=+mS(K,c[r>>2]|0,k);kJ(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L796:do{if(M){H=646}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b2[c[(c[L>>2]|0)+36>>2]&255](L)|0)!=-1){break}c[f>>2]=0;H=646;break L796}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}}while(0);do{if((H|0)==646){if(j){break}X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}function im(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];io(a,0,j,k,f,g,h);i=b;return}function io(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;iR(o,j,x,m,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L816:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((b2[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=670}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L816}}if((b2[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[f>>2]=0;H=670;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L816}}}}while(0);if((H|0)==670){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}gH(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gH(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)&255}else{U=a[N]|0}if((iS(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;b2[T&255](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);h[l>>3]=+mR(K,c[r>>2]|0,k);kJ(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((b2[c[(c[E>>2]|0)+36>>2]&255](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L877:do{if(M){H=712}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b2[c[(c[L>>2]|0)+36>>2]&255](L)|0)!=-1){break}c[f>>2]=0;H=712;break L877}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}}while(0);do{if((H|0)==712){if(j){break}X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;gF(p);gF(o);i=e;return}function ip(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+48|0;o=n;p=i;i=i+4|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;nW(o|0,0,12)|0;o=q;gZ(p,h);h=p|0;p=c[h>>2]|0;if((c[6700]|0)!=-1){c[l>>2]=26800;c[l+4>>2]=14;c[l+8>>2]=0;gA(26800,l,110)}l=(c[6701]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+32>>2]|0;cc[z&15](x,19928,19954,y)|0;x=c[h>>2]|0;gg(x)|0;nW(o|0,0,12)|0;x=q;gH(q,10,0);if((a[o]&1)==0){z=x+1|0;A=z;B=z;C=q+8|0}else{z=q+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[r>>2]=A;z=s|0;c[t>>2]=z;c[u>>2]=0;x=f|0;w=g|0;D=q|0;E=q+4|0;F=A;G=c[x>>2]|0;L904:while(1){do{if((G|0)==0){H=0}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){H=G;break}if((b2[c[(c[G>>2]|0)+36>>2]&255](G)|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[w>>2]|0;do{if((J|0)==0){K=743}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{L=F;break L904}}if((b2[c[(c[J>>2]|0)+36>>2]&255](J)|0)==-1){c[w>>2]=0;K=743;break}else{if(I^(J|0)==0){break}else{L=F;break L904}}}}while(0);if((K|0)==743){K=0;if(I){L=F;break}}J=d[o]|0;M=(J&1|0)==0;if(((c[r>>2]|0)-F|0)==((M?J>>>1:c[E>>2]|0)|0)){if(M){N=J>>>1;O=J>>>1}else{J=c[E>>2]|0;N=J;O=J}gH(q,N<<1,0);if((a[o]&1)==0){P=10}else{P=(c[D>>2]&-2)-1|0}gH(q,P,0);if((a[o]&1)==0){Q=B}else{Q=c[C>>2]|0}c[r>>2]=Q+O;R=Q}else{R=F}J=H+12|0;M=c[J>>2]|0;S=H+16|0;if((M|0)==(c[S>>2]|0)){T=(b2[c[(c[H>>2]|0)+36>>2]&255](H)|0)&255}else{T=a[M]|0}if((iq(T,16,R,r,u,0,n,z,t,y)|0)!=0){L=R;break}M=c[J>>2]|0;if((M|0)==(c[S>>2]|0)){S=c[(c[H>>2]|0)+40>>2]|0;b2[S&255](H)|0;F=R;G=H;continue}else{c[J>>2]=M+1;F=R;G=H;continue}}a[L+3|0]=0;do{if((a[27448]|0)==0){if((bc(27448)|0)==0){break}c[6340]=aR(2147483647,8480,0)|0}}while(0);G=ir(L,c[6340]|0,7648,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){U=0}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){U=G;break}if((b2[c[(c[G>>2]|0)+36>>2]&255](G)|0)!=-1){U=G;break}c[x>>2]=0;U=0}}while(0);x=(U|0)==0;G=c[w>>2]|0;do{if((G|0)==0){K=788}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(!x){break}V=b|0;c[V>>2]=U;gF(q);gF(n);i=e;return}if((b2[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[w>>2]=0;K=788;break}if(!(x^(G|0)==0)){break}V=b|0;c[V>>2]=U;gF(q);gF(n);i=e;return}}while(0);do{if((K|0)==788){if(x){break}V=b|0;c[V>>2]=U;gF(q);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;gF(q);gF(n);i=e;return}}while(0);e=bP(4)|0;nj(e);bl(e|0,18192,158)}function iq(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(a[m+24|0]|0)==b<<24>>24;if(!p){if((a[m+25|0]|0)!=b<<24>>24){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&b<<24>>24==i<<24>>24){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+26|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((a[i]|0)==b<<24>>24){s=i;break}else{i=i+1|0}}i=s-m|0;if((i|0)>23){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((i|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<22){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;m=a[19928+i|0]|0;s=c[g>>2]|0;c[g>>2]=s+1;a[s]=m;q=0;return q|0}}while(0);f=a[19928+i|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function ir(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=bD(b|0)|0;b=aX(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}bD(h|0)|0;i=f;return b|0}function is(a){a=a|0;ge(a|0);nM(a);return}function it(a){a=a|0;ge(a|0);return}function iu(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];b_[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==0){a[j]=0}else if((w|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}gZ(r,g);q=r|0;r=c[q>>2]|0;if((c[6698]|0)!=-1){c[m>>2]=26792;c[m+4>>2]=14;c[m+8>>2]=0;gA(26792,m,110)}m=(c[6699]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[q>>2]|0;gg(n)|0;gZ(s,g);n=s|0;p=c[n>>2]|0;if((c[6602]|0)!=-1){c[l>>2]=26408;c[l+4>>2]=14;c[l+8>>2]=0;gA(26408,l,110)}d=(c[6603]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;z=c[n>>2]|0;gg(z)|0;z=t|0;A=x;b0[c[(c[A>>2]|0)+24>>2]&127](z,y);b0[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(iv(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];gQ(t+12|0);gQ(t|0);i=k;return}}while(0);o=bP(4)|0;nj(o);bl(o|0,18192,158)}}while(0);k=bP(4)|0;nj(k);bl(k|0,18192,158)}function iv(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=nE(m)|0;if((o|0)!=0){p=o;q=o;break}nR();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{m=c[r+12>>2]|0;if((m|0)==(c[r+16>>2]|0)){A=b2[c[(c[r>>2]|0)+36>>2]&255](r)|0}else{A=c[m>>2]|0}if((A|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){B=z;C=0}else{y=c[m+12>>2]|0;if((y|0)==(c[m+16>>2]|0)){D=b2[c[(c[m>>2]|0)+36>>2]&255](m)|0}else{D=c[y>>2]|0}if((D|0)==-1){c[b>>2]=0;E=0}else{E=m}B=c[u>>2]|0;C=E}F=(C|0)==0;if(!((r^F)&(s|0)!=0)){break}r=c[B+12>>2]|0;if((r|0)==(c[B+16>>2]|0)){G=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{G=c[r>>2]|0}if(k){H=G}else{H=b1[c[(c[e>>2]|0)+28>>2]&31](h,G)|0}do{if(n){I=x;J=s}else{r=t+1|0;L1111:do{if(k){m=s;y=x;o=p;w=0;v=f;while(1){do{if((a[o]|0)==1){K=v;if((a[K]&1)==0){L=v+4|0}else{L=c[v+8>>2]|0}if((H|0)!=(c[L+(t<<2)>>2]|0)){a[o]=0;M=w;N=y;O=m-1|0;break}P=d[K]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[v+4>>2]|0}if((Q|0)!=(r|0)){M=1;N=y;O=m;break}a[o]=2;M=1;N=y+1|0;O=m-1|0}else{M=w;N=y;O=m}}while(0);P=v+12|0;if((P|0)==(g|0)){R=O;S=N;T=M;break L1111}m=O;y=N;o=o+1|0;w=M;v=P}}else{v=s;w=x;o=p;y=0;m=f;while(1){do{if((a[o]|0)==1){P=m;if((a[P]&1)==0){U=m+4|0}else{U=c[m+8>>2]|0}if((H|0)!=(b1[c[(c[e>>2]|0)+28>>2]&31](h,c[U+(t<<2)>>2]|0)|0)){a[o]=0;V=y;W=w;X=v-1|0;break}K=d[P]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[m+4>>2]|0}if((Y|0)!=(r|0)){V=1;W=w;X=v;break}a[o]=2;V=1;W=w+1|0;X=v-1|0}else{V=y;W=w;X=v}}while(0);K=m+12|0;if((K|0)==(g|0)){R=X;S=W;T=V;break L1111}v=X;w=W;o=o+1|0;y=V;m=K}}}while(0);if(!T){I=S;J=R;break}r=c[u>>2]|0;m=r+12|0;y=c[m>>2]|0;if((y|0)==(c[r+16>>2]|0)){o=c[(c[r>>2]|0)+40>>2]|0;b2[o&255](r)|0}else{c[m>>2]=y+4}if((S+R|0)>>>0<2>>>0|n){I=S;J=R;break}y=t+1|0;m=S;r=p;o=f;while(1){do{if((a[r]|0)==2){w=d[o]|0;if((w&1|0)==0){Z=w>>>1}else{Z=c[o+4>>2]|0}if((Z|0)==(y|0)){_=m;break}a[r]=0;_=m-1|0}else{_=m}}while(0);w=o+12|0;if((w|0)==(g|0)){I=_;J=R;break}else{m=_;r=r+1|0;o=w}}}}while(0);t=t+1|0;x=I;s=J}do{if((B|0)==0){$=1}else{J=c[B+12>>2]|0;if((J|0)==(c[B+16>>2]|0)){aa=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{aa=c[J>>2]|0}if((aa|0)==-1){c[u>>2]=0;$=1;break}else{$=(c[u>>2]|0)==0;break}}}while(0);do{if(F){ab=963}else{u=c[C+12>>2]|0;if((u|0)==(c[C+16>>2]|0)){ac=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{ac=c[u>>2]|0}if((ac|0)==-1){c[b>>2]=0;ab=963;break}else{if($^(C|0)==0){break}else{ab=965;break}}}}while(0);if((ab|0)==963){if($){ab=965}}if((ab|0)==965){c[j>>2]=c[j>>2]|2}L1192:do{if(n){ab=970}else{$=f;C=p;while(1){if((a[C]|0)==2){ad=$;break L1192}b=$+12|0;if((b|0)==(g|0)){ab=970;break L1192}$=b;C=C+1|0}}}while(0);if((ab|0)==970){c[j>>2]=c[j>>2]|4;ad=g}if((q|0)==0){i=l;return ad|0}nF(q);i=l;return ad|0}function iw(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ix(a,0,j,k,f,g,h);i=b;return}function ix(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;iT(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L1216:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b2[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=999}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=999;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L1216}}}}while(0);if((F|0)==999){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}gH(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}gH(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{T=c[G>>2]|0}if((iP(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;b2[S&255](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=mZ(K,c[q>>2]|0,j,v)|0;kJ(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=1041}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=b2[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=1041;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}}while(0);do{if((F|0)==1041){if(h){break}Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}function iy(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iz(a,0,j,k,f,g,h);i=b;return}function iz(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==64){v=8}else if((u|0)==8){v=16}else{v=10}u=l|0;iT(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L1306:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b2[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=1070}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=1070;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{L=m;M=C;N=G;break L1306}}}}while(0);if((F|0)==1070){F=0;if(E){L=m;M=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}gH(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gH(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{U=c[G>>2]|0}if((iP(U,v,S,q,t,A,n,l,s,u)|0)!=0){L=S;M=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;b2[T&255](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=mY(L,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;kJ(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=1112}else{B=c[M+12>>2]|0;if((B|0)==(c[M+16>>2]|0)){Y=b2[c[(c[M>>2]|0)+36>>2]&255](M)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=1112;break}if(!(h^(M|0)==0)){break}Z=b|0;c[Z>>2]=W;gF(o);gF(n);i=e;return}}while(0);do{if((F|0)==1112){if(h){break}Z=b|0;c[Z>>2]=W;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;gF(o);gF(n);i=e;return}function iA(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iB(a,0,j,k,f,g,h);i=b;return}function iB(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;f=i;i=i+144|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+104|0;o=f+112|0;p=f+128|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==64){w=8}else if((v|0)==0){w=0}else{w=10}v=m|0;iT(o,j,v,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=c[n>>2]|0;n=x;x=c[j>>2]|0;L1396:while(1){do{if((x|0)==0){C=0}else{D=c[x+12>>2]|0;if((D|0)==(c[x+16>>2]|0)){E=b2[c[(c[x>>2]|0)+36>>2]&255](x)|0}else{E=c[D>>2]|0}if((E|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);F=(C|0)==0;D=c[g>>2]|0;do{if((D|0)==0){G=1141}else{H=c[D+12>>2]|0;if((H|0)==(c[D+16>>2]|0)){I=b2[c[(c[D>>2]|0)+36>>2]&255](D)|0}else{I=c[H>>2]|0}if((I|0)==-1){c[g>>2]=0;G=1141;break}else{H=(D|0)==0;if(F^H){J=D;K=H;break}else{L=n;M=D;N=H;break L1396}}}}while(0);if((G|0)==1141){G=0;if(F){L=n;M=0;N=1;break}else{J=0;K=1}}D=d[q]|0;H=(D&1|0)==0;if(((c[r>>2]|0)-n|0)==((H?D>>>1:c[A>>2]|0)|0)){if(H){O=D>>>1;P=D>>>1}else{D=c[A>>2]|0;O=D;P=D}gH(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}gH(p,Q,0);if((a[q]&1)==0){R=y}else{R=c[z>>2]|0}c[r>>2]=R+P;S=R}else{S=n}D=C+12|0;H=c[D>>2]|0;T=C+16|0;if((H|0)==(c[T>>2]|0)){U=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{U=c[H>>2]|0}if((iP(U,w,S,r,u,B,o,m,t,v)|0)!=0){L=S;M=J;N=K;break}H=c[D>>2]|0;if((H|0)==(c[T>>2]|0)){T=c[(c[C>>2]|0)+40>>2]|0;b2[T&255](C)|0;n=S;x=C;continue}else{c[D>>2]=H+4;n=S;x=C;continue}}x=d[o]|0;if((x&1|0)==0){V=x>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=S}}while(0);b[l>>1]=mX(L,c[r>>2]|0,k,w)|0;kJ(o,m,c[t>>2]|0,k);do{if(F){W=0}else{t=c[C+12>>2]|0;if((t|0)==(c[C+16>>2]|0)){X=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{X=c[t>>2]|0}if((X|0)!=-1){W=C;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;do{if(N){G=1183}else{C=c[M+12>>2]|0;if((C|0)==(c[M+16>>2]|0)){Y=b2[c[(c[M>>2]|0)+36>>2]&255](M)|0}else{Y=c[C>>2]|0}if((Y|0)==-1){c[g>>2]=0;G=1183;break}if(!(j^(M|0)==0)){break}Z=e|0;c[Z>>2]=W;gF(p);gF(o);i=f;return}}while(0);do{if((G|0)==1183){if(j){break}Z=e|0;c[Z>>2]=W;gF(p);gF(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;Z=e|0;c[Z>>2]=W;gF(p);gF(o);i=f;return}function iC(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iD(a,0,j,k,f,g,h);i=b;return}function iD(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==64){v=8}else if((u|0)==8){v=16}else{v=10}u=l|0;iT(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L1486:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b2[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=1212}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=1212;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L1486}}}}while(0);if((F|0)==1212){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}gH(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}gH(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{T=c[G>>2]|0}if((iP(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;b2[S&255](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=mW(K,c[q>>2]|0,j,v)|0;kJ(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=1254}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=b2[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=1254;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}}while(0);do{if((F|0)==1254){if(h){break}Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}function iE(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iF(a,0,j,k,f,g,h);i=b;return}function iF(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=l|0;iT(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L1576:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b2[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=1283}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=1283;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L1576}}}}while(0);if((F|0)==1283){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}gH(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}gH(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{T=c[G>>2]|0}if((iP(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;b2[S&255](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=mV(K,c[q>>2]|0,j,v)|0;kJ(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=1325}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=b2[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=1325;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}}while(0);do{if((F|0)==1325){if(h){break}Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;gF(o);gF(n);i=e;return}function iG(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iH(a,0,j,k,f,g,h);i=b;return}function iH(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==64){v=8}else if((u|0)==8){v=16}else{v=10}u=l|0;iT(n,h,u,m);nW(p|0,0,12)|0;h=o;gH(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L1666:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b2[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=1354}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b2[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=1354;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{L=m;M=C;N=G;break L1666}}}}while(0);if((F|0)==1354){F=0;if(E){L=m;M=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}gH(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gH(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{U=c[G>>2]|0}if((iP(U,v,S,q,t,A,n,l,s,u)|0)!=0){L=S;M=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;b2[T&255](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=mU(L,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;kJ(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=b2[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=1396}else{B=c[M+12>>2]|0;if((B|0)==(c[M+16>>2]|0)){Y=b2[c[(c[M>>2]|0)+36>>2]&255](M)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=1396;break}if(!(h^(M|0)==0)){break}Z=b|0;c[Z>>2]=W;gF(o);gF(n);i=e;return}}while(0);do{if((F|0)==1396){if(h){break}Z=b|0;c[Z>>2]=W;gF(o);gF(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;gF(o);gF(n);i=e;return}function iI(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iJ(a,0,j,k,f,g,h);i=b;return}function iJ(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;iU(o,j,x,m,n);nW(q|0,0,12)|0;j=p;gH(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L1751:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=b2[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=1421}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=b2[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=1421;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L1751}}}}while(0);if((I|0)==1421){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}gH(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[h>>2]&-2)-1|0}gH(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=b2[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{W=c[J>>2]|0}if((iV(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;b2[V&255](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);g[l>>2]=+mT(N,c[r>>2]|0,k);kJ(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=b2[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=1464}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=b2[c[(c[O>>2]|0)+36>>2]&255](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=1464;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}}while(0);do{if((I|0)==1464){if(j){break}$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;gF(p);gF(o);i=e;return}function iK(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iL(a,0,j,k,f,g,h);i=b;return}
function nY(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{nX(b,c,d)|0}return b|0}function nZ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(K=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function n_(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(K=e,a-c>>>0|0)|0}function n$(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}K=a<<c-32;return 0}function n0(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=0;return b>>>c-32|0}function n1(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=(b|0)<0?-1:0;return b>>c-32|0}function n2(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function n3(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function n4(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ag(d,c)|0;f=a>>>16;a=(e>>>16)+(ag(d,f)|0)|0;d=b>>>16;b=ag(d,c)|0;return(K=(a>>>16)+(ag(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function n5(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=n_(e^a,f^b,e,f)|0;b=K;a=g^e;e=h^f;f=n_((oa(i,b,n_(g^c,h^d,g,h)|0,K,0)|0)^a,K^e,a,e)|0;return(K=K,f)|0}function n6(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=n_(h^a,j^b,h,j)|0;b=K;a=n_(k^d,l^e,k,l)|0;oa(m,b,a,K,g)|0;a=n_(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=K;i=f;return(K=j,a)|0}function n7(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=n4(e,a)|0;f=K;return(K=(ag(b,a)|0)+(ag(d,e)|0)+f|f&0,c|0|0)|0}function n8(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=oa(a,b,c,d,0)|0;return(K=K,e)|0}function n9(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;oa(a,b,d,e,g)|0;i=f;return(K=c[g+4>>2]|0,c[g>>2]|0)|0}function oa(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(K=n,o)|0}else{if(!m){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(K=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(K=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(K=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((n3(l|0)|0)>>>0);return(K=n,o)|0}p=(n2(l|0)|0)-(n2(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}else{if(!m){r=(n2(l|0)|0)-(n2(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(n2(j|0)|0)+33-(n2(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(K=n,o)|0}else{p=n3(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(K=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;G=0}else{g=d|0|0;d=k|e&0;e=nZ(g,d,-1,-1)|0;k=K;i=w;w=v;v=u;u=t;t=s;s=0;while(1){H=w>>>31|i<<1;I=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;n_(e,k,j,a)|0;b=K;h=b>>31|((b|0)<0?-1:0)<<1;J=h&1;L=n_(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=K;b=t-1|0;if((b|0)==0){break}else{i=H;w=I;v=M;u=L;t=b;s=J}}B=H;C=I;D=M;E=L;F=0;G=J}J=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(J|0)>>>31|(B|C)<<1|(C<<1|J>>>31)&0|F;o=(J<<1|0>>>31)&-2|G;return(K=n,o)|0}function ob(){bQ()}function oc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;bZ[a&15](b|0,c|0,d|0,e|0,f|0)}function od(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;b_[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function oe(a,b){a=a|0;b=b|0;b$[a&511](b|0)}function of(a,b,c){a=a|0;b=b|0;c=c|0;b0[a&127](b|0,c|0)}function og(a,b,c){a=a|0;b=b|0;c=c|0;return b1[a&31](b|0,c|0)|0}function oh(a,b){a=a|0;b=b|0;return b2[a&255](b|0)|0}function oi(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;b3[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function oj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return b4[a&63](b|0,c|0,d|0)|0}function ok(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b5[a&15](b|0,c|0,d|0)}function ol(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;b6[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function om(a){a=a|0;b7[a&3]()}function on(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return b8[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function oo(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;b9[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function op(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ca[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function oq(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;cb[a&63](b|0,c|0,d|0,e|0,f|0,g|0)}function or(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return cc[a&15](b|0,c|0,d|0,e|0)|0}function os(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return cd[a&31](b|0,c|0,d|0,e|0,f|0)|0}function ot(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ce[a&15](b|0,c|0,d|0,e|0)}function ou(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(0)}function ov(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ah(1)}function ow(a){a=a|0;ah(2)}function ox(a,b){a=a|0;b=b|0;ah(3)}function oy(a,b){a=a|0;b=b|0;ah(4);return 0}function oz(a){a=a|0;ah(5);return 0}function oA(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ah(6)}function oB(a,b,c){a=a|0;b=b|0;c=c|0;ah(7);return 0}function oC(a,b,c){a=a|0;b=b|0;c=c|0;ah(8)}function oD(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ah(9)}function oE(){ah(10)}function oF(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(11);return 0}function oG(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ah(12)}function oH(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(13)}function oI(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ah(14)}function oJ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(15);return 0}function oK(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(16);return 0}function oL(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(17)}
// EMSCRIPTEN_END_FUNCS
var bZ=[ou,ou,ff,ou,nA,ou,fy,ou,nz,ou,ny,ou,ou,ou,ou,ou];var b_=[ov,ov,jt,ov,jD,ov,jF,ov,k1,ov,jg,ov,je,ov,kX,ov,jp,ov,js,ov,jG,ov,i2,ov,iO,ov,jr,ov,iC,ov,jE,ov,i0,ov,iG,ov,iy,ov,iA,ov,ip,ov,iE,ov,iw,ov,iu,ov,iM,ov,iK,ov,iI,ov,jH,ov,ib,ov,jq,ov,ig,ov,h7,ov,h9,ov,id,ov,h5,ov,im,ov,ik,ov,ii,ov,h3,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov,ov];var b$=[ow,ow,k7,ow,h1,ow,i9,ow,gq,ow,g0,ow,lc,ow,lp,ow,f6,ow,fV,ow,iW,ow,gi,ow,l1,ow,go,ow,is,ow,fb,ow,hT,ow,hP,ow,dz,ow,cL,ow,nP,ow,gj,ow,ln,ow,lD,ow,jB,ow,it,ow,nj,ow,hH,ow,k3,ow,cy,ow,ft,ow,lo,ow,ht,ow,h2,ow,fj,ow,ed,ow,ke,ow,lh,ow,no,ow,mp,ow,hN,ow,go,ow,hZ,ow,jV,ow,ms,ow,lq,ow,nF,ow,kY,ow,mo,ow,hx,ow,fU,ow,hY,ow,jQ,ow,m4,ow,gj,ow,m_,ow,fD,ow,fv,ow,iX,ow,ey,ow,mq,ow,dE,ow,mc,ow,kf,ow,hs,ow,hE,ow,jN,ow,jA,ow,hQ,ow,j3,ow,nO,ow,g$,ow,m1,ow,m2,ow,e8,ow,hI,ow,he,ow,lN,ow,fr,ow,nl,ow,hu,ow,hO,ow,kA,ow,fM,ow,kp,ow,hJ,ow,ll,ow,fq,ow,nr,ow,ex,ow,cx,ow,np,ow,f$,ow,lg,ow,jO,ow,kL,ow,nk,ow,mn,ow,kD,ow,kZ,ow,m3,ow,jU,ow,i8,ow,hS,ow,f0,ow,fs,ow,hU,ow,hz,ow,gy,ow,fO,ow,lV,ow,fu,ow,kS,ow,fp,ow,kK,ow,mr,ow,fo,ow,gQ,ow,fc,ow,cD,ow,nl,ow,ns,ow,cJ,ow,hD,ow,eA,ow,gz,ow,hr,ow,ez,ow,hG,ow,k2,ow,gY,ow,hC,ow,f7,ow,lj,ow,hR,ow,kq,ow,fk,ow,jm,ow,j4,ow,hy,ow,hd,ow,hB,ow,m0,ow,jn,ow,nq,ow,k8,ow,fN,ow,dA,ow,nn,ow,fg,ow,jR,ow,dF,ow,kT,ow,kB,ow,gF,ow,lE,ow,gn,ow,hw,ow,m5,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow];var b0=[ox,ox,mB,ox,fd,ox,cG,ox,kv,ox,fx,ox,j7,ox,my,ox,cw,ox,fw,ox,ko,ox,dH,ox,mx,ox,kd,ox,fP,ox,k6,ox,j$,ox,ky,ox,kl,ox,hf,ox,j_,ox,kt,ox,kw,ox,lk,ox,f1,ox,fe,ox,fW,ox,kz,ox,mA,ox,cH,ox,j8,ox,gm,ox,mC,ox,kn,ox,ka,ox,mz,ox,kc,ox,g1,ox,f8,ox,lb,ox,ki,ox,j2,ox,j1,ox,jZ,ox,kj,ox,kk,ox,jY,ox,ku,ox,j9,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox,ox];var b1=[oy,oy,gb,oy,lz,oy,ho,oy,lJ,oy,lF,oy,fZ,oy,f4,oy,lv,oy,lH,oy,cC,oy,hq,oy,lx,oy,hc,oy,ha,oy,fS,oy];var b2=[oz,oz,mQ,oz,kh,oz,g8,oz,lS,oz,mG,oz,g9,oz,mO,oz,j5,oz,jo,oz,mE,oz,ga,oz,hn,oz,hm,oz,mi,oz,mK,oz,mI,oz,nm,oz,gp,oz,mw,oz,mt,oz,mJ,oz,mu,oz,g5,oz,lR,oz,kx,oz,mL,oz,fQ,oz,j6,oz,l8,oz,kr,oz,mD,oz,fX,oz,mj,oz,nQ,oz,hL,oz,j0,oz,fY,oz,mv,oz,g6,oz,hj,oz,f2,oz,lU,oz,kb,oz,mP,oz,f9,oz,l7,oz,l_,oz,hk,oz,jW,oz,mF,oz,jX,oz,gk,oz,kg,oz,l0,oz,km,oz,mH,oz,ks,oz,lZ,oz,jC,oz,mN,oz,mM,oz,mb,oz,e9,oz,mm,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz,oz];var b3=[oA,oA,k_,oA,kU,oA,oA,oA];var b4=[oB,oB,hX,oB,lG,oB,ly,oB,nt,oB,lB,oB,h0,oB,gt,oB,hb,oB,g7,oB,lr,oB,hg,oB,k9,oB,lL,oB,lw,oB,fR,oB,gu,oB,hl,oB,lI,oB,k4,oB,g2,oB,f3,oB,hp,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB,oB];var b5=[oC,oC,e$,oC,cE,oC,dD,oC,gs,oC,hM,oC,dG,oC,oC,oC];var b6=[oD,oD,jj,oD,jh,oD,i6,oD,i3,oD,oD,oD,oD,oD,oD,oD];var b7=[oE,oE,ob,oE];var b8=[oF,oF,lW,oF,l4,oF,l2,oF,mf,oF,lX,oF,md,oF,lO,oF,lP,oF,oF,oF,oF,oF,oF,oF,oF,oF,oF,oF,oF,oF,oF,oF];var b9=[oG,oG,jI,oG,ju,oG,oG,oG];var ca=[oH,oH,jS,oH,jP,oH,kC,oH,kM,oH,kG,oH,kO,oH,oH,oH];var cb=[oI,oI,nB,oI,jf,oI,jb,oI,ja,oI,nC,oI,jk,oI,k5,oI,hh,oI,eQ,oI,e7,oI,i7,oI,iY,oI,i1,oI,iZ,oI,nD,oI,g3,oI,la,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI,oI];var cc=[oJ,oJ,ls,oJ,lt,oJ,lK,oJ,lA,oJ,lu,oJ,oJ,oJ,oJ,oJ];var cd=[oK,oK,lC,oK,l6,oK,h_,oK,mk,oK,l9,oK,lM,oK,lY,oK,hV,oK,lQ,oK,lT,oK,mh,oK,l$,oK,oK,oK,oK,oK,oK,oK];var ce=[oL,oL,nv,oL,nw,oL,nu,oL,g4,oL,h$,oL,hi,oL,hW,oL];return{_strlen:nV,_free:nF,_main:fJ,_realloc:nH,_memmove:nY,__GLOBAL__I_a:gd,_memset:nW,_malloc:nE,_memcpy:nX,_calloc:nG,runPostSets:cv,stackAlloc:cf,stackSave:cg,stackRestore:ch,setThrew:ci,setTempRet0:cl,setTempRet1:cm,setTempRet2:cn,setTempRet3:co,setTempRet4:cp,setTempRet5:cq,setTempRet6:cr,setTempRet7:cs,setTempRet8:ct,setTempRet9:cu,dynCall_viiiii:oc,dynCall_viiiiiii:od,dynCall_vi:oe,dynCall_vii:of,dynCall_iii:og,dynCall_ii:oh,dynCall_viiiiiid:oi,dynCall_iiii:oj,dynCall_viii:ok,dynCall_viiiiid:ol,dynCall_v:om,dynCall_iiiiiiiii:on,dynCall_viiiiiiiii:oo,dynCall_viiiiiiii:op,dynCall_viiiiii:oq,dynCall_iiiii:or,dynCall_iiiiii:os,dynCall_viiii:ot}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iii": invoke_iii, "invoke_ii": invoke_ii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_iiii": invoke_iiii, "invoke_viii": invoke_viii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iiiii": invoke_iiiii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_llvm_lifetime_end": _llvm_lifetime_end, "__scanString": __scanString, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "_strtoull": _strtoull, "_fflush": _fflush, "__isLeapYear": __isLeapYear, "_llvm_stackrestore": _llvm_stackrestore, "_fwrite": _fwrite, "_send": _send, "_isspace": _isspace, "_read": _read, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "___resumeException": ___resumeException, "_llvm_va_end": _llvm_va_end, "_vsscanf": _vsscanf, "_snprintf": _snprintf, "_fgetc": _fgetc, "__getFloat": __getFloat, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "_strchr": _strchr, "___setErrNo": ___setErrNo, "_isxdigit": _isxdigit, "_exit": _exit, "_sprintf": _sprintf, "___ctype_b_loc": ___ctype_b_loc, "_freelocale": _freelocale, "_catgets": _catgets, "_asprintf": _asprintf, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "___cxa_begin_catch": ___cxa_begin_catch, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_call_unexpected": ___cxa_call_unexpected, "_llvm_stacksave": _llvm_stacksave, "__exit": __exit, "_strftime": _strftime, "___cxa_throw": ___cxa_throw, "_llvm_eh_exception": _llvm_eh_exception, "_printf": _printf, "_pread": _pread, "__arraySum": __arraySum, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_isascii": _isascii, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_strerror": _strerror, "_catclose": _catclose, "_llvm_lifetime_start": _llvm_lifetime_start, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_uselocale": _uselocale, "_vsnprintf": _vsnprintf, "_sscanf": _sscanf, "_sysconf": _sysconf, "_fread": _fread, "_abort": _abort, "_fprintf": _fprintf, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "__reallyNegative": __reallyNegative, "_write": _write, "___cxa_allocate_exception": ___cxa_allocate_exception, "___cxa_pure_virtual": ___cxa_pure_virtual, "_vasprintf": _vasprintf, "_catopen": _catopen, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "_stdout": _stdout, "___fsmu8": ___fsmu8, "___dso_handle": ___dso_handle }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
