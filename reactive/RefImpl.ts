// ref(rawValue, false)
const convert = (val) => isObject(val) ? reactive(val) : val;

class RefImpl {
  constructor(_rawValue, _shallow = false) {
      this._rawValue = _rawValue;
      this._shallow = _shallow;
      this.__v_isRef = true;
      this._value = _shallow ? _rawValue : convert(_rawValue);
  }
  // 走一遍发布订阅流程 - 暂时等同于vue2的流程 - pending

  get value() {
      track(toRaw(this), "get" /* GET */, 'value');
      return this._value;
  }
  set value(newVal) {
    // newVal !== oldVal
      if (hasChanged(toRaw(newVal), this._rawValue)) {
          this._rawValue = newVal;
          this._value = this._shallow ? newVal : convert(newVal);
          trigger(toRaw(this), "set" /* SET */, 'value', newVal);
      }
  }
}