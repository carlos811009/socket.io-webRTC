import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as moment from 'moment';

// socket io client 
// import webSocket from 'socket.io-client'
import { io } from 'socket.io-client'
import { ActivatedRoute, ParamMap, Params } from '@angular/router';


class User {
  displayName!: string;
  email!: string;
  avatar!: string;
  timeZone!: string;
}

const options = {
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 2500000,
  mimeType: 'video/mp4'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'test-web';
  public user?: User;
  public token: any;
  public stream: any = {};
  public recorder: any
  public recordedBlobs: any = [];
  public text = ''
  public socket: any
  public roomNum = ''
  public role = ''
  public socketId = ''
  public videoTracks: any
  public audioTracks: any
  public localPeer: any
  public remotePeer: any
  public tracks: any
  public remoteRole = ''
  public remoteId = ''
  public remoteStream: any

  public members: Array<{ nickName: string, socketId: string }> = []
  public selfNickName = ''
  public hasSetNickName = false
  public self = { nickName: this.selfNickName, socketId: this.socketId }
  public publicGroup = 'aiii';
  public roomId = '';
  public messages: Array<{ socketId: string, message: string, nickName: string }> = [];
  public message = '';
  public privateMessage: any = {};
  private isOnLine = false;
  public onCall = false
  public isConnect = false
  public remoteIsOpenVideo = false
  public hasView = false;
  constructor(
    public http: HttpClient,
    private route: ActivatedRoute,
  ) { }

  async ngOnInit() {
  }

  handleMediaStreamError(err: any) {
    console.log('navigator.getUserMedia error: ', err);
  }

  // <---- getUserMedia start ---->

  // 取用使用者鏡頭畫面
  async openVideo(video: boolean = true) {
    const getUserMediaOption = {
      audio: true,
      video: video
    }
    this.stream = await navigator.mediaDevices.getUserMedia(getUserMediaOption)
      .catch(err => { this.handleMediaStreamError(err) })
    await this.gotLocalMediaStream(this.stream)
  }

  // 取得畫面的blob資訊
  async gotLocalMediaStream(stream: any) {
    console.log('gotLocalMediaStream', stream)
    const video: any = document.getElementById('selfVideo');
    video.srcObject = stream;
    // this.tracks = stream.getTracks()
    // this.videoTracks = stream.getVideoTracks();
    // this.audioTracks = stream.getAudioTracks();

    // // 如果getUserMedia的audio參數是false，audioTracks則會回傳[]，反之videoTracks也一樣
    // console.log('this.videoTracks', this.videoTracks)
    // console.log('this.audioTracks', this.audioTracks)

    video.onloadedmetadata = async () => {
      console.log('selfVideo test')
      await video.play(10);
    };
  }

  async closeCamera() {
    const video: any = document.querySelector('video');
    const stream = video.srcObject
    const tracks = stream.getTracks()
    tracks.forEach((track: any) => {
      track.stop();
    });

    video.srcObject = null;
  }
  startRecode(stream: any) {
    this.recorder = new MediaRecorder(stream);
    this.recorder.ondataavailable = (event: any) => {
      const blob = event.data;
      // const remoteVideo: any = document.getElementById('remoteVideo')
      // remoteVideo.srcObject = blob
      // this.socket.emit('toRemote', { socketId: this.socketId, roomId: this.roomId, blob, remoteId: this.remoteId })
    }
    this.socket.on('getVideo', (data: any) => {
      const blob = data.blob
      const id = data.socketId
      console.log(blob)
    })
    // 設定recode傳送時間區段
    this.recorder.start(100);
    // this.recorder.onstop = (event: any) => {
    //   console.log('Recorder stopped: ', event);
    //   // console.log('Recorded Blobs: ', recordedBlobs);
    // };
    // this.recorder.ondataavailable = this.handleDataAvailable;
    // this.recorder.start();
    // console.log('MediaRecorder started', this.recorder);
  }
  // 可以錄製
  handleDataAvailable(event: any) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      this.recordedBlobs.push(event.data);
      console.log(this.recordedBlobs)
    }
  }

  // <---- RTCPeerConnection again ---->
  initPeer() {
    console.log('initPeer')
    try {
      const configuration = {
        iceServers: [{
          urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
        }],
        video: { frameRate: { frameRate: { ideal: 8, max: 10 } } }
      };
      this.localPeer = new RTCPeerConnection(configuration);
      // this.localPeer.addStream(this.stream); // 都需要添加本地流
      this.stream.getTracks().forEach((track: any) => {
        this.localPeer.addTrack(track, this.stream)
      })
      const remoteVideo: any = document.getElementById('remoteVideo')
      this.localPeer.onicecandidate = (event: any) => {
        // 监听ICE候选信息 如果收集到，就发送给对方
        if (event.candidate) { // 发送 ICE 候选
          remoteVideo.srcObject = event.stream
          this.socket.emit('1v1ICE', { remoteRole: this.remoteRole, remoteId: this.remoteId, sdp: event.candidate });
        }
      }
      this.localPeer.ontrack = async (event: any) => {
        this.remoteStream = await event.streams[0];
        const videoTrack = await this.remoteStream.getVideoTracks();
        this.remoteIsOpenVideo = !!videoTrack.length;
        // setTimeout(() => {
        this.showRemote();
        // }, 1000)

      };
    } catch (err: any) {
      alert(err.message)
    }


  }

  async onOffer(data: any) {
    try {
      // 接收端设置远程 offer 描述
      await this.localPeer.setRemoteDescription(data.sdp);
      // 接收端创建 answer
      let answer = await this.localPeer.createAnswer();
      // 接收端设置本地 answer 描述
      await this.localPeer.setLocalDescription(answer);
      // 给对方发送 answer
      this.socket.emit('1v1answer', { remoteRole: this.remoteRole, remoteId: this.remoteId, sdp: answer });

    } catch (e) {
      console.log('onOffer: ', e);
    }
  }
  async onAnswer(data: any) { // 接收answer
    try {
      console.log('onAnswer', data)
      await this.localPeer.setRemoteDescription(data.sdp); // 呼叫端设置远程 answer 描述
    } catch (e) {
      console.log('onAnswer: ', e);
      this.initPeer()
      await this.createOwnOffer()
    }
  }
  async onIce(data: any) { // 接收 ICE 候选
    try {
      // console.log('onIce', this.socketId, data.sdp)
      await this.localPeer.addIceCandidate(data.sdp); // 设置远程 ICE
    } catch (e) {
      console.log('onIce: ', e);
    }
  }

  async createOwnOffer() {
    const signalOption = {
      offerToReceiveAudio: 1, // 是否傳送聲音流給對方
      offerToReceiveVideo: 1, // 是否傳送影像流給對方
    };
    try {
      const offer = await this.localPeer.createOffer(signalOption); // 创建 offer
      await this.localPeer.setLocalDescription(offer); // 接收端设置远程 offer 描述
      console.log('createOwnOffer', this.remoteId)
      this.socket.emit('1v1offer', { remoteRole: this.remoteRole, remoteId: this.remoteId, sdp: offer });
    } catch (e) {
      console.log('Offer-setRemoteDescription: ', e);
    }
  }

  showRemote() {
    const remoteVideo: any = document.getElementById('remoteVideo')
    remoteVideo.srcObject = this.remoteStream
    console.log(remoteVideo)
    remoteVideo.onloadedmetadata = ((async () => {
      console.log('remoteVideo onloadedmetadata')
      this.hasView = true;
      remoteVideo.play();
    })());
  }

  openWeb() {
    window.open('https://df06-220-136-84-10.ngrok.io/?role=sales&roomId=test112233445566')
  }

  closeWeb() {
    window.close()
  }

  // ---- sp function ----
  privateMsg(socketId: string) {
    this.remoteId = socketId
    this.socket.emit('private-message-apply', { remoteId: socketId, sendInfo: this.self })
  }
  setNickName() {
    if (!this.selfNickName) {
      alert('不要害羞，來取個可愛的名字吧！')
      return;
    }
    this.hasSetNickName = true
    this.connectToSocketServer()
  }

  // 連線並設立監聽
  async connectToSocketServer() {
    this.socket = io('https://eec2-220-136-89-202.ngrok.io')
    this.socket.on("connect", async () => {
      this.socketId = this.socket.id
      this.selfNickName = this.selfNickName || this.socketId
      this.self.nickName = this.selfNickName
      this.self.socketId = this.socketId
      if (this.roomId) {
        this.socket.emit('join-room', { ...this.self, roomId: this.roomId })
        this.isOnLine = true
      } else {
        this.socket.emit('join-room', { ...this.self, roomId: this.publicGroup })
      }
    });
    // aiii群組匿名
    this.socket.on('set-nickName', async (info: any) => {
      this.members.forEach((m: any) => {
        if (m.socketId === info.socketId) {
          m['nickName'] = info.nickName
        }
      })
    })

    // 房間廣播
    this.socket.on('room-broadcast', async (info: any) => {
      if (!info.status) {
        alert(info.message)
        this.hasSetNickName = false
        return;
      } else {
        this.remoteId = info.inTheRoom.filter((id: any, index: number) => {
          this.members[index] = { socketId: id, nickName: '' }
          return id !== this.socketId
        })[0]
        console.log('isOnLine', this.isOnLine)
        if (this.roomId) {
          if (info.inTheRoom.length > 1) {
            alert(info.message)
            this.isConnect = true

          } else {
            alert('等待配對中....！')
          }
        }

      }
      if (!this.roomId) {
        this.socket.emit('set-nickName', { socketId: this.socketId, nickName: this.selfNickName, roomId: this.publicGroup })
      }
    })

    this.socket.on('someoneP2P', (info: any) => {
      console.log('someoneP2P')
      this.socket.emit('set-nickName', { socketId: this.socketId, nickName: this.selfNickName, roomId: this.publicGroup })
    })

    // webRTC
    this.socket.on('1v1answer', (data: any) => { // 接收到 answer
      if (data.remoteId === this.socketId) {
        console.log('1v1answer')
        this.onAnswer(data);
      }
    });
    this.socket.on('1v1ICE', (data: any) => { // 接收到 ICE
      if (data.remoteId === this.socketId) {
        this.onIce(data);
      }
    });
    this.socket.on('1v1offer', (data: any) => { // 接收到 offer
      if (data.remoteId === this.socketId) {
        this.onOffer(data);
      }

    });

    // 訊息監聽
    this.socket.on('send-message', (info: any) => {
      if (info.roomId === 'aiii') {
        this.messages.push(info.sendInfo)
      } else {
        if (!this.privateMessage[info.roomId]) {
          this.privateMessage[info.roomId] = []
          this.privateMessage[info.roomId].push(info.sendInfo)
        } else {
          this.privateMessage[info.roomId].push(info.sendInfo)
        }
      }
    })

    // 私聊請求
    this.socket.on('private-message-message', (info: any) => {
      console.log('private-message-message', info)
      console.log(this.isOnLine)
      if (this.isOnLine) {
        this.socket.emit('private-message-reply', { result: false, remoteId: info.sendInfo.socketId, sendInfo: info.sendInfo, message: `${this.self.nickName}，正在忙線中` })
      } else {
        console.log('comform', `${info.sendInfo.nickName}，請求連線！`)
        if (confirm(`${info.sendInfo.nickName}，請求連線！`)) {
          this.socket.emit('private-message-reply', { remoteId: info.sendInfo.socketId, sendInfo: info.sendInfo, result: true, message: `正在建立連線中...` })
          this.remoteId = info.sendInfo.socketId
          this.roomId = `${this.remoteId}-${this.self.socketId}`
          this.socket.emit('join-room', { ...this.self, roomId: this.roomId })
          this.isOnLine = true
        } else {
          this.socket.emit('private-message-reply', { remoteId: info.sendInfo.socketId, sendInfo: info.sendInfo, result: false, message: `${this.self.nickName}，拒絕連線` })
        }
      }
    })

    this.socket.on('private-message-reply', (info: any) => {
      console.log('private-message-reply', info)
      if (!info.result) {
        alert(info.message)
        return;
      } else {
        this.roomId = `${this.self.socketId}-${this.remoteId}`
        this.socket.emit('join-room', { ...this.self, roomId: this.roomId })
        this.isOnLine = true
      }
    })
    this.socket.on('private-call-call', async (info: any) => {
      if (confirm(info.message)) {
        this.socket.emit('private-call-reply', { remoteId: this.remoteId, sendInfo: info.sendInfo, result: true, message: `正在建立通話中...！` })
        this.onCall = true
        await this.startLive()
      } else {
        this.socket.emit('private-call-reply', { remoteId: this.remoteId, sendInfo: info.sendInfo, result: false, message: `${this.self.nickName}，拒絕通話！` })
      }
    })

    this.socket.on('private-call-reply', async (info: any) => {
      console.log('private-call-reply', info)
      if (!info.result) {
        alert(info.message)
        return;
      } else {
        console.log(info)
        this.onCall = true
        this.isOnLine = true
        await this.startLive()
      }
    })


    // 離開群聊
    this.socket.on('leave-member', (id: any) => {
      const a = this.members
      for (let i = 0; i < this.members.length; i++) {
        const info = this.members[i]
        if (info.socketId === id) {
          this.members.splice(i, 1)
          return;
        }
      }
    });


    // 離開service
    this.socket.on("disconnected", (reason: any) => {
      console.log('reason', reason)
    });
  }

  // 訊息發送event
  sendMessage() {
    const room = this.roomId || this.publicGroup
    if (!!this.message) {
      this.socket.emit('send-message', { roomId: room, sendInfo: { message: this.message, ...this.self } })
      this.message = '';
    }
  }

  // 電話請求
  async privateCall() {
    this.socket.emit('private-call-apply', { remoteId: this.remoteId, sendInfo: this.self, message: `${this.self.nickName} 正播打視訊電話給你，是否接聽？` })
  }
  // 開始通話
  async startLive(open: boolean = true) {
    await this.openVideo(open)
    this.initPeer()
    await this.createOwnOffer()
  }

}
