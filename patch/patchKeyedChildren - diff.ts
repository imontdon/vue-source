const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, optimized) => {
  // 初始化下标
  let i = 0;
  // 获取新children的长度
  const l2 = c2.length;
  // 老children的最大下标
  let e1 = c1.length - 1; // prev ending index
  // 新children的最大下标
  let e2 = l2 - 1; // next ending index 新结点的长度
  // 1. sync from start
  // (a b) c
  // (a b) d e
  // 找到首个头部不同的结点

  // e.g:
  // <comment>abcdefghgi => <comment>acbfhedgi
  // i => 2
  while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = (c2[i] = optimized
          ? cloneIfMounted(c2[i])
          : normalizeVNode(c2[i])); // c2[i].el === null ? c2[i] : cloneVNode(c2[i])
      if (isSameVNodeType(n1, n2)) { // n1.type === n2.type && n1.key === n2.key
        // 相同vnodetype走更新流程
          patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized);
      }
      else { // 头部找到不同的结点
          break;
      }
      i++;
  }
  // i = prevTree第一个不同的结点下标
  /**
   * 
   * <!-- <input v-model="input" />
      <hello-world :msg="msg" :info="info">
      <template v-slot:default="scope">
          <span>{{ scope }}</span>
      </template>
      <template v-slot:test="scope">
          <span>{{ scope.row }}</span>
      </template>
      </hello-world> --> i = 0
      <li key="a">a</li> i = 1
      <li key="b">b</li> i = 2
      <li key="c">c</li> i = 3
      <li key="d">d</li> i = 4 // removed e.g.1, => i = 4 // add e.g.2 => i = 4
      <li key="e">e</li> // add e.g.2
      <!-- <li key="e" v-if="show">e</li> -->

      <!-- <button @click="change">change</button>
      <button @click="addAge">Add Age</button> -->
   */

  // 匹配尾部
  // 2. sync from end
  // a (b c)
  // d e (b c)
  // e.g.1: 如果是删除结点，则e2 = 3 < i break, 此时e1 = 4
  // e.g.2: 如果是增加结点: e1 = 3, e2 = 5, i = 4


  // e.g:
  // <comment>abcdefghi => <comment>acbfhedgi
  // e1 = e1 - 1 = 8, e2 = e2 - 1 = 8
  while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = (c2[e2] = optimized
          ? cloneIfMounted(c2[e2])
          : normalizeVNode(c2[e2]));
      if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized);
      }
      else {
          break;
      }
      e1--;
      e2--;
  }
  

  // 3. common sequence + mount
  // (a b) i = 2, e1 = 1
  // (a b) c i = 2, e2 = 2
  // i = 2, e1 = 1, e2 = 2
  // (a b)
  // c (a b)
  // i = 0, e1 = -1, e2 = 0
  // 增加的结点, i > e1 && i <= e2
  if (i > e1) {
      if (i <= e2) {
          const nextPos = e2 + 1;
          // 在nextPos处前插入c2[i]
          const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
          while (i <= e2) {
              patch(null, (c2[i] = optimized
                  ? cloneIfMounted(c2[i])
                  : normalizeVNode(c2[i])), container, anchor, parentComponent, parentSuspense, isSVG);
              i++;
          }
      }
  }
  // i > e2 说明是删除结点, 需要unmountc1[i]的结点至e1处
  // 4. common sequence + unmount
  // (a b) c
  // (a b)
  // i = 2, e1 = 2, e2 = 1
  // a (b c)
  // (b c)
  // i = 0, e1 = 0, e2 = -1
  else if (i > e2) { // i > e2 && i <= e1 卸载结点
      while (i <= e1) {
          unmount(c1[i], parentComponent, parentSuspense, true);
          i++;
      }
  }
  // i = 5, e1 = 4
  // 数组乱序了，其中增加或删除了一些结点 [comment, a,b,c,d,e,comment,comment] => [comment, a,d,f,c,b,e,comment,comment], i = 2, e1(index) = 4, e2(index) = 5
  // 5. unknown sequence
  // [i ... e1 + 1]: a b [c d e] f g
  // [i ... e2 + 1]: a b [e d c h] f g
  // i = 2, e1 = 4, e2 = 5
  else {
      // 开始打乱的下标
      const s1 = i; // prev starting index
      const s2 = i; // next starting index
      // 5.1 build key:index map for newChildren
      // 收集新结点的Map<key, index>
      /**
       * 
          0: {"d" => 2}
          1: {"f" => 3}
          2: {"c" => 4}
          3: {"b" => 5}
       */


      // e.g:
      // <comment>abcdefghi => <comment>acbfhedgi
      // e1 = e1 - 1 = 8, e2 = e2 - 1 = 8
      const keyToNewIndexMap = new Map();// Map<key, index>
      // index: s2 => e2 ===> 中间那段多出来的的children
      // 新的子结点
      for (i = s2; i <= e2; i++) {
          const nextChild = (c2[i] = optimized // d,f,c,b
              ? cloneIfMounted(c2[i])
              : normalizeVNode(c2[i]));
          if (nextChild.key != null) { // 下标更新可能会出现的问题
              if ((process.env.NODE_ENV !== 'production') && keyToNewIndexMap.has(nextChild.key)) { // key不唯一报错
                  warn(`Duplicate keys found during update:`, JSON.stringify(nextChild.key), `Make sure keys are unique.`);
              }
              keyToNewIndexMap.set(nextChild.key, i); // key => oldIndex
          }
      }
      // 5.2 loop through old children left to be patched and try to patch
      // matching nodes & remove nodes that are no longer present
      let j;
      // 已经匹配了的长度（次数）
      let patched = 0;
      const toBePatched = e2 - s2 + 1; // 应该patch的长度
      let moved = false;
      // used to track whether any node has moved
      // 追踪node是否移动过
      let maxNewIndexSoFar = 0;
      // works as Map<newIndex, oldIndex>
      // Note that oldIndex is offset by +1
      // and oldIndex = 0 is a special value indicating the new node has
      // no corresponding old node.
      // used for determining longest stable subsequence
      // 新下标对应旧下标的位置
      // init: new Array(patchedLen).fill(0)
      // 匹配后: newIndexToOldIndexMap = 0 则代表新增的结点
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++)
          newIndexToOldIndexMap[i] = 0;

      // 循环老children
      for (i = s1; i <= e1; i++) {
          const prevChild = c1[i];
          // 已经匹配的次数 >= 应该匹配的长度 => 卸载
          if (patched >= toBePatched) {
              // all new children have been patched so this can only be a removal
              // 所有结点都更新了，就删除旧的结点
              unmount(prevChild, parentComponent, parentSuspense, true);
              continue;
          }
          // 获取老结点对应的新结点的下标
          let newIndex; // = Map<key, index>中prevChild.key对应的新下标
          if (prevChild.key != null) {
              newIndex = keyToNewIndexMap.get(prevChild.key);
          }
          // 循环去查找 - key的好处
          else { // 没有key的话要在[startDifferentIndex, e2Index]中循环判断是否相等 - 设置key的好处出现啦，直接从缓存中获取
              // key-less node, try to locate a key-less node of the same type
              for (j = s2; j <= e2; j++) {
                  if (newIndexToOldIndexMap[j - s2] === 0 &&
                      isSameVNodeType(prevChild, c2[j])) {
                      newIndex = j; // 得到相同则break
                      break;
                  }
              }
          }
          // 找不到新结点的下标 - unmount老结点
          if (newIndex === undefined) { // 如果在新的结点中没有找到旧结点 => 说明旧结点被删除啦 => 执行unmount
              unmount(prevChild, parentComponent, parentSuspense, true);
          }
          else {
              // 否则新结点对应旧结点的映射关系更新: newIndex - s2 = newIndexMap.get(prevChild.key) - startDifferentIndex 
              // b 跑到新的位置是5,则 5 - s2 = 5 - startDifferentIndex = 5 - 2 = 3 => 3
              // => 需要匹配的数组下标对应着c1下标 + 1的元素

              // 新结点需要更新长度的下标对应老children的元素下标
              newIndexToOldIndexMap[newIndex - s2] = i + 1;
              if (newIndex >= maxNewIndexSoFar) { // 判断位置是否发生改变， 小下标的元素移到后面则maxIndexSoFar比大下标元素移到到后面要大
                  maxNewIndexSoFar = newIndex;
              }
              else { // 位置发生改变
                  moved = true;
              }
              patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, optimized);
              patched++; // 匹配次数  + 1
          }
      }
      // 5.3 move and mount
      // generate longest stable subsequence only when nodes have moved
      // newIndexToOldIndexMap: [5, 0, 4, 3]
      // 获取最大增长子序列: [3], 0是新增的不计入子序列中
      const increasingNewIndexSequence = moved
          ? getSequence(newIndexToOldIndexMap)
          : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      // looping backwards so that we can use last patched node as anchor
      // 倒序方便找后一个结点为参照物
      for (i = toBePatched - 1; i >= 0; i--) {
          const nextIndex = s2 + i;
          const nextChild = c2[nextIndex];
          // 参照物
          const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
          if (newIndexToOldIndexMap[i] === 0) { // 匹配后还是为0则是新增的结点
              // mount new - 挂载
              patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG);
          }
          else if (moved) {
              // move if:
              // There is no stable subsequence (e.g. a reverse)
              // OR current node is not among the stable sequence
              // 没有最长递增子序列或者当前的节点index不在最长递增子序列中 => 移动
              if (j < 0 || i !== increasingNewIndexSequence[j]) {
                  // nextChild插入anchor前
                  move(nextChild, container, anchor, 2 /* REORDER */);
              }
              else { // continue
                  j--;
              }
          }
      }
  }
};