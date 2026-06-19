'use client';

import React, { useState, useEffect } from 'react';

export default function HeroVisual() {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [scanPosition, setScanPosition] = useState(0);

  // Animate a scanning bar effect
  useEffect(() => {
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { id: 1, path: '/app/page.tsx', rule: '//*/', status: 'covered', label: 'Home View' },
    { id: 2, path: '/app/dashboard/page.tsx', rule: '//*/dashboard', status: 'covered', label: 'Dashboard View' },
    { id: 3, path: '/app/dashboard/settings/page.tsx', rule: 'NO MATCH', status: 'untracked', label: 'Settings Change' },
    { id: 4, path: '/app/billing/invoices/page.tsx', rule: 'NO MATCH', status: 'untracked', label: 'Invoice Download' },
    { id: 5, path: '/app/profile/page.tsx', rule: '//*/profile (partial)', status: 'partial', label: 'Profile Update' },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto h-[170px] border border-border bg-[#0c0c0c] rounded-md overflow-hidden font-mono text-[10px] p-4 flex justify-between items-center select-none shadow-2xl">
      {/* Laser Scanning Line */}
      <div 
        className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-partial/40 to-transparent pointer-events-none z-10"
        style={{ top: `${scanPosition}%` }}
      />
      {/* Glowing background dots */}
      <div className="absolute top-1/4 left-1/4 w-36 h-36 bg-red-untracked/5 rounded-full blur-[40px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-36 h-36 bg-green-covered/5 rounded-full blur-[40px] pointer-events-none" />

      {/* Cyber Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b1b1b_1px,transparent_1px),linear-gradient(to_bottom,#1b1b1b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

      {/* Left side: Codebase Routes */}
      <div className="flex flex-col gap-2 z-10 w-[42%] text-left">
        <span className="text-secondary uppercase text-[8px] tracking-wider mb-1 block border-b border-border pb-1">Codebase Routes</span>
        {nodes.map((node) => (
          <div 
            key={node.id}
            onMouseEnter={() => setActiveNode(node.id)}
            onMouseLeave={() => setActiveNode(null)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeNode === node.id 
                ? 'border-primary bg-[#151515] text-primary scale-[1.02]' 
                : 'border-border bg-surface text-secondary'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate h-5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                node.status === 'covered' 
                  ? 'bg-green-covered shadow-[0_0_4px_#22c55e]' 
                  : node.status === 'partial' 
                  ? 'bg-amber-partial shadow-[0_0_4px_#f59e0b]' 
                  : 'bg-red-untracked shadow-[0_0_4px_#ef4444]'
              }`} />
              <span className="truncate">{node.path}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Center SVG Connections */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none z-0">
        <svg className="w-full h-full">
          {nodes.map((node) => {
            const isActive = activeNode === node.id;
            const y1 = 43 + (node.id - 1) * 23.5;
            const y2 = 43 + (node.id - 1) * 23.5;
            
            // Connect left to right (Left X = ~188, Right X = ~292)
            let strokeColor = 'rgba(34, 34, 34, 0.4)';
            if (activeNode === null) {
              strokeColor = node.status === 'covered' 
                ? 'rgba(34, 197, 94, 0.15)' 
                : node.status === 'partial' 
                ? 'rgba(245, 158, 11, 0.15)' 
                : 'rgba(239, 68, 68, 0.15)';
            } else if (isActive) {
              strokeColor = node.status === 'covered' 
                ? 'rgba(34, 197, 94, 0.7)' 
                : node.status === 'partial' 
                ? 'rgba(245, 158, 11, 0.7)' 
                : 'rgba(239, 68, 68, 0.7)';
            }

            return (
              <React.Fragment key={node.id}>
                {/* SVG path connecting nodes */}
                <path
                  d={`M 188 ${y1} Q 240 ${y1} 240 ${y2} T 292 ${y2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 1.5 : 1}
                  className="transition-colors duration-200"
                />
                
                {/* Flowing data packet animation on active line */}
                {isActive && node.status !== 'untracked' && (
                  <circle r="2.5" fill={node.status === 'covered' ? 'var(--color-green-covered)' : 'var(--color-amber-partial)'}>
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={`M 188 ${y1} Q 240 ${y1} 240 ${y2} T 292 ${y2}`}
                    />
                  </circle>
                )}
              </React.Fragment>
            );
          })}
        </svg>
      </div>

      {/* Right side: Pendo Page Rules */}
      <div className="flex flex-col gap-2 z-10 w-[42%] text-right">
        <span className="text-secondary uppercase text-[8px] tracking-wider mb-1 block border-b border-border pb-1 text-right">Pendo Rules Mapping</span>
        {nodes.map((node) => (
          <div 
            key={node.id}
            onMouseEnter={() => setActiveNode(node.id)}
            onMouseLeave={() => setActiveNode(null)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeNode === node.id 
                ? 'border-primary bg-[#151515] text-primary scale-[1.02]' 
                : 'border-border bg-surface text-secondary'
            }`}
          >
            <div className="flex items-center justify-end gap-1.5 truncate h-5">
              <span className="truncate">{node.rule}</span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                node.status === 'covered' 
                  ? 'bg-green-covered shadow-[0_0_4px_#22c55e]' 
                  : node.status === 'partial' 
                  ? 'bg-amber-partial shadow-[0_0_4px_#f59e0b]' 
                  : 'bg-red-untracked shadow-[0_0_6px_#ef4444] animate-ping'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Center Badge for Status HUD */}
      {activeNode !== null && (
        <div 
          style={{
            borderColor: 
              nodes[activeNode - 1].status === 'covered' 
                ? 'rgba(34, 197, 94, 0.4)' 
                : nodes[activeNode - 1].status === 'partial' 
                ? 'rgba(245, 158, 11, 0.4)' 
                : 'rgba(239, 68, 68, 0.4)',
            backgroundColor: 'rgba(10, 10, 10, 0.95)'
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 border rounded-md shadow-2xl z-20 text-[9px] min-w-[130px] font-semibold text-center border-solid"
        >
          <div className="text-center font-bold">
            {nodes[activeNode - 1].status === 'covered' ? (
              <span className="text-green-covered">✓ TELEMETRY OK</span>
            ) : nodes[activeNode - 1].status === 'partial' ? (
              <span className="text-amber-partial">⚠ PARTIAL RULE</span>
            ) : (
              <span className="text-red-untracked animate-pulse">❌ DRIFT DETECTED</span>
            )}
          </div>
          <div className="text-secondary text-[8px] mt-0.5 truncate">
            {nodes[activeNode - 1].label}
          </div>
        </div>
      )}
    </div>
  );
}
