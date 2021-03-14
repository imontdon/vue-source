function applyOptions(instance, options, deferredData = [], deferredWatch = [], deferredProvide = [], asMixin = false) {
  const { 
  // composition
  mixins, extends: extendsOptions, 
  // state
  data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, 
  // assets
  components, directives, 
  // lifecycle
  beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, 
  // public API
  expose } = options;
  const publicThis = instance.proxy;
  const ctx = instance.ctx;
  const globalMixins = instance.appContext.mixins;
  if (asMixin && render && instance.render === NOOP) {
      instance.render = render;
  }
  // applyOptions is called non-as-mixin once per instance
  if (!asMixin) {
      isInBeforeCreate = true;
      callSyncHook('beforeCreate', "bc" /* BEFORE_CREATE */, options, instance, globalMixins);
      isInBeforeCreate = false;
      // global mixins are applied first
      applyMixins(instance, globalMixins, deferredData, deferredWatch, deferredProvide);
  }
  // extending a base component...
  if (extendsOptions) {
      applyOptions(instance, extendsOptions, deferredData, deferredWatch, deferredProvide, true);
  }
  // local mixins
  if (mixins) {
      applyMixins(instance, mixins, deferredData, deferredWatch, deferredProvide);
  }
  const checkDuplicateProperties = (process.env.NODE_ENV !== 'production') ? createDuplicateChecker() : null;
  if ((process.env.NODE_ENV !== 'production')) {
      const [propsOptions] = instance.propsOptions;
      if (propsOptions) {
          for (const key in propsOptions) {
              checkDuplicateProperties("Props" /* PROPS */, key);
          }
      }
  }
  // options initialization order (to be consistent with Vue 2):
  // - props (already done outside of this function)
  // - inject
  // - methods
  // - data (deferred since it relies on `this` access)
  // - computed
  // - watch (deferred since it relies on `this` access)
  if (injectOptions) {
      if (isArray(injectOptions)) {
          for (let i = 0; i < injectOptions.length; i++) {
              const key = injectOptions[i];
              ctx[key] = inject(key);
              if ((process.env.NODE_ENV !== 'production')) {
                  checkDuplicateProperties("Inject" /* INJECT */, key);
              }
          }
      }
      else {
          for (const key in injectOptions) {
              const opt = injectOptions[key];
              if (isObject(opt)) {
                  ctx[key] = inject(opt.from || key, opt.default, true /* treat default function as factory */);
              }
              else {
                  ctx[key] = inject(opt);
              }
              if ((process.env.NODE_ENV !== 'production')) {
                  checkDuplicateProperties("Inject" /* INJECT */, key);
              }
          }
      }
  }
  if (methods) {
      for (const key in methods) {
          const methodHandler = methods[key];
          if (isFunction(methodHandler)) {
              ctx[key] = methodHandler.bind(publicThis);
              if ((process.env.NODE_ENV !== 'production')) {
                  checkDuplicateProperties("Methods" /* METHODS */, key);
              }
          }
          else if ((process.env.NODE_ENV !== 'production')) {
              warn(`Method "${key}" has type "${typeof methodHandler}" in the component definition. ` +
                  `Did you reference the function correctly?`);
          }
      }
  }
  if (!asMixin) {
      if (deferredData.length) {
          deferredData.forEach(dataFn => resolveData(instance, dataFn, publicThis));
      }
      if (dataOptions) {
          // @ts-ignore dataOptions is not fully type safe
          resolveData(instance, dataOptions, publicThis);
      }
      if ((process.env.NODE_ENV !== 'production')) {
          const rawData = toRaw(instance.data);
          for (const key in rawData) {
              checkDuplicateProperties("Data" /* DATA */, key);
              // expose data on ctx during dev
              if (key[0] !== '$' && key[0] !== '_') {
                  Object.defineProperty(ctx, key, {
                      configurable: true,
                      enumerable: true,
                      get: () => rawData[key],
                      set: NOOP
                  });
              }
          }
      }
  }
  else if (dataOptions) {
      deferredData.push(dataOptions);
  }
  if (computedOptions) {
      for (const key in computedOptions) {
          const opt = computedOptions[key];
          const get = isFunction(opt)
              ? opt.bind(publicThis, publicThis)
              : isFunction(opt.get)
                  ? opt.get.bind(publicThis, publicThis)
                  : NOOP;
          if ((process.env.NODE_ENV !== 'production') && get === NOOP) {
              warn(`Computed property "${key}" has no getter.`);
          }
          const set = !isFunction(opt) && isFunction(opt.set)
              ? opt.set.bind(publicThis)
              : (process.env.NODE_ENV !== 'production')
                  ? () => {
                      warn(`Write operation failed: computed property "${key}" is readonly.`);
                  }
                  : NOOP;
          const c = computed({
              get,
              set
          });
          Object.defineProperty(ctx, key, {
              enumerable: true,
              configurable: true,
              get: () => c.value,
              set: v => (c.value = v)
          });
          if ((process.env.NODE_ENV !== 'production')) {
              checkDuplicateProperties("Computed" /* COMPUTED */, key);
          }
      }
  }
  if (watchOptions) {
      deferredWatch.push(watchOptions);
  }
  if (!asMixin && deferredWatch.length) {
      deferredWatch.forEach(watchOptions => {
          for (const key in watchOptions) {
              createWatcher(watchOptions[key], ctx, publicThis, key);
          }
      });
  }
  if (provideOptions) {
      deferredProvide.push(provideOptions);
  }
  if (!asMixin && deferredProvide.length) {
      deferredProvide.forEach(provideOptions => {
          const provides = isFunction(provideOptions)
              ? provideOptions.call(publicThis)
              : provideOptions;
          Reflect.ownKeys(provides).forEach(key => {
              provide(key, provides[key]);
          });
      });
  }
  // asset options.
  // To reduce memory usage, only components with mixins or extends will have
  // resolved asset registry attached to instance.
  if (asMixin) {
      if (components) {
          extend(instance.components ||
              (instance.components = extend({}, instance.type.components)), components);
      }
      if (directives) {
          extend(instance.directives ||
              (instance.directives = extend({}, instance.type.directives)), directives);
      }
  }
  // lifecycle options
  if (!asMixin) {
      callSyncHook('created', "c" /* CREATED */, options, instance, globalMixins);
  }
  if (beforeMount) {
      onBeforeMount(beforeMount.bind(publicThis));
  }
  if (mounted) {
      onMounted(mounted.bind(publicThis));
  }
  if (beforeUpdate) {
      onBeforeUpdate(beforeUpdate.bind(publicThis));
  }
  if (updated) {
      onUpdated(updated.bind(publicThis));
  }
  if (activated) {
      onActivated(activated.bind(publicThis));
  }
  if (deactivated) {
      onDeactivated(deactivated.bind(publicThis));
  }
  if (errorCaptured) {
      onErrorCaptured(errorCaptured.bind(publicThis));
  }
  if (renderTracked) {
      onRenderTracked(renderTracked.bind(publicThis));
  }
  if (renderTriggered) {
      onRenderTriggered(renderTriggered.bind(publicThis));
  }
  if ((process.env.NODE_ENV !== 'production') && beforeDestroy) {
      warn(`\`beforeDestroy\` has been renamed to \`beforeUnmount\`.`);
  }
  if (beforeUnmount) {
      onBeforeUnmount(beforeUnmount.bind(publicThis));
  }
  if ((process.env.NODE_ENV !== 'production') && destroyed) {
      warn(`\`destroyed\` has been renamed to \`unmounted\`.`);
  }
  if (unmounted) {
      onUnmounted(unmounted.bind(publicThis));
  }
  if (isArray(expose)) {
      if (!asMixin) {
          if (expose.length) {
              const exposed = instance.exposed || (instance.exposed = proxyRefs({}));
              expose.forEach(key => {
                  exposed[key] = toRef(publicThis, key);
              });
          }
          else if (!instance.exposed) {
              instance.exposed = EMPTY_OBJ;
          }
      }
      else if ((process.env.NODE_ENV !== 'production')) {
          warn(`The \`expose\` option is ignored when used in mixins.`);
      }
  }
}