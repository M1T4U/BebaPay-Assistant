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
    let tokens: Token[] = [];

    const NODE_COUNT = 50;
    const TOKEN_COUNT = 30;
    const CONNECTION_DISTANCE = 250; // Max distance to draw a connection line

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.3; // Slow drift
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 2; // Node size
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x > canvasWidth + this.radius) this.x = -this.radius;
        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.y > canvasHeight + this.radius) this.y = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan
        context.fill();
      }
    }
    
    class Token {
        startNode!: Node;
        endNode!: Node;
        progress!: number;
        speed!: number;

        constructor() {
            this.reset();
        }

        reset() {
            this.startNode = nodes[Math.floor(Math.random() * nodes.length)];
            this.endNode = nodes[Math.floor(Math.random() * nodes.length)];
            this.progress = 0;
            this.speed = Math.random() * 0.005 + 0.005; // Varying speed for tokens
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
            context.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
            context.fillStyle = '#34d399'; // Emerald-500
            context.shadowColor = '#34d399';
            context.shadowBlur = 10;
            context.fill();

            // Reset shadow for other elements
            context.shadowBlur = 0;
        }
    }


    const init = () => {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push(new Node(canvas.width, canvas.height));
      }
      
      tokens = [];
      for (let i = 0; i < TOKEN_COUNT; i++) {
        tokens.push(new Token());
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
                    // Fade out lines based on distance
                    const opacity = 1 - (distance / CONNECTION_DISTANCE);
                    context.strokeStyle = `rgba(0, 191, 255, ${opacity * 0.2})`; // Faint deep sky blue
                    context.lineWidth = 1;
                    context.stroke();
                }
            }
        }
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections first, so they are in the background
      drawConnections(ctx);
      
      // Update and draw nodes
      nodes.forEach(node => {
          node.update(canvas.width, canvas.height);
          node.draw(ctx);
      });
      
      // Update and draw tokens
      tokens.forEach(token => {
          token.update();
          token.draw(ctx);
      });

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
