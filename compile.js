// 扫描模板中所有依赖（指令、插值、绑定、事件等）创建更新函数和watcher
class Compile {
    // el是宿主元素或其选择器
    // vm当前Vue实例
    constructor(el, vm) {
        this.$el = document.querySelector(el)
        this.$vm = vm
        if(this.$el) {
            // 将dom节点转换为Fragment提高执行效率
            this.$fragment = this.node2Fragment(this.$el)
            // 执行编译，编译完成以后所有的依赖已经替换成真正的值
            this.compile(this.$fragment)
            // 将生成的结果追加至宿主元素
            this.$el.appendChild(this.$fragment)
        }
    }
    node2Fragment(el) {
        const $fragment = document.createDocumentFragment()
        let child
        // 将原生节点移动至fragment 表达式
        while ((child = el.firstChild)) {
            // appendChild 是移动操作，如果被插入的节点已经存在于当前文档的文档树中,则那个节点会首先从原先的位置移除,然后再插入到新的位置.
            //移动一个节点，child 就会少一个，最终结束循环
            $fragment.appendChild(child);
        }
        return $fragment
    }
    // 编译指定片段
    compile(el) {
        // NodeList 对象是一个节点的集合，是由 Node.childNodes 和 document.querySelectorAll 返回的。
        let childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if(this.isElementNode(node)) {
                // 元素节点要识别v-xx或@xx
                this.compileElement(node)
            } else if (this.isTextNode(node) && /\{\{(.*)\}\}/.test(node.textContent)) {
                // 文本节点，只关心{{msg}}格式
                this.compileText(node, RegExp.$1)// RegExp.$1RegExp的一个属性,指的是与正则表达式匹配的第一个 子匹配(以括号为标志)字符串
            }
            if(node.childNodes && node.childNodes.length) {
                this.compile(node)
            }
        })
    }

    compileElement(node) {
    // console.log('编译元素节点');
    // <div v-text="test" @click="onClick"></div>
        const attrs = node.attributes
        Array.from(attrs).forEach(attr => {
            const attrName = attr.name
            const exp = attr.value
            if(this.isDirective(attrName)) {
                //指令
                const dir = attrName.substring(2) //text 2到end
                //指令存在则执行
                this[dir] && this[dir](node, this.$vm, exp)
            } else if (this.isEventDirective(attrName)) {
                //事件
                const dir = attrName.substring(1) 
                //绑定事件
                this.eventHandler(node, this.$vm, exp, dir)
            }
        })
    }

    compileText(node, exp) {
        // console.log('编译文本节点');
        this.text(node, this.$vm, exp);
    }

    isElementNode(node) {
        return node.nodeType == 1 //元素节点
    }

    isTextNode(node) {
        return node.nodeType == 3 //元素节点
    }

    isDirective(attr) {
        return attr.indexOf('v-') == 0
    }

    isEventDirective(attr) {
        return attr.indexOf('@') == 0
    }

    // 文本更新
    text(node, vm, exp) {
        this.update(node, vm, exp, 'text');
    }

    // 处理html
    html(node, vm, exp) {
        this.update(node, vm, exp, 'html');
    }

    // 双向绑定
    model(node, vm, exp) {
        this.update(node, vm, exp, 'model')
        let val = vm.exp

        // 双绑还要处理视图对模型的更新
        node.addEventListener('input', e => {
            vm[exp] = e.target.value
        })
    }

    // 更新
    // 能够触发这个 update 方法的时机有两个：1-编译器初始化视图；2-Watcher更新视图
    update(node, vm, exp, dir) {
        let updateFn = this[dir + 'Updater']
        updateFn && updateFn(node, vm[exp])
        new Watcher(vm, exp, function(value) {
            updateFn && updateFn(node, value)
        })
    }

    textUpdater(node, value) {
        node.textContent = value;
    }

    htmlUpdater(node, value) {
        node.innerHTML = value;
    }

    modelUpdater(node, value) {
        node.value = value;
    }

    /*
    * @param exp value
    * @param dir key
    */
    eventHandler(node, vm, exp, dir) {
        let fn = vm.$options.methods && vm.$options.methods[exp]
        if(dir && fn) {
            node.addEventListener(dir, fn.bind(vm), false)
        }
    }
}
