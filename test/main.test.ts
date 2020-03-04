'use strict'

import chai from 'chai'
import sinon, { fake } from 'sinon'
import sinonChai from 'sinon-chai'

import SelfPromise from '../src/main'
import { describe } from 'mocha'

chai.use(sinonChai)

const assert = chai.assert

describe('Promise', () => {

    describe('# 基本测试', () => {
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

        it('状态确定后，promise的值和状态都不能改变', done => {
            new Promise((res, rej) => {
                res('first')
                res('second')
            }).then(value => {
                assert.equal(value, 'first')
            }, value => {
                assert.isUndefined(value)
            }).then(undefined, reason => {
                throw reason
            })

            new Promise((res, rej) => {
                res('first')
                rej('second')
            }).then(value => {
                assert.equal(value, 'first')
            }, value => {
                assert(false)
                assert.isUndefined(value)
            }).then(undefined, reason => {
                throw reason
            })

            new Promise((res, rej) => {
                res('first')
                throw new Error('second')
            }).then(value => {
                assert.equal(value, 'first')
                done()
            }, value => {
                assert(false)
                assert.isUndefined(value)
                done()
            }).then(undefined, reason => {
                throw reason
            })
        })


    })

    describe('# then方法', () => {
        it('必须具有then方法', () => {
            assert.isFunction(new SelfPromise(() => { }).then)
        })

        it('onfulfilled或onRejected都应是可选的参数, 如果传入的不是函数，他们将被直接忽略', () => {
            assert.doesNotThrow(() => {
                new Promise(() => 10).then().then()
            })

            assert.doesNotThrow(() => {
                // @ts-ignore
                new Promise(() => 10).then('test', 'test').then(555, 555)
            })
        })

        describe('* 如果onfulfilled是一个函数', () => {
            it('onfulfilled函数必须在resolve函数调用后, 以promise的值调用', done => {
                const fn = sinon.fake()
                new SelfPromise(res => res('test value')).then(value => {
                    fn()
                    assert.equal('test value', value)
                }).then(undefined, reason => {
                    throw reason
                })
                setTimeout(() => {
                    assert(fn.called === true)
                    done()
                })
            })

            it('onfulfilled函数不能在resolve函数调用前调用', done => {
                const fn = sinon.fake()
                new SelfPromise(res => {
                    assert(fn.called === false)
                }).then(fn).then(undefined, reason => {
                    throw reason
                })

                setTimeout(() => {
                    assert(fn.called === false)
                })

                const fn2 = fake()
                new SelfPromise(res => {
                    assert(fn2.called === false)
                    res('test')
                }).then(fn2).then(undefined, reason => {
                    throw reason
                })

                setTimeout(() => {
                    assert(fn2.called === true)
                    done()
                })
            })

            it('onfulfilled函数不能被多次调用', done => {
                const fn = sinon.fake()
                new SelfPromise((res, rej) => {
                    res('dfgdf')
                    res('gdgd')
                    rej('fdhgdfhd')
                }).then(fn)

                setTimeout(() => {
                    assert(fn.calledOnce)
                    done()
                })
            })
        })

        describe('* 如果onrejected是一个函数', () => {
            it('onfulfilled函数必须在reject函数调用后后, 以错误原因调用', done => {
                const fn = sinon.fake()
                new SelfPromise((res, rej) => rej('test value')).then(undefined, reason => {
                    fn()
                    assert.equal('test value', reason)
                })

                const fn2 = sinon.fake()
                new SelfPromise((res, rej) => {
                    rej('test value')
                    res()
                }).then(undefined, reason => {
                    fn2()
                    assert.instanceOf(reason, Error)
                })
                
                setTimeout(() => {
                    assert(fn.called === true)
                    assert(fn2.called === true)
                    done()
                })
            })

            it('onrejected函数不能在resolve函数调用前调用', done => {
                const fn = sinon.fake()
                new SelfPromise(() => {
                    assert(fn.called === false)
                }).then(fn).then(undefined, reason => {
                    throw reason
                })

                setTimeout(() => {
                    assert(fn.called === false)
                })

                const fn2 = fake()
                new SelfPromise((res, rej) => {
                    assert(fn2.called === false)
                    rej('test')
                }).then(undefined, fn2).then(undefined, reason => {
                    throw reason
                })

                setTimeout(() => {
                    assert(fn2.called === true)
                    done()
                })
            })

            it('onrejected函数不能被多次调用', done => {
                const fn = sinon.fake()
                new SelfPromise((res, rej) => {
                    rej()
                    rej()
                    rej()
                    rej()
                    throw Error('test Error , only use at test case')
                }).then(undefined, fn)

                setTimeout(() => {
                    assert(fn.calledOnce)
                    done()
                })
            })
        })

        it('.then方法中传入的函数必须被异步调用', done => {
            const fn = sinon.fake()
            const onResolve = sinon.fake()
            new Promise((res) => {
                fn()
                res()

            }).then(onResolve)
            assert(fn.called === true)
            assert(onResolve.called === false)

            globalThis.setTimeout(() => {
                assert(onResolve.called === true)
                done()
            }, 1)
        })

        it('onFulfilled函数 和 onRejected函数必须像函数一样被调用，例如没有this', done => {
            const resThis = sinon.fake()
            const rejThis = sinon.fake()
            new SelfPromise(res => res()).then(resThis)


            new SelfPromise((res, rej) => rej()).then(undefined, rejThis)

            setTimeout(() => {
                assert.isUndefined(resThis.thisValues[0])
                assert.isUndefined(rejThis.thisValues[0])
                done()
            })
        })

        it('.then方法可以在同一个Promise上调用多次,并按照先后顺序执行回调', done => {
            const fns = [sinon.fake(), sinon.fake(), sinon.fake()]
            const promise = new SelfPromise(res => res())
            for (const fn of fns) {
                promise.then(fn)
            }

            setTimeout(() => {
                const [fn1, fn2, fn3] = fns
                fn1.calledBefore(fn2)
                fn1.calledBefore(fn3)
                fn2.calledBefore(fn3)
            })

            const fns2 = [sinon.fake(), sinon.fake(), sinon.fake()]
            const promise2 = new SelfPromise((res,rej) => rej())
            for (const fn of fns) {
                promise2.then(undefined,fn)
            }

            setTimeout(() => {
                const [fn1, fn2, fn3] = fns2
                fn1.calledBefore(fn2)
                fn1.calledBefore(fn3)
                fn2.calledBefore(fn3)
                done()
            })
        })

        describe('then方法执行后返回一个Promise', () => {
            it('返回的promise必须是一个新的实例',()=>{
                assert.instanceOf(new SelfPromise(() => { }).then(), SelfPromise)
                const testPromise = new SelfPromise(() => { })
                assert.notEqual(testPromise.then(), testPromise)
            })
        })

    })

})
