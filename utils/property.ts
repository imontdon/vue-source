const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
      const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
      // let @vue/reactivity know it should never observe Vue public instances.
      if (key === "__v_skip" /* SKIP */) {
          return true;
      }
      // for internal formatters to know that this is a Vue instance
      if ( key === '__isVue') {
          return true;
      }
      // data / props / ctx
      // This getter gets called for every property access on the render context
      // during render and is a major hotspot. The most expensive part of this
      // is the multiple hasOwn() calls. It's much faster to do a simple property
      // access on a plain object, so we use an accessCache object (with null
      // prototype) to memoize what access type a key corresponds to.
      let normalizedProps;
      if (key[0] !== '$') {
          const n = accessCache[key];
          if (n !== undefined) {
              switch (n) {
                  case 0 /* SETUP */:
                      return setupState[key];
                  case 1 /* DATA */:
                      return data[key];
                  case 3 /* CONTEXT */:
                      return ctx[key];
                  case 2 /* PROPS */:
                      return props[key];
                  // default: just fallthrough
              }
          }
          else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
              accessCache[key] = 0 /* SETUP */;
              return setupState[key];
          }
          else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
              accessCache[key] = 1 /* DATA */;
              return data[key];
          }
          else if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (normalizedProps = instance.propsOptions[0]) &&
              hasOwn(normalizedProps, key)) {
              accessCache[key] = 2 /* PROPS */;
              return props[key];
          }
          else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
              accessCache[key] = 3 /* CONTEXT */;
              return ctx[key];
          }
          else if ( !isInBeforeCreate) {
              accessCache[key] = 4 /* OTHER */;
          }
      }
      const publicGetter = publicPropertiesMap[key];
      let cssModule, globalProperties;
      // public $xxx properties
      if (publicGetter) {
          if (key === '$attrs') {
              track(instance, "get" /* GET */, key);
               markAttrsAccessed();
          }
          return publicGetter(instance);
      }
      else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) &&
          (cssModule = cssModule[key])) {
          return cssModule;
      }
      else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
          // user may set custom properties to `this` that start with `$`
          accessCache[key] = 3 /* CONTEXT */;
          return ctx[key];
      }
      else if (
      // global properties
      ((globalProperties = appContext.config.globalProperties),
          hasOwn(globalProperties, key))) {
          return globalProperties[key];
      }
      else if (
          currentRenderingInstance &&
          (!isString(key) ||
              // #1091 avoid internal isRef/isVNode checks on component instance leading
              // to infinite warning loop
              key.indexOf('__v') !== 0)) {
          if (data !== EMPTY_OBJ &&
              (key[0] === '$' || key[0] === '_') &&
              hasOwn(data, key)) {
              warn(`Property ${JSON.stringify(key)} must be accessed via $data because it starts with a reserved ` +
                  `character ("$" or "_") and is not proxied on the render context.`);
          }
          else {
              warn(`Property ${JSON.stringify(key)} was accessed during render ` +
                  `but is not defined on instance.`);
          }
      }
  },
  set({ _: instance }, key, value) {
      const { data, setupState, ctx } = instance;
      if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
          setupState[key] = value;
      }
      else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
          data[key] = value;
      }
      else if (key in instance.props) {
          
              warn(`Attempting to mutate prop "${key}". Props are readonly.`, instance);
          return false;
      }
      if (key[0] === '$' && key.slice(1) in instance) {
          
              warn(`Attempting to mutate public property "${key}". ` +
                  `Properties starting with $ are reserved and readonly.`, instance);
          return false;
      }
      else {
          if ( key in instance.appContext.config.globalProperties) {
              Object.defineProperty(ctx, key, {
                  enumerable: true,
                  configurable: true,
                  value
              });
          }
          else {
              ctx[key] = value;
          }
      }
      return true;
  },
  has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
      let normalizedProps;
      return (accessCache[key] !== undefined ||
          (data !== EMPTY_OBJ && hasOwn(data, key)) ||
          (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
          ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
          hasOwn(ctx, key) ||
          hasOwn(publicPropertiesMap, key) ||
          hasOwn(appContext.config.globalProperties, key));
  }
};