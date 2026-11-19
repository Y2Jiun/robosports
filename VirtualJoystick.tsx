import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (dx: number, dy: number) => void;
  color?: 'rose' | 'cyan' | 'amber';
  label?: string;
  size?: number;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  color = 'rose',
  label = 'MOVE',
  size = 110,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activeTouchId = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentVector = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const maxRadius = size / 2 - 16;

  const colorStyles = {
    rose: {
      ring: 'border-rose-500/50 bg-rose-950/30',
      knob: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/50 border-rose-300',
      text: 'text-rose-400',
    },
    cyan: {
      ring: 'border-cyan-500/50 bg-cyan-950/30',
      knob: 'bg-gradient-to-br from-cyan-300 to-blue-600 shadow-cyan-500/50 border-cyan-200',
      text: 'text-cyan-400',
    },
    amber: {
      ring: 'border-amber-500/50 bg-amber-950/30',
      knob: 'bg-gradient-to-br from-amber-300 to-amber-600 shadow-amber-500/50 border-amber-200',
      text: 'text-amber-400',
    },
  }[color];

  // Continuous movement loop while active
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (running && (currentVector.current.dx !== 0 || currentVector.current.dy !== 0)) {
        onMove(currentVector.current.dx, currentVector.current.dy);
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [onMove]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    container.setPointerCapture(e.pointerId);
    activeTouchId.current = e.pointerId;
    setIsActive(true);
    updateKnob(e.clientX, e.clientY);
  };

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    setKnobPos({ x: deltaX, y: deltaY });

    // Normalized vector -1.0 to +1.0
    const normX = deltaX / maxRadius;
    const normY = deltaY / maxRadius;

    // Deadzone
    if (Math.hypot(normX, normY) < 0.12) {
      currentVector.current = { dx: 0, dy: 0 };
    } else {
      currentVector.current = { dx: normX, dy: normY };
    }
  }, [maxRadius]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isActive || activeTouchId.current !== e.pointerId) return;
    e.preventDefault();
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeTouchId.current === e.pointerId) {
      activeTouchId.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      currentVector.current = { dx: 0, dy: 0 };
      try {
        containerRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none touch-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative rounded-full border-2 shadow-inner flex items-center justify-center cursor-pointer transition-colors ${colorStyles.ring}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          touchAction: 'none',
        }}
      >
        {/* Crosshair guide lines */}
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/40 pointer-events-none" />
        <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 w-[1px] bg-slate-700/40 pointer-events-none" />

        {/* Center Target Ring */}
        <div className="w-6 h-6 rounded-full border border-slate-700/60 pointer-events-none" />

        {/* Joystick Thumb Knob */}
        <div
          className={`absolute w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 ${colorStyles.knob}`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-3 h-3 rounded-full bg-white/70 shadow-sm" />
        </div>
      </div>
      <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${colorStyles.text}`}>
        {label}
      </span>
    </div>
  );
};
