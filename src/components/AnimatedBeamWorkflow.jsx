/**
 * ============================================================
 *  CREDENT — AI Credit Appraisal Engine
 *  © 2025 Asenra. All Rights Reserved.
 *  https://asenra.in
 *
 *  This source code is the exclusive intellectual property of
 *  Asenra. Unauthorized reproduction, distribution, or use
 *  of this code, in whole or in part, is strictly prohibited.
 * ============================================================
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, Search, ShieldCheck, BrainCircuit, Award, BarChart3 } from 'lucide-react';

/* ═══════════════════════════════════════════════
   AnimatedBeamWorkflow — Credent Pipeline
   Shows data flowing from sources → AI Engine → outputs
═══════════════════════════════════════════════ */

// SVG animated beam between two points
function AnimatedBeam({ x1, y1, x2, y2, delay = 0, reverse = false, color = 'var(--teal)' }) {
    const [pathD, setPathD] = useState('');

    useEffect(() => {
        const midX = (x1 + x2) / 2;
        const curvature = (y2 - y1) * 0.4;
        const d = `M ${x1} ${y1} Q ${midX} ${y1 + curvature} ${x2} ${y2}`;
        setPathD(d);
    }, [x1, y1, x2, y2]);

    if (!pathD) return null;

    const beamId = `beam-${x1}-${y1}-${x2}-${y2}`;

    return (
        <g>
            <path d={pathD} fill="none" stroke="var(--border-default)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
            <circle r="3" fill={color} opacity="0.9">
                <animateMotion dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} keyPoints={reverse ? "1;0" : "0;1"} keyTimes="0;1">
                    <mpath href={`#${beamId}`} />
                </animateMotion>
            </circle>
            <circle r="6" fill={color} opacity="0.15">
                <animateMotion dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} keyPoints={reverse ? "1;0" : "0;1"} keyTimes="0;1">
                    <mpath href={`#${beamId}`} />
                </animateMotion>
            </circle>
            <path id={beamId} d={pathD} fill="none" stroke="none" />
        </g>
    );
}

// Node circle with label — uses wider foreignObject to prevent clipping
function WorkflowNode({ icon: Icon, label, x, y, size = 48, color, bg, isCenter = false }) {
    const boxW = 120;
    return (
        <foreignObject
            x={x - boxW / 2}
            y={y - size / 2 - 2}
            width={boxW}
            height={size + 28}
            style={{ overflow: 'visible' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: isCenter ? 0.1 : 0.15 }}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: isCenter ? '14px' : '50%',
                        background: isCenter
                            ? 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)'
                            : bg || 'var(--bg-primary)',
                        border: isCenter ? 'none' : '2px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isCenter
                            ? '0 8px 32px -4px rgba(6, 182, 212, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.15)'
                            : '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
                        color: isCenter ? 'white' : (color || 'var(--text-secondary)'),
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    <Icon size={isCenter ? 26 : 18} />
                    {isCenter && (
                        <div style={{
                            position: 'absolute',
                            inset: '-3px',
                            borderRadius: '17px',
                            border: '2px solid var(--teal)',
                            opacity: 0.3,
                            animation: 'pulse-ring 2s ease-in-out infinite',
                        }} />
                    )}
                </motion.div>
                <span style={{
                    fontSize: '0.5625rem',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    lineHeight: 1.2,
                }}>
                    {label}
                </span>
            </div>
        </foreignObject>
    );
}

export default function AnimatedBeamWorkflow() {
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ w: 640, h: 300 });

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDims({ w: Math.max(rect.width, 500), h: 300 });
            }
        };
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    const cx = dims.w / 2;
    const cy = 140;
    const spread = Math.min(200, dims.w * 0.28);

    // Left nodes (data sources)
    const leftX = cx - spread;
    const leftNodes = [
        { icon: FileText, label: 'PDF Upload', y: cy - 85, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)' },
        { icon: Database, label: 'GSTN Data', y: cy, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.08)' },
        { icon: Search, label: 'Web Intel', y: cy + 85, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
    ];

    // Right nodes (outputs)
    const rightX = cx + spread;
    const rightNodes = [
        { icon: BarChart3, label: 'Risk Score', y: cy - 85, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
        { icon: ShieldCheck, label: 'Integrity', y: cy, color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.08)' },
        { icon: Award, label: 'CAM Report', y: cy + 85, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.08)' },
    ];

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '700px',
                margin: '0 auto',
                height: '310px',
                overflow: 'visible',
            }}
        >
            <svg
                viewBox={`0 0 ${dims.w} 310`}
                width="100%"
                height="310"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <style>{`
            @keyframes pulse-ring {
              0%, 100% { opacity: 0.2; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.08); }
            }
          `}</style>
                </defs>

                {/* Beams: left → center */}
                {leftNodes.map((node, i) => (
                    <AnimatedBeam
                        key={`l-${i}`}
                        x1={leftX + 24}
                        y1={node.y}
                        x2={cx - 32}
                        y2={cy}
                        delay={i * 0.6}
                        color={node.color}
                    />
                ))}

                {/* Beams: center → right */}
                {rightNodes.map((node, i) => (
                    <AnimatedBeam
                        key={`r-${i}`}
                        x1={cx + 32}
                        y1={cy}
                        x2={rightX - 24}
                        y2={node.y}
                        delay={i * 0.6 + 0.3}
                        color={node.color}
                    />
                ))}

                {/* Left nodes (sources) */}
                {leftNodes.map((node, i) => (
                    <WorkflowNode key={`ln-${i}`} icon={node.icon} label={node.label} x={leftX} y={node.y} color={node.color} bg={node.bg} />
                ))}

                {/* Center node (AI Engine) */}
                <WorkflowNode icon={BrainCircuit} label="AI Engine" x={cx} y={cy} size={60} isCenter />

                {/* Right nodes (outputs) */}
                {rightNodes.map((node, i) => (
                    <WorkflowNode key={`rn-${i}`} icon={node.icon} label={node.label} x={rightX} y={node.y} color={node.color} bg={node.bg} />
                ))}
            </svg>
        </div>
    );
}
