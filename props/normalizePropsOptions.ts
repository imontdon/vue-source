/**
 * 
 * 
 * @description - 整理子组件的props, mixin, extends. 
 * instance.propsOptions = normalizePropsOptions(type, context)
 * @param {Component} comp 
 * @param {Context} appContext 
 * @param {Boolean} asMixin 
 */
function normalizePropsOptions(comp, appContext, asMixin = false) {
  if (!appContext.deopt && comp.__props) {
      return comp.__props;
  }
  // 组件内的props
  const raw = comp.props;
  const normalized = {};
  // 有布尔类型的话 || 有default 会放入对应子组件的props
  const needCastKeys = [];
  // apply mixin/extends props
  let hasExtends = false;
  if ( !isFunction(comp)) {
      const extendProps = (raw) => {
          hasExtends = true;
          const [props, keys] = normalizePropsOptions(raw, appContext, true);
          extend(normalized, props);
          if (keys)
              needCastKeys.push(...keys);
      };
      // 处理appContext.mixins - 全局
      if (!asMixin && appContext.mixins.length) {
          appContext.mixins.forEach(extendProps);
      }
      // 处理extends
      if (comp.extends) {
          extendProps(comp.extends);
      }
      // 处理mixins - 组件内的
      if (comp.mixins) {
          comp.mixins.forEach(extendProps);
      }
  }
  if (!raw && !hasExtends) {
      return (comp.__props = EMPTY_ARR);
  }
  // props数数组的话 - 必须是string
  if (isArray(raw)) {
      for (let i = 0; i < raw.length; i++) {
          if ( !isString(raw[i])) {
              warn(`props must be strings when using array syntax.`, raw[i]);
          }
          // a_b => aB
          const normalizedKey = camelize(raw[i]);
          // 验证propName
          if (validatePropName(normalizedKey)) {
              normalized[normalizedKey] = EMPTY_OBJ;
          }
      }
  }
  else if (raw) { // 不是数组则必须是对象
      if ( !isObject(raw)) {
          warn(`invalid props options`, raw);
      }
      for (const key in raw) {
          const normalizedKey = camelize(key);
          if (validatePropName(normalizedKey)) {
              const opt = raw[key];
              const prop = (normalized[normalizedKey] =
                  isArray(opt) || isFunction(opt) ? { type: opt } : opt);
              if (prop) { // props: { 0: '是否有Boolean类型' ? true : false, 1: '没有String类型 || 有String类型没有Boolean类型' ? true : false }
                  // 返回是Boolen类型的下标，如果是对象则布尔类型返回0, 其他-1(找不到);如果是数组的化则返回找到Boolean类型的下标, 找不到则-1
                  const booleanIndex = getTypeIndex(Boolean, prop.type);
                  // 同上
                  const stringIndex = getTypeIndex(String, prop.type);
                  prop[0 /* shouldCast */] = booleanIndex > -1;
                  prop[1 /* shouldCastTrue */] =
                      stringIndex < 0 || booleanIndex < stringIndex;
                  // if the prop needs boolean casting or default value
                  // 有布尔类型的话 || 有default
                  if (booleanIndex > -1 || hasOwn(prop, 'default')) {
                      needCastKeys.push(normalizedKey);
                  }
              }
          }
      }
  }
  return (comp.__props = [normalized, needCastKeys]);
}