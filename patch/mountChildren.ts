const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, optimized, start = 0) => {
  for (let i = start; i < children.length; i++) {
    // 获取children[i]的结点
      const child = (children[i] = optimized
          ? cloneIfMounted(children[i])
          : normalizeVNode(children[i]));
      patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
  }
};

function cloneIfMounted(child) {
  return child.el === null ? child : cloneVNode(child);
}