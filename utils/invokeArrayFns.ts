// 执行生命周期函数 - 这里应该兼容了vue2
// vue3的情况下执行injectHook返回的warppedHook
const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
      fns[i](arg);
  }
};