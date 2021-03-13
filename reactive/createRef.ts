function createRef(rawValue, shallow = false) {
  // 有__v_isRef属性则直接返回
  if (isRef(rawValue)) {
      return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}