function guardToPromiseFn(guard, to, from, record, name) {
  // keep a reference to the enterCallbackArray to prevent pushing callbacks if a new navigation took place
  const enterCallbackArray = record &&
      // name is defined if record is because of the function overload
      (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
  return () => new Promise((resolve, reject) => {
      const next = (valid) => {
          if (valid === false) // next(false)
              reject(createRouterError(4 /* NAVIGATION_ABORTED */, {
                  from,
                  to,
              }));
          else if (valid instanceof Error) { // next(throw new Error('xxx'))
              reject(valid);
          }
          else if (isRouteLocation(valid)) {
              reject(createRouterError(2 /* NAVIGATION_GUARD_REDIRECT */, {
                  from: to,
                  to: valid,
              }));
          }
          else {
              if (enterCallbackArray &&
                  // since enterCallbackArray is truthy, both record and name also are
                  record.enterCallbacks[name] === enterCallbackArray &&
                  typeof valid === 'function')
                  enterCallbackArray.push(valid);
              resolve();
          }
      };
      // wrapping with Promise.resolve allows it to work with both async and sync guards
      // 这边执行钩子函数
      const guardReturn = guard.call(record && record.instances[name], to, from, (process.env.NODE_ENV !== 'production') ? canOnlyBeCalledOnce(next, to, from) : next);
      let guardCall = Promise.resolve(guardReturn);
      if (guard.length < 3) // 没有next入参, next(guardReturn)
          guardCall = guardCall.then(next);
      if ((process.env.NODE_ENV !== 'production') && guard.length > 2) { // 有next入参设置提示
          const message = `The "next" callback was never called inside of ${guard.name ? '"' + guard.name + '"' : ''}:\n${guard.toString()}\n. If you are returning a value instead of calling "next", make sure to remove the "next" parameter from your function.`;
          if (typeof guardReturn === 'object' && 'then' in guardReturn) { // 钩子函数返回的是一个带有then方法的对象
              guardCall = guardCall.then(resolvedValue => {
                  // @ts-ignore: _called is added at canOnlyBeCalledOnce
                  if (!next._called) {
                      warn(message);
                      return Promise.reject(new Error('Invalid navigation guard'));
                  }
                  return resolvedValue;
              });
              // TODO: test me!
          }
          else if (guardReturn !== undefined) {
              // @ts-ignore: _called is added at canOnlyBeCalledOnce
              if (!next._called) {
                  warn(message);
                  reject(new Error('Invalid navigation guard'));
                  return;
              }
          }
      }
      guardCall.catch(err => reject(err));
  });
}