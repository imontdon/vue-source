class ComputedRefImpl {
  constructor(getter, _setter, isReadonly) {
      this._setter = _setter;
      this._dirty = true;
      this.__v_isRef = true;
      this.effect = effect(getter, {
          lazy: true,
          scheduler: () => {
              if (!this._dirty) {
                  this._dirty = true;
                  trigger(toRaw(this), "set" /* SET */, 'value');
              }
          }
      });
      this["__v_isReadonly" /* IS_READONLY */] = isReadonly;
  }
  get value() { // get的时候看dirty属性, 如果fase直接返回，反则求值
      if (this._dirty) {
          this._value = this.effect();
          this._dirty = false;
      }
      track(toRaw(this), "get" /* GET */, 'value');
      return this._value;
  }
  set value(newValue) {
      this._setter(newValue);
  }
}