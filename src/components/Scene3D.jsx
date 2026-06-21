import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AnimatedDie from './AnimatedDie';
import Floor from './Floor';

export default function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 10], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: 3 /* ACESFilmic */ }}
      style={{ background: 'transparent' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#c8c0ff" />
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-5, 8, -3]}
        intensity={0.4}
        color="#8b7bff"
      />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#ff6b9d" />

      {/* Fog */}
      <fog attach="fog" args={['#0a0a0f', 15, 40]} />

      {/* Die with animation (no physics) */}
      <AnimatedDie />

      {/* Floor (visual only, no physics) */}
      <Floor />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={6}
        maxDistance={20}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.45}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
        target={[0, 1.5, 0]}
      />
    </Canvas>
  );
}
