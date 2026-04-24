import React, { useRef, useEffect } from 'react';

/* ═══════════════════════════════════════════════
   VideoText — Text with video background
   Uses CSS mix-blend-mode for the masking effect
═══════════════════════════════════════════════ */

export default function VideoText({ src, children, fontSize = '6rem', fontWeight = 900 }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, []);

    return (
        <div className="video-text-wrapper">
            {/* Video layer */}
            <video
                ref={videoRef}
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className="video-text-video"
            />
            {/* Mask overlay — white bg with black text, blended so video shows through text */}
            <div className="video-text-mask">
                <span
                    className="video-text-content"
                    style={{ fontSize, fontWeight }}
                >
                    {children}
                </span>
            </div>
        </div>
    );
}
