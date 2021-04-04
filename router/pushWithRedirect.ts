function pushWithRedirect(to, redirectedFrom) {
  const targetLocation = (pendingLocation = resolve(to));
  const from = currentRoute.value;
  const data = to.state;
  const force = to.force;
  // to could be a string where `replace` is a function
  const replace = to.replace === true;
  const shouldRedirect = handleRedirectRecord(targetLocation);
  if (shouldRedirect) // pending
      return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
          state: data,
          force,
          replace,
      }), 
      // keep original redirectedFrom if it exists
      redirectedFrom || targetLocation);
  // if it was a redirect we already called `pushWithRedirect` above
  const toLocation = targetLocation;
  toLocation.redirectedFrom = redirectedFrom;
  let failure;
  if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
      failure = createRouterError(16 /* NAVIGATION_DUPLICATED */, { to: toLocation, from });
      // trigger scroll to allow scrolling to the same anchor
      handleScroll(from, from, 
      // this is a push, the only way for it to be triggered from a
      // history.listen is with a redirect, which makes it become a push
      true, 
      // This cannot be the first navigation because the initial location
      // cannot be manually navigated to
      false);
  }
  return (failure ? Promise.resolve(failure) : navigate(toLocation, from))
      .catch((error) => isNavigationFailure(error)
      ? error
      : // reject any unknown error
          triggerError(error))
      .then((failure) => { // 钩子函数执行完毕, failure为beforeResolve的返回值
      if (failure) {
          if (isNavigationFailure(failure, 2 /* NAVIGATION_GUARD_REDIRECT */)) {
              if ((process.env.NODE_ENV !== 'production') &&
                  // we are redirecting to the same location we were already at
                  isSameRouteLocation(stringifyQuery$1, resolve(failure.to), toLocation) &&
                  // and we have done it a couple of times
                  redirectedFrom &&
                  // @ts-ignore
                  (redirectedFrom._count = redirectedFrom._count
                      ? // @ts-ignore
                          redirectedFrom._count + 1
                      : 1) > 10) {
                  warn(`Detected an infinite redirection in a navigation guard when going from "${from.fullPath}" to "${toLocation.fullPath}". Aborting to avoid a Stack Overflow. This will break in production if not fixed.`);
                  return Promise.reject(new Error('Infinite redirect in navigation guard'));
              }
              return pushWithRedirect(
              // keep options
              assign(locationAsObject(failure.to), {
                  state: data,
                  force,
                  replace,
              }), 
              // preserve the original redirectedFrom if any
              redirectedFrom || toLocation);
          }
      }
      else {
          // if we fail we don't finalize the navigation
          failure = finalizeNavigation(toLocation, from, true, replace, data);
      }
      triggerAfterEach(toLocation, from, failure);
      return failure; // 结束后触发flushJobs 执行effect去更新视图
  });
}