import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Floating Particles Component
 * Creates a subtle, ambient particle effect in the background
 * Very slow, calming movement - doesn't affect user interaction
 */
const FloatingParticles = () => {
  const pointsRef = useRef(null);
  const particlesRef = useRef(null);

  // Generate particle positions
  useEffect(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);

    // Create particles in a sphere volume
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40; // x
      positions[i + 1] = (Math.random() - 0.5) * 40; // y
      positions[i + 2] = (Math.random() - 0.5) * 40; // z
    }

    if (particlesRef.current) {
      particlesRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
    }
  }, []);

  // Animate particles with very slow movement
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      // Rotate very slowly (only 0.02 rad per second - extremely subtle)
      pointsRef.current.rotation.x += 0.0001;
      pointsRef.current.rotation.y += 0.00015;

      // Optional: slight position wave (very subtle)
      const time = clock.getElapsedTime();
      pointsRef.current.position.y = Math.sin(time * 0.05) * 0.3; // Max 0.3 units movement
    }
  });

  return (
    <group ref={pointsRef}>
      <Points ref={particlesRef} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#667eea" // Primary color from theme
          size={0.08}
          sizeAttenuation
          depthWrite={false}
          opacity={0.3} // Low opacity for ambient feel
        />
      </Points>
    </group>
  );
};

/**
 * Animated Gradient Mesh Component
 * Alternative to particles - creates a subtle gradient effect
 * Can be used instead of or alongside particles
 */
const AnimatedGradientMesh = () => {
  const meshRef = useRef(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Very subtle rotation
      meshRef.current.rotation.x += 0.00005;
      meshRef.current.rotation.y += 0.0001;
      meshRef.current.rotation.z += 0.00003;
    }
  });

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]} position={[0, 0, 0]}>
      <icosahedronGeometry args={[20, 4]} />
      <meshPhongMaterial
        color="#764ba2"
        wireframe={false}
        wireframeLinewidth={1}
        opacity={0.05}
        transparent
        emissive="#667eea"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

/**
 * Canvas Background Component
 * Wraps Three.js canvas with particles
 * Positioned absolutely behind all content
 */
const CanvasBackground = ({ children = null, useGradient = false }) => {
  // Check for prefers-reduced-motion (accessibility)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check if device is low-end (simple heuristic)
  const isLowEndDevice = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return true;

    // Check for low VRAM or mobile
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return renderer && (renderer.includes('Mali') || renderer.includes('Adreno'));
    }
    return false;
  };

  // Disable animations on low-end devices or if user prefers reduced motion
  if (prefersReducedMotion || isLowEndDevice()) {
    return <div className="canvas-background-disabled" />;
  }

  return (
    <div style={styles.container}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          precision: 'lowp', // Lower precision for better performance
          powerPreference: 'high-performance',
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.3} />

        {/* Render gradient mesh or particles */}
        {useGradient ? <AnimatedGradientMesh /> : <FloatingParticles />}

        {children}
      </Canvas>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none', // Allow clicks through canvas
    overflow: 'hidden',
  },
};

export { CanvasBackground, FloatingParticles, AnimatedGradientMesh };
export default CanvasBackground;
