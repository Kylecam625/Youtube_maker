import { useEffect, useRef, useCallback } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform vec3 u_keyColor;
  uniform float u_threshold;
  uniform float u_smoothing;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float diff = distance(color.rgb, u_keyColor);
    float alpha = smoothstep(u_threshold, u_threshold + u_smoothing, diff);
    gl_FragColor = vec4(color.rgb, alpha);
  }
`;

interface ChromaKeyCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  keyColor: [number, number, number];
  threshold: number;
  smoothing: number;
  width?: number;
  height?: number;
}

export function ChromaKeyCanvas({
  videoRef,
  enabled,
  keyColor,
  threshold,
  smoothing,
  width = 1280,
  height = 720,
}: ChromaKeyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animRef = useRef<number>(0);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
    if (!gl) return;
    glRef.current = gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textureRef.current = texture;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }, []);

  useEffect(() => {
    if (enabled) initGL();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [enabled, initGL]);

  useEffect(() => {
    if (!enabled) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const render = () => {
      const gl = glRef.current;
      const video = videoRef.current;
      const program = programRef.current;
      if (!gl || !video || !program || video.readyState < 2) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      gl.uniform3f(gl.getUniformLocation(program, "u_keyColor"), keyColor[0], keyColor[1], keyColor[2]);
      gl.uniform1f(gl.getUniformLocation(program, "u_threshold"), threshold);
      gl.uniform1f(gl.getUniformLocation(program, "u_smoothing"), smoothing);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [enabled, keyColor, threshold, smoothing, videoRef]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
