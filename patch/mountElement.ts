const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
  let el;
  let vnodeHook;
  const { type, props, shapeFlag, transition, scopeId, patchFlag, dirs } = vnode;
  if (!(process.env.NODE_ENV !== 'production') &&
      vnode.el &&
      hostCloneNode !== undefined &&
      patchFlag === -1 /* HOISTED */) {
      // If a vnode has non-null el, it means it's being reused.
      // Only static vnodes can be reused, so its mounted DOM nodes should be
      // exactly the same, and we can simply do a clone here.
      // only do this in production since cloned trees cannot be HMR updated.
      el = vnode.el = hostCloneNode(vnode.el);
  }
  else {
    // 创建一个vnode.type的元素
      el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is);
      // mount children first, since some props may rely on child content
      // being already rendered, e.g. `<select value>`
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, vnode.children);
      }
      else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        // 挂载child在刚才创建的el上
          mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== 'foreignObject', optimized || !!vnode.dynamicChildren);
      }
      // directive created生命周期
      if (dirs) {
          invokeDirectiveHook(vnode, null, parentComponent, 'created');
      }
      // props
      if (props) {
        // element的属性
          for (const key in props) {
              if (!isReservedProp(key)) {
                  hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
              }
          }
          if ((vnodeHook = props.onVnodeBeforeMount)) {
              invokeVNodeHook(vnodeHook, parentComponent, vnode);
          }
      }
      // scopeId
      setScopeId(el, scopeId, vnode, parentComponent);
  }
  if ((process.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) {
      Object.defineProperty(el, '__vnode', {
          value: vnode,
          enumerable: false
      });
      Object.defineProperty(el, '__vueParentComponent', {
          value: parentComponent,
          enumerable: false
      });
  }
  if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
  }
  // #1583 For inside suspense + suspense not resolved case, enter hook should call when suspense resolved
  // #1689 For inside suspense + suspense resolved case, just call it
  const needCallTransitionHooks = (!parentSuspense || (parentSuspense && !parentSuspense.pendingBranch)) &&
      transition &&
      !transition.persisted;
  if (needCallTransitionHooks) {
      transition.beforeEnter(el);
  }
  // 插入结点 - dom有了
  hostInsert(el, container, anchor);
  if ((vnodeHook = props && props.onVnodeMounted) ||
      needCallTransitionHooks ||
      dirs) {
      queuePostRenderEffect(() => {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
          needCallTransitionHooks && transition.enter(el);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
      }, parentSuspense);
  }
};