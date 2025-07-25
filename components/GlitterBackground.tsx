
import React, { useRef, useEffect } from 'react';

const GlitterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];
    let transactions: Transaction[] = [];

    const NODE_COUNT = 35; // A bit fewer for a cleaner, more focused look
    const TRANSACTION_COUNT = 30;
    const CONNECTION_DISTANCE = 280; // Slightly larger connection radius

    // Helper to draw a detailed hexagon
    const drawHexagon = (context: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        context.beginPath();
        for (let i = 0; i < 6; i++) {
            context.lineTo(x + size * Math.cos(Math.PI / 3 * i), y + size * Math.sin(Math.PI / 3 * i));
        }
        context.closePath();
    };

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.25; // Slow, gentle drift
        this.vy = (Math.random() - 0.5) * 0.25;
        this.size = Math.random() * 4 + 5; // Base size for hexagons
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges for seamless looping
        if (this.x > canvasWidth + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = canvasWidth + this.size;
        if (this.y > canvasHeight + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = canvasHeight + this.size;
      }

      draw(context: CanvasRenderingContext2D) {
        // Outer glow
        context.shadowColor = 'rgba(45, 212, 191, 0.5)'; // teal-400
        context.shadowBlur = 15;
        
        // Main hexagon body
        drawHexagon(context, this.x, this.y, this.size);
        context.fillStyle = 'rgba(15, 23, 42, 0.75)'; // slate-900 with transparency
        context.fill();

        // Hexagon border
        context.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // sky-400
        context.lineWidth = 1.5;
        context.stroke();
        
        // Inner core
        drawHexagon(context, this.x, this.y, this.size * 0.5);
        context.strokeStyle = 'rgba(45, 212, 191, 0.4)'; // teal-400
        context.lineWidth = 1;
        context.stroke();

        // Reset shadow for performance
        context.shadowBlur = 0;
      }
    }
    
    // Renamed from Token to Transaction for thematic consistency
    class Transaction {
        startNode: Node;
        endNode: Node;
        progress: number;
        speed: number;

        constructor() {
            this.reset();
        }

        reset() {
            // Ensure start and end nodes are different
            let startIndex = Math.floor(Math.random() * nodes.length);
            let endIndex = Math.floor(Math.random() * nodes.length);
            while(startIndex === endIndex) {
                endIndex = Math.floor(Math.random() * nodes.length);
            }
            this.startNode = nodes[startIndex];
            this.endNode = nodes[endIndex];
            this.progress = 0;
            this.speed = Math.random() * 0.003 + 0.002; // Slower, more deliberate speed
        }

        update() {
            this.progress += this.speed;
            if (this.progress >= 1) {
                this.reset();
            }
        }

        draw(context: CanvasRenderingContext2D) {
            if (!this.startNode || !this.endNode) return;
            
            const currentX = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
            const currentY = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

            context.beginPath();
            context.rect(currentX - 2, currentY - 2, 4, 4); // Small square for a "digital" feel
            
            // Use the BebaPay gradient colors
            const gradient = context.createLinearGradient(currentX - 2, currentY - 2, currentX + 2, currentY + 2);
            gradient.addColorStop(0, '#34d399'); // emerald-400
            gradient.addColorStop(1, '#22d3ee'); // cyan-400
            
            context.fillStyle = gradient;
            context.shadowColor = '#6ee7b7'; // emerald-300
            context.shadowBlur = 8;
            context.fill();
        }
    }


    const init = () => {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push(new Node(canvas.width, canvas.height));
      }
      
      transactions = [];
      if(nodes.length > 1) {
          for (let i = 0; i < TRANSACTION_COUNT; i++) {
            transactions.push(new Transaction());
          }
      }
    };

    const drawConnections = (context: CanvasRenderingContext2D) => {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONNECTION_DISTANCE) {
                    context.beginPath();
                    context.moveTo(nodes[i].x, nodes[i].y);
                    context.lineTo(nodes[j].x, nodes[j].y);
                    // Fade out lines based on distance for a clean look
                    const opacity = 1 - (distance / CONNECTION_DISTANCE);
                    context.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.15})`; // Faint sky-400
                    context.lineWidth = 1;
                    context.stroke();
                }
            }
        }
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      // Use a fade effect instead of clearRect for motion trails
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)'; // slate-900 with low alpha
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Connections go in the background
      drawConnections(ctx);
      
      // Update and draw nodes
      nodes.forEach(node => {
          node.update(canvas.width, canvas.height);
          node.draw(ctx);
      });
      
      // Update and draw transactions
      transactions.forEach(packet => {
          packet.update();
          packet.draw(ctx);
      });

      // Reset shadow for next frame to avoid affecting other elements if any were added
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial setup
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a', // slate-900
      }}
    />
  );
};

export default GlitterBackground;
