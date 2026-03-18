import React, { Component } from 'react';

class GameRules extends Component {
    render() {
        return (
            <div className="container animate-fade-in flex flex-col justify-center items-center h-80vh text-center">
                <div className="glass p-10 max-w-2xl w-full">
                    <h1 className="gradient-text text-4xl mb-6 font-black tracking-tight uppercase">Rules of the Arena</h1>
                    
                    <div className="flex flex-col gap-6 text-left mb-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Squad & Purse</h3>
                                <p className="text-secondary text-sm">Every franchise starts with a budget of <strong>100 Cr</strong> to assemble a max squad of 18 players. Exhausting your purse disqualifies you from further bidding!</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-accent text-dark flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Auction Timing</h3>
                                <p className="text-secondary text-sm">You have <strong>20 seconds</strong> per player. Any last-second bids (under 5s) will reset the timer back to 5 seconds to give others a final chance!</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center font-bold text-xl text-dark flex-shrink-0">3</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">AI Match Prediction</h3>
                                <p className="text-secondary text-sm">After the auction, you must select your <strong>Playing XI (11) + 1 Impact Player</strong>. Our AI evaluates your squad's balance, batting depth, bowling economy, and strike rates to declare the winner.</p>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary w-full py-4 text-xl font-bold uppercase tracking-widest animate-pulse shadow-lg" onClick={() => this.props.setView('auction')}>
                        Understood, Enter Auction
                    </button>
                </div>
            </div>
        );
    }
}

export default GameRules;
