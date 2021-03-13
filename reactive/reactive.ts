function reactive(target) {
  // if trying to observe a readonly proxy, return the readonly version.
  // 有来直接返回
  if (target && target["__v_isReadonly" /* IS_READONLY */]) {
      return target;
  }
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
}