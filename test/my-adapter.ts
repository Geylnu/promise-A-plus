import SelfPromise from '../src/main'

export const resolved = SelfPromise.resolve
export const rejected = SelfPromise.reject
export const deferred = ()=>{
    let resolve: Function =()=>{}, reject: Function = ()=>{}
    const promise = new SelfPromise((res,rej)=>{
        resolve = res
        reject = rej
    })

    return {
        promise,
        resolve,
        reject
    }
}