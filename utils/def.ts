const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: false,
      value
  });
};