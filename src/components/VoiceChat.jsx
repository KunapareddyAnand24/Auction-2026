import React, { Component } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { db } from '../firebase';

/**
 * VoiceChat – WebRTC group voice using PeerJS loaded from CDN.
 * Each participant:
 *   1. Gets a PeerJS peer (peerId = uid or randomId)
 *   2. Registers their peerId on Firebase: rooms/{roomCode}/peers/{peerId}
 *   3. Watches the peers node – connects to any peer they haven't called yet
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
        };
        this.peer = null;
        this.localStream = null;
        this.calls = {};       // peerId -> call object
        this.peerRef = null;
        this.peersListener = null;
        this.myPeerId = null;
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
        this.setState({ joining: true, error: null });
        try {
            await this.loadPeerJS();

            // Get microphone
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            // Create PeerJS instance
            this.peer = new window.Peer(undefined, {
                host: 'peerjs.deno.dev', // Free public PeerJS server
                secure: true,
                port: 443,
                path: '/',
                debug: 1,
            });

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                this.setState({ connected: true, joined: true, joining: false });
                this.registerPeer(id);
                this.listenForPeers();
            });

            this.peer.on('call', (call) => {
                call.answer(this.localStream);
                this.handleIncomingCall(call);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                this.setState({ error: `Voice error: ${err.type}`, joining: false });
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

    registerPeer = (id) => {
        if (!db || !this.props.roomCode) return;
        this.peerRef = ref(db, `rooms/${this.props.roomCode}/peers/${id}`);
        set(this.peerRef, {
            peerId: id,
            name: this.props.myName || 'User',
            joinedAt: Date.now()
        });
    };

    listenForPeers = () => {
        if (!db || !this.props.roomCode) return;
        const peersRef = ref(db, `rooms/${this.props.roomCode}/peers`);
        this.peersListener = onValue(peersRef, (snap) => {
            const data = snap.val();
            if (!data) return;
            const peerIds = Object.keys(data).filter(pid => pid !== this.myPeerId);
            this.setState({ peerCount: peerIds.length });

            // Call any new peers
            peerIds.forEach(pid => {
                if (!this.calls[pid] && this.peer) {
                    const call = this.peer.call(pid, this.localStream);
                    if (call) this.handleIncomingCall(call, pid);
                }
            });
        });
    };

    handleIncomingCall = (call, peerId) => {
        const pid = peerId || call.peer;
        this.calls[pid] = call;

        call.on('stream', (remoteStream) => {
            // Play remote audio
            let audio = document.getElementById(`voice-audio-${pid}`);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `voice-audio-${pid}`;
                audio.autoplay = true;
                audio.style.display = 'none';
                document.body.appendChild(audio);
            }
            audio.srcObject = remoteStream;
        });

        call.on('close', () => {
            delete this.calls[pid];
            const audio = document.getElementById(`voice-audio-${pid}`);
            if (audio) audio.remove();
            this.setState(s => ({ peerCount: Math.max(0, s.peerCount - 1) }));
        });
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
        if (this.peersListener) this.peersListener();
        if (this.peerRef) remove(this.peerRef);
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
        Object.values(this.calls).forEach(c => { try { c.close(); } catch (_) {} });
        this.calls = {};
        if (this.peer) { try { this.peer.destroy(); } catch (_) {} this.peer = null; }
        // Remove audio elements
        document.querySelectorAll('[id^=voice-audio-]').forEach(a => a.remove());
        this.setState({ joined: false, connected: false, peerCount: 0 });
    };

    render() {
        const { muted, connected, peerCount, error, joining, joined } = this.state;

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
                    <div className="voice-controls">
                        <button
                            className={`voice-btn ${muted ? 'voice-btn--muted' : 'voice-btn--active'}`}
                            onClick={this.toggleMute}
                            title={muted ? 'Unmute' : 'Mute'}
                        >
                            {muted ? '🔇' : '🎙️'}
                            <span>{muted ? 'Unmute' : 'Mute'}</span>
                        </button>
                        <button className="voice-btn voice-btn--leave" onClick={this.leaveVoice} title="Leave call">
                            📵 <span>Leave</span>
                        </button>
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
