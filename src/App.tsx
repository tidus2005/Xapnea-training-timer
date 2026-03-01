import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Timer, Activity, RotateCcw, Settings, CheckCircle2, History, ChevronLeft, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type AppState = 'idle' | 'prep' | 'ready' | 'dive' | 'post-dive' | 'summary' | 'history';

interface RoundRecord {
  round: number;
  prepTime: number;
  diveTime: number;
}

interface SessionRecord {
  id: string;
  date: string;
  rounds: RoundRecord[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentRound, setCurrentRound] = useState(1);
  const [prepTimeLeft, setPrepTimeLeft] = useState(120);
  const [diveTimeElapsed, setDiveTimeElapsed] = useState(0);
  const [postDiveTimeLeft, setPostDiveTimeLeft] = useState(10);
  const [currentSessionRounds, setCurrentSessionRounds] = useState<RoundRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  
  const [initialPrepTime, setInitialPrepTime] = useState(120);
  const [preparationDecrement, setPreparationDecrement] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch((e) => console.error('Failed to load sessions', e));
  }, []);

  const saveSession = (rounds: RoundRecord[]) => {
    if (rounds.length === 0) return;
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rounds }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session) setSessions((prev) => [data.session, ...prev]);
      })
      .catch((e) => console.error('Failed to save session', e));
  };

  const deleteSession = (id: string) => {
    fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (r.ok || r.status === 204) setSessions((prev) => prev.filter((s) => s.id !== id));
        else console.error('Failed to delete session', r.status);
      })
      .catch((e) => console.error('Failed to delete session', e));
  };

  const playSound = (type: 'prep-end' | 'dive-start' | 'dive-end' | 'thirty-sec') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'prep-end') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'dive-start') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = 'square';
          osc2.frequency.setValueAtTime(660, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
          osc2.stop(ctx.currentTime + 0.4);
        }, 200);
      } else if (type === 'dive-end') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'thirty-sec') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const getPrepTimeForRound = (round: number) => {
    const time = initialPrepTime - (round - 1) * preparationDecrement;
    return Math.max(time, 0);
  };

  useEffect(() => {
    if (appState === 'prep') {
      timerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            playSound('prep-end');
            setAppState('ready');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (appState === 'dive') {
      timerRef.current = setInterval(() => {
        setDiveTimeElapsed((prev) => {
          const next = prev + 1;
          if (next % 30 === 0) {
            playSound('thirty-sec');
          }
          return next;
        });
      }, 1000);
    } else if (appState === 'post-dive') {
      timerRef.current = setInterval(() => {
        setPostDiveTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState, soundEnabled]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTraining = () => {
    setCurrentRound(1);
    setCurrentSessionRounds([]);
    setPrepTimeLeft(getPrepTimeForRound(1));
    setAppState('prep');
  };

  const startFreediving = () => {
    playSound('dive-start');
    setDiveTimeElapsed(0);
    setAppState('dive');
  };

  const endFreediving = () => {
    playSound('dive-end');
    const newRecord = {
      round: currentRound,
      prepTime: getPrepTimeForRound(currentRound),
      diveTime: diveTimeElapsed,
    };
    setCurrentSessionRounds((prev) => [...prev, newRecord]);
    
    setPostDiveTimeLeft(10);
    setAppState('post-dive');
  };

  const startNextRound = () => {
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setPrepTimeLeft(getPrepTimeForRound(nextRound));
    setAppState('prep');
  };

  const finishTraining = () => {
    saveSession(currentSessionRounds);
    setAppState('summary');
  };

  const resetApp = () => {
    setAppState('idle');
    setCurrentRound(1);
    setCurrentSessionRounds([]);
  };

  const trendData = sessions.slice().reverse().map((s, i) => {
    const avgDive = s.rounds.reduce((acc, r) => acc + r.diveTime, 0) / s.rounds.length;
    const avgRec = s.rounds.reduce((acc, r) => acc + r.prepTime, 0) / s.rounds.length;
    return {
      name: `S${i+1}`,
      avgDive: Math.round(avgDive),
      avgRec: Math.round(avgRec)
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col">
        <header className="flex items-center justify-center py-6 mb-8 border-b border-slate-800/50">
          <Activity className="w-6 h-6 text-cyan-400 mr-3" />
          <h1 className="text-xl font-medium tracking-wide text-slate-200 uppercase">Apnea Training</h1>
        </header>

        <main className="flex-1 flex flex-col">
          {appState === 'idle' && (
            <div className="flex-1 flex flex-col justify-center space-y-6 animate-in fade-in duration-500">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-slate-400 mr-2" />
                    <h2 className="text-lg font-medium text-slate-300">Training Settings</h2>
                  </div>
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}
                    title="Toggle Sounds"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Preparation Time</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={initialPrepTime}
                        onChange={(e) => setInitialPrepTime(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                      />
                      <span className="ml-3 text-slate-500 text-sm">sec</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Preparation Decrement per Round</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={preparationDecrement}
                        onChange={(e) => setPreparationDecrement(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                      />
                      <span className="ml-3 text-slate-500 text-sm">sec</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setAppState('history')}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium py-4 rounded-2xl transition-all flex items-center justify-center"
                >
                  <History className="w-5 h-5 mr-2" />
                  History
                </button>
                <button 
                  onClick={startTraining}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </button>
              </div>
            </div>
          )}

          {appState === 'history' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center mb-6">
                <button 
                  onClick={() => setAppState('idle')}
                  className="p-2 -ml-2 mr-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-medium text-slate-200">Session History</h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2 pb-8">
                {sessions.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">No training history yet.</div>
                ) : (
                  <>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-slate-300 mb-4">Overall Trends (Averages)</h3>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="avgDive" name="Avg Dive (s)" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="avgRec" name="Avg Recovery (s)" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-slate-300">Session Details</h3>
                      {sessions.map((session) => (
                        <div key={session.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                          <div className="text-sm text-slate-400 mb-4 flex justify-between items-center">
                            <span>{new Date(session.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400">{session.rounds.length} Rounds</span>
                              <button
                                type="button"
                                onClick={() => deleteSession(session.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="h-40 w-full mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={session.rounds.map(r => ({ name: `R${r.round}`, dive: r.diveTime, rec: r.prepTime }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} cursor={{ fill: '#1e293b' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="dive" name="Dive Time" fill="#22d3ee" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="rec" name="Recovery" fill="#64748b" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="space-y-2">
                            {session.rounds.map((r, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Round {r.round}</span>
                                <div className="flex space-x-4">
                                  <span className="text-slate-400">
                                    {r.round === 1 ? 'Prep' : 'Rec'}: {formatTime(r.prepTime)}
                                  </span>
                                  <span className="text-cyan-400 font-mono w-12 text-right">{formatTime(r.diveTime)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {(appState === 'prep' || appState === 'ready' || appState === 'dive') && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
              <div className="text-cyan-400 font-medium tracking-widest uppercase text-sm mb-2">
                Round {currentRound}
              </div>
              
              <div className="text-slate-400 mb-8">
                {appState === 'prep' && (currentRound === 1 ? 'Preparation Phase' : 'Recovery Phase')}
                {appState === 'ready' && 'Ready to Dive'}
                {appState === 'dive' && 'Freediving'}
              </div>

              <div className={`text-8xl font-mono font-light tracking-tighter mb-12 tabular-nums ${appState === 'dive' ? 'text-cyan-400' : 'text-slate-100'}`}>
                {appState === 'dive' ? formatTime(diveTimeElapsed) : formatTime(prepTimeLeft)}
              </div>

              <div className="w-full space-y-4">
                {appState === 'prep' && (
                  <div className="space-y-3">
                    <button 
                      disabled
                      className="w-full bg-slate-800 text-slate-500 font-medium text-lg py-4 rounded-2xl cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      <Timer className="w-5 h-5 mr-2 opacity-50" />
                      {currentRound === 1 ? 'Preparing...' : 'Recovering...'}
                    </button>
                    <button
                      onClick={() => {
                        setPrepTimeLeft(0);
                        playSound('prep-end');
                        setAppState('ready');
                      }}
                      className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
                    >
                      Skip {currentRound === 1 ? 'Preparation' : 'Recovery'}
                    </button>
                  </div>
                )}

                {appState === 'ready' && (
                  <button 
                    onClick={startFreediving}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center animate-pulse"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Freediving
                  </button>
                )}

                {appState === 'dive' && (
                  <button 
                    onClick={endFreediving}
                    className="w-full bg-rose-500 hover:bg-rose-400 text-white font-semibold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(244,63,94,0.3)] flex items-center justify-center"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    End Dive
                  </button>
                )}

                <button 
                  onClick={finishTraining}
                  className="w-full bg-transparent border border-slate-800 hover:bg-slate-800/50 text-slate-400 font-medium py-4 rounded-2xl transition-all mt-4"
                >
                  Finish Training Early
                </button>
              </div>
            </div>
          )}

          {appState === 'post-dive' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
              <div className="text-cyan-400 font-medium tracking-widest uppercase text-sm mb-2">
                Recovery Breathing
              </div>
              
              <div className="text-slate-400 mb-8">
                Take 5 Deep Breaths
              </div>

              <div className="text-6xl font-bold tracking-widest mb-4 text-white animate-pulse">
                HOPE
              </div>

              <div className="text-4xl font-mono font-light tracking-tighter mb-12 tabular-nums text-slate-300">
                00:{postDiveTimeLeft.toString().padStart(2, '0')}
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={startNextRound}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Next Round
                </button>

                <button 
                  onClick={finishTraining}
                  className="w-full bg-transparent border border-slate-800 hover:bg-slate-800/50 text-slate-400 font-medium py-4 rounded-2xl transition-all mt-4"
                >
                  Finish Training Early
                </button>
              </div>
            </div>
          )}

          {appState === 'summary' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <CheckCircle2 className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-100">Training Complete</h2>
                <p className="text-slate-400 mt-2">You completed {currentSessionRounds.length} rounds.</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-8 pr-2">
                {currentSessionRounds.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">No rounds completed.</div>
                ) : (
                  currentSessionRounds.map((record, idx) => (
                    <div key={idx} className="bg-slate-900/80 border border-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-300 mr-4">
                          {record.round}
                        </div>
                        <div>
                          <div className="text-sm text-slate-400">
                            {record.round === 1 ? 'Prep' : 'Recovery'}: {formatTime(record.prepTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-mono text-cyan-400">
                        {formatTime(record.diveTime)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={resetApp}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-lg py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                New Session
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
