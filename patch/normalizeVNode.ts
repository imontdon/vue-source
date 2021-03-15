function normalizeVNode(child) {
  if (child == null || typeof child === 'boolean') { // vnode结点为空则comment
      // empty placeholder
      return createVNode(Comment);
  }
  else if (isArray(child)) { // 数组的化去创建一个fragment - pending
      // fragment
      return createVNode(Fragment, null, child);
  }
  else if (typeof child === 'object') { // vnode没有el直接返回
      // already vnode, this should be the most common since compiled templates
      // always produce all-vnode children arrays
      return child.el === null ? child : cloneVNode(child); // pending
  }
  else { // 文本结点
      // strings and numbers
      return createVNode(Text, null, String(child));
  }
}4550-