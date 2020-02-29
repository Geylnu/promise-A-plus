import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

const assert = chai.assert

describe('test',()=>{
    it('必须接受一个函数，否则抛出错误',()=>{
        assert(1===1)
    })

    it('resolve和reject函数必须被异步调用',()=>{

    })
})
