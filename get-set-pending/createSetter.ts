function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
      const oldValue = target[key];
      if (!shallow) {
          value = toRaw(value);
          if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
              oldValue.value = value;
              return true;
          }
      }
      const hadKey = isArray(target) && isIntegerKey(key)
          ? Number(key) < target.length
          : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      // don't trigger if target is something up in the prototype chain of original
      if (target === toRaw(receiver)) {
          if (!hadKey) {
              trigger(target, "add" /* ADD */, key, value);
          }
          else if (hasChanged(value, oldValue)) {
              trigger(target, "set" /* SET */, key, value, oldValue);
          }
      }
      return result;
  };
}