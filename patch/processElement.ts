const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
  isSVG = isSVG || n2.type === 'svg';
  if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
  }
  else {
      patchElement(n1, n2, parentComponent, parentSuspense, isSVG, optimized);
  }
};