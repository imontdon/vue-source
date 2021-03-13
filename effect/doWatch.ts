// watchEffect(getter, options)
// watch(Function, (newVal, oldVal) => {}, options)
// watch(ref | reactive, (newVal, oldVal) => {}, options)
// watch([Ref | Reactive, Function], ([RefNewVal, FunctionNewVal], [refOldVal, FunctionOldVal]) => {}, options)
function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ, instance = currentInstance) {
  // 是个watchEffect
  if ((process.env.NODE_ENV !== 'production') && !cb) {
    // 传了immediate, deep则希望它是watch => 行为不一致
      if (immediate !== undefined) {
          warn(`watch() "immediate" option is only respected when using the ` +
              `watch(source, callback, options?) signature.`);
      }
      if (deep !== undefined) {
          warn(`watch() "deep" option is only respected when using the ` +
              `watch(source, callback, options?) signature.`);
      }
  }
  // 设置source格式提示
  const warnInvalidSource = (s) => {
      warn(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, ` +
          `a reactive object, or an array of these types.`);
  };
  let getter;
  let forceTrigger = false;
  // source可以直接是一个ref
  if (isRef(source)) {
      getter = () => source.value;
      forceTrigger = !!source._shallow;
  }
  else if (isReactive(source)) { // 也可以是一个reactive, reactive则deep默认为true, 创建reactive时必须是对象的缘故
      getter = () => source;
      deep = true;
  }
  else if (isArray(source)) { // source是数组的话则getter需要遍历数组里的数
      getter = () => source.map(s => { // [Function, reactive, ref]
          if (isRef(s)) {
              return s.value;
          }
          else if (isReactive(s)) {
              return traverse(s);
          }
          else if (isFunction(s)) { // 执行s()
              return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */);
          }
          else { // source类型格式提示
              (process.env.NODE_ENV !== 'production') && warnInvalidSource(s);
          }
      });
  }
  else if (isFunction(source)) { // 是函数的话, 则可以是普通的值
    // 有cb则是一个watch
      if (cb) { // getter = () => source()
          // getter with cb
          getter = () => callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */);
      }
      else { // 没有cb => watchEffect
          // no cb -> simple effect
          getter = () => {
              if (instance && instance.isUnmounted) {
                  return;
              }
              if (cleanup) { // cleanup有值的话则调用cleanup, 执行自定义fn
                  cleanup();
              }
              // source(onInvalidate)
              return callWithErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [onInvalidate]);
          };
      }
  }
  else { // 其他情况，提示
      getter = NOOP;
      (process.env.NODE_ENV !== 'production') && warnInvalidSource(source);
  }
  if (cb && deep) { // is a watch && deep
      const baseGetter = getter;
      getter = () => traverse(baseGetter());
  }
  let cleanup;
  // 设置onInvalidate函数, source为函数会用到, 入参为自定义fn
  const onInvalidate = (fn) => {
      cleanup = runner.options.onStop = () => {
          callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */);
      };
  };
  // 设置oldValue
  let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE;
  // job - 微任务? - 代码形式来看不是 - pending
  const job = () => {
      if (!runner.active) {
          return;
      }
      if (cb) {
          // watch(source, cb)
          const newValue = runner();
          if (deep || forceTrigger || hasChanged(newValue, oldValue)) {
              // cleanup before running cb again
              if (cleanup) {
                  cleanup();
              }
              callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                  newValue,
                  // pass undefined as the old value when it's changed for the first time
                  oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                  onInvalidate
              ]);
              oldValue = newValue;
          }
      }
      else {
          // watchEffect
          runner();
      }
  };
  // important: mark the job as a watcher callback so that scheduler knows
  // it is allowed to self-trigger (#1727)
  job.allowRecurse = !!cb;
  let scheduler; // 调度器 - pending
  if (flush === 'sync') { // 同步 - 低效的
      scheduler = job;
  }
  else if (flush === 'post') {
      scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
  }
  else {
      // default: 'pre'
      scheduler = () => {
          if (!instance || instance.isMounted) {
              queuePreFlushCb(job);
          }
          else {
              // with 'pre' option, the first call must happen before
              // the component is mounted so it is called synchronously.
              job();
          }
      };
  }
  // runner => getter() => 获取source值
  const runner = effect(getter, {
      lazy: true,
      onTrack,
      onTrigger,
      scheduler
  });
  
  // instance.effects.push(runner)
  recordInstanceBoundEffect(runner, instance);
  // initial run

  // 是watch的话
  if (cb) {
    // 如果立即执行则直接执行job
      if (immediate) {
          job();
      }
      else { // 否则 oldValue = source的值  - 准确来讲是执行getter函数的值需要看上面getter函数赋值
          oldValue = runner();
      }
  }
  else if (flush === 'post') { // 默认是 pre - pending 
      queuePostRenderEffect(runner, instance && instance.suspense);
  }
  else { // 直接获取souce的的值 - 准确来讲是执行getter函数的值需要看上面getter函数赋值
      runner();
  }
  return () => { // 返回一个'stop'函数去调用stop方法
      stop(runner);
      if (instance) { // 从effects中删除当前runner
          remove(instance.effects, runner);
      }
  };
}