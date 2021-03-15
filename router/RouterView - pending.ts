const RouterViewImpl = /*#__PURE__*/ defineComponent({
  name: 'RouterView',
  // #674 we manually inherit them
  inheritAttrs: false,
  props: {
      name: {
          type: String,
          default: 'default',
      },
      route: Object,
  },
  setup(props, { attrs, slots }) {
      (process.env.NODE_ENV !== 'production') && warnDeprecatedUsage();
      const injectedRoute = inject(routerViewLocationKey);
      const routeToDisplay = computed(() => props.route || injectedRoute.value);
      const depth = inject(viewDepthKey, 0);
      const matchedRouteRef = computed(() => routeToDisplay.value.matched[depth]);
      provide(viewDepthKey, depth + 1);
      provide(matchedRouteKey, matchedRouteRef);
      provide(routerViewLocationKey, routeToDisplay);
      const viewRef = ref();
      // watch at the same time the component instance, the route record we are
      // rendering, and the name
      watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
          // copy reused instances
          if (to) {
              // this will update the instance for new instances as well as reused
              // instances when navigating to a new route
              to.instances[name] = instance;
              // the component instance is reused for a different route or name so
              // we copy any saved update or leave guards
              if (from && from !== to && instance && instance === oldInstance) {
                  to.leaveGuards = from.leaveGuards;
                  to.updateGuards = from.updateGuards;
              }
          }
          // trigger beforeRouteEnter next callbacks
          if (instance &&
              to &&
              // if there is no instance but to and from are the same this might be
              // the first visit
              (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
              (to.enterCallbacks[name] || []).forEach(callback => callback(instance));
          }
      }, { flush: 'post' });
      return () => {
          const route = routeToDisplay.value;
          const matchedRoute = matchedRouteRef.value;
          const ViewComponent = matchedRoute && matchedRoute.components[props.name];
          // we need the value at the time we render because when we unmount, we
          // navigated to a different location so the value is different
          const currentName = props.name;
          if (!ViewComponent) {
              return normalizeSlot(slots.default, { Component: ViewComponent, route });
          }
          // props from route configuration
          const routePropsOption = matchedRoute.props[props.name];
          const routeProps = routePropsOption
              ? routePropsOption === true
                  ? route.params
                  : typeof routePropsOption === 'function'
                      ? routePropsOption(route)
                      : routePropsOption
              : null;
          const onVnodeUnmounted = vnode => {
              // remove the instance reference to prevent leak
              if (vnode.component.isUnmounted) {
                  matchedRoute.instances[currentName] = null;
              }
          };
          const component = h(ViewComponent, assign({}, routeProps, attrs, {
              onVnodeUnmounted,
              ref: viewRef,
          }));
          return (
          // pass the vnode to the slot as a prop.
          // h and <component :is="..."> both accept vnodes
          normalizeSlot(slots.default, { Component: component, route }) ||
              component);
      };
  },
});