const effectStack = [];

function createReactiveEffect(fn, options) {

  // 返回这个effect函数
  const effect = function reactiveEffect() {
      if (!effect.active) {
          return options.scheduler ? undefined : fn();
      }
      if (!effectStack.includes(effect)) {
        // 清空effect.deps
          cleanup(effect);
          try {
            // 开始追踪
            // shouldTrack = true, getter时有数据
              enableTracking();
              effectStack.push(effect);
              // 提前设置activeEffect, getter的时候有数据
              activeEffect = effect;
              return fn();
          }
          finally {
              effectStack.pop();
              resetTracking();
              activeEffect = effectStack[effectStack.length - 1];
          }
      }
  };
  effect.id = uid++;
  effect.allowRecurse = !!options.allowRecurse;
  effect._isEffect = true;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}