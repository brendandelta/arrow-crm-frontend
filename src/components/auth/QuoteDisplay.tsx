"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Quote, Laugh, Lightbulb, Zap } from "lucide-react";

// Persistent audio context
let globalAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!globalAudioContext || globalAudioContext.state === "closed") {
    globalAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (globalAudioContext.state === "suspended") {
    globalAudioContext.resume();
  }
  return globalAudioContext;
}

// Sound generator using Web Audio API
function playSound(type: "bass" | "hihat" | "synth" | "airhorn" | "wobble" | "laser" | "explosion" | "rave") {
  const audioContext = getAudioContext();

  switch (type) {
    case "bass": {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
      break;
    }
    case "hihat": {
      const bufferSize = audioContext.sampleRate * 0.05;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;
      const highpass = audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 8000;
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      noise.connect(highpass);
      highpass.connect(gainNode);
      gainNode.connect(audioContext.destination);
      noise.start(audioContext.currentTime);
      break;
    }
    case "synth": {
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      osc1.type = "sawtooth";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(440, audioContext.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
      osc2.frequency.setValueAtTime(443, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(886, audioContext.currentTime + 0.1);
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc1.start(audioContext.currentTime);
      osc2.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.2);
      osc2.stop(audioContext.currentTime + 0.2);
      break;
    }
    case "airhorn": {
      for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440 + i * 5, audioContext.currentTime);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.6);
      }
      break;
    }
    case "wobble": {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      oscillator.type = "sawtooth";
      lfo.frequency.value = 20;
      lfoGain.gain.value = 150;
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      lfo.start(audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      lfo.stop(audioContext.currentTime + 0.5);
      break;
    }
    case "laser": {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1500, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
    }
    case "explosion": {
      const bufferSize = audioContext.sampleRate * 0.5;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;
      const lowpass = audioContext.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(1000, audioContext.currentTime);
      lowpass.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      noise.connect(lowpass);
      lowpass.connect(gainNode);
      gainNode.connect(audioContext.destination);
      noise.start(audioContext.currentTime);
      break;
    }
    case "rave": {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, audioContext.currentTime);
      for (let i = 0; i < 8; i++) {
        osc.frequency.setValueAtTime(150 + (i % 2) * 50, audioContext.currentTime + i * 0.05);
      }
      osc.connect(gain);
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.4);
      break;
    }
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  type: "confetti" | "emoji" | "laser";
  emoji?: string;
  angle?: number;
}

const EMOJIS = ["💰", "🚀", "💎", "🔥", "⚡", "💸", "🎉", "🤑", "📈", "💪", "🏆", "👑", "💯", "🎯", "✨"];
const HYPE_TEXTS = ["LETS GO", "MONEY", "GAINS", "STONKS", "RICH", "ALPHA", "SIGMA", "W", "NO CAP", "BUSSIN", "SHEESH"];

export function QuoteDisplay() {
  const { quote, dismissQuote, user, alternativeMode, toggleAlternativeMode } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [tweakMode, setTweakMode] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bgHue, setBgHue] = useState(0);
  const [shake, setShake] = useState({ x: 0, y: 0 });
  const [textScale, setTextScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [strobe, setStrobe] = useState(false);
  const [invert, setInvert] = useState(false);
  const [flyingTexts, setFlyingTexts] = useState<{id: number; text: string; x: number; y: number; vx: number; color: string}[]>([]);
  const [glitchOffset, setGlitchOffset] = useState({ r: 0, g: 0, b: 0 });
  const [bass, setBass] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const beatRef = useRef<NodeJS.Timeout | null>(null);
  const extraSoundRef = useRef<NodeJS.Timeout | null>(null);
  const wobbleRef = useRef<NodeJS.Timeout | null>(null);
  const textIdRef = useRef(0);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const isBrendan = user?.id === 1;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setIsExiting(true);
    setTweakMode(false);
    setTimeout(() => {
      dismissQuote();
    }, 400);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!tweakMode) handleContinue();
    }, 8000);
    return () => clearTimeout(timer);
  }, [tweakMode]);

  // Tweak mode animations
  useEffect(() => {
    if (!tweakMode) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (beatRef.current) clearInterval(beatRef.current);
      if (extraSoundRef.current) clearInterval(extraSoundRef.current);
      if (wobbleRef.current) clearInterval(wobbleRef.current);
      intervalsRef.current.forEach(i => clearInterval(i));
      intervalsRef.current = [];
      setParticles([]);
      setShake({ x: 0, y: 0 });
      setTextScale(1);
      setRotation(0);
      setStrobe(false);
      setInvert(false);
      setFlyingTexts([]);
      setGlitchOffset({ r: 0, g: 0, b: 0 });
      setBass(1);
      return;
    }

    // Resume audio context on user interaction
    getAudioContext();

    // MASSIVE AIRHORN INTRO
    playSound("airhorn");
    setTimeout(() => playSound("explosion"), 100);
    setTimeout(() => playSound("airhorn"), 300);
    setTimeout(() => playSound("laser"), 400);
    setTimeout(() => playSound("airhorn"), 500);
    setTimeout(() => playSound("explosion"), 600);

    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#88ff00", "#ff0088", "#8800ff"];

    // MEGA confetti spawn
    const newParticles: Particle[] = [];
    for (let i = 0; i < 300; i++) {
      newParticles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 500,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 40,
        size: Math.random() * 20 + 5,
        type: Math.random() > 0.7 ? "emoji" : "confetti",
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      });
    }
    setParticles(newParticles);

    // HYPER color cycling
    let hue = 0;
    const colorInterval = setInterval(() => {
      hue = (hue + 25) % 360;
      setBgHue(hue);
    }, 30);

    // INTENSE screen shake
    const shakeInterval = setInterval(() => {
      setShake({
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
      });
    }, 30);

    // CRAZY text pulse
    let scale = 1;
    let scaleDir = 1;
    const pulseInterval = setInterval(() => {
      scale += scaleDir * 0.1;
      if (scale >= 1.5) scaleDir = -1;
      if (scale <= 0.7) scaleDir = 1;
      setTextScale(scale);
    }, 30);

    // FAST rotation
    let rot = 0;
    const rotateInterval = setInterval(() => {
      rot += 8;
      setRotation(rot);
    }, 30);

    // STROBE
    const strobeInterval = setInterval(() => {
      setStrobe(s => !s);
    }, 80);

    // RANDOM INVERT
    const invertInterval = setInterval(() => {
      if (Math.random() > 0.9) setInvert(i => !i);
    }, 100);

    // GLITCH
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchOffset({
          r: (Math.random() - 0.5) * 10,
          g: (Math.random() - 0.5) * 10,
          b: (Math.random() - 0.5) * 10,
        });
      } else {
        setGlitchOffset({ r: 0, g: 0, b: 0 });
      }
    }, 50);

    // BASS PUMP
    const bassInterval = setInterval(() => {
      setBass(b => b > 1 ? b - 0.1 : 1);
    }, 30);

    // FLYING HYPE TEXT
    const textInterval = setInterval(() => {
      const id = textIdRef.current++;
      setFlyingTexts(prev => [...prev.slice(-20), {
        id,
        text: HYPE_TEXTS[Math.floor(Math.random() * HYPE_TEXTS.length)],
        x: -200,
        y: Math.random() * window.innerHeight,
        vx: 15 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
      }]);
    }, 200);

    // Update flying texts
    const flyingInterval = setInterval(() => {
      setFlyingTexts(prev => prev.map(t => ({ ...t, x: t.x + t.vx })).filter(t => t.x < window.innerWidth + 300));
    }, 30);

    // ABSOLUTE CHAOS BEAT - NONSTOP SOUNDS
    let beatCount = 0;
    beatRef.current = setInterval(() => {
      const sounds: ("bass" | "hihat" | "synth" | "wobble" | "laser" | "rave")[] = ["bass", "hihat", "synth", "wobble", "laser", "rave"];
      // Play 2-3 sounds every tick
      playSound(sounds[beatCount % 6]);
      playSound(sounds[(beatCount + 3) % 6]);
      if (Math.random() > 0.5) playSound("hihat");
      if (Math.random() > 0.7) playSound("laser");
      if (beatCount % 2 === 0) {
        playSound("bass");
        playSound("rave");
        setBass(1.3);
      }
      if (beatCount % 4 === 0) {
        playSound("explosion");
        playSound("airhorn");
      }
      if (beatCount % 8 === 0) {
        // EXTRA AIRHORN CHAOS
        playSound("airhorn");
        setTimeout(() => playSound("airhorn"), 50);
        setTimeout(() => playSound("airhorn"), 100);
      }
      beatCount++;

      // ADD MORE CHAOS
      setParticles(prev => {
        const moreParticles: Particle[] = [];
        for (let i = 0; i < 50; i++) {
          if (Math.random() > 0.3) {
            moreParticles.push({
              x: Math.random() * window.innerWidth,
              y: -30,
              vx: (Math.random() - 0.5) * 25,
              vy: Math.random() * 15 + 5,
              color: colors[Math.floor(Math.random() * colors.length)],
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 50,
              size: Math.random() * 25 + 10,
              type: Math.random() > 0.5 ? "emoji" : "confetti",
              emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            });
          }
        }
        // Side explosions
        if (beatCount % 3 === 0) {
          for (let i = 0; i < 30; i++) {
            moreParticles.push({
              x: Math.random() > 0.5 ? 0 : window.innerWidth,
              y: window.innerHeight / 2,
              vx: (Math.random() - 0.5) * 30,
              vy: (Math.random() - 0.5) * 30,
              color: colors[Math.floor(Math.random() * colors.length)],
              rotation: 0,
              rotationSpeed: (Math.random() - 0.5) * 60,
              size: Math.random() * 30 + 15,
              type: "emoji",
              emoji: "💥",
            });
          }
        }
        return [...prev.slice(-400), ...moreParticles];
      });
    }, 80);

    // EXTRA SOUND CHAOS - hi-hats and lasers between beats
    extraSoundRef.current = setInterval(() => {
      if (Math.random() > 0.3) playSound("hihat");
      if (Math.random() > 0.6) playSound("laser");
      if (Math.random() > 0.8) playSound("synth");
    }, 50);

    // WOBBLE BASS LOOP
    wobbleRef.current = setInterval(() => {
      playSound("wobble");
    }, 400);

    // CONTINUOUS AIRHORN MADNESS
    const airhornInterval = setInterval(() => {
      playSound("airhorn");
    }, 2000);

    // Store all intervals
    intervalsRef.current = [
      colorInterval,
      shakeInterval,
      pulseInterval,
      rotateInterval,
      strobeInterval,
      invertInterval,
      glitchInterval,
      bassInterval,
      textInterval,
      flyingInterval,
      airhornInterval,
    ];

    return () => {
      if (extraSoundRef.current) clearInterval(extraSoundRef.current);
      if (wobbleRef.current) clearInterval(wobbleRef.current);
      intervalsRef.current.forEach(i => clearInterval(i));
      intervalsRef.current = [];
      if (beatRef.current) clearInterval(beatRef.current);
    };
  }, [tweakMode]);

  // Particle animation
  useEffect(() => {
    if (!tweakMode || particles.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setParticles(prev => {
        return prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          rotation: p.rotation + p.rotationSpeed,
        })).filter(p => p.y < window.innerHeight + 100);
      });

      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.type === "emoji" && p.emoji) {
          ctx.font = `${p.size * 2}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [tweakMode, particles]);

  const activateTweakMode = useCallback(() => {
    setTweakMode(true);
  }, []);

  if (!quote) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-400 overflow-hidden ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: tweakMode
          ? `linear-gradient(${rotation}deg, hsl(${bgHue}, 100%, ${strobe ? 80 : 50}%), hsl(${(bgHue + 60) % 360}, 100%, ${strobe ? 80 : 50}%), hsl(${(bgHue + 120) % 360}, 100%, ${strobe ? 80 : 50}%), hsl(${(bgHue + 180) % 360}, 100%, ${strobe ? 80 : 50}%))`
          : "linear-gradient(to bottom right, rgb(236, 253, 245), rgb(255, 255, 255), rgb(248, 250, 252))",
        transform: tweakMode ? `translate(${shake.x}px, ${shake.y}px) scale(${bass})` : "none",
        filter: tweakMode && invert ? "invert(1) hue-rotate(180deg)" : "none",
      }}
    >
      {/* Flying hype text */}
      {tweakMode && flyingTexts.map(t => (
        <div
          key={t.id}
          className="absolute text-6xl font-black pointer-events-none z-30"
          style={{
            left: t.x,
            top: t.y,
            color: t.color,
            textShadow: `0 0 20px ${t.color}, 0 0 40px ${t.color}, 0 0 60px ${t.color}`,
            transform: `rotate(${Math.sin(t.x * 0.01) * 20}deg)`,
          }}
        >
          {t.text}
        </div>
      ))}

      {/* Confetti canvas */}
      {tweakMode && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
        />
      )}

      {/* LASER BEAMS */}
      {tweakMode && (
        <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 origin-left"
              style={{
                left: "50%",
                top: "50%",
                width: "150%",
                background: `linear-gradient(90deg, hsl(${(bgHue + i * 45) % 360}, 100%, 50%), transparent)`,
                transform: `rotate(${rotation + i * 45}deg)`,
                boxShadow: `0 0 20px hsl(${(bgHue + i * 45) % 360}, 100%, 50%)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Strobe overlay */}
      {tweakMode && strobe && (
        <div className="absolute inset-0 bg-card/30 pointer-events-none z-15" />
      )}

      {/* Glitch layers */}
      {tweakMode && (glitchOffset.r !== 0 || glitchOffset.g !== 0) && (
        <>
          <div
            className="absolute inset-0 pointer-events-none z-25 mix-blend-screen opacity-50"
            style={{
              background: `rgba(255,0,0,0.3)`,
              transform: `translate(${glitchOffset.r}px, ${glitchOffset.r}px)`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-25 mix-blend-screen opacity-50"
            style={{
              background: `rgba(0,255,0,0.3)`,
              transform: `translate(${glitchOffset.g}px, ${-glitchOffset.g}px)`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-25 mix-blend-screen opacity-50"
            style={{
              background: `rgba(0,0,255,0.3)`,
              transform: `translate(${-glitchOffset.b}px, ${glitchOffset.b}px)`,
            }}
          />
        </>
      )}

      <div
        className={`w-full max-w-lg mx-4 text-center transition-all duration-500 relative z-20 ${
          isVisible && !isExiting
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
        style={{
          transform: tweakMode
            ? `scale(${textScale}) rotate(${Math.sin(rotation * 0.1) * 15}deg) translateY(${Math.sin(rotation * 0.2) * 20}px)`
            : "none",
        }}
      >
        {/* Welcome */}
        <div className="mb-6">
          <p
            className={`font-bold mb-1 ${tweakMode ? "text-white text-4xl" : "text-emerald-600 text-sm font-medium"}`}
            style={tweakMode ? {
              textShadow: `0 0 30px white, 0 0 60px hsl(${bgHue}, 100%, 50%)`,
              animation: "bounce 0.1s infinite",
            } : {}}
          >
            {tweakMode ? "🔥💀 ABSOLUTE CHAOS 💀🔥" : "Welcome back,"}
          </p>
          <h1
            className={`font-black ${tweakMode ? "text-7xl" : "text-2xl text-foreground font-semibold"}`}
            style={tweakMode ? {
              background: `linear-gradient(${rotation}deg, hsl(${bgHue}, 100%, 50%), hsl(${(bgHue + 120) % 360}, 100%, 50%), hsl(${(bgHue + 240) % 360}, 100%, 50%))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 30px hsl(${bgHue}, 100%, 50%)) drop-shadow(0 0 60px white)`,
            } : {}}
          >
            {user?.name.split(" ")[0]}
            {tweakMode && " 🚀💰🎉💎👑"}
          </h1>
        </div>

        {/* Quote Card */}
        <div
          className={`border rounded-lg p-6 mb-6 ${
            tweakMode
              ? "bg-black/50 backdrop-blur-md border-white"
              : alternativeMode
                ? "bg-card/80 backdrop-blur-sm border-amber-200"
                : "bg-card/80 backdrop-blur-sm border-emerald-200"
          }`}
          style={tweakMode ? {
            boxShadow: `0 0 60px hsl(${bgHue}, 100%, 50%), 0 0 120px hsl(${(bgHue + 180) % 360}, 100%, 50%), inset 0 0 60px hsl(${bgHue}, 100%, 50%, 0.3)`,
            borderWidth: "4px",
            animation: "pulse 0.1s infinite",
          } : {}}
        >
          <div className="flex justify-center mb-4">
            {tweakMode ? (
              <div className="relative">
                <Zap className="w-16 h-16 text-yellow-400 animate-spin" style={{ filter: "drop-shadow(0 0 30px yellow) drop-shadow(0 0 60px orange)" }} />
                <Zap className="w-16 h-16 text-yellow-400 animate-spin absolute top-0 left-0" style={{ filter: "drop-shadow(0 0 30px yellow)", animationDirection: "reverse", animationDuration: "0.2s" }} />
              </div>
            ) : alternativeMode ? (
              <Laugh className="w-8 h-8 text-amber-500/60" />
            ) : (
              <Quote className="w-8 h-8 text-emerald-500/60" />
            )}
          </div>
          <blockquote
            className={`leading-relaxed mb-3 ${tweakMode ? "text-3xl text-white font-black" : "text-lg text-foreground"}`}
            style={tweakMode ? {
              textShadow: `0 0 20px white, 0 0 40px hsl(${bgHue}, 100%, 50%)`,
            } : {}}
          >
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <cite className={`text-sm not-italic ${
            tweakMode ? "text-yellow-300 font-black text-xl" : alternativeMode ? "text-amber-600" : "text-emerald-600"
          }`}
          style={tweakMode ? { textShadow: "0 0 20px yellow" } : {}}>
            — {quote.author}
          </cite>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className={`group inline-flex items-center gap-2 font-bold rounded-lg transition-all ${
            tweakMode
              ? "bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white text-2xl px-12 py-5 border-4 border-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 font-medium"
          }`}
          style={tweakMode ? {
            boxShadow: `0 0 40px yellow, 0 0 80px red`,
            animation: "bounce 0.15s infinite, pulse 0.1s infinite",
            transform: `scale(${1 + Math.sin(rotation * 0.3) * 0.1})`,
          } : {}}
        >
          <span>{tweakMode ? "💸💸 GET THIS BREAD 💸💸" : "Let's Get It"}</span>
          <ArrowRight className={`group-hover:translate-x-0.5 transition-transform ${tweakMode ? "w-8 h-8" : "w-4 h-4"}`} />
        </button>

        {/* Tweak Mode Button - For everyone */}
        {!tweakMode && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={activateTweakMode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 border-yellow-400 bg-yellow-400/10 text-yellow-600 hover:bg-yellow-400 hover:text-black transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              <span>TWEAK MODE</span>
              <Zap className="w-4 h-4" />
            </button>

            {isBrendan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAlternativeMode();
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border transition-colors ${
                  alternativeMode
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {alternativeMode ? (
                  <>
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Switch to motivation</span>
                  </>
                ) : (
                  <>
                    <Laugh className="w-3.5 h-3.5" />
                    <span>Unlock alternative messaging?</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {!tweakMode && (
          <p className="mt-4 text-muted-foreground text-xs">
            Auto-continuing in a moment...
          </p>
        )}

        {tweakMode && (
          <p className="mt-6 text-white text-2xl font-black animate-pulse" style={{ textShadow: `0 0 30px hsl(${bgHue}, 100%, 50%)` }}>
            🎵🔥 MAXIMUM OVERDRIVE 🔥🎵
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
