import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
// @ts-expect-error: STLLoader may not have types
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

function STLModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <Center>
      <mesh geometry={geometry} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </Center>
  );
}

function GLTFModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return (
    <Center>
      <primitive object={gltf.scene} rotation={[Math.PI, 0, 0]} />;
    </Center>
  );
}

export function ModelLoader({ url }: { url: string }) {
  // Always call hooks, use only the relevant one
  const ext = url.split(".").pop()?.toLowerCase();
  return (
    <div className="bg-gray-400 ml-2 h-[300px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Bounds fit clip observe>
          {ext === "stl" ? <STLModel url={url} /> : <GLTFModel url={url} />}
        </Bounds>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}

// Note: You need to install the following dependencies if not already present:
// npm install three @react-three/fiber @react-three/drei
// npm install --save-dev @types/three
