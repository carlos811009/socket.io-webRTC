"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestore = exports.port = exports.app = void 0;
var express = require("express");
var cors = require("cors");
// import { main } from './media';
// import { socket } from './socket';
var admin = require("firebase-admin");
exports.app = express();
exports.port = 8080;
exports.app.use(cors());
exports.app.use(express.json());
exports.app.use(express.urlencoded({
    extended: true,
    // limit: '30mb'
}));
var adminBot = admin.initializeApp();
exports.firestore = adminBot.firestore();
var server = require('http').createServer(exports.app);
exports.app.get('/join', function () { return [
    console.log('test')
]; });
// 將app server指派給 socket io
var io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});
io.on('connection', function (socket) {
    //經過連線後在 console 中印出訊息
    console.log('success connect!', socket.id);
    //監聽透過 connection 傳進來的事件
    socket.on('join-room', function (joinMemberInfo) {
        // console.log('joinMemberInfo', joinMemberInfo)
        var roomId = joinMemberInfo.roomId;
        var original = socket.adapter.rooms.get(roomId) || {};
        if (roomId !== 'aiii' && (original.size || 0) >= 2) {
            io.to(socket.id).emit('room-broadcast', { status: false, message: '房間超過人數限制' });
            return;
        }
        socket.join(roomId);
        var inTheRoom = socket.adapter.rooms.get(roomId) || [];
        console.log(roomId, inTheRoom);
        if (roomId !== 'aiii') {
            socket.leave('aiii');
            var inAiii = socket.adapter.rooms.get('aiii') || [];
            io.to('aiii').emit('leave-member', socket.id);
            io.to(roomId).emit('room-broadcast', { status: true, inTheRoom: Array.from(inTheRoom), message: "\u914D\u5C0D\u6210\u529F\uFF0C\u958B\u555F\u901A\u8A71" });
            return;
        }
        io.to(roomId).emit('room-broadcast', { status: true, inTheRoom: Array.from(inTheRoom), message: "\u52A0\u5165Aiii" });
    });
    // 設定每個socketId的nickName
    socket.on('set-nickName', function (info) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            io.to(info.roomId).emit('set-nickName', info);
            return [2 /*return*/];
        });
    }); });
    // webRTC
    socket.on('1v1offer', function (data) {
        var remoteId = data.remoteId;
        console.log('1v1offer', remoteId);
        io.to(remoteId).emit('1v1offer', data);
    });
    socket.on('1v1ICE', function (data) {
        var remoteId = data.remoteId;
        console.log('1v1ICE', remoteId);
        io.to(remoteId).emit('1v1ICE', data);
    });
    socket.on('1v1answer', function (data) {
        var remoteId = data.remoteId;
        console.log('1v1answer', remoteId);
        io.to(remoteId).emit('1v1answer', data);
    });
    socket.on('send-message', function (info) {
        console.log(info);
        io.to(info.roomId).emit('send-message', info);
    });
    // 監聽私聊
    socket.on('private-message-apply', function (info) {
        io.to(info.remoteId).emit('private-message-message', info);
    });
    socket.on('private-message-reply', function (info) {
        io.to(info.remoteId).emit('private-message-reply', info);
    });
    socket.on('private-call-apply', function (info) {
        io.to(info.remoteId).emit('private-call-call', info);
    });
    socket.on('private-call-reply', function (info) {
        io.to(info.remoteId).emit('private-call-reply', info);
    });
    socket.on('disconnect', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socketIdRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("socket \u7528\u6236\u96E2\u958B ".concat(socket.id));
                    io.to('aiii').emit('leave-member', socket.id); // test
                    io.emit('disconnected', socket.id);
                    socketIdRef = exports.firestore.doc("/sites/msd/connect-sockets/".concat(socket.id));
                    return [4 /*yield*/, socketIdRef.get()];
                case 1:
                    if (!(_a.sent()).exists) return [3 /*break*/, 3];
                    return [4 /*yield*/, socketIdRef.delete()]; // 斷線後清除原本的連線紀錄
                case 2:
                    _a.sent(); // 斷線後清除原本的連線紀錄
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
});
server.listen(exports.port, function () {
    console.log(exports.port, 'open server!');
});
