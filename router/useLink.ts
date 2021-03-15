function useLink(props) {
  // app.use的时候会设置
  // 获取routerKey
  const router = inject(routerKey);
  // 获取currentRoute
  const currentRoute = inject(routeLocationKey);
  // pending
  const route = computed(() => router.resolve(unref(props.to)));
  // pending
  const activeRecordIndex = computed(() => {
      let { matched } = route.value;
      let { length } = matched;
      const routeMatched = matched[length - 1];
      let currentMatched = currentRoute.matched;
      if (!routeMatched || !currentMatched.length)
          return -1;
      let index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
      if (index > -1)
          return index;
      // possible parent record
      let parentRecordPath = getOriginalPath(matched[length - 2]);
      return (
      // we are dealing with nested routes
      length > 1 &&
          // if the parent and matched route have the same path, this link is
          // referring to the empty child. Or we currently are on a different
          // child of the same parent
          getOriginalPath(routeMatched) === parentRecordPath &&
          // avoid comparing the child with its parent
          currentMatched[currentMatched.length - 1].path !== parentRecordPath
          ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2]))
          : index);
  });
  // pending
  const isActive = computed(() => activeRecordIndex.value > -1 &&
      includesParams(currentRoute.params, route.value.params));
  // pending
  const isExactActive = computed(() => activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params));
  // pending
  function navigate(e = {}) {
      if (guardEvent(e))
          return router[unref(props.replace) ? 'replace' : 'push'](unref(props.to));
      return Promise.resolve();
  }
  return {
      route,
      href: computed(() => route.value.href),
      isActive,
      isExactActive,
      navigate,
  };
}