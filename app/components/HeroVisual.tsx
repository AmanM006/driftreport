'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TelemetryNode {
  id: number;
  name: string;
  route: string;
  status: 'covered' | 'partial' | 'untracked';
  detail: string;
  x: number;
  y: number;
}

export default function HeroVisual() {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 220 });

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
    { id: 2, name: 'Stripe Checkout',      route: '/billing/checkout',    status: 'covered',   detail: 'Fully instrumented with valid shadow schema', x: 82, y: 20 },
    { id: 3, name: 'User Auth',            route: '/profile/security',    status: 'covered',   detail: 'All security actions mapped successfully',  x: 16, y: 76 },
    { id: 4, name: 'Billing Invoices',     route: '/billing/invoices',    status: 'untracked', detail: 'Telemetry Gap: 0 rules map to codebase path', x: 83, y: 78 },
    { id: 5, name: 'Settings Hub',         route: '/dashboard/settings',  status: 'untracked', detail: 'Drift Detected: active flag requires schema map', x: 86, y: 48 },
  ];

  const centerX = 50;
  const centerY = 50;

  const getAbsCoords = (pctX: number, pctY: number) => ({
    x: (pctX / 100) * dimensions.width,
    y: (pctY / 100) * dimensions.height,
  });

  const centerPixel = getAbsCoords(centerX, centerY);

  const statusColor = (s: TelemetryNode['status'], hovered: boolean) => {
    if (s === 'covered')   return hovered ? 'rgba(134,239,172,0.55)' : 'rgba(134,239,172,0.15)';
    if (s === 'partial')   return hovered ? 'rgba(251,191, 36,0.55)' : 'rgba(251,191, 36,0.15)';
    return                          hovered ? 'rgba(248, 113,113,0.55)' : 'rgba(248,113,113,0.10)';
  };

  const dotColor = (s: TelemetryNode['status']) => {
    if (s === 'covered')   return '#86efac';
    if (s === 'partial')   return '#fbbf24';
    return '#f87171';
  };

  const activeNode = hoveredNode !== null ? nodes.find(n => n.id === hoveredNode) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto h-[220px] overflow-hidden select-none"
    >
      {/* Subtle background glow at center */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: activeNode
            ? `radial-gradient(ellipse 60% 50% at 50% 50%, ${statusColor(activeNode.status, false).replace('0.15', '0.06').replace('0.10', '0.04')} 0%, transparent 70%)`
            : 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />

      {/* SVG: crosshair anchor + connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Tiny crosshair at center — no big circle */}
        <line
          x1={centerPixel.x - 6} y1={centerPixel.y}
          x2={centerPixel.x + 6} y2={centerPixel.y}
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"
        />
        <line
          x1={centerPixel.x} y1={centerPixel.y - 6}
          x2={centerPixel.x} y2={centerPixel.y + 6}
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"
        />

        {/* Connection lines from center to each node */}
        {nodes.map((node) => {
          const np = getAbsCoords(node.x, node.y);
          const isHovered = hoveredNode === node.id;
          return (
            <line
              key={node.id}
              x1={centerPixel.x}
              y1={centerPixel.y}
              x2={np.x}
              y2={np.y}
              stroke={statusColor(node.status, isHovered)}
              strokeWidth={isHovered ? 1 : 0.7}
              strokeDasharray={isHovered ? '0' : '3 4'}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* Route capsules */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
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
            className={`absolute z-20 px-2.5 py-1 rounded-full border flex items-center gap-1.5 cursor-default transition-all duration-300 ${
              isHovered
                ? 'bg-white/[0.06] border-white/15 shadow-sm scale-[1.04]'
                : 'bg-[#07070e]/50 border-white/[0.06] opacity-65'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: dotColor(node.status) }}
            />
            <div className="flex flex-col leading-none text-left">
              <span className="text-[8.5px] text-white font-medium whitespace-nowrap">{node.name}</span>
              <span className="text-[7.5px] text-white/35 mt-[1px] font-mono whitespace-nowrap">{node.route}</span>
            </div>
          </div>
        );
      })}

      {/* Hover detail card — anchored bottom-center */}
      {activeNode && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-30 animate-fade-in">
          <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#07070e]/90 backdrop-blur-sm shadow-md text-center">
            <div className="text-[8.5px] font-medium text-white mb-0.5">{activeNode.route}</div>
            <div
              className="text-[8px] leading-relaxed max-w-[220px]"
              style={{ color: dotColor(activeNode.status), opacity: 0.85 }}
            >
              {activeNode.detail}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
