import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store/gameStore';
import { drawDieChessboard } from '../utils/drawChessboard';

const DIE_SIZE = 2;
const TEX_SIZE = 256;

/**
 * 6 preset roll animations. Each leads to a specific face on top.
 * 
 * The rotations are designed so that:
 *   Face 0 (+X) up → final rotation (0, 0, -π/2)
 *   Face 1 (-X) up → final rotation (0, 0, π/2)
 *   Face 2 (+Y) up → final rotation (0, 0, 0)
 *   Face 3 (-Y) up → final rotation (π, 0, 0)
 *   Face 4 (+Z) up → final rotation (-π/2, 0, 0)
 *   Face 5 (-Z) up → final rotation (π/2, 0, 0)
 */
const FACE_ROTATIONS = [
  new THREE.Euler(0, 0, -Math.PI / 2),             // Face 0 (+X) up
  new THREE.Euler(0, 0, Math.PI / 2),              // Face 1 (-X) up
  new THREE.Euler(0, 0, 0),                         // Face 2 (+Y) up
  new THREE.Euler(Math.PI, 0, 0),                   // Face 3 (-Y) up
  new THREE.Euler(-Math.PI / 2, 0, 0),             // Face 4 (+Z) up
  new THREE.Euler(Math.PI / 2, 0, 0),              // Face 5 (-Z) up
];

/**
 * Animation phases:
 * 1. LIFT    - Die lifts up from surface (0 → 0.2s)
 * 2. SPIN    - Die spins wildly in the air (0.2s → 1.5s)
 * 3. SETTLE  - Die lands and settles to final rotation (1.5s → 2.2s)
 */
const ANIM_DURATION = 1.0;
const LIFT_END = 0.15;
const SPIN_END = 0.7;

// Easing functions
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

export default function AnimatedDie() {
  const phase = useGameStore((s) => s.phase);
  const games = useGameStore((s) => s.games);
  const topFace = useGameStore((s) => s.topFace);
  const rollCount = useGameStore((s) => s.rollCount);
  const rollTargetFace = useGameStore((s) => s.rollTargetFace);
  const setTopFace = useGameStore((s) => s.setTopFace);

  const meshRef = useRef();
  const animState = useRef({
    isAnimating: false,
    startTime: 0,
    targetFace: 0,
    startQuat: new THREE.Quaternion(),
    targetQuat: new THREE.Quaternion(),
    settleStartQuat: new THREE.Quaternion(),
    settleStartCaptured: false,
    spinAxis: new THREE.Vector3(1, 1, 0).normalize(),
    spinSpeed: 12,
    lastRollCount: 0,
  });

  // Create 6 offscreen canvases for textures
  const canvases = useMemo(() => {
    return Array.from({ length: 6 }, () => {
      const canvas = document.createElement('canvas');
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      return canvas;
    });
  }, []);

  // Create textures from canvases
  const textures = useMemo(() => {
    return canvases.map((canvas) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    });
  }, [canvases]);

  // Create materials array (one per face)
  const materials = useMemo(() => {
    return textures.map((tex) => {
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.35,
        metalness: 0.05,
      });
    });
  }, [textures]);

  // Start animation when roll is triggered
  useEffect(() => {
    if (phase === 'ROLLING' && rollCount !== animState.current.lastRollCount) {
      animState.current.lastRollCount = rollCount;

      // Use the target face from store, fallback to random just in case
      const targetFace = rollTargetFace !== null ? rollTargetFace : Math.floor(Math.random() * 6);

      // Store current quaternion as start
      if (meshRef.current) {
        animState.current.startQuat.copy(meshRef.current.quaternion);
      }

      // Compute target quaternion from the face rotation
      const targetEuler = FACE_ROTATIONS[targetFace];
      animState.current.targetQuat.setFromEuler(targetEuler);

      // Random spin axis and speed for variety
      animState.current.spinAxis.set(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize();
      animState.current.spinSpeed = 8 + Math.random() * 10;

      animState.current.targetFace = targetFace;
      animState.current.startTime = -1; // Will be set on first frame
      animState.current.settleStartCaptured = false;
      animState.current.isAnimating = true;
    }
  }, [phase, rollCount]);

  const prevGames = useRef([...games]);
  const prevTopFace = useRef(topFace);

  // Update textures whenever games or topFace change
  useEffect(() => {
    let timeoutIds = [];
    canvases.forEach((canvas, i) => {
      // Only draw if the game FEN changed, or if the topFace highlight state for this face changed
      const gameChanged = prevGames.current[i] !== games[i];
      const topFaceChanged = (prevTopFace.current === i) !== (topFace === i);
      
      if (gameChanged || topFaceChanged || !animState.current.initializedTextures) {
        const id = setTimeout(() => {
          const ctx = canvas.getContext('2d');
          drawDieChessboard(ctx, TEX_SIZE, games[i], i, topFace === i);
          textures[i].needsUpdate = true;
          prevGames.current[i] = games[i];
        }, i * 50); // Stagger by 50ms per face
        timeoutIds.push(id);
      }
    });
    prevTopFace.current = topFace;
    animState.current.initializedTextures = true;
    
    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [games, topFace, canvases, textures]);

  // Animation loop
  useFrame((state) => {
    if (!animState.current.isAnimating || !meshRef.current) return;

    const clock = state.clock;
    if (animState.current.startTime < 0) {
      animState.current.startTime = clock.getElapsedTime();
    }

    const elapsed = clock.getElapsedTime() - animState.current.startTime;
    const t = Math.min(elapsed / ANIM_DURATION, 1);

    const mesh = meshRef.current;

    if (elapsed < LIFT_END) {
      // Phase 1: LIFT — rise up while starting to spin
      const liftT = elapsed / LIFT_END;
      const liftEase = easeOutQuart(liftT);
      mesh.position.y = 1 + liftEase * 4;

      // Begin rotating
      const spinAngle = elapsed * animState.current.spinSpeed;
      const spinQuat = new THREE.Quaternion();
      spinQuat.setFromAxisAngle(animState.current.spinAxis, spinAngle);
      mesh.quaternion.copy(animState.current.startQuat).multiply(spinQuat);

    } else if (elapsed < SPIN_END) {
      // Phase 2: SPIN — fast spinning at peak height with slight bob
      const spinT = (elapsed - LIFT_END) / (SPIN_END - LIFT_END);
      
      // Height: parabolic arc
      const heightT = spinT;
      const height = 5 + Math.sin(heightT * Math.PI) * 2;
      mesh.position.y = height;

      // Fast spin that gradually slows
      const spinAngle = elapsed * animState.current.spinSpeed * (1 - spinT * 0.5);
      const spinQuat = new THREE.Quaternion();
      spinQuat.setFromAxisAngle(animState.current.spinAxis, spinAngle);
      mesh.quaternion.copy(animState.current.startQuat).multiply(spinQuat);

      // Slight wobble on a second axis
      const wobbleAxis = new THREE.Vector3(
        animState.current.spinAxis.z,
        animState.current.spinAxis.x,
        animState.current.spinAxis.y
      ).normalize();
      const wobbleQuat = new THREE.Quaternion();
      wobbleQuat.setFromAxisAngle(wobbleAxis, Math.sin(elapsed * 7) * 0.3 * (1 - spinT));
      mesh.quaternion.multiply(wobbleQuat);

    } else {
      // Phase 3: SETTLE — lerp to final rotation and position
      // Capture the quaternion at the exact transition point
      if (!animState.current.settleStartCaptured) {
        animState.current.settleStartQuat.copy(mesh.quaternion);
        animState.current.settleStartCaptured = true;
      }

      const settleT = (elapsed - SPIN_END) / (ANIM_DURATION - SPIN_END);
      const clampedT = Math.min(settleT, 1);
      const settleEase = easeOutBounce(clampedT);

      // Position: come down to rest height (1 = half die size above floor)
      mesh.position.y = 5 * (1 - settleEase) + 1;

      // Rotation: smooth slerp from captured spin-end orientation to target
      const rotProgress = easeInOutCubic(clampedT);
      mesh.quaternion.slerpQuaternions(
        animState.current.settleStartQuat,
        animState.current.targetQuat,
        rotProgress
      );
    }

    // Animation complete
    if (t >= 1) {
      animState.current.isAnimating = false;
      mesh.position.y = 1;
      mesh.quaternion.copy(animState.current.targetQuat);

      // Notify store of the top face
      setTimeout(() => {
        setTopFace(animState.current.targetFace);
      }, 300);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 1, 0]} castShadow receiveShadow material={materials}>
      <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
    </mesh>
  );
}
