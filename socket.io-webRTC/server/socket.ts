import { app, port } from ".";
const server = require('http').Server(app)
  .listen(port, () => {
    console.log('open server!');
  })
const io = require('socket.io')(server);

export const socket = () => {
  console.log('socket is running')
  io.on('connection', socket => {
    //經過連線後在 console 中印出訊息
    console.log('success connect!')
    //監聽透過 connection 傳進來的事件
    socket.on('getMessage', message => {
      //回傳 message 給發送訊息的 Client
      socket.emit('getMessage', message)
    })
  })
}