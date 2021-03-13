/**
 * 
 * @param instance 
 * @param isSSR 
 */
function setupComponent(instance, isSSR = false) {
  isInSSRComponentSetup = isSSR;
  // 父组件传值的props不是子组件内的props定义
  const { props, children, shapeFlag } = instance.vnode;
  const isStateful = shapeFlag & 4 /* STATEFUL_COMPONENT */;
  // 设置props
  initProps(instance, props, isStateful, isSSR);
  // 设置slots
  initSlots(instance, children);
  const setupResult = isStateful
      ? setupStatefulComponent(instance, isSSR)
      : undefined;
  isInSSRComponentSetup = false;
  return setupResult;
}