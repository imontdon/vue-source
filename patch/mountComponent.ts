const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
  const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense));
  if ((process.env.NODE_ENV !== 'production') && instance.type.__hmrId) {
      registerHMR(instance);
  }
  if ((process.env.NODE_ENV !== 'production')) {
      pushWarningContext(initialVNode);
      startMeasure(instance, `mount`);
  }
  // inject renderer internals for keepAlive
  if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals;
  }
  // resolve props and slots for setup context
  if ((process.env.NODE_ENV !== 'production')) {
      startMeasure(instance, `init`);
  }
  // 处理setup函数
  setupComponent(instance);
  if ((process.env.NODE_ENV !== 'production')) {
      endMeasure(instance, `init`);
  }
  // setup() is async. This component relies on async logic to be resolved
  // before proceeding
   // setup处理的时候如果setup返回的是一个Promise. 详: setupStatefulComponent
   // pending 
  if ( instance.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
      // Give it a placeholder if this is not hydration
      // TODO handle self-defined fallback
      if (!initialVNode.el) {
          const placeholder = (instance.subTree = createVNode(Comment));
          processCommentNode(null, placeholder, container, anchor);
      }
      return;
  }
  // 组件update或mount函数处理,
  // 这里说明数据已经有了, dom还没挂载上
  setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
  if ((process.env.NODE_ENV !== 'production')) {
      popWarningContext();
      endMeasure(instance, `mount`);
  }
};