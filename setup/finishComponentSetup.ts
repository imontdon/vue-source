function finishComponentSetup(instance, isSSR) {
  // 获取组件
  const Component = instance.type;
  // template / render function normalization
  // 判断是否有render, 在setupResult为函数的时候会将instance.render = setupResult
  // 没有的话则进入
  if (!instance.render) {
      // could be set from setup()
      if (compile && Component.template && !Component.render) {
          if ((process.env.NODE_ENV !== 'production')) {
              startMeasure(instance, `compile`);
          }
          Component.render = compile(Component.template, {
              isCustomElement: instance.appContext.config.isCustomElement,
              delimiters: Component.delimiters
          });
          if ((process.env.NODE_ENV !== 'production')) {
              endMeasure(instance, `compile`);
          }
      }
      // 赋值实例的render
      instance.render = (Component.render || NOOP);
      // for runtime-compiled render functions using `with` blocks, the render
      // proxy used needs a different `has` handler which is more performant and
      // also only allows a whitelist of globals to fallthrough.
      if (instance.render._rc) {
          instance.withProxy = new Proxy(instance.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
      }
  }
  // 兼容vue2.x
  // support for 2.x options
  if (__VUE_OPTIONS_API__) {
      currentInstance = instance;
      pauseTracking();
      applyOptions(instance, Component);
      resetTracking();
      currentInstance = null;
  }
  // warn missing template/render
  if ((process.env.NODE_ENV !== 'production') && !Component.render && instance.render === NOOP) {
      /* istanbul ignore if */
      if (!compile && Component.template) {
          warn(`Component provided template option but ` +
              `runtime compilation is not supported in this build of Vue.` +
              ( ` Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`
                  ) /* should not happen */);
      }
      else {
          warn(`Component is missing template or render function.`);
      }
  }
}