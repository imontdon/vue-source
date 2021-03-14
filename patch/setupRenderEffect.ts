const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
  // create reactive effect for rendering
  // 这里的lazy为undefined所以会立即执行componentEffect函数
  instance.update = effect(function componentEffect() {
    // 挂载逻辑
      if (!instance.isMounted) {
          let vnodeHook;
          const { el, props } = initialVNode;
          // 钩子函数
          const { bm, m, parent } = instance;
          // beforeMount hook
          if (bm) {
              invokeArrayFns(bm);
          }
          // onVnodeBeforeMount
          if ((vnodeHook = props && props.onVnodeBeforeMount)) {
              invokeVNodeHook(vnodeHook, parent, initialVNode);
          }
          // render
          if ((process.env.NODE_ENV !== 'production')) {
              startMeasure(instance, `render`);
          }
          const subTree = (instance.subTree = renderComponentRoot(instance));
          if ((process.env.NODE_ENV !== 'production')) {
              endMeasure(instance, `render`);
          }
          if (el && hydrateNode) {
              if ((process.env.NODE_ENV !== 'production')) {
                  startMeasure(instance, `hydrate`);
              }
              // vnode has adopted host node - perform hydration instead of mount.
              hydrateNode(initialVNode.el, subTree, instance, parentSuspense);
              if ((process.env.NODE_ENV !== 'production')) {
                  endMeasure(instance, `hydrate`);
              }
          }
          else {
              if ((process.env.NODE_ENV !== 'production')) {
                  startMeasure(instance, `patch`);
              }
              patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
              if ((process.env.NODE_ENV !== 'production')) {
                  endMeasure(instance, `patch`);
              }
              initialVNode.el = subTree.el;
          }
          // mounted hook
          if (m) {
              queuePostRenderEffect(m, parentSuspense);
          }
          // onVnodeMounted
          if ((vnodeHook = props && props.onVnodeMounted)) {
              const scopedInitialVNode = initialVNode;
              queuePostRenderEffect(() => {
                  invokeVNodeHook(vnodeHook, parent, scopedInitialVNode);
              }, parentSuspense);
          }
          // activated hook for keep-alive roots.
          // #1742 activated hook must be accessed after first render
          // since the hook may be injected by a child keep-alive
          const { a } = instance;
          if (a &&
              initialVNode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
              queuePostRenderEffect(a, parentSuspense);
          }
          instance.isMounted = true;
          // #2458: deference mount-only object parameters to prevent memleaks
          initialVNode = container = anchor = null;
      }
      else {
          // updateComponent
          // This is triggered by mutation of component's own state (next: null)
          // OR parent calling processComponent (next: VNode)
          // next: n2 | vnode
          let { next, bu, u, parent, vnode } = instance;
          let originNext = next;
          let vnodeHook;
          if ((process.env.NODE_ENV !== 'production')) {
              pushWarningContext(next || instance.vnode);
          }
          if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance, next, optimized);
          }
          else {
              next = vnode;
          }
          // beforeUpdate hook
          if (bu) {
              invokeArrayFns(bu);
          }
          // onVnodeBeforeUpdate
          if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
              invokeVNodeHook(vnodeHook, parent, next, vnode);
          }
          // render
          if ((process.env.NODE_ENV !== 'production')) {
              startMeasure(instance, `render`);
          }
          const nextTree = renderComponentRoot(instance);
          if ((process.env.NODE_ENV !== 'production')) {
              endMeasure(instance, `render`);
          }
          const prevTree = instance.subTree;
          instance.subTree = nextTree;
          if ((process.env.NODE_ENV !== 'production')) {
              startMeasure(instance, `patch`);
          }
          patch(prevTree, nextTree, 
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el), 
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree), instance, parentSuspense, isSVG);
          if ((process.env.NODE_ENV !== 'production')) {
              endMeasure(instance, `patch`);
          }
          next.el = nextTree.el;
          if (originNext === null) {
              // self-triggered update. In case of HOC, update parent component
              // vnode el. HOC is indicated by parent instance's subTree pointing
              // to child component's vnode
              updateHOCHostEl(instance, nextTree.el);
          }
          // updated hook
          if (u) {
              queuePostRenderEffect(u, parentSuspense);
          }
          // onVnodeUpdated
          if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
              queuePostRenderEffect(() => {
                  invokeVNodeHook(vnodeHook, parent, next, vnode);
              }, parentSuspense);
          }
          if ((process.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) {
              devtoolsComponentUpdated(instance);
          }
          if ((process.env.NODE_ENV !== 'production')) {
              popWarningContext();
          }
      }
  }, (process.env.NODE_ENV !== 'production') ? createDevEffectOptions(instance) : prodEffectOptions);
};