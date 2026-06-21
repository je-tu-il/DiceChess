import Peer from 'peerjs';

class PeerManager {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.onDataCallback = null;
    this.onConnectionCallback = null;
    this.onCloseCallback = null;
    this.isHost = false;
  }

  initialize(isHost, onOpen, onError, forceId) {
    this.isHost = isHost;
    
    // Generate a short 6 character room code or use forceId
    const shortId = isHost ? (forceId || Math.random().toString(36).substring(2, 8).toUpperCase()) : undefined;

    this.peer = new Peer(shortId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      if (onOpen) onOpen(id);
    });

    this.peer.on('connection', (conn) => {
      if (this.isHost) {
        if (this.connection) {
          // Already have a player, reject
          conn.close();
          return;
        }
        this.setupConnection(conn);
        if (this.onConnectionCallback) this.onConnectionCallback();
      }
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      if (onError) onError(err);
    });

    this.peer.on('disconnected', () => {
      // Reconnect to signaling server if disconnected
      if (!this.peer.destroyed) {
        this.peer.reconnect();
      }
    });
  }

  connect(hostId, onSuccess, onError) {
    if (!this.peer) return;
    const conn = this.peer.connect(hostId, { reliable: true });
    
    conn.on('open', () => {
      this.setupConnection(conn);
      if (onSuccess) onSuccess();
    });

    conn.on('error', (err) => {
      if (onError) onError(err);
    });
  }

  setupConnection(conn) {
    this.connection = conn;
    
    this.connection.on('data', (data) => {
      if (this.onDataCallback) this.onDataCallback(data);
    });

    this.connection.on('close', () => {
      this.connection = null;
      if (this.onCloseCallback) this.onCloseCallback();
    });
  }

  send(data) {
    if (this.connection && this.connection.open) {
      this.connection.send(data);
    }
  }

  onData(cb) {
    this.onDataCallback = cb;
  }

  onConnection(cb) {
    this.onConnectionCallback = cb;
  }

  onClose(cb) {
    this.onCloseCallback = cb;
  }

  disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const peerManager = new PeerManager();
