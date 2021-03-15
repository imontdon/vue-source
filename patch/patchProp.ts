const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
  switch (key) {
      // special
      case 'class':
          patchClass(el, nextValue, isSVG);
          break;
      case 'style':
          patchStyle(el, prevValue, nextValue);
          break;
      default:
          if (isOn(key)) {
              // ignore v-model listeners
              if (!isModelListener(key)) {
                  patchEvent(el, key, prevValue, nextValue, parentComponent);
              }
          }
          else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
              patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
          }
          else {
              // special case for <input v-model type="checkbox"> with
              // :true-value & :false-value
              // store value as dom properties since non-string values will be
              // stringified.
              if (key === 'true-value') {
                  el._trueValue = nextValue;
              }
              else if (key === 'false-value') {
                  el._falseValue = nextValue;
              }
              patchAttr(el, key, nextValue, isSVG);
          }
          break;
  }
};