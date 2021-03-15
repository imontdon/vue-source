const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
  // 创建两个空文本结点
  const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
  const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
  let { patchFlag, dynamicChildren } = n2;
  if (patchFlag > 0) {
      optimized = true; // 设为true后挂载子结点方法选择不同
  }
  if ((process.env.NODE_ENV !== 'production') && isHmrUpdating) {
      // HMR updated, force full diff
      patchFlag = 0;
      optimized = false;
      dynamicChildren = null;
  }
  if (n1 == null) {
    // container.insertBefore(fragmentStartAnchor, anchor)
    hostInsert(fragmentStartAnchor, container, anchor);
    // container.insertBefore(fragmentEndAnchor, anchor)
      hostInsert(fragmentEndAnchor, container, anchor);
      // a fragment can only have array children
      // since they are either generated by the compiler, or implicitly created
      // from arrays.
      // 挂载子结点, 锚点: fragmentEndAnchor
      mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, optimized);
  }
  else {
      if (patchFlag > 0 &&
          patchFlag & 64 /* STABLE_FRAGMENT */ &&
          dynamicChildren &&
          // #2715 the previous fragment could've been a BAILed one as a result
          // of renderSlot() with no valid children
          n1.dynamicChildren) {
          // a stable fragment (template root or <template v-for>) doesn't need to
          // patch children order, but it may contain dynamicChildren.
          patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG);
          if ((process.env.NODE_ENV !== 'production') && parentComponent && parentComponent.type.__hmrId) {
              traverseStaticChildren(n1, n2);
          }
          else if (
          // #2080 if the stable fragment has a key, it's a <template v-for> that may
          //  get moved around. Make sure all root level vnodes inherit el.
          // #2134 or if it's a component root, it may also get moved around
          // as the component is being moved.
          n2.key != null ||
              (parentComponent && n2 === parentComponent.subTree)) {
              traverseStaticChildren(n1, n2, true /* shallow */);
          }
      }
      else {
          // keyed / unkeyed, or manual fragments.
          // for keyed & unkeyed, since they are compiler generated from v-for,
          // each child is guaranteed to be a block so the fragment will never
          // have dynamicChildren.
          patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, optimized);
      }
  }
}