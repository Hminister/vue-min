class XVue {
    // const o = new XVue({
    //     el: '#app',
    //     data: {
    //       test: '模板解析',
    //       foo: { bar: 'bar' },
    //       html: '<button>v-html test</button>'
    //     },
    //     methods: {
    //       onClick() {
    //         this.test = 'hello XVue'
    //       }
    //     }
    // })
    constructor(options) {
       this.$data = options.data
       this.$options = options
       //数据劫持
       this.observe(this.$data)
       //执行编译
       new Compile(options.el, this)
    }

    //@params: value | Object
    observe(value) {
        if(!value || typeof value !=='object') {
            return false
        }
        Object.keys(value).forEach(key => {
            //通知变化 get set
            this.defineReactive(value, key, value[key])
            // 为vue的data做属性代理 $data
            this.proxyData(key)
        })
    }
    
    defineReactive(obj, key, val) {
        //递归查找嵌套属性
        this.observe(val)

        // 创建Dep
        const dep = new Dep()
        Object.defineProperty(obj, key, {
            enumerable: true, //可枚举
            configurable: true, //可配置

            get() {
                Dep.target && dep.addDep(Dep.target) //Dep.target？？
                console.log(dep.deps);
                return val
            },

            set(newVal) {
                if(newVal === val) {
                    return false
                }
                val = newVal
                // 修改
                dep.notify()
            }
        })
    }

    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },

            set(newVal) {
                this.$data[key] = newVal
            }
        })
    }

}


class Dep {
    constructor() {
        //deps里面存放的是Watcher的实例
        this.deps = [] 
    }
    addDep(dep) {
        this.deps.push(dep)
    }
    // 通知所有watcher执行更新
    notify() {
        this.deps.forEach(dep => {
            dep.update()
        })
    }
}

class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm
        this.key = key
        this.cb = cb
        // 将来 new 一个监听器时，将当前 Watcher 实例附加到 Dep.target
        // 将来通过 Dep.target 就能拿到当时创建的 Watcher 实例
        Dep.target = this
        // 读取操作，主动触发 get，当前 Watcher 实例被添加到依赖管理器中 
        this.vm[this.key]
        // 清空操作，避免不必要的重复添加（再次触发 get 就不需要再添加 watcher 了）
        Dep.target = null;
    }
    update() {
        // console.log('from Watcher update: 视图更新啦！！！');
        // 通知页面做更新  
        this.cb.call(this.vm, this.vm[this.key])
    }
}