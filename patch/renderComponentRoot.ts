function renderComponentRoot(instance) {
  const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, data, setupState, ctx } = instance;
  let result;
  currentRenderingInstance = instance;
  if ((process.env.NODE_ENV !== 'production')) {
      accessedAttrs = false;
  }
  try {
      let fallthroughAttrs;
      if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
          // withProxy is a proxy with a different `has` trap only for
          // runtime-compiled render functions using `with` block.
          // 数据相当于vue2的this
          const proxyToUse = withProxy || proxy;
          // 先去把结点进行render得到vnode再去normalize化
          result = normalizeVNode(render.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
          fallthroughAttrs = attrs;
      }
      else {
          // functional
          const render = Component;
          // in dev, mark attrs accessed if optional props (attrs === props)
          if ((process.env.NODE_ENV !== 'production') && attrs === props) {
              markAttrsAccessed();
          }
          result = normalizeVNode(render.length > 1
              ? render(props, (process.env.NODE_ENV !== 'production')
                  ? {
                      get attrs() {
                          markAttrsAccessed();
                          return attrs;
                      },
                      slots,
                      emit
                  }
                  : { attrs, slots, emit })
              : render(props, null /* we know it doesn't need it */));
          fallthroughAttrs = Component.props
              ? attrs
              : getFunctionalFallthrough(attrs);
      }
      // attr merging
      // in dev mode, comments are preserved, and it's possible for a template
      // to have comments along side the root element which makes it a fragment
      let root = result;
      let setRoot = undefined;
      if ((process.env.NODE_ENV !== 'production') && result.patchFlag & 2048 /* DEV_ROOT_FRAGMENT */) {
          ;
          [root, setRoot] = getChildRoot(result);
      }
      if (Component.inheritAttrs !== false && fallthroughAttrs) {
          const keys = Object.keys(fallthroughAttrs);
          const { shapeFlag } = root;
          if (keys.length) {
              if (shapeFlag & 1 /* ELEMENT */ ||
                  shapeFlag & 6 /* COMPONENT */) {
                  if (propsOptions && keys.some(isModelListener)) {
                      // If a v-model listener (onUpdate:xxx) has a corresponding declared
                      // prop, it indicates this component expects to handle v-model and
                      // it should not fallthrough.
                      // related: #1543, #1643, #1989
                      fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
                  }
                  root = cloneVNode(root, fallthroughAttrs);
              }
              else if ((process.env.NODE_ENV !== 'production') && !accessedAttrs && root.type !== Comment) {
                  const allAttrs = Object.keys(attrs);
                  const eventAttrs = [];
                  const extraAttrs = [];
                  for (let i = 0, l = allAttrs.length; i < l; i++) {
                      const key = allAttrs[i];
                      // 是不是onXXX props， 是的话eventAttrs.push('xxx') - 去掉on
                      if (isOn(key)) {
                          // ignore v-model handlers when they fail to fallthrough
                          if (!isModelListener(key)) {
                              // remove `on`, lowercase first letter to reflect event casing
                              // accurately
                              eventAttrs.push(key[2].toLowerCase() + key.slice(3));
                          }
                      }
                      else {
                          extraAttrs.push(key);
                      }
                  }
                  if (extraAttrs.length) {
                      warn(`Extraneous non-props attributes (` +
                          `${extraAttrs.join(', ')}) ` +
                          `were passed to component but could not be automatically inherited ` +
                          `because component renders fragment or text root nodes.`);
                  }
                  if (eventAttrs.length) {
                      warn(`Extraneous non-emits event listeners (` +
                          `${eventAttrs.join(', ')}) ` +
                          `were passed to component but could not be automatically inherited ` +
                          `because component renders fragment or text root nodes. ` +
                          `If the listener is intended to be a component custom event listener only, ` +
                          `declare it using the "emits" option.`);
                  }
              }
          }
      }
      // inherit directives
      // 整合vnode dirs和root dirs
      if (vnode.dirs) {
          if ((process.env.NODE_ENV !== 'production') && !isElementRoot(root)) {
              warn(`Runtime directive used on component with non-element root node. ` +
                  `The directives will not function as intended.`);
          }
          root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
      }
      // inherit transition data
      if (vnode.transition) {
          if ((process.env.NODE_ENV !== 'production') && !isElementRoot(root)) {
              warn(`Component inside <Transition> renders non-element root node ` +
                  `that cannot be animated.`);
          }
          root.transition = vnode.transition;
      }
      if ((process.env.NODE_ENV !== 'production') && setRoot) { // pending
          setRoot(root);
      }
      else {
          result = root; // 直接返回root
      }
  }
  catch (err) {
      handleError(err, instance, 1 /* RENDER_FUNCTION */);
      result = createVNode(Comment);
  }
  currentRenderingInstance = null;
  return result;
}