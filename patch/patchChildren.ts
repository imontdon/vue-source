const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized = false) => {
  // 获取老结点的children
  const c1 = n1 && n1.children;
  const prevShapeFlag = n1 ? n1.shapeFlag : 0;
  // 新结点的children
  const c2 = n2.children;
  const { patchFlag, shapeFlag } = n2;
  // fast path
  if (patchFlag > 0) {
      if (patchFlag & 128 /* KEYED_FRAGMENT */) {
          // this could be either fully-keyed or mixed (some keyed some not)
          // presence of patchFlag means children are guaranteed to be arrays
          // diff
          patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          return;
      }
      else if (patchFlag & 256 /* UNKEYED_FRAGMENT */) {
          // unkeyed
          patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          return;
      }
  }
  // children has 3 possibilities: text, array or no children.
  if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      // text children fast path
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
          hostSetElementText(container, c2);
      }
  }
  else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          // prev children was array
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
              // two arrays, cannot assume anything, do full diff
              // diff
              patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          }
          else {
              // no new children, just unmount old
              unmountChildren(c1, parentComponent, parentSuspense, true);
          }
      }
      else {
          // prev children was text OR null
          // new children is array OR null
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
              hostSetElementText(container, '');
          }
          // mount new if array
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
              mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
          }
      }
  }
};