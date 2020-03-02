interface nextPromiseCallback {
    onfulfilled?: (value: unknown) => unknown,
    onrejected?: (reason: unknown) => unknown,
    resolve: SelfPromise["selfResolve"],
    reject: SelfPromise["selfReject"],
}

class SelfPromise {
    private static readonly PENDING = 'pending'
    private static readonly FULFILLED = 'fulfilled'
    private static readonly REJECTED = 'rejected'

    private state: 'pending' | 'fulfilled' | 'rejected' = "pending"
    private value: unknown

    constructor(executor: (resolve: (value?: unknown) => void, reject: (reason?: unknown) => void) => void) {
        if (typeof executor !== 'function'){
            throw new TypeError('executor must to be a function')
        }
        try {
            executor(this.selfResolve.bind(this), this.selfReject.bind(this))
        } catch (error) {
            this.selfReject(error)
        }
    }

    private callBacks: nextPromiseCallback[] = []

    private selfResolve(value?: unknown): void {
        this.transition(SelfPromise.FULFILLED, value)
    }

    private selfReject(reason?: unknown): void {
        this.transition(SelfPromise.REJECTED, reason)
    }

    private transition(status: 'fulfilled' | 'rejected', value?: unknown): void {
        if (this.state === SelfPromise.PENDING) {
            this.state = status
            this.value = value

            this.runCallbacks()
        }
    }

    private runCallbacks(): void {
        for (const callback of this.callBacks) {
            this.handleCallback(callback, this.value)
        }
    }

    private handleCallback(nextCallback: nextPromiseCallback, value?: unknown) {
        const { onfulfilled, onrejected, resolve, reject } = nextCallback
        let callback: ((value: unknown) => unknown) | undefined
        if (this.state === SelfPromise.FULFILLED) {
            callback = onfulfilled
        } else if (this.state === SelfPromise.REJECTED) {
            callback = onrejected
        } else {
            throw new Error('Incorrect status, expected status is either "fulfilled" or "rejected"')
        }

        if (typeof callback === 'function') {
            globalThis.setTimeout(() => {
                try {
                    if (typeof callback === 'function'){
                        resolve(callback.call(this, value))
                    }else{
                        throw new TypeError(' callback\'s type has changed ')
                    }
                } catch (error) {
                    reject(error)
                }
            })
        } else {
            throw new TypeError('"onfulfilled" or "onrejected" is expected to be a function')
        }
    }

    public then(onfulfilled?: (value: unknown) => unknown, onrejected?: (reason: unknown) => unknown): SelfPromise {
        return new SelfPromise((resolve, reject) => {
            if (this.state === SelfPromise.PENDING) {
                this.callBacks.push({ onfulfilled, onrejected, resolve, reject })
            } else {
                this.handleCallback({ onfulfilled, onrejected, resolve, reject }, this.value)
            }
        })
    }

}


export default SelfPromise