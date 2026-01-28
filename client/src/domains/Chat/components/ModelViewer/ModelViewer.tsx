import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';

interface ModelViewerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  onLoad?: () => void;
  onSnapshot?: (base64: string) => void; // 추가: 스냅샷 생성 콜백
  onError?: (error: Error) => void;
  className?: string;
}

export function ModelViewer({
  modelUrl,
  width = 400,
  height = 300,
  interactive = true,
  autoRotate = false,
  onLoad,
  onSnapshot,
  onError,
  className,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setLoading(true);
    setError(null);

    // Scene 초기화
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 0, 100);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true // 추가: 스냅샷 캡처를 위해 필요
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 성능 최적화
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // OrbitControls
    let controls: OrbitControls | null = null;
    if (interactive) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 2;
      controlsRef.current = controls;
    }

    // DRACOLoader 설정
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    dracoLoader.preload();

    // GLTFLoader 설정
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // 모델 로드 (디버깅/안정성: fetch → arrayBuffer → loader.parse)
    // load()는 내부 XHR이 hang 되는 케이스가 있어, 단계를 분리해서 원인을 확정한다.
    const abortController = new AbortController();
    const LOAD_TIMEOUT_MS = 20000;
    const timeoutId = window.setTimeout(() => {
      console.error(`⏱️ [ModelViewer] 로드 타임아웃 (${LOAD_TIMEOUT_MS}ms): ${modelUrl}`);
      abortController.abort();
      setError('3D 모델 로딩이 시간 초과되었습니다. (네트워크/파싱 지연)');
      setLoading(false);
    }, LOAD_TIMEOUT_MS);

    const url = `${modelUrl}${modelUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

    (async () => {
      try {
        const startedAt = performance.now();
        const res = await fetch(url, { signal: abortController.signal });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer();

        loader.parse(
          arrayBuffer,
          '',
          (gltf: any) => {
            window.clearTimeout(timeoutId);

            const model = gltf.scene;

            // 바운딩박스 계산 후 자동 카메라 조정
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim === 0) {
              console.warn('⚠️ 모델의 크기가 0입니다.');
            }

            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 2.0;
            camera.position.set(center.x, center.y, center.z + cameraZ);
            camera.lookAt(center);

            scene.add(model);
            setLoading(false);
            onLoad?.();

            // 스냅샷 생성 (렌더링 직후)
            if (onSnapshot) {
              setTimeout(() => {
                if (rendererRef.current && sceneRef.current) {
                  rendererRef.current.render(sceneRef.current, camera);
                  const base64 = rendererRef.current.domElement.toDataURL('image/png');
                  onSnapshot(base64);
                }
              }, 500); // 모델이 완전히 그려질 시간을 잠깐 줌
            }
          },
          (err: any) => {
            window.clearTimeout(timeoutId);
            console.error(`❌ [ModelViewer] GLB 파싱 실패`, err);
            const errorMsg = `3D 모델 파싱 실패 (${(err as any)?.message || '알 수 없는 오류'})`;
            setError(errorMsg);
            setLoading(false);
            onError?.(new Error(errorMsg));
          },
        );
      } catch (err: any) {
        window.clearTimeout(timeoutId);
        if (err?.name === 'AbortError') {
          console.warn('🛑 [ModelViewer] fetch 중단(AbortError)');
          return;
        }
        console.error('❌ [ModelViewer] fetch 실패', err);
        const errorMsg = `3D 모델 다운로드 실패 (${err?.message || String(err)})`;
        setError(errorMsg);
        setLoading(false);
        onError?.(new Error(errorMsg));
      }
    })();

    // 애니메이션 루프
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (controls) {
        controls.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 창 크기 조정
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
      }
    };
    window.addEventListener('resize', handleResize);

    // 정리
    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (controls) {
        controls.dispose();
      }
      renderer.dispose();
      dracoLoader.dispose();
      
      // Scene 정리
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [modelUrl, width, height, interactive, autoRotate, onLoad, onError]);

  if (error) {
    return (
      <Box
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-surface-level-2)',
          borderRadius: 'var(--shape-radius-md)',
          gap: 'var(--space-gap-xs)',
        }}
        className={className}
      >
        <Typography variant="caption" color="text-error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    // 중요: `Box`는 ref 포워딩이 아닐 수 있어, Three.js 컨테이너는 native div를 사용
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'relative',
        backgroundColor: '#f5f5f5',
        borderRadius: 'var(--shape-radius-md)',
        overflow: 'hidden',
      }}
      className={className}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface-level-2)',
            zIndex: 1,
          }}
        >
          <Typography variant="caption" color="text-secondary">
            로딩 중...
          </Typography>
        </div>
      )}
    </div>
  );
}
