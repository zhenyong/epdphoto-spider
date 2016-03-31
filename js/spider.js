(() => {

    let instance = null;

    var remote = require('remote')
    var app = remote.require('app')
    var request = remote.require('request');
    var fs = remote.require('fs');

    var imageUrlQueue = new ExecQueue();
    var imageDownloadQueue = new ExecQueue();

    class Spider {

        constructor() {
            this._isReady = false;
            this._defaultFromData = null;
            this._pendingQueue = [];
            this._ready();
        }

        /**
         * 获取下载图片所需要的隐藏参数
         */
        _ready() {
            console.log('>>>ready');

            var match, formData = {},
                name, value;

            request('http://wz.epdphoto.com/index.aspx', (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    match = body.match(/<input.*name=.*$/igm);
                    if (!match) {
                        alert('规则变了，联系作者吧！')
                        return;
                    }
                    // 部分表单字段后面会覆盖
                    match.forEach((line) => {
                        name = line.match(/name="([^"]+)"/)[1];
                        value = line.match(/value="([^"]+)"/)[1];
                        formData[name] = value;
                    });
                    this._defaultFromData = formData;
                    this._isReady = true;

                    // 如果还没准备好前，调用了下载图片，则会进入等待队列
                    // 待准备好再处理该队列
                    this._runPendingQueue();
                    console.log('<<<ready');

                } else {
                    alert('网络不行，或者是被和谐了！');
                }
            })

        }

        _runPendingQueue() {
            var obj;
            while ((obj = this._pendingQueue.pop())) {
                this._downloadImage(obj.code, obj.dir);
            }
        }

        /**
         * 根据编号下载多张图片
         * @param  {String} code 起始图片的编号
         * @param  {[type]} num 一共下载多少张连续的图片
         * @param  {String} outDir 图片输出目录
         * @return 
         */
        downloadImage(code, num, outDir) {
            var codePrefix = code.substr(0, 2);
            var startNum = parseInt(code.substr(2), 10);
            var countedCode;
            num = parseInt(num, 10);
            for (var i = 0; i < num; i++) {
                countedCode = codePrefix + (startNum + i);
                this._downloadImage(countedCode, outDir);
            }
        }

        /**
         * 根据编号下载一张图片
         * @param  {String} code 图片编号
         * @param  {String} outDir 图片输出目录
         * @return 下载图片到指定目录
         */
        _downloadImage(code, outDir) {
            console.log('>>>download', code);

            var contentLength, chunkLength;

            if (!this._isReady) {
                this._pendingQueue.push({
                    code: code,
                    dir: outDir
                });
                return;
            }

            this._getImageUrlByCode(code, (error, imgUrl) => {
                if (error) {
                    alert(error);
                    return;
                }
                imageDownloadQueue.exec(() => {

                    request(imgUrl) //
                        .on('data', (data) => {
                            console.log('downloading ',code);
                            // console.log(data);
                        })
                        .on('response', function(response) {
                            contentLength = response.headers['content-length'];
                        })
                        .on('end', () => {
                            console.log('<<<end download image',code);
                        })
                        .pipe(fs.createWriteStream(path.join(outDir, path.basename(imgUrl))));
                });
            });
        }


        /**
         * [_getImageUrlByCode description]
         * @param  {[type]}   code [description]
         * @param  {Function} cb function (error, imgUrl)
         * 错误代码
         * @return {[type]}      [description]
         */
        _getImageUrlByCode(code, cb) {
            // 拷贝一份默认表单数据
            var formData = JSON.parse(JSON.stringify(this._defaultFromData));
            formData.txt_number = code;


            imageUrlQueue.exec(() => {

                request.post({
                    url: 'http://wz.epdphoto.com/index.aspx',
                    form: formData
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        if (/lbl_message.*查不到数据/.test(body)) {
                            cb('查找不到数据');
                            return;
                        }
                        // console.log(body);
                        var match = body.match(/<img id="Image1" src="([^"]+)".*\/>/);
                        var imgUrl;
                        if (match) {
                            imgUrl = match[1];
                            cb(null, imgUrl);
                        } else {
                            cb('我做不到！');
                        }
                    } else {
                        cb('网络有问题，或者被和谐了！');
                    }

                }).on('end', () => {
                    console.log('<<<end get image url',code);
                });

            });
        }

    }


    window.Spider = new Spider();

})();