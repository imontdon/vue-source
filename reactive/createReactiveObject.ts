function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
  // 不是对象类型 - 提示错误
  if (!isObject(target)) {
      if ((process.env.NODE_ENV !== 'production')) {
          console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object


  // raw && !(readonly && reactive)
  if (target["__v_raw" /* RAW */] &&
      !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
      return target;
  }
  // target already has corresponding Proxy
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;
  // 已有则返回
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
      return existingProxy;
  }

  // v_skip || 不可扩展0, 其他targetTypeMap
  // v_skip => dynamicChildren
  // only a whitelist of value types can be observed.
  const targetType = getTargetType(target);
  if (targetType === 0 /* INVALID */) {
      return target;
  }
  const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
  // 设置target
  proxyMap.set(target, proxy);
  return proxy;
}