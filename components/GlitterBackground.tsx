import React, { useRef, useEffect } from 'react';
import type { Theme } from '../App';

interface GlitterBackgroundProps {
  theme: Theme;
}

const GlitterBackground: React.FC<GlitterBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Define color palettes for both themes
    const colors = {
        dark: {
            backgroundFill: 'rgba(18, 18, 18, 0.2)',
            nodeRing: (opacity: number) => `rgba(45, 212, 191, ${opacity})`, // teal-400
            nodeCoreBG: '#121212',
            nodeCoreGlow: '#64ffda', // A vibrant mint/teal green
            nodeCoreShadow: 'rgba(100, 255, 218, 0.7)',
            packetHead: '#64ffda',
            packetShadow: 'rgba(100, 255, 218, 0.9)',
            packetTrailStart: 'rgba(100, 255, 218, 0)',
            packetTrailEnd: 'rgba(100, 255, 218, 0.6)',
            connection: (opacity: number) => `rgba(45, 212, 191, ${opacity * 0.25})`, // teal-400
            canvasBG: '#121212'
        },
        light: {
            backgroundFill: 'rgba(249, 250, 251, 0.2)', // gray-50 with alpha
            nodeRing: (opacity: number) => `rgba(107, 114, 128, ${opacity})`, // gray-500
            nodeCoreBG: '#f9fafb', // gray-50
            nodeCoreGlow: 'rgba(55, 65, 81, 0.9)', // gray-700
            nodeCoreShadow: 'rgba(55, 65, 81, 0.7)',
            packetHead: '#4b5563', // gray-600
            packetShadow: '#374151', // gray-700
            packetTrailStart: 'rgba(75, 85, 99, 0)',
            packetTrailEnd: 'rgba(75, 85, 99, 0.6)',
            connection: (opacity: number) => `rgba(156, 163, 175, ${opacity * 0.35})`, // gray-400
            canvasBG: '#f9fafb'
        }
    };
    
    const currentColors = colors[theme];
    canvas.style.backgroundColor = currentColors.canvasBG;


    let animationFrameId: number;
    let nodes: Node[] = [];
    let packets: Packet[] = [];

    const NODE_COUNT = 40;
    const PACKET_COUNT = 35;
    const CONNECTION_DISTANCE = 250; 

    class Node {
      x: number;
      y: number;
      originX: number;
      originY: number;
      vx: number;
      vy: number;
      size: number;
      pulseOffset: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.originX = Math.random() * canvasWidth;
        this.originY = Math.random() * canvasHeight;
        this.x = this.originX;
        this.y = this.originY;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1.5 + 2; 
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx + (this.originX - this.x) * 0.01;
        this.y += this.vy + (this.originY - this.y) * 0.01;
        
        const wrapMargin = 20;
        if (this.x > canvasWidth + wrapMargin) this.x = -wrapMargin;
        if (this.x < -wrapMargin) this.x = canvasWidth + wrapMargin;
        if (this.y > canvasHeight + wrapMargin) this.y = -wrapMargin;
        if (this.y < -wrapMargin) this.y = canvasHeight + wrapMargin;
      }

      draw(context: CanvasRenderingContext2D) {
        const pulse = Math.sin(Date.now() * 0.002 + this.pulseOffset);
        const outerRingRadius = this.size * 2.5 + pulse * 2;
        
        context.beginPath();
        context.arc(this.x, this.y, outerRingRadius, 0, Math.PI * 2);
        context.strokeStyle = currentColors.nodeRing(0.3 + pulse * 0.2);
        context.lineWidth = 0.5;
        context.stroke();
        
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = currentColors.nodeCoreBG;
        context.fill();

        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
        context.fillStyle = currentColors.nodeCoreGlow;
        context.shadowColor = currentColors.nodeCoreShadow;
        context.shadowBlur = 15;
        context.fill();
        context.shadowBlur = 0;
      }
    }
    
    class Packet {
        startNode: Node;
        endNode: Node;
        progress: number;
        speed: number;
        size: number;

        constructor() {
            this.reset();
        }

        reset() {
            if (nodes.length < 2) return;
            let startIndex = Math.floor(Math.random() * nodes.length);
            let endIndex = Math.floor(Math.random() * nodes.length);
            while(startIndex === endIndex) {
                endIndex = Math.floor(Math.random() * nodes.length);
            }
            this.startNode = nodes[startIndex];
            this.endNode = nodes[endIndex];
            this.progress = 0;
            this.speed = Math.random() * 0.0025 + 0.001;
            this.size = Math.random() * 1.5 + 1.5;
        }

        update() {
            if (!this.startNode || !this.endNode) {
                this.reset();
                return;
            }
            this.progress += this.speed;
            if (this.progress >= 1) {
                this.reset();
            }
        }

        draw(context: CanvasRenderingContext2D) {
            if (!this.startNode || !this.endNode) return;
            
            const currentX = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
            const currentY = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;
            
            const dx = this.endNode.x - this.startNode.x;
            const dy = this.endNode.y - this.startNode.y;
            const angle = Math.atan2(dy, dx);
            const trailLength = this.speed * 8000;
            const trailStartX = currentX - trailLength * Math.cos(angle);
            const trailStartY = currentY - trailLength * Math.sin(angle);
            
            const gradient = context.createLinearGradient(trailStartX, trailStartY, currentX, currentY);
            gradient.addColorStop(0, currentColors.packetTrailStart);
            gradient.addColorStop(1, currentColors.packetTrailEnd);

            context.beginPath();
            context.moveTo(trailStartX, trailStartY);
            context.lineTo(currentX, currentY);
            context.strokeStyle = gradient;
            context.lineWidth = this.size * 0.7;
            context.stroke();

            context.beginPath();
            context.arc(currentX, currentY, this.size, 0, Math.PI * 2);
            context.fillStyle = currentColors.packetHead;
            context.shadowColor = currentColors.packetShadow;
            context.shadowBlur = 12;
            context.fill();
            context.shadowBlur = 0;
        }
    }

    const init = () => {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push(new Node(canvas.width, canvas.height));
      }
      
      packets = [];
      if(nodes.length > 1) {
          for (let i = 0; i < PACKET_COUNT; i++) {
            packets.push(new Packet());
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
                    const opacity = 1 - (distance / CONNECTION_DISTANCE);
                    context.strokeStyle = currentColors.connection(opacity);
                    context.lineWidth = 1;
                    context.stroke();
                }
            }
        }
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.fillStyle = currentColors.backgroundFill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawConnections(ctx);
      
      nodes.forEach(node => {
          node.update(canvas.width, canvas.height);
          node.draw(ctx);
      });
      
      packets.forEach(packet => {
          packet.update();
          packet.draw(ctx);
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
    
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

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
        transition: 'background-color 0.3s ease-in-out',
      }}
    />
  );
};

export default GlitterBackground;