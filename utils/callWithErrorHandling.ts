/**
 * @description - 好多用到要注意
 * @param fn 
 * @param instance 
 * @param type 
 * @param args - 入参
 */
function callWithErrorHandling(fn, instance, type, args) {
  let res;
  try { // 执行fn.apply(null, args)
      res = args ? fn(...args) : fn();
  }
  catch (err) {
      handleError(err, instance, type);
  }
  return res;
}