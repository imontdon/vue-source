/**
 * 
 * @param instance 
 * @param rawProps - 父组件给子组件传的props对象
 * @param isStateful 
 * @param isSSR 
 */
function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
  isSSR = false) {
      const props = {};
      const attrs = {};
      // InternalObjectKey: string =  '__vInternal'
      def(attrs, InternalObjectKey, 1);
      // 这里会设置props的默认值和attrs
      setFullProps(instance, rawProps, props, attrs);
      // validation
      if ((process.env.NODE_ENV !== 'production')) {
          validateProps(props, instance);
      }
      if (isStateful) {
          // stateful
          instance.props = isSSR ? props : shallowReactive(props);
      }
      else {
          if (!instance.type.props) {
              // functional w/ optional props, props === attrs
              instance.props = attrs;
          }
          else {
              // functional w/ declared props
              instance.props = props;
          }
      }
      instance.attrs = attrs;
  }