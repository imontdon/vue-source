// record effects created during a component's setup() so that they can be
// stopped when the component unmounts
// instance.effects放入当前effect
function recordInstanceBoundEffect(effect, instance = currentInstance) {
  if (instance) {
      (instance.effects || (instance.effects = [])).push(effect);
  }
}