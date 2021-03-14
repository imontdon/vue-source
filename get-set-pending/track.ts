let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
}
function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
}
function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === undefined ? true : last;
}


function track(target, type, key) {
  // 不应该被追踪 || 没有活跃的active
  if (!shouldTrack || activeEffect === undefined) {
      return;
  }
  // targetMap: WeakMap<target as Record<string, unknow>, Map<key as string, Set<Dep>>>
  // 获取target的depsMap
  let depsMap = targetMap.get(target);
  // 不存在则设置
  if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
      depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) { // dep没有effect函数的话, 则
      dep.add(activeEffect); // depSet.add(dep)
      activeEffect.deps.push(dep); // activeEffect.deps.push(dep)
      if ((process.env.NODE_ENV !== 'production') && activeEffect.options.onTrack) {
          activeEffect.options.onTrack({
              effect: activeEffect,
              target,
              type,
              key
          });
      }
  }
}