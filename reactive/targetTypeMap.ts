function targetTypeMap(rawType) {
  switch (rawType) {
      case 'Object':
      case 'Array':
          return 1 /* COMMON */;
      case 'Map':
      case 'Set':
      case 'WeakMap':
      case 'WeakSet':
          return 2 /* COLLECTION */;
      default:
          return 0 /* INVALID */;
  }
}