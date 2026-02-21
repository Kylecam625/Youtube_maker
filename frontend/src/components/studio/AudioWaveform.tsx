import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
}

export function AudioWaveform({ stream }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const bgChannels = getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim() || "18 18 18";
    const bgColor = `rgb(${bgChannels})`;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const hue = (i / bufferLength) * 120;
        ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audioCtx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-16 rounded-lg border-2 border-border bg-background"
    />
  );
}
