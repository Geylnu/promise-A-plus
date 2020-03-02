import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import SelfPromise from '../src/main'

chai.use(sinonChai)

const assert = chai.assert

describe('test', () => {
    it('必须接受一个函数，否则抛出错误', () => {
        assert.throw(() => {
            // @ts-ignore
            new SelfPromise(true)
        })
    })
    
    
    it('构造函数中传入的函数必须被立即执行', () => {
        const fn = sinon.fake()
        new SelfPromise(fn)
        assert(fn.called)
    })
    
    it('必须具有then方法，then方法执行后返回一个新的实例', () => {
        assert.isFunction(new SelfPromise(() => { }).then)
        assert.instanceOf(new SelfPromise(() => { }).then(), SelfPromise)
        const testPromise = new SelfPromise(() => { })
        assert.notEqual(testPromise.then(), testPromise)
    })

    it('.then函数的onfulfilled函数必须在resolve函数调用后调用', done=>{
        const fn = sinon.fake()
        new SelfPromise(res=>res()).then(()=>{
            fn()
        })
        setTimeout(()=>{
            assert(fn.called === true)
            done()
        })
    })

    it('.then函数必须传入promise的最终值',done=>{
        const expectedValue = Math.floor(Math.random()*10000)
        new SelfPromise((res)=>{
            res(expectedValue)
        }).then(value=>{
            assert.equal(value, expectedValue)
            done()
        })
    })

    it('.then方法中传入的函数必须被异步调用', done => {
        const fn = sinon.fake()
        const onResolve = sinon.fake()
        new Promise((res)=>{
            fn()
            res()

        }).then(onResolve)
        assert(fn.called === true)
        assert(onResolve.called === false)
        
        globalThis.setTimeout(()=>{
            assert(onResolve.called === true)
            done()
        },1)
    })
})
