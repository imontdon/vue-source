function resolvePropValue(options, props, key, value, instance) {
  // 获取normalizePropsOptions
  const opt = options[key];
  if (opt != null) {
      const hasDefault = hasOwn(opt, 'default');
      // default values
      if (hasDefault && value === undefined) {
          const defaultValue = opt.default; // 获取用户定义的default属性
          if (opt.type !== Function && isFunction(defaultValue)) { // type不是Function && defaultValue不是函数（vue2.x中props的type为"对象"或"数组"时default: () => [] || () => {}）
              // debugger
              setCurrentInstance(instance);
              value = defaultValue(props);
              setCurrentInstance(null);
          }
          else {
              value = defaultValue; // 赋值
          }
      }
      // boolean casting
      if (opt[0 /* shouldCast */]) { // 如果存在Boolean类型 && 没有default属性, 默认值设为false
          if (!hasOwn(props, key) && !hasDefault) {
              value = false;
          }
          else if (opt[1 /* shouldCastTrue */] && // 不是Boolean && (不是String类型 || 有String类型没有Boolean类型)
              (value === '' || value === hyphenate(key))) {
              value = true;
          }
      }
  }
  return value;
}