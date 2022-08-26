import * as express from 'express'
import * as cors from 'cors';
// import { main } from './media';
// import { socket } from './socket';
import * as admin from 'firebase-admin'
export const app = express()
export const port = 8080
app.use(cors());
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
    // limit: '30mb'
  })
);

const adminBot = admin.initializeApp()
export const firestore = adminBot.firestore()

const server = require('http').createServer(app)


app.get('/join', () => [
  console.log('test')
])

// 將app server指派給 socket io
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', socket => {
  //經過連線後在 console 中印出訊息
  console.log('success connect!', socket.id)
  //監聽透過 connection 傳進來的事件
  socket.on('join-room', joinMemberInfo => {
    // console.log('joinMemberInfo', joinMemberInfo)
    const { roomId } = joinMemberInfo
    const original = socket.adapter.rooms.get(roomId) || {}
    if (roomId !== 'aiii' && (original.size || 0) >= 2) {
      io.to(socket.id).emit('room-broadcast', { status: false, message: '房間超過人數限制' })
      return
    }
    socket.join(roomId)
    const inTheRoom = socket.adapter.rooms.get(roomId) || []
    console.log(roomId, inTheRoom)
    if (roomId !== 'aiii') {
      socket.leave('aiii')
      const inAiii = socket.adapter.rooms.get('aiii') || []
      io.to('aiii').emit('leave-member', socket.id)
      io.to(roomId).emit('room-broadcast', { status: true, inTheRoom: Array.from(inTheRoom), message: `配對成功，開啟通話` })
      return
    }
    io.to(roomId).emit('room-broadcast', { status: true, inTheRoom: Array.from(inTheRoom), message: `加入Aiii` })
  })

  // 設定每個socketId的nickName
  socket.on('set-nickName', async (info: any) => {
    io.to(info.roomId).emit('set-nickName', info)
  })


  // webRTC
  socket.on('1v1offer', data => {
    const remoteId = data.remoteId
    console.log('1v1offer', remoteId)
    io.to(remoteId).emit('1v1offer', data)
  })
  socket.on('1v1ICE', data => {
    const remoteId = data.remoteId
    console.log('1v1ICE', remoteId)
    io.to(remoteId).emit('1v1ICE', data)
  })
  socket.on('1v1answer', data => {
    const remoteId = data.remoteId
    console.log('1v1answer', remoteId)
    io.to(remoteId).emit('1v1answer', data)
  })

  socket.on('send-message', info => {
    console.log(info)
    io.to(info.roomId).emit('send-message', info)
  })

  // 監聽私聊
  socket.on('private-message-apply', info => {
    io.to(info.remoteId).emit('private-message-message', info)
  })
  socket.on('private-message-reply', info => {
    io.to(info.remoteId).emit('private-message-reply', info)
  })

  socket.on('private-call-apply', info => {
    io.to(info.remoteId).emit('private-call-call', info)
  })
  socket.on('private-call-reply', info => {
    io.to(info.remoteId).emit('private-call-reply', info)
  })


  socket.on('disconnect', async () => {
    console.log(`socket 用戶離開 ${socket.id}`);
    io.to('aiii').emit('leave-member', socket.id) // test
    io.emit('disconnected', socket.id);

    const socketIdRef = firestore.doc(`/sites/msd/connect-sockets/${socket.id}`)
    if ((await socketIdRef.get()).exists) {
      await socketIdRef.delete() // 斷線後清除原本的連線紀錄
    }
    // const socketId = socket.id
    // const roomId = socket.adapter.rooms.get('All')[socketId].roomId
    // delete socket.adapter.rooms.get('All')[socketId]
    // const original = socket.adapter.rooms.get('All')
    // socket.adapter.rooms.set('All', original)
    // const inTheRoom = socket.adapter.rooms.get(roomId) || []
    // io.to(roomId).emit('room-broadcast', { inTheRoom: Array.from(inTheRoom), allInfo: original })
  });
})
server.listen(port, () => {
  console.log(port, 'open server!');
})