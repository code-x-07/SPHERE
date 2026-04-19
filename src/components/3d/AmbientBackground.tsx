import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 1800;

function ParticleField({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = 0;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const [mx, my] = mouse.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] += velocities[i * 3] + Math.sin(timeRef.current * 0.3 + i * 0.01) * 0.0008;
      pos[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(timeRef.current * 0.2 + i * 0.013) * 0.0008;

      const dx = pos[i * 3] - mx * 10;
      const dy = pos[i * 3 + 1] - my * 10;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        pos[i * 3] += (dx / dist) * 0.008;
        pos[i * 3 + 1] += (dy / dist) * 0.008;
      }

      if (pos[i * 3] > 10) pos[i * 3] = -10;
      if (pos[i * 3] < -10) pos[i * 3] = 10;
      if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = -10;
      if (pos[i * 3 + 1] < -10) pos[i * 3 + 1] = 10;
    }
    geo.attributes.position.needsUpdate = true;
    meshRef.current.rotation.z += delta * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#0ea5e9"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function ConnectionLines({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const ref = useRef<THREE.LineSegments>(null);
  const timeRef = useRef(0);
  const COUNT = 60;

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 6);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 6] = (Math.random() - 0.5) * 16;
      pos[i * 6 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 6 + 2] = 0;
      pos[i * 6 + 3] = pos[i * 6] + (Math.random() - 0.5) * 4;
      pos[i * 6 + 4] = pos[i * 6 + 1] + (Math.random() - 0.5) * 4;
      pos[i * 6 + 5] = 0;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const [mx, my] = mouse.current;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 6] += Math.sin(timeRef.current * 0.15 + i) * 0.003;
      pos[i * 6 + 1] += Math.cos(timeRef.current * 0.12 + i) * 0.003;
      pos[i * 6 + 3] += Math.sin(timeRef.current * 0.1 + i * 1.5) * 0.003;
      pos[i * 6 + 4] += Math.cos(timeRef.current * 0.18 + i * 1.5) * 0.003;
      pos[i * 6] += mx * 0.0005;
      pos[i * 6 + 1] += my * 0.0005;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={COUNT * 2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#06b6d4" transparent opacity={0.12} />
    </lineSegments>
  );
}

export default function AmbientBackground() {
  const mouse = useRef<[number, number]>([0, 0]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1),
    ];
  };

  return (
    <div
      className="fixed inset-0 z-0"
      onMouseMove={handleMouseMove}
      style={{ background: 'radial-gradient(ellipse at 30% 50%, #050d1a 0%, #050505 60%, #0a0505 100%)' }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.3} />
        <ParticleField mouse={mouse} />
        <ConnectionLines mouse={mouse} />
      </Canvas>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,165,233,0.04) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
