var inputCodeEl = document.querySelector('#code');
var inputNumEl = document.querySelector('#num');

var reg = /^[a-zA-Z]{2}\d+$/;

var remote = require('remote');
var app = remote.require('app');

app.commandLine.appendSwitch('proxy-server', '127.0.0.1:1080');

var request = remote.require('request');
var fs = remote.require('fs');
var dialog = remote.require('dialog');
var path = require('path');

var validateCode = (code) => {
    if (!reg.test(code)) {
        alert('请输入形如 AG4999 的编号！');
        return false;
    }
    return true;
}

var confirmDefaultOutDir = () => {
    var dir = inputSaveDirectoryEl.value;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    return dir;
};

var download = () => {
    var code = inputCodeEl.value.trim();
    var num = inputNumEl.value.trim();
    console.log(code,num);
    var dir = confirmDefaultOutDir();
    if (!validateCode(code)) {
        return;
    }
    if(!/^\d+$/.test(num)) {
        alert('请输入正确数量！');
        return;
    }
    Spider.downloadImage(code, num, dir);
};

var btnDownloadEl = document.querySelector('#download');
var btnBrowserEl = document.querySelector('#browser');
var btnAutoEl = document.querySelector('#auto');
var inputSaveDirectoryEl = document.querySelector('#saveDirectory');


var singleInputWrap = document.querySelector('#singleInput');
var multipleInputWrap = document.querySelector('#multipleInput');

btnDownloadEl.addEventListener('click', download);

btnBrowserEl.addEventListener('click', () => {
    inputSaveDirectoryEl.value = dialog.showOpenDialog({
        properties: ['openDirectory']
    });
});

btnAutoEl.addEventListener('click', () => {
    inputSaveDirectoryEl.value = path.join(app.getPath('downloads'), 'epdphoto');
});


btnAutoEl.click();