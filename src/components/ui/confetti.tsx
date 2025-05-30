
"use client";
import React, { useEffect, useState, useCallback } from 'react';

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

  const triggerConfetti = useCallback(() => {
    setIsVisible(true);
    const newParticles: ConfettiParticle[] = [];
    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      for (let i = 0; i < 100; i++) { // Number of particles
        newParticles.push(createParticle(width, height));
      }
    }
    setParticles(newParticles);

    setTimeout(() => {
      setIsVisible(false);
      setParticles([]);
    }, 3000); // Confetti duration
  }, []);

  useEffect(() => {
    window.addEventListener('taskDoneConfetti', triggerConfetti as EventListener);
    return () => {
      window.removeEventListener('taskDoneConfetti', triggerConfetti as EventListener);
    };
  }, [triggerConfetti]);
  
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setParticles(prevParticles => 
        prevParticles.map(p => {
          const newX = p.x + p.vx;
          const newY = p.y + p.vy;
          const newAngle = p.angle + p.angularVelocity;
          let newOpacity = p.opacity - 0.01; // fade out
          
          if (newY > canvas.height + p.size || newX < -p.size || newX > canvas.width + p.size || newOpacity <= 0) {
             newOpacity = 0; // Mark for removal if needed, or just stop drawing
          }

          return { ...p, x: newX, y: newY, angle: newAngle, opacity: newOpacity };
        }).filter(p => p.opacity > 0) // Keep only visible particles
      );

      particles.forEach(p => {
        if (p.opacity <=0) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, particles]);


  if (!isVisible) return null;

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
      }}
    />
  );
}

