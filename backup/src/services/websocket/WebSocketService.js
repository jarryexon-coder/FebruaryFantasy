import { NativeEventEmitter, NativeModules } from 'react-native';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventEmitter = new NativeEventEmitter();
    this.listeners = new Map();
  }

  connect() {
    const protocol = __DEV__ ? 'ws' : 'wss';
    const host = __DEV__ ? 'localhost:5000' : 'your-production-domain.com';
    const wsUrl = `${protocol}://${host}/ws`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.eventEmitter.emit('websocket_message', {
        type: 'connection_established',
        data: { connected: true }
      });
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.eventEmitter.emit('websocket_message', data);
        
        if (data.type === 'secret_phrase_event') {
          this.eventEmitter.emit('secret_phrase_event', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.eventEmitter.emit('websocket_message', {
        type: 'connection_lost',
        data: { connected: false }
      });
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connect();
        }, 3000);
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  subscribe(channel) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        channel: channel
      }));
    }
  }
  
  unsubscribe(channel) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel: channel
      }));
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  addEventListener(eventName, callback) {
    this.eventEmitter.addListener(eventName, callback);
  }
  
  removeEventListener(eventName, callback) {
    this.eventEmitter.removeListener(eventName, callback);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
