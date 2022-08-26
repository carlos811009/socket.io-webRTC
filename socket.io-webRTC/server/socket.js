"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
var _1 = require(".");
var server = require('http').Server(_1.app)
    .listen(_1.port, function () {
    console.log('open server!');
});
var io = require('socket.io')(server);
var socket = function () {
    console.log('socket is running');
    io.on('connection', function (socket) {
        //經過連線後在 console 中印出訊息
        console.log('success connect!');
        //監聽透過 connection 傳進來的事件
        socket.on('getMessage', function (message) {
            //回傳 message 給發送訊息的 Client
            socket.emit('getMessage', message);
        });
    });
};
exports.socket = socket;
