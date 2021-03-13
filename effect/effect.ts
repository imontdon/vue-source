// fn: getter, options: {}
function effect(fn, options = EMPTY_OBJ) {
  if (isEffect(fn)) {
      fn = fn.raw;
  }
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) { // computed时options.lazy = true延迟执行,直接返回effect, watch时也是
      effect();
  }
  return effect;
}


function isEffect(fn) {
  return fn && fn._isEffect === true;
}