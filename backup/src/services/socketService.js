import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  connect(userId) {
    if (this.socket) return;
    
    this.socket = io(API_BASE_URL, {
      transports: ['websocket'],
      query: { userId },
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      this.connected = true;
      
      // Request initial live data
      this.socket.emit('request-live-games');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Listen for live updates
    this.socket.on('live-score', this.handleLiveScore.bind(this));
    this.socket.on('odds-update', this.handleOddsUpdate.bind(this));
    this.socket.on('bet-matched', this.handleBetMatched.bind(this));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  handleLiveScore(data) {
    console.log('Live score update:', data);
    this.emitToListeners('live-score', data);
  }

  handleOddsUpdate(data) {
    console.log('Odds update:', data);
    this.emitToListeners('odds-update', data);
  }

  handleBetMatched(data) {
    console.log('Bet matched:', data);
    this.emitToListeners('bet-matched', data);
  }

  // Subscribe to events
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emitToListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Send actions to server
  placeLiveBet(betData) {
    if (this.socket && this.connected) {
      this.socket.emit('place-bet', betData);
      return true;
    }
    return false;
  }

  requestOddsUpdate(sport) {
    if (this.socket && this.connected) {
      this.socket.emit('request-odds', { sport });
    }
  }
}

export default new SocketService();
