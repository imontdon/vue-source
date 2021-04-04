function finalizeNavigation(toLocation, from, isPush, replace, data) {
  // a more recent navigation took place
  const error = checkCanceledNavigation(toLocation, from);
  if (error)
      return error;
  // only consider as push if it's not the first navigation
  const isFirstNavigation = from === START_LOCATION_NORMALIZED;
  const state = !isBrowser ? {} : history.state;
  // change URL only if the user did a push/replace and if it's not the initial navigation because
  // it's just reflecting the url
  if (isPush) { // 触发地址栏更新
      // on the initial navigation, we want to reuse the scroll position from
      // history state if it exists
      if (replace || isFirstNavigation) // 执行changeLocation => 执行history['replaceState' | 'pushState'](state, '', url) => 修改histroyState.value
          routerHistory.replace(toLocation.fullPath, assign({
              scroll: isFirstNavigation && state && state.scroll,
          }, data));
      else
          routerHistory.push(toLocation.fullPath, data);
  }
  // accept current navigation
  currentRoute.value = toLocation; // 某些trigger - pending
  handleScroll(toLocation, from, isPush, isFirstNavigation); // 没有滚动行为直接resolve() - pending有滚动行为的情况
  markAsReady();
}