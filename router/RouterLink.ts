const RouterLinkImpl = /*#__PURE__*/ defineComponent({
  name: 'RouterLink',
  props: {
      to: {
          type: [String, Object],
          required: true,
      },
      replace: Boolean,
      activeClass: String,
      // inactiveClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: {
          type: String,
          default: 'page',
      },
  },
  setup(props, { slots, attrs }) {
      const link = reactive(useLink(props));
      const { options } = inject(routerKey);
      const elClass = computed(() => ({
          [getLinkClass(props.activeClass, options.linkActiveClass, 'router-link-active')]: link.isActive,
          // [getLinkClass(
          //   props.inactiveClass,
          //   options.linkInactiveClass,
          //   'router-link-inactive'
          // )]: !link.isExactActive,
          [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, 'router-link-exact-active')]: link.isExactActive,
      }));
      // 返回一个render函数
      return () => {
          const children = slots.default && slots.default(link);
          return props.custom
              ? children
              : h('a', assign({
                  'aria-current': link.isExactActive
                      ? props.ariaCurrentValue
                      : null,
                  onClick: link.navigate,
                  href: link.href,
              }, attrs, {
                  class: elClass.value,
              }), children);
      };
  },
});