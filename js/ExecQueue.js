//害怕短时间流量太大还和谐，提供一个队列执行器
//你要保证请求调用的相关代码都处于队列运行的管理


class ExecQueue {
    constructor() {
        this._queue = [];
        this._running = false;
    }

    exec(fn) {
        this._queue.push(fn);
        this._startDeferRun();
    }

    _startDeferRun() {
        if (this._running) {
            return;
        }
        this._deferRun();
    }

    _deferRun() {
        var me = this;
        var fn = this._queue.shift();
        if (!fn) {
            this._running = false;
            return;
        }

        setTimeout(() => {
            console.log('shift from queue and exec');
            me._deferRun();
            fn();
        }, this._randomTime());
        this._running = true;
    }

    _randomTime() {
        return parseInt(1000 + Math.random() * 1000, 10);
    }
}