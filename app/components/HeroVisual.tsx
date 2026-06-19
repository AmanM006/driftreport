'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TelemetryNode {
  id: number;
  name: string;
  route: string;
  status: 'covered' | 'partial' | 'untracked';
  detail: string;
  x: number; // percentage width
  y: number; // percentage height
}

export default function HeroVisual() {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 240 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const nodes: TelemetryNode[] = [
    { id: 1, name: 'Analytics Dashboard', route: '/dashboard/analytics', status: 'partial', detail: 'Feature flag drift on beta telemetry rules', x: 20, y: 25 },
    { id: 2, name: 'Stripe Checkout', route: '/billing/checkout', status: 'covered', detail: 'Fully instrumented with valid shadow schema', x: 80, y: 22 },
    { id: 3, name: 'User Authentication', route: '/profile/security', status: 'covered', detail: 'All security actions mapped successfully', x: 18, y: 75 },
    { id: 4, name: 'Billing Invoices', route: '/billing/invoices', status: 'untracked', detail: 'Telemetry Gap: 0 rules map to codebase path', x: 82, y: 78 },
    { id: 5, name: 'Settings Hub', route: '/dashboard/settings', status: 'untracked', detail: 'Drift Detected: active flag requires schema map', x: 85, y: 50 },
  ];

  const centerX = 50;
  const centerY = 50;

  const getAbsCoords = (pctX: number, pctY: number) => {
    return {
      x: (pctX / 100) * dimensions.width,
      y: (pctY / 100) * dimensions.height,
    };
  };

  const centerPixel = getAbsCoords(centerX, centerY);

  const activeNodeObj = hoveredNode !== null ? nodes.find(n => n.id === hoveredNode) : null;
  const activeStatus = activeNodeObj?.status || null;

  let centerDotColor = 'bg-indigo-500';
  let centerGlow = 'rgba(99, 102, 241, 0.05)';

  if (activeStatus === 'covered') {
    centerDotColor = 'bg-green-covered';
    centerGlow = 'rgba(16, 185, 129, 0.08)';
  } else if (activeStatus === 'partial') {
    centerDotColor = 'bg-amber-partial';
    centerGlow = 'rgba(245, 158, 11, 0.08)';
  } else if (activeStatus === 'untracked') {
    centerDotColor = 'bg-red-untracked';
    centerGlow = 'rgba(244, 63, 94, 0.08)';
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto h-[240px] bg-transparent overflow-hidden rounded-2xl select-none"
    >
      {/* Background glow effects - very subtle minimalist fade */}
      <div 
        className="absolute inset-0 transition-all duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${centerGlow} 0%, transparent 60%)`
        }}
      />

      {/* SVG Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {nodes.map((node) => {
          const nodePixel = getAbsCoords(node.x, node.y);
          const isHovered = hoveredNode === node.id;
          
          let color = 'rgba(255,255,255,0.05)';
          if (node.status === 'covered') {
            color = isHovered ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.12)';
          } else if (node.status === 'partial') {
            color = isHovered ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.12)';
          } else {
            color = isHovered ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.08)';
          }

          return (
            <line
              key={node.id}
              x1={centerPixel.x}
              y1={centerPixel.y}
              x2={nodePixel.x}
              y2={nodePixel.y}
              stroke={color}
              strokeWidth={isHovered ? 1.2 : 0.8}
              className="transition-colors duration-300"
            />
          );
        })}
      </svg>

      {/* Central Minimalist Node */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
        style={{ left: `${centerX}%`, top: `${centerY}%` }}
      >
        <div className="w-10 h-10 rounded-full border border-white/10 bg-[#06060c] flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
          <span className={`w-2.5 h-2.5 rounded-full ${centerDotColor} transition-colors duration-300`} />
        </div>
      </div>

      {/* Floating Route Capsules */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        
        let statusColor = 'bg-slate-400';
        if (node.status === 'covered') statusColor = 'bg-green-covered';
        else if (node.status === 'partial') statusColor = 'bg-amber-partial';
        else statusColor = 'bg-red-untracked';

        return (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute z-20 px-2.5 py-1 rounded-full border flex items-center gap-2 cursor-pointer transition-all duration-300 bg-[#06060c]/40 ${
              isHovered 
                ? 'border-white/20 bg-[#06060c]/90 scale-102 shadow-md' 
                : 'border-white/5 opacity-70'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
            <div className="flex flex-col text-[8.5px] leading-none text-left">
              <span className="text-white font-medium">{node.name}</span>
            </div>
          </div>
        );
      })}

      {/* Minimal Card Details */}
      {hoveredNode !== null && (
        <div 
          className="absolute left-1/2 bottom-2 -translate-x-1/2 px-3 py-1.5 border border-white/10 bg-[#06060c] rounded-xl shadow-lg z-30 text-[9px] w-56 text-center backdrop-blur-sm animate-fade-in"
        >
          <div className="font-semibold text-white mb-0.5">
            {nodes[hoveredNode - 1].route}
          </div>
          <div className={`text-[8.5px] opacity-80 ${
            nodes[hoveredNode - 1].status === 'covered' 
              ? 'text-green-covered' 
              : nodes[hoveredNode - 1].status === 'partial'
              ? 'text-amber-partial' 
              : 'text-red-untracked'
          }`}>
            {nodes[hoveredNode - 1].detail}
          </div>
        </div>
      )}
    </div>
  );
}
