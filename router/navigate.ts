/**
 * 
 * @param to 
 * @param from 
 * @returns 
 */
function navigate(to, from) {
    // checkCanceledNavigation这个方法：如果第一个参数和第二个参数(to, from)不相等 return error
  let guards;
  const [leavingRecords, updatingRecords, enteringRecords,] = extractChangingRecords(to, from);
  console.log('check component: beforeRouteLeave guard', 'extractComponentsGuards')
  // all components here have been resolved once because we are leaving
  // extractComponentsGuards: match去找组件，在组件里找到guardType: beforeRouteLeave的guard => guards.push(guardToPromiseFn(guard, to, from));
  guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeRouteLeave', to, from);
  // leavingRecords is already reversed
  for (const record of leavingRecords) {
      record.leaveGuards.forEach(guard => {
          guards.push(guardToPromiseFn(guard, to, from));
      });
  }
  const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
  guards.push(canceledNavigationCheck);
  console.warn('run component: beforeRouteLeave guard')
  // run the queue of per route beforeRouteLeave guards
  return (runGuardQueue(guards)
      .then(() => {
      // check global guards beforeEach
      console.log('check global: beforeEach guard')
      guards = [];
      for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
      }
      guards.push(canceledNavigationCheck);
      console.warn('run global: beforeEach guard')
      return runGuardQueue(guards);
  })
      .then(() => {
      console.log('check component: beforeRouteUpdate guard', 'extractComponentsGuards')
      // check in components beforeRouteUpdate
      guards = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from);
      for (const record of updatingRecords) {
          record.updateGuards.forEach(guard => {
              guards.push(guardToPromiseFn(guard, to, from));
          });
      }
      guards.push(canceledNavigationCheck);
      console.warn('run component: beforeRouteUpdate guard')
      // run the queue of per route beforeEnter guards
      return runGuardQueue(guards);
  })
      .then(() => {
      console.log('check route config: beforeEnter guard', '获取的是record.beforeEnter')
      // check the route beforeEnter
      guards = [];
      for (const record of to.matched) {
          // do not trigger beforeEnter on reused views
          if (record.beforeEnter && from.matched.indexOf(record) < 0) {
              if (Array.isArray(record.beforeEnter)) {
                  for (const beforeEnter of record.beforeEnter)
                      guards.push(guardToPromiseFn(beforeEnter, to, from));
              }
              else {
                  guards.push(guardToPromiseFn(record.beforeEnter, to, from));
              }
          }
      }
      guards.push(canceledNavigationCheck);
      console.warn('run route config: beforeEach guard')
      // run the queue of per route beforeEnter guards
      return runGuardQueue(guards);
  })
      .then(() => {
      // NOTE: at this point to.matched is normalized and does not contain any () => Promise<Component>
      // clear existing enterCallbacks, these are added by extractComponentsGuards
      to.matched.forEach(record => (record.enterCallbacks = {}));
      console.log('check component: beforeRouteEnter', 'extractComponentsGuards')
      // check in-component beforeRouteEnter
      guards = extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from);
      guards.push(canceledNavigationCheck);
      // run the queue of per route beforeEnter guards
      console.warn('run component: beforeRouteEnter')
      return runGuardQueue(guards);
  })
      .then(() => {
      // check global guards beforeResolve
      console.log('check global: beforeResolve guard')
      guards = [];
      for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
      }
      guards.push(canceledNavigationCheck);
      console.warn('run global: beforeResolve guard')
      // 返回beforeResolve的值, 如果没有则是undefined
      return runGuardQueue(guards);
  })
      // catch any navigation canceled
      .catch(err => isNavigationFailure(err, 8 /* NAVIGATION_CANCELLED */)
      ? err
      : Promise.reject(err)));
}
function triggerAfterEach(to, from, failure) {
  // navigation is confirmed, call afterGuards
  // TODO: wrap with error handlers
  console.warn('run afterEach guard')
  for (const guard of afterGuards.list())
      guard(to, from, failure);
}