import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense } from "react";
// @ts-expect-error: STLLoader may not have types
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

function STLModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
}

function GLTFModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} />;
}

export function ModelLoader({ url }: { url: string }) {
  // Always call hooks, use only the relevant one
  const ext = url.split(".").pop()?.toLowerCase();
  return (
    <div className="bg-gray-400 ml-2 h-[300px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        {ext === "stl" ? <STLModel url={url} /> : <GLTFModel url={url} />}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}

// Note: You need to install the following dependencies if not already present:
// npm install three @react-three/fiber @react-three/drei
// npm install --save-dev @types/three
