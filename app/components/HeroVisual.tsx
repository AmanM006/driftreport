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
  const [dimensions, setDimensions] = useState({ width: 500, height: 280 });

  // Update container size on resize to draw SVG paths correctly
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
    { id: 1, name: 'Analytics Dashboard', route: '/dashboard/analytics', status: 'partial', detail: 'Feature flag drift on beta telemetry rules', x: 18, y: 22 },
    { id: 2, name: 'Stripe Checkout', route: '/billing/checkout', status: 'covered', detail: 'Fully instrumented with valid shadow schema', x: 82, y: 18 },
    { id: 3, name: 'User Authentication', route: '/profile/security', status: 'covered', detail: 'All security actions mapped successfully', x: 15, y: 78 },
    { id: 4, name: 'Billing Invoices', route: '/billing/invoices', status: 'untracked', detail: 'Telemetry Gap: 0 rules map to codebase path', x: 85, y: 80 },
    { id: 5, name: 'Settings Hub', route: '/dashboard/settings', status: 'untracked', detail: 'Drift Detected: active flag requires schema map', x: 88, y: 48 },
  ];

  // Coordinates of the central orb (in percentage of container)
  const centerX = 50;
  const centerY = 50;

  // Convert percentages to absolute pixels
  const getAbsCoords = (pctX: number, pctY: number) => {
    return {
      x: (pctX / 100) * dimensions.width,
      y: (pctY / 100) * dimensions.height,
    };
  };

  const centerPixel = getAbsCoords(centerX, centerY);

  // Dynamic colors based on hovered node
  const activeNodeObj = hoveredNode !== null ? nodes.find(n => n.id === hoveredNode) : null;
  const activeStatus = activeNodeObj?.status || null;

  let glowColor = 'rgba(99, 102, 241, 0.15)'; // Default Indigo
  let orbGradient = 'from-indigo-600/40 via-blue-500/25 to-transparent';
  let orbCore = 'from-indigo-500 to-blue-600';
  let pulseRingColor = 'border-indigo-500/30';

  if (activeStatus === 'covered') {
    glowColor = 'rgba(16, 185, 129, 0.3)'; // Green
    orbGradient = 'from-emerald-600/40 via-teal-500/25 to-transparent';
    orbCore = 'from-emerald-500 to-teal-600';
    pulseRingColor = 'border-emerald-500/40';
  } else if (activeStatus === 'partial') {
    glowColor = 'rgba(245, 158, 11, 0.3)'; // Amber
    orbGradient = 'from-amber-600/40 via-yellow-500/25 to-transparent';
    orbCore = 'from-amber-500 to-yellow-600';
    pulseRingColor = 'border-amber-500/40';
  } else if (activeStatus === 'untracked') {
    glowColor = 'rgba(244, 63, 94, 0.3)'; // Rose/Red
    orbGradient = 'from-rose-600/40 via-red-500/25 to-transparent';
    orbCore = 'from-rose-500 to-red-600';
    pulseRingColor = 'border-rose-500/40';
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto h-[280px] bg-transparent overflow-hidden rounded-3xl select-none animate-float-slow"
    >
      {/* Background glow effects - dynamically shifting colors */}
      <div 
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 65%)`
        }}
      />

      {/* SVG Coordinate Mesh & Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="glow-line-covered" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.1)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.7)" />
          </linearGradient>
          <linearGradient id="glow-line-partial" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.1)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0.7)" />
          </linearGradient>
          <linearGradient id="glow-line-untracked" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(244, 63, 94, 0.1)" />
            <stop offset="100%" stopColor="rgba(244, 63, 94, 0.7)" />
          </linearGradient>
          <filter id="blur-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
          </filter>
        </defs>

        {/* 3D Telemetry Sphere Coordinates / Latitude & Longitude Mesh lines */}
        <g transform={`translate(${centerPixel.x}, ${centerPixel.y}) rotate(15)`} className="opacity-45">
          {/* Main sphere boundary */}
          <circle cx="0" cy="0" r="76" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
          
          {/* Concentric rotating orbits/coordinate grids */}
          <ellipse cx="0" cy="0" rx="76" ry="24" stroke="rgba(99,102,241,0.15)" strokeWidth="1" fill="none" className="animate-spin-slow" />
          <ellipse cx="0" cy="0" rx="24" ry="76" stroke="rgba(99,102,241,0.15)" strokeWidth="1" fill="none" className="animate-spin-slow" />
          
          <ellipse cx="0" cy="0" rx="76" ry="48" stroke="rgba(99,102,241,0.1)" strokeWidth="0.8" strokeDasharray="3 3" fill="none" className="animate-spin-reverse-slow" />
          <ellipse cx="0" cy="0" rx="48" ry="76" stroke="rgba(99,102,241,0.1)" strokeWidth="0.8" strokeDasharray="3 3" fill="none" className="animate-spin-reverse-slow" />

          {/* Dotted orbits */}
          <circle cx="0" cy="0" r="50" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="1 8" fill="none" className="animate-spin-slow" />
          <circle cx="0" cy="0" r="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 12" fill="none" className="animate-spin-reverse-slow" />
        </g>

        {/* Connection Lines */}
        {nodes.map((node) => {
          const nodePixel = getAbsCoords(node.x, node.y);
          const isHovered = hoveredNode === node.id;
          
          let color = 'rgba(255,255,255,0.04)';
          let strokeDash = '5 5';
          let glowGrad = 'rgba(255,255,255,0.04)';
          
          if (node.status === 'covered') {
            color = isHovered ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.25)';
            strokeDash = '0';
            glowGrad = 'url(#glow-line-covered)';
          } else if (node.status === 'partial') {
            color = isHovered ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.25)';
            strokeDash = '3 2';
            glowGrad = 'url(#glow-line-partial)';
          } else { // untracked
            color = isHovered ? 'rgba(244, 63, 94, 0.8)' : 'rgba(244, 63, 94, 0.18)';
            strokeDash = '5 5';
            glowGrad = 'url(#glow-line-untracked)';
          }

          return (
            <g key={node.id} className="transition-all duration-300">
              {/* Blur Backglow for Connection line (active state) */}
              {isHovered && (
                <line
                  x1={centerPixel.x}
                  y1={centerPixel.y}
                  x2={nodePixel.x}
                  y2={nodePixel.y}
                  stroke={glowGrad}
                  strokeWidth="5"
                  filter="url(#blur-filter)"
                />
              )}
              
              {/* Main connection line */}
              <line
                x1={centerPixel.x}
                y1={centerPixel.y}
                x2={nodePixel.x}
                y2={nodePixel.y}
                stroke={isHovered ? color : 'rgba(255, 255, 255, 0.06)'}
                strokeWidth={isHovered ? 1.5 : 1}
                strokeDasharray={isHovered ? '0' : strokeDash}
                className="transition-colors duration-300"
              />

              {/* Pulsing telemetry data packet flowing along the path */}
              {isHovered && node.status !== 'untracked' && (
                <circle r="3.5" fill={node.status === 'covered' ? '#10b981' : '#f59e0b'} className="shadow-[0_0_10px_currentColor]">
                  <animateMotion
                    dur="1.5s"
                    repeatCount="indefinite"
                    path={`M ${centerPixel.x} ${centerPixel.y} L ${nodePixel.x} ${nodePixel.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Central Glowing 3D Glass Sphere */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center cursor-pointer group"
        style={{ left: `${centerX}%`, top: `${centerY}%` }}
      >
        {/* Shifting radial outer glow halos */}
        <div className={`absolute w-28 h-28 bg-gradient-to-tr ${orbGradient} rounded-full blur-2xl animate-orb-pulse transition-all duration-700`} />
        <div className="absolute w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-xl animate-spin-reverse-slow" />
        
        {/* Orbiting particles ring */}
        <div className={`absolute w-26 h-26 rounded-full border border-dashed ${pulseRingColor} animate-spin-slow transition-colors duration-500`} />
        <div className="absolute w-20 h-20 rounded-full border border-dotted border-white/5 animate-spin-reverse-slow" />
        
        {/* Glass Orb Shell */}
        <div className="relative w-16 h-16 rounded-full glass-panel flex items-center justify-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.2),_0_10px_20px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-all duration-500">
          
          {/* Inner core - dynamic color shifts */}
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${orbCore} flex items-center justify-center shadow-lg transition-all duration-500`}>
            <span className="text-[9px] font-bold text-white font-heading tracking-wider uppercase">
              {activeStatus ? activeStatus.substring(0, 4) : 'Core'}
            </span>
          </div>

          {/* Sweeping reflection highlights */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="absolute top-1 left-2 w-4 h-2 bg-white/25 rounded-full rotate-[-15deg] blur-[0.5px]" />
            <div className="absolute bottom-1 right-2 w-6 h-1 bg-white/5 rounded-full blur-[1px]" />
          </div>
        </div>
      </div>

      {/* Floating Status Node Capsules */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        
        let statusBadgeColor = 'bg-slate-400';
        let hoverBorder = 'hover:border-slate-500/50';
        
        if (node.status === 'covered') {
          statusBadgeColor = 'bg-green-covered shadow-[0_0_8px_#10b981]';
          hoverBorder = 'hover:border-green-covered/40 hover:bg-green-covered/[0.04]';
        } else if (node.status === 'partial') {
          statusBadgeColor = 'bg-amber-partial shadow-[0_0_8px_#f59e0b]';
          hoverBorder = 'hover:border-amber-partial/40 hover:bg-amber-partial/[0.04]';
        } else {
          statusBadgeColor = 'bg-red-untracked shadow-[0_0_8px_#f43f5e]';
          hoverBorder = 'hover:border-red-untracked/40 hover:bg-red-untracked/[0.04]';
        }

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
            className={`absolute z-20 glass-pill px-3 py-1.5 rounded-full flex items-center gap-2.5 cursor-pointer transition-all duration-300 ${hoverBorder} ${
              isHovered ? 'scale-105 border-white/20 bg-white/[0.08] shadow-[0_8px_20px_rgba(0,0,0,0.5)] z-30' : 'opacity-80'
            }`}
          >
            {/* Pulsing Status Light */}
            <span className={`w-2 h-2 rounded-full ${statusBadgeColor} ${node.status === 'untracked' ? 'animate-pulse' : ''}`} />
            
            {/* Metadata labels */}
            <div className="flex flex-col text-[9px] font-medium leading-none text-left">
              <span className="text-white font-heading font-semibold tracking-wide">{node.name}</span>
              <span className="text-slate-400 text-[8px] mt-0.5 font-mono">{node.route}</span>
            </div>
          </div>
        );
      })}

      {/* Floating Center Detail Card */}
      {hoveredNode !== null && (
        <div 
          style={{
            borderColor: 
              nodes[hoveredNode - 1].status === 'covered' 
                ? 'rgba(16, 185, 129, 0.3)' 
                : nodes[hoveredNode - 1].status === 'partial' 
                ? 'rgba(245, 158, 11, 0.3)' 
                : 'rgba(244, 63, 94, 0.3)',
            backgroundColor: 'rgba(5, 5, 10, 0.95)',
          }}
          className="absolute left-1/2 bottom-3 -translate-x-1/2 px-4 py-2 border rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.6)] z-30 text-[10px] w-64 text-center border-solid backdrop-blur-md animate-fade-in"
        >
          <div className="font-heading font-bold text-white uppercase tracking-wider mb-0.5">
            {nodes[hoveredNode - 1].name}
          </div>
          <div className="text-slate-400 text-[8px] mb-1.5 font-mono">
            {nodes[hoveredNode - 1].route}
          </div>
          <div className={`text-[9px] font-medium ${
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
