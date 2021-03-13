// setupContext: { emit, props, attrs, slots, expose }
function createSetupContext(instance) {
  const expose = exposed => {
      if ((process.env.NODE_ENV !== 'production') && instance.exposed) {
          warn(`expose() should be called only once per setup().`);
      }
      instance.exposed = proxyRefs(exposed);
  };
  if ((process.env.NODE_ENV !== 'production')) {
      // We use getters in dev in case libs like test-utils overwrite instance
      // properties (overwrites should not be done in prod)
      return Object.freeze({
          get props() {
              return instance.props;
          },
          get attrs() {
              return new Proxy(instance.attrs, attrHandlers);
          },
          get slots() {
              return shallowReadonly(instance.slots); // 注意一下这个default哪来的 - pending
          },
          get emit() {
              return (event, ...args) => instance.emit(event, ...args);
          },
          expose
      });
  }
  else {
      return {
          attrs: instance.attrs,
          slots: instance.slots,
          emit: instance.emit,
          expose
      };
  }
}