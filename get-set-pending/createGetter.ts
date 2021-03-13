function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
          return !isReadonly;
      }
      else if (key === "__v_isReadonly" /* IS_READONLY */) {
          return isReadonly;
      }
      else if (key === "__v_raw" /* RAW */ &&
          receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)) {
          return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
          return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key)
          ? builtInSymbols.has(key)
          : key === `__proto__` || key === `__v_isRef`) {
          return res;
      }
      if (!isReadonly) {
          track(target, "get" /* GET */, key);
      }
      if (shallow) {
          return res;
      }
      if (isRef(res)) {
          // ref unwrapping - does not apply for Array + integer key.
          const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
          return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
          // Convert returned value into a proxy as well. we do the isObject check
          // here to avoid invalid value warning. Also need to lazy access readonly
          // and reactive here to avoid circular dependency.
          return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
  };
}