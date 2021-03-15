/**
 * 
 * @param instance - 实例
 * @param rawProps - 父组件给子组件的props
 * @param props - 默认是 {}
 * @param attrs - 默认 {}
 */
function setFullProps(instance, rawProps, props, attrs) {
  // normalizePropsOptions
  const [options, needCastKeys] = instance.propsOptions;
  if (rawProps) {
      for (const key in rawProps) {
          const value = rawProps[key];
          // key, ref are reserved and never passed down
          if (isReservedProp(key)) {
              continue;
          }
          // prop option names are camelized during normalization, so to support
          // kebab -> camel conversion here we need to camelize the key.
          let camelKey;
          // camelize => (a_b => aB)
          // 子组件的props定义中是否有这个属性, 有的话赋值给props否则赋值给attrs
          if (options && hasOwn(options, (camelKey = camelize(key)))) {
              props[camelKey] = value;
          }
          else if (!isEmitListener(instance.emitsOptions, key)) {
              // Any non-declared (either as a prop or an emitted event) props are put
              // into a separate `attrs` object for spreading. Make sure to preserve
              // original key casing
              attrs[key] = value;
          }
      }
  }
  if (needCastKeys) { // 子组件props中有boolean类型或者有default的属性
      const rawCurrentProps = toRaw(props);
      for (let i = 0; i < needCastKeys.length; i++) {
          const key = needCastKeys[i];
          props[key] = resolvePropValue(options, rawCurrentProps, key, rawCurrentProps[key], instance);
      }
  }
}