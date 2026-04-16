import { useEffect, useRef } from 'react';

export default function Background() {
    const canvasRef = useRef(null);

    useEffect(() => {
        console.log('Background initialisé 🚀');

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let animationFrameId;
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        resize();

        const drawHex = (x, y, s, opacity) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = x + s * Math.cos(angle);
                const py = y + s * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(110,90,139,${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        const baseSize = 20;
        const gap = 16;
        const dx = 1.5 * baseSize + gap;
        const dy = Math.sqrt(3) * baseSize + gap;

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let col = 0; col < canvas.width / dx + 2; col++) {
                for (let row = 0; row < canvas.height / dy + 2; row++) {
                    const x = col * dx;
                    const y = row * dy + (col % 2 ? (dy / 2) : 0);

                    const dist = Math.hypot(mouse.x - x, mouse.y - y);
                    const maxDist = 200;

                    let opacity = 0.15;
                    let size = baseSize;
                    if (dist < maxDist) {
                        const t = 1 - dist / maxDist;
                        opacity = 0.15 + t * 0.85;
                        size = baseSize * (1 + t * 0.5);
                    }

                    drawHex(x, y, size, opacity);
                }
            }
            animationFrameId = requestAnimationFrame(drawGrid);
        };

        drawGrid();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="background">
            <canvas ref={canvasRef} id="hexCanvas"></canvas>
        </div>
    );
}