// pending
function emit(instance, event, ...rawArgs) {
  const props = instance.vnode.props || EMPTY_OBJ;
  if ((process.env.NODE_ENV !== 'production')) {
      const { emitsOptions, propsOptions: [propsOptions] } = instance;
      if (emitsOptions) {
          if (!(event in emitsOptions)) {
              if (!propsOptions || !(toHandlerKey(event) in propsOptions)) {
                  warn(`Component emitted event "${event}" but it is neither declared in ` +
                      `the emits option nor as an "${toHandlerKey(event)}" prop.`);
              }
          }
          else {
              const validator = emitsOptions[event];
              if (isFunction(validator)) {
                  const isValid = validator(...rawArgs);
                  if (!isValid) {
                      warn(`Invalid event arguments: event validation failed for event "${event}".`);
                  }
              }
          }
      }
  }
  let args = rawArgs;
  const isModelListener = event.startsWith('update:');
  // for v-model update:xxx events, apply modifiers on args
  const modelArg = isModelListener && event.slice(7);
  if (modelArg && modelArg in props) {
      const modifiersKey = `${modelArg === 'modelValue' ? 'model' : modelArg}Modifiers`;
      const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
      if (trim) {
          args = rawArgs.map(a => a.trim());
      }
      else if (number) {
          args = rawArgs.map(toNumber);
      }
  }
  if ((process.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) {
      devtoolsComponentEmit(instance, event, args);
  }
  if ((process.env.NODE_ENV !== 'production')) {
      const lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && props[toHandlerKey(lowerCaseEvent)]) {
          warn(`Event "${lowerCaseEvent}" is emitted in component ` +
              `${formatComponentName(instance, instance.type)} but the handler is registered for "${event}". ` +
              `Note that HTML attributes are case-insensitive and you cannot use ` +
              `v-on to listen to camelCase events when using in-DOM templates. ` +
              `You should probably use "${hyphenate(event)}" instead of "${event}".`);
      }
  }
  // convert handler name to camelCase. See issue #2249
  let handlerName = toHandlerKey(camelize(event));
  let handler = props[handlerName];
  // for v-model update:xxx events, also trigger kebab-case equivalent
  // for props passed via kebab-case
  if (!handler && isModelListener) {
      handlerName = toHandlerKey(hyphenate(event));
      handler = props[handlerName];
  }
  if (handler) {
      callWithAsyncErrorHandling(handler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
      if (!instance.emitted) {
          (instance.emitted = {})[handlerName] = true;
      }
      else if (instance.emitted[handlerName]) {
          return;
      }
      callWithAsyncErrorHandling(onceHandler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
  }
}