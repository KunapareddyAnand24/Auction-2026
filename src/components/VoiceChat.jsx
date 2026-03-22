import React, { Component } from 'react';
import { ref, set, onValue, remove, onDisconnect } from 'firebase/database';
import { db } from '../firebase';

/**
 * VoiceChat – WebRTC group voice using PeerJS loaded from CDN.
 * Uses official 0.peerjs.com servers for reliability.
 */
class VoiceChat extends Component {
    constructor(props) {
        super(props);
        this.state = {
            muted: false,
            connected: false,
            peerCount: 0,
            error: null,
            joining: false,
            joined: false,
            speakingPeers: {}, // map of peerId -> boolean
            retryCount: 0
        };
        this.peer = null;
        this.localStream = null;
        this.calls = {};       // peerId -> call object
        this.peerRef = null;
        this.peersListener = null;
        this.myPeerId = null;
        this.audioContext = null;
        this.analysers = {}; // peerId -> analyser node
        this.speakingInterval = null;
        this.maxRetries = 3;
    }

    componentWillUnmount() {
        this.leaveVoice();
    }

    loadPeerJS = () => new Promise((resolve, reject) => {
        if (window.Peer) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load PeerJS'));
        document.head.appendChild(script);
    });

    joinVoice = async () => {
        this.setState({ joining: true, error: null, retryCount: 0 });
        await this.initializeVoice();
    };

    initializeVoice = async () => {
        try {
            await this.loadPeerJS();

            // Get microphone if we don't already have it
            if (!this.localStream) {
                this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            }
            
            // Set up local audio analyser for self-speaking indicator
            this.setupAudioAnalyser('local', this.localStream);

            // Create PeerJS instance using official server with reliable STUN
            this.peer = new window.Peer(undefined, {
                host: '0.peerjs.com', 
                secure: true,
                port: 443,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ]
                },
                debug: 1,
            });

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                this.setState({ connected: true, joined: true, joining: false, retryCount: 0, error: null });
                this.registerPeer(id);
                this.listenForPeers();
                
                // Start monitoring speaking status
                if (!this.speakingInterval) {
                    this.speakingInterval = setInterval(this.checkSpeakingStatus, 100);
                }
            });

            this.peer.on('call', (call) => {
                // Ignore if we already have a call with this peer to prevent duplicates
                if (this.calls[call.peer]) {
                    console.log('Ignoring duplicate incoming call from', call.peer);
                    return;
                }
                call.answer(this.localStream);
                this.handleCall(call);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                // Handle specific errors
                if (err.type === 'network' || err.type === 'server-error' || err.type === 'unavailable-id') {
                     this.handleDisconnectAndRetry();
                } else if (err.type === 'peer-unavailable') {
                    // Just clean up the specific call that failed
                    const match = err.message.match(/Could not connect to peer (.*)/);
                    if (match && match[1]) {
                        this.cleanupCall(match[1]);
                    }
                } else {
                    this.setState({ error: `Voice error: ${err.type}`, joining: false });
                }
            });
            
            this.peer.on('disconnected', () => {
                console.log('Peer disconnected, attempting to reconnect...');
                if (this.peer && !this.peer.destroyed) {
                    this.peer.reconnect();
                }
            });

        } catch (err) {
            console.error('Voice join error:', err);
            this.setState({
                error: err.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow mic in browser settings.'
                    : err.message,
                joining: false
            });
        }
    };
    
    handleDisconnectAndRetry = () => {
        const { retryCount, maxRetries } = this.state;
        if (retryCount < maxRetries) {
            this.setState({ 
                retryCount: retryCount + 1, 
                error: `Connection lost. Retrying (${retryCount + 1}/${maxRetries})...`,
                connected: false
            });
            // Cleanup old peer
            if (this.peer) {
                this.peer.destroy();
                this.peer = null;
            }
            // Try again after a delay
            setTimeout(() => this.initializeVoice(), 2000);
        } else {
            this.setState({ 
                error: "Voice server connection failed after multiple retries. Please leave and rejoin.",
                joining: false,
                connected: false
            });
        }
    };

    registerPeer = (id) => {
        if (!db || !this.props.roomCode) return;
        this.peerRef = ref(db, `rooms/${this.props.roomCode}/peers/${id}`);
        set(this.peerRef, {
            peerId: id,
            name: this.props.myName || 'User',
            joinedAt: Date.now()
        });
        
        // Auto-remove on disconnect
        onDisconnect(this.peerRef).remove();
    };

    listenForPeers = () => {
        if (!db || !this.props.roomCode) return;
        const peersRef = ref(db, `rooms/${this.props.roomCode}/peers`);
        this.peersListener = onValue(peersRef, (snap) => {
            const data = snap.val();
            if (!data) {
                this.setState({ peerCount: 0 });
                return;
            }
            
            const allPeerIds = Object.keys(data);
            const otherPeerIds = allPeerIds.filter(pid => pid !== this.myPeerId);
            this.setState({ peerCount: otherPeerIds.length });

            // Call any new peers we aren't already calling
            otherPeerIds.forEach(pid => {
                if (!this.calls[pid] && this.peer && !this.peer.disconnected && !this.peer.destroyed) {
                    console.log('Calling new peer:', pid);
                    try {
                        const call = this.peer.call(pid, this.localStream);
                        if (call) this.handleCall(call, pid);
                    } catch (err) {
                        console.error("Error making call to", pid, err);
                    }
                }
            });
            
            // Clean up calls for peers that are no longer in Firebase
            Object.keys(this.calls).forEach(pid => {
                if (!allPeerIds.includes(pid)) {
                    this.cleanupCall(pid);
                }
            });
        });
    };

    handleCall = (call, peerIdOverride) => {
        const pid = peerIdOverride || call.peer;
        this.calls[pid] = call;

        call.on('stream', (remoteStream) => {
            // Play remote audio
            let audio = document.getElementById(`voice-audio-${pid}`);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `voice-audio-${pid}`;
                audio.autoplay = true;
                audio.style.display = 'none'; // Keep hidden, we handle UI separately
                document.body.appendChild(audio);
            }
            audio.srcObject = remoteStream;
            
            // Set up analyser for this remote stream to detect speaking
            this.setupAudioAnalyser(pid, remoteStream);
        });

        call.on('close', () => {
            this.cleanupCall(pid);
        });
        
        call.on('error', (err) => {
             console.error(`Call error with ${pid}:`, err);
             this.cleanupCall(pid);
        });
    };
    
    cleanupCall = (pid) => {
        if (this.calls[pid]) {
            try { this.calls[pid].close(); } catch(e) {}
            delete this.calls[pid];
        }
        
        const audio = document.getElementById(`voice-audio-${pid}`);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
        }
        
        if (this.analysers[pid]) {
            delete this.analysers[pid];
        }
        
        this.setState(s => {
            const newSpeaking = { ...s.speakingPeers };
            delete newSpeaking[pid];
            return { speakingPeers: newSpeaking };
        });
    };

    setupAudioAnalyser = (id, stream) => {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Only setup if context is running (overcoming browser autoplay policy if needed)
            if (this.audioContext.state !== 'running') {
                this.audioContext.resume().catch(e => console.warn("Could not resume audio context", e));
            }

            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;
            
            const track = stream.getAudioTracks()[0];
            if (!track) return;

            // use MediaStream directly
            const source = this.audioContext.createMediaStreamSource(new MediaStream([track]));
            source.connect(analyser);
            
            this.analysers[id] = { analyser, dataArray: new Uint8Array(analyser.frequencyBinCount) };
        } catch (err) {
            console.warn(`Could not setup audio analyser for ${id}:`, err);
        }
    };
    
    checkSpeakingStatus = () => {
        if (!this.state.connected) return;
        
        let changed = false;
        const newSpeaking = { ...this.state.speakingPeers };
        
        Object.keys(this.analysers).forEach(id => {
            const { analyser, dataArray } = this.analysers[id];
            
            // If local and muted, force not speaking
            if (id === 'local' && this.state.muted) {
                 if (newSpeaking[id]) {
                     newSpeaking[id] = false;
                     changed = true;
                 }
                 return;
            }
            
            try {
                analyser.getByteFrequencyData(dataArray);
                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                
                // Threshold for speaking
                const isSpeaking = average > 10;
                
                if (newSpeaking[id] !== isSpeaking) {
                    newSpeaking[id] = isSpeaking;
                    changed = true;
                }
            } catch (e) {
                // Ignore errors if stream ended or nodes disconnected
            }
        });
        
        if (changed) {
            this.setState({ speakingPeers: newSpeaking });
        }
    };

    toggleMute = () => {
        if (!this.localStream) return;
        const track = this.localStream.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            this.setState({ muted: !track.enabled });
        }
    };

    leaveVoice = () => {
        if (this.speakingInterval) {
            clearInterval(this.speakingInterval);
            this.speakingInterval = null;
        }
        if (this.peersListener) this.peersListener();
        if (this.peerRef) {
            remove(this.peerRef).catch(e => console.error("Error removing peer from DB", e));
            onDisconnect(this.peerRef).cancel();
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
        
        Object.keys(this.calls).forEach(pid => this.cleanupCall(pid));
        this.calls = {};
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(e => console.warn(e));
            this.audioContext = null;
        }
        this.analysers = {};
        
        if (this.peer) { 
            try { this.peer.destroy(); } catch (_) {} 
            this.peer = null; 
        }
        
        // Remove all dynamically created audio elements just in case
        document.querySelectorAll('audio[id^="voice-audio-"]').forEach(el => {
            el.srcObject = null;
            el.remove();
        });
        
        this.setState({ joined: false, connected: false, peerCount: 0, speakingPeers: {}, error: null });
    };

    render() {
        const { muted, connected, peerCount, error, joining, joined, speakingPeers } = this.state;
        const isSelfSpeaking = speakingPeers['local'] && !muted;

        return (
            <div className="voice-panel">
                <div className="voice-header">
                    🎙️ VOICE CHAT
                    {connected && (
                        <span className="voice-connected-badge">
                            <span className="voice-live-dot"></span>
                            LIVE · {peerCount + 1} in call
                        </span>
                    )}
                </div>

                {error && <div className="voice-error">{error}</div>}

                {!joined ? (
                    <button
                        className="btn btn-primary w-full py-3 font-bold"
                        onClick={this.joinVoice}
                        disabled={joining}
                    >
                        {joining ? '⏳ Connecting...' : '🎙️ Join Voice Call'}
                    </button>
                ) : (
                    <div className="voice-controls flex-col gap-2">
                        <div className="flex gap-2 w-full">
                            <button
                                className={`voice-btn flex-1 ${muted ? 'voice-btn--muted' : 'voice-btn--active'} ${isSelfSpeaking ? 'ring-2 ring-success' : ''}`}
                                onClick={this.toggleMute}
                                title={muted ? 'Unmute' : 'Mute'}
                            >
                                {muted ? '🔇' : '🎙️'}
                                <span>{muted ? 'Unmute' : 'Mute'}</span>
                            </button>
                            <button className="voice-btn voice-btn--leave flex-1" onClick={this.leaveVoice} title="Leave call">
                                📵 <span>Leave</span>
                            </button>
                        </div>
                        
                        {/* Status bar showing if others are speaking */}
                        {peerCount > 0 && (
                             <div className="text-xs text-secondary mt-1 flex justify-between items-center px-1">
                                 <span>{peerCount} other{peerCount > 1 ? 's' : ''} connected</span>
                                 {Object.keys(speakingPeers).some(id => id !== 'local' && speakingPeers[id]) && (
                                     <span className="text-success animate-pulse flex items-center gap-1">
                                        🗣️ Someone is speaking
                                     </span>
                                 )}
                             </div>
                        )}
                    </div>
                )}

                {joined && peerCount === 0 && (
                    <div className="voice-waiting">Waiting for others to join voice...</div>
                )}
            </div>
        );
    }
}

export default VoiceChat;

