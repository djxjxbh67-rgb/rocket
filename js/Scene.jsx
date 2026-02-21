import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// The core geometric assembly
function QuantumRing() {
    const meshRef = useRef();

    // Create a complex torus knot for that high-tech look
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.1;
            meshRef.current.rotation.y += delta * 0.15;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={meshRef}>
                <torusKnotGeometry args={[1.5, 0.4, 256, 64, 2, 3]} />
                <meshPhysicalMaterial
                    color="#00ffcc"
                    emissive="#004433"
                    roughness={0.1}
                    metalness={0.8}
                    transmission={0.9} // Glass effect
                    thickness={0.5}
                    ior={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    wireframe={true} // Add a high tech feel
                    wireframeLinewidth={1}
                    transparent={true}
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
}

// Particle stream background
function ParticleStream() {
    const pointsRef = useRef();

    // Generate random points in a sphere/cylinder
    const count = 2000;
    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const radius = 3 + Math.random() * 5;
            const y = (Math.random() - 0.5) * 20;

            arr[i * 3] = Math.cos(theta) * radius;
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = Math.sin(theta) * radius;
        }
        return arr;
    }, [count]);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y -= delta * 0.05;
            // Subtle wave effect
            const positions = pointsRef.current.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                positions[iy] -= delta * 2; // Move down
                if (positions[iy] < -10) positions[iy] = 10; // Reset
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial transparent color="#ffffff" size={0.05} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
        </Points>
    );
}

function Scene() {
    const groupRef = useRef();

    // Set up ScrollTrigger once mounted
    React.useEffect(() => {
        if (!groupRef.current) return;

        // We want the 3D scene to respond to scroll
        // For example, as we scroll down to benefits, the ring explodes or moves
        let tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: 1, // Smooth scrub
            }
        });

        // Move the group down and scale it up slightly on scroll
        tl.to(groupRef.current.position, {
            y: -5,
            z: 2,
            ease: "power1.inOut"
        }, 0);

        tl.to(groupRef.current.rotation, {
            x: Math.PI / 4,
            ease: "power1.inOut"
        }, 0);

        // Another trigger for the benefits section
        let tl2 = gsap.timeline({
            scrollTrigger: {
                trigger: "#benefits",
                start: "top center",
                end: "bottom center",
                scrub: 1
            }
        });

        tl2.to(groupRef.current.position, {
            x: 4, // Move right
            y: -8,
            ease: "power1.inOut"
        }, 0);

    }, []);

    return (
        <group ref={groupRef}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={2} color="#8a2be2" />

            <group position={[4, 0, 0]}>
                <QuantumRing />
            </group>
            <ParticleStream />
            <Sparkles count={500} scale={10} size={2} speed={0.4} opacity={0.3} color="#00ffcc" />
        </group>
    );
}

function App() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}> {/* Cap DPR for performance */}
                <Scene />
            </Canvas>
        </div>
    );
}

// Inject into HTML
const container = document.getElementById('canvas-container');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
