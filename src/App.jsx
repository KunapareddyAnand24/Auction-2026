import React, { Component } from 'react';
import './App.css';
import playersData from './data/playersData';
import RoomPage from './components/RoomPage';
import AuctionDashboard from './components/AuctionDashboard';
import ResultsPage from './components/ResultsPage';
import ModeSelector from './components/ModeSelector';
import ComputerAuction from './components/ComputerAuction';
import TransferWindow from './components/TransferWindow';
import UserProfile from './components/UserProfile';
import GameRules from './components/GameRules';
import AdminDashboard from './components/AdminDashboard';
import { ref, onValue } from 'firebase/database';
import { db, auth } from './firebase';
import emailjs from '@emailjs/browser';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

class LandingPage extends Component {
  render() {
    return (
      <div className="container h-80vh flex flex-col justify-center items-center text-center animate-fade-in">
        <h1 className="gradient-text text-6xl mb-4 font-black tracking-tight">APL AUCTION 2026</h1>
        <p className="text-secondary mb-12 max-w-lg text-lg" style={{ lineHeight: '1.7' }}>
          Step into the shoes of a franchise owner. Join the same lobby with friends across different devices and build your dream team.
        </p>
        <button className="btn btn-primary px-10 py-4 text-lg" onClick={() => this.props.setView('login')}>Enter Arena</button>
      </div>
    );
  }
}

class LoginPage extends Component {
  state = {
    isLogin: true,
    email: '',
    password: '',
    username: '',
    error: '',
    loading: false,
    signupSuccess: false,
    otpSent: false,
    userOtpInput: '',
    generatedOtp: '',
    resendTimer: 30,
    canResend: false,
  };

  resendInterval = null;

  componentWillUnmount() {
    if (this.resendInterval) clearInterval(this.resendInterval);
  }

  startResendTimer = () => {
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.setState({ resendTimer: 30, canResend: false });
    this.resendInterval = setInterval(() => {
      this.setState(prevState => {
        if (prevState.resendTimer <= 1) {
          clearInterval(this.resendInterval);
          return { resendTimer: 0, canResend: true };
        }
        return { resendTimer: prevState.resendTimer - 1 };
      });
    }, 1000);
  };

  handleResendOTP = async () => {
    const { email, username } = this.state;
    this.setState({ loading: true, error: '' });

    const newOtp = email === 'admin@aplauction.com' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    this.setState({ generatedOtp: newOtp });

    // Bypass actual email sending for admin
    if (email === 'admin@aplauction.com') {
      this.setState({ loading: false });
      this.startResendTimer();
      return;
    }

    const SERVICE_ID = "Auction";
    const TEMPLATE_ID = "template_jbushsq";
    const PUBLIC_KEY = "dZkHbznBmubYoRBoy";

    const templateParams = {
      to_email: email,
      passcode: newOtp,
      time: new Date().toLocaleTimeString(),
      to_name: username,
    };

    try {
      console.log("Resending OTP...", templateParams);
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      console.log("EmailJS Resend Success:", response.status, response.text);
      this.startResendTimer();
    } catch (emailErr) {
      console.error("EmailJS Resend Error:", emailErr);
      this.setState({ error: `Resend Error: ${emailErr?.text || emailErr?.message}` });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleAuthAction = async () => {
    const { isLogin, email, password, username } = this.state;
    this.setState({ error: '', loading: true });

    try {
      if (isLogin) {
        if (!email.trim() || !password.trim()) {
          throw new Error("Email and password cannot be empty.");
        }
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!email.trim() || !password.trim() || !username.trim()) {
          throw new Error("All fields are required.");
        }

        // Step 1: Generate and send OTP for SIGNUP
        const otp = email === 'admin@aplauction.com' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
        this.setState({ generatedOtp: otp, loading: true });
        console.log("Current email:", email, "Is Admin:", email === 'admin@aplauction.com');

        // Bypass actual email sending for the admin demo account
        if (email === 'admin@aplauction.com') {
          console.log("Admin bypass triggered. Code is 123456");
          this.setState({ otpSent: true, loading: false });
          return;
        }

        // EmailJS Configuration
        const SERVICE_ID = "Auction"; 
        const TEMPLATE_ID = "template_jbushsq";
        const PUBLIC_KEY = "dZkHbznBmubYoRBoy";

        const templateParams = {
          to_email: email,
          passcode: otp,    // Matching user's template variable
          time: new Date().toLocaleTimeString(), // For the {{time}} variable
          to_name: username,
        };

        try {
          console.log("Sending Initial OTP...", templateParams);
          const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
          console.log("EmailJS Initial Success:", response.status, response.text);
          this.setState({ otpSent: true });
          this.startResendTimer();
        } catch (emailErr) {
          console.error("EmailJS Error:", emailErr);
          const errorMsg = emailErr?.text || emailErr?.message || "Check your EmailJS credentials";
          this.setState({ error: `Email Error: ${errorMsg}` });
        }
      }
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleVerifyOTP = async () => {
    const { userOtpInput, generatedOtp, email, password, username } = this.state;
    if (userOtpInput === generatedOtp) {
      this.setState({ loading: true, error: '' });
      try {
        // Finalize Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
        await signOut(auth);
        this.setState({ 
          signupSuccess: true, 
          otpSent: false, 
          isLogin: true, 
          password: '',
          generatedOtp: '',
          userOtpInput: ''
        });
      } catch (err) {
        this.setState({ error: err.message, otpSent: false });
      } finally {
        this.setState({ loading: false });
      }
    } else {
      this.setState({ error: "Invalid OTP code. Please try again." });
    }
  };

  handleGoogleSignIn = async () => {
    this.setState({ error: '', loading: true });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        this.setState({ error: 'Popup blocked or closed. Please allow popups or try again.' });
      } else {
        this.setState({ error: err.message });
      }
    } finally {
      this.setState({ loading: false });
    }
  };

  handleGuestPlay = async () => {
    this.setState({ error: '', loading: true });
    try {
      const userCredential = await signInAnonymously(auth);
      await updateProfile(userCredential.user, { displayName: 'Guest Manager' });
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { isLogin, email, password, username, error, loading, signupSuccess, otpSent, userOtpInput, resendTimer, canResend } = this.state;

    if (otpSent) {
      return (
        <div className="container flex justify-center items-center h-80vh animate-fade-in">
          <div className="glass p-12 w-full max-w-md text-center">
            <h2 className="gradient-text text-3xl font-black mb-4">VERIFY EMAIL</h2>
            <p className="text-secondary mb-8 text-sm">
              We've sent a 6-digit verification code to <br/>
              <strong className="text-white">{email}</strong>
            </p>
            
            {error && <div className="alert-error">{error}</div>}

            <div className="mb-8">
              <input
                type="text"
                maxLength="6"
                placeholder="0 0 0 0 0 0"
                className="otp-input"
                value={userOtpInput}
                onChange={(e) => this.setState({ userOtpInput: e.target.value.replace(/\D/g, '') })}
              />
            </div>

            <div className="resend-container mb-8">
              {canResend ? (
                <button 
                  className="btn-resend" 
                  onClick={this.handleResendOTP}
                  disabled={loading}
                >
                  Resend Code
                </button>
              ) : (
                <span className="timer-text">
                  Resend code in <strong className="text-accent">{resendTimer}s</strong>
                </span>
              )}
            </div>

            <button 
              className="btn btn-primary w-full py-4 text-lg mb-4"
              onClick={this.handleVerifyOTP}
              disabled={userOtpInput.length !== 6 || loading}
            >
              Verify OTP
            </button>
            <button className="btn-guest" onClick={() => {
              if (this.resendInterval) clearInterval(this.resendInterval);
              this.setState({ otpSent: false });
            }}>
              Back to Sign Up
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container flex justify-center items-center h-80vh animate-fade-in">
        <div className="glass p-12 w-full max-w-md">
          {/* Signup Success */}
          {signupSuccess && (
            <div className="signup-success">
              ✅ Account created successfully! Please login with your credentials.
            </div>
          )}
          {/* Auth Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
              onClick={() => this.setState({ isLogin: true, error: '' })}
              disabled={loading}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
              onClick={() => this.setState({ isLogin: false, error: '' })}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="alert-error">{error}</div>}

          {!isLogin && (
            <div className="mb-4 text-left">
              <label className="text-sm text-secondary mb-1 block">Manager Name</label>
              <input
                type="text"
                placeholder="e.g. Akash Ambani"
                value={username}
                onChange={(e) => this.setState({ username: e.target.value })}
                disabled={loading}
              />
            </div>
          )}

          <div className="mb-4 text-left">
            <label className="text-sm text-secondary mb-1 block">Email</label>
            <input
              type="email"
              placeholder="manager@franchise.com"
              value={email}
              onChange={(e) => this.setState({ email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="mb-6 text-left">
            <label className="text-sm text-secondary mb-1 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => this.setState({ password: e.target.value })}
              disabled={loading}
            />
          </div>

          <button
            className="btn btn-primary w-full py-4 text-md font-bold mb-4"
            onClick={this.handleAuthAction}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login to Franchise' : 'Create Account')}
          </button>

          <div className="auth-divider">or continue with</div>

          {/* Google Sign-In */}
          <button className="btn-google mb-3" onClick={this.handleGoogleSignIn} disabled={loading}>
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Guest Play */}
          <button className="btn-guest" onClick={this.handleGuestPlay} disabled={loading}>
            👤 Play as Guest
          </button>
        </div>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'landing',
      user: null,
      email: null,
      authLoading: true,
      roomCode: null,
      players: playersData,
      teams: [],
      myTeamId: null,
      isHost: false,
      gameMode: null, // 'computer', 'multiplayer', 'quick'
    };
    this.roomListener = null;
    this.authListener = null;
  }

  componentDidMount() {
    if (auth) {
      this.authListener = onAuthStateChanged(auth, (user) => {
        if (user) {
          this.setState({
            user: user.displayName || user.email || 'Guest Manager',
            email: user.email,
            authLoading: false
          });

          // Sync user to Firestore so Admin can see them
          if (user.uid && user.email) {
            const userRef = doc(firestore, "users", user.uid);
            getDoc(userRef).then(docSnap => {
              if (!docSnap.exists()) {
                setDoc(userRef, {
                  uid: user.uid,
                  email: user.email,
                  username: user.displayName || 'Manager',
                  createdAt: new Date().toISOString(),
                }).catch(err => console.error("Error creating user doc", err));
              }
            }).catch(err => console.error("Error fetching user doc", err));
          }

          // Auto route to mode select if they were on landing or login
          if (this.state.view === 'landing' || this.state.view === 'login') {
            this.setState({ view: 'modeSelect' });
          }
        } else {
          this.setState({
            user: null,
            authLoading: false
          });

          if (this.state.view !== 'landing') {
            this.setState({ view: 'landing' });
          }
        }
      });
    } else {
      this.setState({ authLoading: false });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.roomCode && this.state.roomCode !== prevState.roomCode) {
      this.listenToRoom(this.state.roomCode);
    }
  }

  componentWillUnmount() {
    if (this.roomListener) this.roomListener();
    if (this.authListener) this.authListener();
  }

  listenToRoom = (code) => {
    if (!db) return;
    if (this.roomListener) this.roomListener();
    const roomRef = ref(db, `rooms/${code}`);
    this.roomListener = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.setState({ teams: data.teams || [] });
        if (data.maxPlayers) {
          this.setState({ players: playersData.slice(0, data.maxPlayers) });
        }

        // Auto-navigate based on room status
        if (data.status === 'active' || data.status === 'waiting') {
          if (this.state.view === 'room') {
            this.setState({ view: 'auction' });
          }
        } else if (data.status === 'transfer') {
          if (this.state.view === 'auction') {
            this.setState({ view: 'transfer' });
          }
        } else if (data.status === 'selection') {
          if (this.state.view === 'transfer') {
            this.setState({ view: 'selection' });
          }
        } else if (data.status === 'finished') {
          if (this.state.view === 'selection' || this.state.view === 'auction') {
            this.setState({ view: 'results' });
          }
        }
      }
    });
  };

  setView = (view) => this.setState({ view });
  setUser = (user) => this.setState({ user });
  setRoomCode = (code) => this.setState({ roomCode: code });
  setTeams = (teams) => this.setState({ teams });
  setMyTeamId = (teamId) => this.setState({ myTeamId: teamId });
  setIsHost = (val) => this.setState({ isHost: val });
  setGameMode = (mode) => this.setState({ gameMode: mode });

  renderView() {
    const { view, roomCode, players, teams, user } = this.state;

    // Automatic redirection bulletproof guard
    if (user && (view === 'landing' || view === 'login')) {
       return <ModeSelector setView={this.setView} setGameMode={this.setGameMode} />;
    }

    switch (view) {
      case 'landing':
        return <LandingPage setView={this.setView} />;
      case 'login':
        return <LoginPage setView={this.setView} setUser={this.setUser} />;
      case 'modeSelect':
        return <ModeSelector setView={this.setView} setGameMode={this.setGameMode} />;
      case 'room':
        return (
          <RoomPage
            setView={this.setView}
            setRoomCode={this.setRoomCode}
            setTeams={this.setTeams}
            setMyTeamId={this.setMyTeamId}
            setIsHost={this.setIsHost}
            teams={teams}
          />
        );
      case 'computerAuction':
        return (
          <ComputerAuction
            userName={this.state.user}
            setView={this.setView}
          />
        );
      case 'quickAuction':
        return (
          <ComputerAuction
            userName={this.state.user}
            setView={this.setView}
          />
        );
      case 'profile':
        return <UserProfile setView={this.setView} />;
      case 'auction':
        return (
          <AuctionDashboard
            players={players}
            teams={teams}
            roomCode={roomCode}
            myTeamId={this.state.myTeamId}
            isHost={this.state.isHost}
            setView={this.setView}
          />
        );
      case 'transfer':
        return (
          <TransferWindow
            roomCode={roomCode}
            myTeamId={this.state.myTeamId}
            setView={this.setView}
          />
        );
      case 'selection':
        return (
          <ResultsPage
            roomCode={roomCode}
            teams={teams}
            myTeamId={this.state.myTeamId}
            setView={this.setView}
          />
        );
      case 'results':
        return <ResultsPage roomCode={roomCode} teams={teams} myTeamId={this.state.myTeamId} setView={this.setView} />;
      case 'rules':
        return <GameRules setView={this.setView} />;
      case 'admin':
        return <AdminDashboard setView={this.setView} />;
      default:
        return <LandingPage setView={this.setView} />;
    }
  }

  handleLogout = async () => {
    try {
      if (this.state.roomCode) {
        this.setRoomCode(null);
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  }

  render() {
    if (this.state.authLoading) {
      return (
        <div className="App flex flex-col min-h-screen justify-center items-center relative z-0 bg-dark">
          <video autoPlay loop muted playsInline style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}>
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>
          <div className="text-2xl text-accent animate-pulse font-black tracking-widest relative z-10">CONNECTING TO LOBBY...</div>
        </div>
      );
    }

    return (
      <div className="App flex flex-col min-h-screen relative z-0 bg-dark">
        {!this.state.user ? (
          <video autoPlay loop muted playsInline style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}>
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>
        ) : (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.2, pointerEvents: 'none', backgroundImage: 'url(/ipl.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
        )}
        <nav className="navbar relative z-10 glass-nav">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => this.setView(this.state.user ? 'modeSelect' : 'landing')}>
            <div className="logo-box">APL</div>
            <div className="font-black text-2xl text-accent tracking-wide">AUCTION</div>
          </div>
          {this.state.user && (
            <div className="flex items-center gap-6">
              {this.state.email === 'admin@aplauction.com' && (
                <button
                  className="btn btn-primary px-4 py-2 text-xs font-bold"
                  onClick={() => this.setView('admin')}
                >
                  DASHBOARD
                </button>
              )}
              {this.state.roomCode && (
                <div className="glass px-4 py-2 text-sm font-bold flex items-center gap-2">
                  ROOM: <span className="text-accent">{this.state.roomCode}</span>
                </div>
              )}
              <button
                className="btn btn-outline px-4 py-2 text-xs font-bold"
                onClick={() => this.setView('profile')}
              >
                PROFILE
              </button>
              <div className="text-secondary text-sm hidden" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
                Manager: <span className="text-accent font-bold">{this.state.user}</span>
              </div>
              <button
                className="btn btn-danger px-4 py-2 text-xs font-bold"
                onClick={this.handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>
        <div className="p-8 flex-1 flex flex-col relative z-10">
          {this.renderView()}
        </div>
      </div>
    );
  }
}

export default App;
