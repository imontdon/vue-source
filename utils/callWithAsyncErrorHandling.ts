/**
 * @description - fn为函数的话与callWithErrorHandling相比对了一层fn返回的promise.catch处理, 数组 - pending
 * @param fn 
 * @param instance 
 * @param type 
 * @param args 
 */
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
      const res = callWithErrorHandling(fn, instance, type, args);
      if (res && isPromise(res)) {
          res.catch(err => {
              handleError(err, instance, type);
          });
      }
      return res;
  }
  const values = [];
  for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
  }
  return values;
}