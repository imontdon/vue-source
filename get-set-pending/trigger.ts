/**
 * @description - 派发
 * @param target 
 * @param type 
 * @param key 
 * @param newValue 
 * @param oldValue 
 * @param oldTarget 
 */
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  // map里没有则没有被track过, 需要在get里先触发track
  const depsMap = targetMap.get(target);
  if (!depsMap) {
      // never been tracked
      return;
  }
  const effects = new Set();
  const add = (effectsToAdd) => {
      if (effectsToAdd) {
          effectsToAdd.forEach(effect => {
              if (effect !== activeEffect || effect.allowRecurse) {
                  effects.add(effect);
              }
          });
      }
  };
  if (type === "clear" /* CLEAR */) { // pending
      // collection being cleared
      // trigger all effects for target
      depsMap.forEach(add);
  }
  else if (key === 'length' && isArray(target)) { // pending
      depsMap.forEach((dep, key) => {
          if (key === 'length' || key >= newValue) {
              add(dep);
          }
      });
  }
  else {
      // schedule runs for SET | ADD | DELETE
      if (key !== void 0) { // 有key
          add(depsMap.get(key));
      }
      // also run for iteration key on ADD | DELETE | Map.SET
      switch (type) {
          case "add" /* ADD */:
              if (!isArray(target)) {
                  add(depsMap.get(ITERATE_KEY));
                  if (isMap(target)) {
                      add(depsMap.get(MAP_KEY_ITERATE_KEY));
                  }
              }
              else if (isIntegerKey(key)) {
                  // new index added to array -> length changes
                  add(depsMap.get('length'));
              }
              break;
          case "delete" /* DELETE */:
              if (!isArray(target)) {
                  add(depsMap.get(ITERATE_KEY));
                  if (isMap(target)) {
                      add(depsMap.get(MAP_KEY_ITERATE_KEY));
                  }
              }
              break;
          case "set" /* SET */:
              if (isMap(target)) {
                  add(depsMap.get(ITERATE_KEY));
              }
              break;
      }
  }
  const run = (effect) => {
      if ((process.env.NODE_ENV !== 'production') && effect.options.onTrigger) {
          effect.options.onTrigger({
              effect,
              target,
              key,
              type,
              newValue,
              oldValue,
              oldTarget
          });
      }
      if (effect.options.scheduler) {
          effect.options.scheduler(effect);
      }
      else {
          effect();
      }
  };
  effects.forEach(run);
}