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
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ isDark, onToggle, className = '' }) {
    const PILL_W = 76;  // px
    const PILL_H = 38;  // px
    const PAD = 4;   // px
    const CIRCLE = PILL_H - PAD * 2; // 30px

    return (
        <div
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggle()}
            className={className}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                width: `${PILL_W}px`,
                height: `${PILL_H}px`,
                padding: `${PAD}px`,
                borderRadius: '9999px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background 300ms, border-color 300ms',
                background: isDark ? '#18181b' : '#f4f4f5',
                border: `1.5px solid ${isDark ? '#3f3f46' : '#d4d4d8'}`,
                boxSizing: 'border-box',
                flexShrink: 0,
                gap: 0,
            }}
        >
            {/* Sliding highlight circle */}
            <div
                style={{
                    position: 'absolute',
                    top: `${PAD}px`,
                    left: `${PAD}px`,
                    width: `${CIRCLE}px`,
                    height: `${CIRCLE}px`,
                    borderRadius: '50%',
                    transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
                    transform: isDark
                        ? `translateX(${PILL_W - PAD * 2 - CIRCLE}px)` // → right (dark)
                        : 'translateX(0)',                               // ← left (light)
                    background: isDark ? '#3f3f46' : '#ffffff',
                    boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.15)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            {/* ☀ Sun slot — always LEFT */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${CIRCLE}px`,
                height: `${CIRCLE}px`,
                flexShrink: 0,
            }}>
                <Sun
                    size={16}
                    strokeWidth={1.5}
                    color={isDark ? '#71717a' : '#faaf5aff'}
                />
            </div>

            {/* 🌙 Moon slot — always RIGHT */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${CIRCLE}px`,
                height: `${CIRCLE}px`,
                flexShrink: 0,
                marginLeft: `${PILL_W - PAD * 2 - CIRCLE * 2}px`,
            }}>
                <Moon
                    size={16}
                    strokeWidth={1.5}
                    color={isDark ? '#c4b5fd' : '#a1a1aa'}
                />
            </div>
        </div>
    );
}
