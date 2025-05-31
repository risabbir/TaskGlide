
"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';

interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  opacity: number;
  angle: number;
  angularVelocity: number;
}

const colors = ["#64B5F6", "#FFECB3", "#81C784", "#FF8A65", "#BA68C8", "#4FC3F7"];

const createParticle = (canvasWidth: number, canvasHeight: number): ConfettiParticle => {
  const size = Math.random() * 8 + 4; // size between 4 and 12
  return {
    id: crypto.randomUUID(),
    x: Math.random() * canvasWidth,
    y: -size, // start off-screen from top
    size,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: Math.random() * 4 - 2, // horizontal velocity
    vy: Math.random() * 3 + 2, // vertical velocity (downwards)
    opacity: 1,
    angle: Math.random() * 360,
    angularVelocity: Math.random() * 6 - 3, // rotation speed
  };
};

export function Confetti() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const triggerConfetti = useCallback(() => {
    setIsVisible(true);
    const newParticles: ConfettiParticle[] = [];
    if (canvasRef.current) {
      const { width } = canvasRef.current.getBoundingClientRect();
      // Ensure width is not 0 if canvas not fully rendered, default to a reasonable value
      const effectiveWidth = width > 0 ? width : window.innerWidth;
      for (let i = 0; i < 100; i++) { // Number of particles
        newParticles.push(createParticle(effectiveWidth, 0)); // y is 0 as they start at top
      }
    }
    setParticles(newParticles);

    setTimeout(() => {
      setIsVisible(false);
      // No need to clear particles here, effect will stop drawing them
    }, 3000); // Confetti duration
  }, []);

  useEffect(() => {
    window.addEventListener('taskDoneConfetti', triggerConfetti as EventListener);
    return () => {
      window.removeEventListener('taskDoneConfetti', triggerConfetti as EventListener);
    };
  }, [triggerConfetti]);
  
  useEffect(() => {
    if (!isVisible || !canvasRef.current) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Clear particles when not visible to prevent stale drawing if isVisible becomes true again quickly
      // setParticles([]); // Optional: Clear particles if desired when not visible
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ensure canvas dimensions are set correctly
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
         if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
      }
    });
    observer.observe(canvas);
    
    // Initial canvas sizing
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }


    const draw = () => {
      if (!canvasRef.current) return; // Guard against canvas being null
      const currentCanvas = canvasRef.current;
      const currentCtx = currentCanvas.getContext('2d');
      if (!currentCtx) return;

      currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(p => {
          const newX = p.x + p.vx;
          const newY = p.y + p.vy;
          const newAngle = p.angle + p.angularVelocity;
          let newOpacity = p.opacity - 0.008; // Slower fade out for longer visibility
          
          // Use currentCanvas.height for boundary check
          if (newY > currentCanvas.height + p.size || newX < -p.size || newX > currentCanvas.width + p.size || newOpacity <= 0) {
             newOpacity = 0;
          }
          return { ...p, x: newX, y: newY, angle: newAngle, opacity: newOpacity };
        }).filter(p => p.opacity > 0);
        
        // Draw the newly computed particles immediately
        updatedParticles.forEach(p => {
            if (p.opacity <=0) return;
            currentCtx.save();
            currentCtx.translate(p.x, p.y);
            currentCtx.rotate(p.angle * Math.PI / 180);
            currentCtx.fillStyle = p.color;
            currentCtx.globalAlpha = p.opacity;
            currentCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            currentCtx.restore();
        });
        
        // If all particles faded out, stop animation early
        if (updatedParticles.length === 0 && animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
            // setIsVisible(false); // Optionally hide canvas immediately
        }

        return updatedParticles;
      });
      
      if (animationFrameIdRef.current !== null) { // Continue animation if not stopped
        animationFrameIdRef.current = requestAnimationFrame(draw);
      }
    };

    // Start the animation if not already running
    if (animationFrameIdRef.current === null) {
        animationFrameIdRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      observer.disconnect();
    };
  }, [isVisible]); // Only re-run this effect if isVisible changes


  if (!isVisible && particles.length === 0) return null; // Don't render canvas if not visible and no particles

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0, // Fade out canvas when not visible
        transition: 'opacity 0.5s ease-out', // Smooth fade out
      }}
    />
  );
}

