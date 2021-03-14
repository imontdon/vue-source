/**
 * @description - 生命周期函数会执行这个方法 e.g: injectHook('bm', () => {})
 * @param type 
 * @param hook 
 * @param target 
 * @param prepend 
 */
function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
      const hooks = target[type] || (target[type] = []);
      // cache the error handling wrapper for injected hooks so the same hook
      // can be properly deduped by the scheduler. "__weh" stands for "with error
      // handling".
      const wrappedHook = hook.__weh ||
          (hook.__weh = (...args) => {
              if (target.isUnmounted) {
                  return;
              }
              // disable tracking inside all lifecycle hooks
              // since they can potentially be called inside effects.
              pauseTracking();
              // Set currentInstance during hook invocation.
              // This assumes the hook does not synchronously trigger other hooks, which
              // can only be false when the user does something really funky.
              setCurrentInstance(target);
              const res = callWithAsyncErrorHandling(hook, target, type, args);
              setCurrentInstance(null);
              resetTracking();
              return res;
          });
      if (prepend) {
          hooks.unshift(wrappedHook);
      }
      else { // hooks.push（warppedHook） // 先存储hook函数
          hooks.push(wrappedHook);
      }
      return wrappedHook;
  }
  else if ((process.env.NODE_ENV !== 'production')) {
      const apiName = toHandlerKey(ErrorTypeStrings[type].replace(/ hook$/, ''));
      warn(`${apiName} is called when there is no active component instance to be ` +
          `associated with. ` +
          `Lifecycle injection APIs can only be used during execution of setup().` +
          ( ` If you are using async setup(), make sure to register lifecycle ` +
                  `hooks before the first await statement.`
              ));
  }
}