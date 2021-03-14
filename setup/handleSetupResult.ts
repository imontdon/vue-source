/**
 * @description - 处理setup结果
 * @param instance 
 * @param setupResult 
 * @param isSSR 
 */
function handleSetupResult(instance, setupResult, isSSR) {

  if (isFunction(setupResult)) {
      // setup returned an inline render function
      {
          instance.render = setupResult; // setup返回一个函数则设为render函数
      }
  }
  else if (isObject(setupResult)) {
      if ((process.env.NODE_ENV !== 'production') && isVNode(setupResult)) {
          warn(`setup() should not return VNodes directly - ` +
              `return a render function instead.`);
      }
      // setup returned bindings.
      // assuming a render function compiled from template is present.
      if ((process.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) {
          instance.devtoolsRawSetupState = setupResult; // 赋值
      }
      instance.setupState = proxyRefs(setupResult); // 设为reactive
      if ((process.env.NODE_ENV !== 'production')) {
          exposeSetupStateOnRenderContext(instance); // 相当于getter/setter(setupState)
      }
  }
  else if ((process.env.NODE_ENV !== 'production') && setupResult !== undefined) {
      warn(`setup() should return an object. Received: ${setupResult === null ? 'null' : typeof setupResult}`);
  }
  finishComponentSetup(instance);
}