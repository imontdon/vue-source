// readonly
function computed(getterOrOptions) { // getter函数或options属性
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) { // 是getter函数的话则设置getter = getter函数
      getter = getterOrOptions;
      setter =  () => {
              console.warn('Write operation failed: computed value is readonly');
          }
          ;
  }
  else { // 对象的get与set
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
  }

  // getter, setter, 入参是函数 || 入参是对象且没有set => readonly
  return new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set);
}