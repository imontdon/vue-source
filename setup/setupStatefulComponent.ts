function setupStatefulComponent(instance, isSSR) {
  // 获取组件
  const Component = instance.type;
  if ((process.env.NODE_ENV !== 'production')) { // 验证各种名字是否规范
      if (Component.name) {
          validateComponentName(Component.name, instance.appContext.config);
      }
      if (Component.components) {
          const names = Object.keys(Component.components);
          for (let i = 0; i < names.length; i++) {
              validateComponentName(names[i], instance.appContext.config);
          }
      }
      if (Component.directives) {
          const names = Object.keys(Component.directives);
          for (let i = 0; i < names.length; i++) {
              validateDirectiveName(names[i]);
          }
      }
  }
  // 0. create render proxy property access cache
  instance.accessCache = Object.create(null);
  // 1. create public instance / render proxy
  // also mark it raw so it's never observed
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  if ((process.env.NODE_ENV !== 'production')) {
      exposePropsOnRenderContext(instance); // instance.ctx[props.key] = props[key]
  }
  // 2. call setup()
  // 获取组件内setup函数
  const { setup } = Component;
  if (setup) {
      // 获取setupContext: Object.freeze
      const setupContext = (instance.setupContext =
          setup.length > 1 ? createSetupContext(instance) : null);
      // 设置当前实例
      currentInstance = instance;
      // 暂停追踪
      pauseTracking();
      // 执行setup(props, setupContext)
      const setupResult = callWithErrorHandling(setup, instance, 0 /* SETUP_FUNCTION */, [(process.env.NODE_ENV !== 'production') ? shallowReadonly(instance.props) : instance.props, setupContext]);
      resetTracking();
      currentInstance = null;


      if (isPromise(setupResult)) {
          if (isSSR) {
              // return the promise so server-renderer can wait on it
              return setupResult.then((resolvedResult) => {
                  handleSetupResult(instance, resolvedResult);
              });
          }
          else {
              // async setup returned Promise.
              // bail here and wait for re-entry.
              instance.asyncDep = setupResult; // 缓存赋值
          }
      }
      else {
          handleSetupResult(instance, setupResult);
      }
  }
  else {
      finishComponentSetup(instance);
  }
}