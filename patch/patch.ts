/**
 * 
 * @param n1 - 老结点
 * @param n2 - 新结点 - 老结点不存在则mount
 * @param container - document.querySelector(container)
 * @param anchor - 锚点 - 参照物
 * @param parentComponent 
 * @param parentSuspense 
 * @param isSVG 
 * @param optimized 
 */
const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, optimized = false) => {
  // patching & not same type, unmount old tree
  if (n1 && !isSameVNodeType(n1, n2)) { // 存在老结点, vnodetype不同则unmount老结点
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
  }
  if (n2.patchFlag === -2 /* BAIL */) {
      optimized = false;
      n2.dynamicChildren = null;
  }
  const { type, ref, shapeFlag } = n2;
  switch (type) {
      case Text:
          processText(n1, n2, container, anchor);
          break;
      case Comment:
          processCommentNode(n1, n2, container, anchor);
          break;
      case Static:
          if (n1 == null) {
              mountStaticNode(n2, container, anchor, isSVG);
          }
          else if ((process.env.NODE_ENV !== 'production')) {
              patchStaticNode(n1, n2, container, isSVG);
          }
          break;
      case Fragment:
          processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          break;
      default:
          if (shapeFlag & 1 /* ELEMENT */) {
              processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          }
          else if (shapeFlag & 6 /* COMPONENT */) {
              processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          }
          else if (shapeFlag & 64 /* TELEPORT */) {
              type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals);
          }
          else if ( shapeFlag & 128 /* SUSPENSE */) {
              type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals);
          }
          else if ((process.env.NODE_ENV !== 'production')) {
              warn('Invalid VNode type:', type, `(${typeof type})`);
          }
  }
  // set ref
  if (ref != null && parentComponent) {
      setRef(ref, n1 && n1.ref, parentSuspense, n2);
  }
};