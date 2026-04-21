import React, { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, CalendarDays, Plus, Save, Search, Trash2, UserRound } from 'lucide-react';
import Layout from '@/components/Layout';
import { clinicalModuleMap } from '@/config/clinicalModules';
import { clinicalModuleService, type ClinicalModuleRecord } from '@/services/clinicalModuleService';
import { showConfirm, showError, showSuccess } from '@/utils/swal';
import type { Patient } from '@/types';
import styles from './OdontogramPage.module.css';

const odontogramDefinition = clinicalModuleMap['historial-odontograma'];

const dentalArches = [
  ['18', '17', '16', '15', '14', '13', '12', '11'],
  ['21', '22', '23', '24', '25', '26', '27', '28'],
  ['48', '47', '46', '45', '44', '43', '42', '41'],
  ['31', '32', '33', '34', '35', '36', '37', '38']
] as const;

const toothIds = dentalArches.flat();
const surfaceKeys = ['top', 'right', 'bottom', 'left', 'center'] as const;

type ToothStatus = 'healthy' | 'caries' | 'filling' | 'crown' | 'missing' | 'implant' | 'fracture' | 'endodontics';
type ToothSurfaceKey = (typeof surfaceKeys)[number];

type ToothState = {
  surfaces: Record<ToothSurfaceKey, ToothStatus>;
  notes: string;
};

type OdontogramChart = Record<string, ToothState>;

type OdontogramPayload = {
  version: number;
  chart: OdontogramChart;
  clinicalNotes: string;
  lastUpdatedTooth: string;
};

type StatusOption = {
  key: ToothStatus;
  label: string;
  hint: string;
  color: string;
};

const statusOptions: StatusOption[] = [
  { key: 'healthy', label: 'Sano', hint: 'Sin hallazgos', color: '#d9f99d' },
  { key: 'caries', label: 'Caries', hint: 'Lesión activa', color: '#ef4444' },
  { key: 'filling', label: 'Resina', hint: 'Restauración', color: '#38bdf8' },
  { key: 'crown', label: 'Corona', hint: 'Cobertura total', color: '#f59e0b' },
  { key: 'missing', label: 'Ausente', hint: 'Pieza perdida', color: '#6b7280' },
  { key: 'implant', label: 'Implante', hint: 'Rehabilitación', color: '#10b981' },
  { key: 'fracture', label: 'Fractura', hint: 'Daño estructural', color: '#a855f7' },
  { key: 'endodontics', label: 'Endodoncia', hint: 'Tratamiento pulpar', color: '#111827' }
];

const statusMap = Object.fromEntries(statusOptions.map(option => [option.key, option])) as Record<ToothStatus, StatusOption>;

const surfaceLabels: Record<ToothSurfaceKey, string> = {
  top: 'Incisal / Oclusal',
  right: 'Distal',
  bottom: 'Cervical',
  left: 'Mesial',
  center: 'Vestibular'
};

const createEmptyToothState = (): ToothState => ({
  surfaces: {
    top: 'healthy',
    right: 'healthy',
    bottom: 'healthy',
    left: 'healthy',
    center: 'healthy'
  },
  notes: ''
});

const createEmptyChart = (): OdontogramChart => Object.fromEntries(
  toothIds.map(toothId => [toothId, createEmptyToothState()])
) as OdontogramChart;

const getToday = () => new Date().toISOString().slice(0, 10);

const normalizeToothState = (value: unknown): ToothState => {
  const empty = createEmptyToothState();
  if (!value || typeof value !== 'object') {
    return empty;
  }

  const candidate = value as Partial<ToothState>;
  const surfaces = candidate.surfaces && typeof candidate.surfaces === 'object'
    ? candidate.surfaces
    : {};

  return {
    surfaces: {
      top: surfaceKeys.includes(surfaces.top as ToothSurfaceKey) ? (surfaces.top as ToothStatus) : empty.surfaces.top,
      right: surfaceKeys.includes(surfaces.right as ToothSurfaceKey) ? (surfaces.right as ToothStatus) : empty.surfaces.right,
      bottom: surfaceKeys.includes(surfaces.bottom as ToothSurfaceKey) ? (surfaces.bottom as ToothStatus) : empty.surfaces.bottom,
      left: surfaceKeys.includes(surfaces.left as ToothSurfaceKey) ? (surfaces.left as ToothStatus) : empty.surfaces.left,
      center: surfaceKeys.includes(surfaces.center as ToothSurfaceKey) ? (surfaces.center as ToothStatus) : empty.surfaces.center
    },
    notes: typeof candidate.notes === 'string' ? candidate.notes : ''
  };
};

const isToothStatus = (value: unknown): value is ToothStatus => statusOptions.some(option => option.key === value);

const normalizeChart = (value: unknown): OdontogramChart => {
  const emptyChart = createEmptyChart();
  if (!value || typeof value !== 'object') {
    return emptyChart;
  }

  const source = value as Record<string, unknown>;
  return toothIds.reduce<OdontogramChart>((accumulator, toothId) => {
    const toothCandidate = source[toothId];
    const emptyTooth = createEmptyToothState();

    if (!toothCandidate || typeof toothCandidate !== 'object') {
      accumulator[toothId] = emptyTooth;
      return accumulator;
    }

    const typedCandidate = toothCandidate as Partial<ToothState> & {
      surfaces?: Partial<Record<ToothSurfaceKey, unknown>>;
    };

    accumulator[toothId] = {
      surfaces: {
        top: isToothStatus(typedCandidate.surfaces?.top) ? typedCandidate.surfaces.top : emptyTooth.surfaces.top,
        right: isToothStatus(typedCandidate.surfaces?.right) ? typedCandidate.surfaces.right : emptyTooth.surfaces.right,
        bottom: isToothStatus(typedCandidate.surfaces?.bottom) ? typedCandidate.surfaces.bottom : emptyTooth.surfaces.bottom,
        left: isToothStatus(typedCandidate.surfaces?.left) ? typedCandidate.surfaces.left : emptyTooth.surfaces.left,
        center: isToothStatus(typedCandidate.surfaces?.center) ? typedCandidate.surfaces.center : emptyTooth.surfaces.center
      },
      notes: typeof typedCandidate.notes === 'string' ? typedCandidate.notes : ''
    };
    return accumulator;
  }, {} as OdontogramChart);
};

const parseOdontogramPayload = (rawDetail?: string) => {
  const fallback = {
    chart: createEmptyChart(),
    clinicalNotes: rawDetail || ''
  };

  if (!rawDetail) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawDetail) as Partial<OdontogramPayload>;
    return {
      chart: normalizeChart(parsed.chart),
      clinicalNotes: typeof parsed.clinicalNotes === 'string' ? parsed.clinicalNotes : ''
    };
  } catch {
    return fallback;
  }
};

const summarizeChart = (chart: OdontogramChart) => {
  const summary = statusOptions.reduce<Record<ToothStatus, number>>((accumulator, option) => {
    accumulator[option.key] = 0;
    return accumulator;
  }, {} as Record<ToothStatus, number>);

  toothIds.forEach(toothId => {
    const statuses = Object.values(chart[toothId]?.surfaces || {});
    const dominantStatus = statuses.find(status => status !== 'healthy') || 'healthy';
    summary[dominantStatus] += 1;
  });

  return summary;
};

const serializeOdontogram = (chart: OdontogramChart, clinicalNotes: string, lastUpdatedTooth: string): string => JSON.stringify({
  version: 1,
  chart,
  clinicalNotes,
  lastUpdatedTooth
});

const ToothCell: React.FC<{
  toothId: string;
  tooth: ToothState;
  selected: boolean;
  onSelect: (toothId: string, surface: ToothSurfaceKey) => void;
}> = ({ toothId, tooth, selected, onSelect }) => {
  const nonHealthy = Object.values(tooth.surfaces).find(status => status !== 'healthy') || 'healthy';

  return (
    <div className={`${styles.toothCard} ${selected ? styles.toothCardActive : ''}`}>
      <span className={styles.toothNumber}>{toothId}</span>
      <svg viewBox="0 0 100 100" className={styles.toothSvg} role="img" aria-label={`Pieza ${toothId}`}>
        <polygon points="25,8 75,8 62,30 38,30" fill={statusMap[tooth.surfaces.top].color} onClick={() => onSelect(toothId, 'top')} />
        <polygon points="70,25 92,38 92,62 70,75 62,62 62,38" fill={statusMap[tooth.surfaces.right].color} onClick={() => onSelect(toothId, 'right')} />
        <polygon points="38,70 62,70 75,92 25,92" fill={statusMap[tooth.surfaces.bottom].color} onClick={() => onSelect(toothId, 'bottom')} />
        <polygon points="8,38 30,25 38,38 38,62 30,75 8,62" fill={statusMap[tooth.surfaces.left].color} onClick={() => onSelect(toothId, 'left')} />
        <rect x="32" y="32" width="36" height="36" rx="6" fill={statusMap[tooth.surfaces.center].color} onClick={() => onSelect(toothId, 'center')} />
      </svg>
      <span className={styles.toothStatus} style={{ backgroundColor: `${statusMap[nonHealthy].color}22`, color: statusMap[nonHealthy].key === 'endodontics' ? '#111827' : '#1f2937' }}>
        {statusMap[nonHealthy].label}
      </span>
    </div>
  );
};

type ToothKind = 'incisor' | 'canine' | 'premolar' | 'molar';

const HumanDentitionModel: React.FC = () => {
  const { scene } = useGLTF('/models/odontograma.glb');

  const normalizedModel = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const uniformScale = 3.2 / maxAxis;

    clone.position.sub(center);
    clone.scale.setScalar(uniformScale);

    clone.traverse((node: THREE.Object3D) => {
      const meshNode = node as THREE.Mesh;
      if (!meshNode.isMesh) {
        return;
      }

      meshNode.castShadow = true;
      meshNode.receiveShadow = true;

      const sourceMaterial = meshNode.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | undefined;
      const baseColor = sourceMaterial?.color?.clone?.() || new THREE.Color('#f5efe3');

      meshNode.material = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: 0.34,
        metalness: 0.02,
        clearcoat: 0.45,
        clearcoatRoughness: 0.22,
        envMapIntensity: 0.6
      });
    });

    return clone;
  }, [scene]);

  return <primitive object={normalizedModel} position={[0, -0.2, 0]} rotation={[0, Math.PI, 0]} />;
};

const getToothKind = (toothId: string): ToothKind => {
  const secondDigit = Number(toothId[1]);

  if ([1, 2].includes(secondDigit)) {
    return 'incisor';
  }

  if (secondDigit === 3) {
    return 'canine';
  }

  if ([4, 5].includes(secondDigit)) {
    return 'premolar';
  }

  return 'molar';
};

const Tooth3DModel: React.FC<{ toothId: string; tooth: ToothState }> = ({ toothId, tooth }) => {
  const surfaceToClinicalTint = (status: ToothStatus) => {
    if (status === 'healthy') {
      return '#fffdf8';
    }
    return statusMap[status].color;
  };

  const overlayOpacityFor = (status: ToothStatus, highlighted: number, healthy = 0.04) => (
    status === 'healthy' ? healthy : highlighted
  );

  const faceColors = {
    top: surfaceToClinicalTint(tooth.surfaces.top),
    right: surfaceToClinicalTint(tooth.surfaces.right),
    bottom: surfaceToClinicalTint(tooth.surfaces.bottom),
    left: surfaceToClinicalTint(tooth.surfaces.left),
    center: surfaceToClinicalTint(tooth.surfaces.center)
  };

  const toothKind = getToothKind(toothId);

  const crownExtrudeSettings = useMemo(() => ({
    depth: 0.58,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.06,
    bevelThickness: 0.05,
    curveSegments: 36
  }), []);

  const buildToothShape = useCallback((kind: ToothKind) => {
    const shape = new THREE.Shape();

    if (kind === 'incisor') {
      shape.moveTo(0, 1.06);
      shape.bezierCurveTo(-0.32, 1.12, -0.56, 0.98, -0.62, 0.68);
      shape.bezierCurveTo(-0.68, 0.38, -0.56, 0.04, -0.36, -0.34);
      shape.bezierCurveTo(-0.2, -0.64, -0.14, -0.88, -0.1, -1.14);
      shape.bezierCurveTo(-0.08, -1.28, -0.06, -1.38, -0.03, -1.48);
      shape.lineTo(0.03, -1.48);
      shape.bezierCurveTo(0.06, -1.38, 0.08, -1.28, 0.1, -1.14);
      shape.bezierCurveTo(0.14, -0.88, 0.2, -0.64, 0.36, -0.34);
      shape.bezierCurveTo(0.56, 0.04, 0.68, 0.38, 0.62, 0.68);
      shape.bezierCurveTo(0.56, 0.98, 0.32, 1.12, 0, 1.06);
      shape.closePath();
      return shape;
    }

    if (kind === 'canine') {
      shape.moveTo(0, 1.18);
      shape.bezierCurveTo(-0.18, 1.02, -0.4, 0.96, -0.54, 0.6);
      shape.bezierCurveTo(-0.66, 0.22, -0.56, -0.2, -0.26, -0.82);
      shape.bezierCurveTo(-0.12, -1.08, -0.06, -1.28, -0.03, -1.42);
      shape.lineTo(0.03, -1.42);
      shape.bezierCurveTo(0.06, -1.28, 0.12, -1.08, 0.26, -0.82);
      shape.bezierCurveTo(0.56, -0.2, 0.66, 0.22, 0.54, 0.6);
      shape.bezierCurveTo(0.4, 0.96, 0.18, 1.02, 0, 1.18);
      shape.closePath();
      return shape;
    }

    if (kind === 'premolar') {
      shape.moveTo(0, 1.06);
      shape.bezierCurveTo(-0.24, 1.16, -0.48, 1.04, -0.6, 0.74);
      shape.bezierCurveTo(-0.72, 0.38, -0.64, -0.06, -0.38, -0.58);
      shape.bezierCurveTo(-0.22, -0.9, -0.14, -1.08, -0.08, -1.26);
      shape.lineTo(0.08, -1.26);
      shape.bezierCurveTo(0.14, -1.08, 0.22, -0.9, 0.38, -0.58);
      shape.bezierCurveTo(0.64, -0.06, 0.72, 0.38, 0.6, 0.74);
      shape.bezierCurveTo(0.48, 1.04, 0.24, 1.16, 0, 1.06);
      shape.closePath();
      return shape;
    }

    shape.moveTo(0, 0.98);
    shape.bezierCurveTo(-0.32, 1.14, -0.68, 1.08, -0.82, 0.68);
    shape.bezierCurveTo(-0.92, 0.24, -0.74, -0.16, -0.46, -0.54);
    shape.bezierCurveTo(-0.3, -0.76, -0.24, -0.96, -0.22, -1.18);
    shape.lineTo(-0.06, -1.3);
    shape.bezierCurveTo(-0.02, -1.12, -0.02, -0.94, -0.02, -0.8);
    shape.lineTo(0.02, -0.8);
    shape.bezierCurveTo(0.02, -0.94, 0.02, -1.12, 0.06, -1.3);
    shape.lineTo(0.22, -1.18);
    shape.bezierCurveTo(0.24, -0.96, 0.3, -0.76, 0.46, -0.54);
    shape.bezierCurveTo(0.74, -0.16, 0.92, 0.24, 0.82, 0.68);
    shape.bezierCurveTo(0.68, 1.08, 0.32, 1.14, 0, 0.98);
    shape.closePath();
    return shape;
  }, []);

  const crownShape = useMemo(() => buildToothShape(toothKind), [buildToothShape, toothKind]);

  const frontSurfaceShape = useMemo(() => {
    const shape = new THREE.Shape();

    if (toothKind === 'incisor') {
      shape.moveTo(0, 0.58);
      shape.bezierCurveTo(-0.16, 0.64, -0.3, 0.48, -0.3, 0.18);
      shape.bezierCurveTo(-0.28, -0.1, -0.18, -0.36, -0.08, -0.74);
      shape.lineTo(0.08, -0.74);
      shape.bezierCurveTo(0.18, -0.36, 0.28, -0.1, 0.3, 0.18);
      shape.bezierCurveTo(0.3, 0.48, 0.16, 0.64, 0, 0.58);
      shape.closePath();
      return shape;
    }

    if (toothKind === 'canine') {
      shape.moveTo(0, 0.78);
      shape.bezierCurveTo(-0.12, 0.62, -0.22, 0.42, -0.2, 0.04);
      shape.bezierCurveTo(-0.16, -0.26, -0.08, -0.52, -0.02, -0.88);
      shape.lineTo(0.02, -0.88);
      shape.bezierCurveTo(0.08, -0.52, 0.16, -0.26, 0.2, 0.04);
      shape.bezierCurveTo(0.22, 0.42, 0.12, 0.62, 0, 0.78);
      shape.closePath();
      return shape;
    }

    if (toothKind === 'premolar') {
      shape.moveTo(0, 0.66);
      shape.bezierCurveTo(-0.16, 0.74, -0.3, 0.54, -0.3, 0.16);
      shape.bezierCurveTo(-0.28, -0.14, -0.18, -0.42, -0.08, -0.8);
      shape.lineTo(0.08, -0.8);
      shape.bezierCurveTo(0.18, -0.42, 0.28, -0.14, 0.3, 0.16);
      shape.bezierCurveTo(0.3, 0.54, 0.16, 0.74, 0, 0.66);
      shape.closePath();
      return shape;
    }

    shape.moveTo(0, 0.56);
    shape.bezierCurveTo(-0.22, 0.66, -0.4, 0.48, -0.42, 0.08);
    shape.bezierCurveTo(-0.42, -0.18, -0.34, -0.42, -0.22, -0.72);
    shape.lineTo(0.22, -0.72);
    shape.bezierCurveTo(0.34, -0.42, 0.42, -0.18, 0.42, 0.08);
    shape.bezierCurveTo(0.4, 0.48, 0.22, 0.66, 0, 0.56);
    shape.closePath();
    return shape;
  }, [toothKind]);

  const renderRoots = () => {
    if (toothKind === 'incisor' || toothKind === 'canine') {
      return (
        <mesh position={[0, -1.58, 0.02]} rotation={[0.08, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.045, toothKind === 'canine' ? 1.95 : 1.72, 22]} />
          <meshStandardMaterial color="#e8dcc9" roughness={0.56} metalness={0.01} />
        </mesh>
      );
    }

    if (toothKind === 'premolar') {
      return (
        <>
          <mesh position={[-0.12, -1.54, 0.04]} rotation={[0.14, 0.02, 0.08]} castShadow receiveShadow>
            <cylinderGeometry args={[0.11, 0.04, 1.66, 22]} />
            <meshStandardMaterial color="#e8dcc9" roughness={0.56} metalness={0.01} />
          </mesh>
          <mesh position={[0.12, -1.48, 0]} rotation={[-0.08, -0.03, -0.08]} castShadow receiveShadow>
            <cylinderGeometry args={[0.1, 0.036, 1.52, 22]} />
            <meshStandardMaterial color="#e6d8c5" roughness={0.56} metalness={0.01} />
          </mesh>
        </>
      );
    }

    return (
      <>
        <mesh position={[-0.2, -1.46, 0.08]} rotation={[0.16, 0.05, 0.12]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.03, 1.58, 20]} />
          <meshStandardMaterial color="#e8dcc9" roughness={0.56} metalness={0.01} />
        </mesh>
        <mesh position={[0.2, -1.46, -0.02]} rotation={[-0.12, -0.03, -0.12]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.03, 1.55, 20]} />
          <meshStandardMaterial color="#e6d8c5" roughness={0.56} metalness={0.01} />
        </mesh>
        <mesh position={[0, -1.34, 0.16]} scale={[0.62, 0.22, 0.4]} castShadow>
          <sphereGeometry args={[0.42, 16, 14]} />
          <meshStandardMaterial color="#f0e5d5" roughness={0.58} metalness={0.01} />
        </mesh>
      </>
    );
  };

  const overlayMaterial = (color: string, opacity = 0.84) => (
    <meshPhysicalMaterial
      color={color}
      transparent
      opacity={opacity}
      roughness={0.2}
      metalness={0.01}
      clearcoat={0.45}
      clearcoatRoughness={0.2}
      polygonOffset
      polygonOffsetFactor={-2}
      polygonOffsetUnits={-2}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );

  return (
    <group rotation={[0.06, toothKind === 'incisor' ? -0.28 : -0.18, 0.03]}>
      <group position={[0, 0.2, -0.29]}>
        <mesh
          castShadow
          receiveShadow
          scale={
            toothKind === 'incisor' ? [0.88, 1.12, 0.7]
              : toothKind === 'canine' ? [0.8, 1.1, 0.72]
              : toothKind === 'premolar' ? [0.94, 1.08, 0.86]
              : [1.08, 1.02, 1]
          }
        >
          <extrudeGeometry args={[crownShape, crownExtrudeSettings]} />
          <meshPhysicalMaterial color="#fff9f3" roughness={0.16} metalness={0.01} clearcoat={0.6} clearcoatRoughness={0.16} />
        </mesh>

        <mesh
          position={[0, toothKind === 'canine' ? 1.08 : 1.0, 0.26]}
          scale={
            toothKind === 'incisor' ? [0.92, 0.14, 0.56]
              : toothKind === 'canine' ? [0.72, 0.12, 0.46]
              : toothKind === 'premolar' ? [0.88, 0.16, 0.64]
              : [1.04, 0.2, 0.82]
          }
          castShadow
        >
          <sphereGeometry args={[0.42, 30, 22]} />
          <meshPhysicalMaterial color="#fffdf9" roughness={0.16} metalness={0.01} clearcoat={0.42} clearcoatRoughness={0.18} />
        </mesh>

        {(toothKind === 'incisor'
          ? [[-0.14, 1.04, 0.16], [0.14, 1.04, 0.16]]
          : toothKind === 'canine'
            ? [[0, 1.16, 0.18]]
            : toothKind === 'premolar'
              ? [[-0.12, 1.08, 0.18], [0.12, 1.12, 0.22]]
              : [[-0.18, 1.08, 0.12], [0.18, 1.1, 0.14], [-0.04, 1.02, 0.36], [0.08, 1.04, 0.34]]
        ).map(([x, y, z], index) => (
          <mesh key={`cusp-${index}`} position={[x, y, z]} scale={[1, 0.78, 1]} castShadow>
            <sphereGeometry args={[toothKind === 'canine' ? 0.11 : 0.12, 18, 18]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.12} metalness={0.01} clearcoat={0.42} clearcoatRoughness={0.14} />
          </mesh>
        ))}

        <mesh position={[0, -1.02, 0.29]} scale={[0.34, 0.14, 0.42]} castShadow>
          <sphereGeometry args={[0.44, 22, 18]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.5} metalness={0.01} />
        </mesh>

        <mesh
          position={[0, toothKind === 'canine' ? 1.06 : 0.98, 0.3]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={
            toothKind === 'incisor' ? [0.86, 0.36, 0.52]
              : toothKind === 'canine' ? [0.54, 0.28, 0.4]
              : toothKind === 'premolar' ? [0.8, 0.46, 0.62]
              : [1.06, 0.68, 0.9]
          }
        >
          <circleGeometry args={[0.25, 34]} />
          {overlayMaterial(faceColors.top, overlayOpacityFor(tooth.surfaces.top, 0.34, 0.02))}
        </mesh>

        <mesh position={[0, toothKind === 'canine' ? 0.02 : -0.02, 0.605]} scale={toothKind === 'incisor' ? [0.72, 0.86, 1] : toothKind === 'canine' ? [0.52, 0.86, 1] : [1, 1, 1]}>
          <shapeGeometry args={[frontSurfaceShape]} />
          {overlayMaterial(faceColors.center, overlayOpacityFor(tooth.surfaces.center, 0.22, 0.03))}
        </mesh>

        <mesh position={[0, -0.06, -0.025]} rotation={[0, Math.PI, 0]} scale={toothKind === 'incisor' ? [0.72, 0.86, 1] : toothKind === 'canine' ? [0.52, 0.86, 1] : [1, 1, 1]}>
          <shapeGeometry args={[frontSurfaceShape]} />
          {overlayMaterial(faceColors.bottom, overlayOpacityFor(tooth.surfaces.bottom, 0.14, 0.02))}
        </mesh>

        <mesh position={[-0.45, 0.04, 0.3]} rotation={[0, Math.PI / 2, 0]} scale={toothKind === 'incisor' ? [0.28, 0.78, 0.16] : toothKind === 'canine' ? [0.24, 0.72, 0.14] : [0.42, 0.9, 0.18]}>
          <capsuleGeometry args={[0.22, 0.5, 6, 14]} />
          {overlayMaterial(faceColors.left, overlayOpacityFor(tooth.surfaces.left, 0.16, 0.03))}
        </mesh>

        <mesh position={[0.45, 0.04, 0.3]} rotation={[0, -Math.PI / 2, 0]} scale={toothKind === 'incisor' ? [0.28, 0.78, 0.16] : toothKind === 'canine' ? [0.24, 0.72, 0.14] : [0.42, 0.9, 0.18]}>
          <capsuleGeometry args={[0.22, 0.5, 6, 14]} />
          {overlayMaterial(faceColors.right, overlayOpacityFor(tooth.surfaces.right, 0.16, 0.03))}
        </mesh>
      </group>

      <group position={[0, -0.04, 0.02]}>
        <mesh position={[0, -0.98, 0.17]} scale={[0.3, 0.12, 0.34]} castShadow>
          <sphereGeometry args={[0.42, 20, 18]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.58} metalness={0.01} />
        </mesh>
        {renderRoots()}
      </group>
    </group>
  );
};

const Tooth3DPreview: React.FC<{ toothId: string; tooth: ToothState }> = ({ toothId, tooth }) => {
  const [viewMode, setViewMode] = useState<'full' | 'single'>('full');

  return (
    <div className={styles.viewerFrame}>
      <Canvas
        dpr={[1, 2]}
        shadows
        camera={{ position: [0, 0.55, 5.8], fov: 32, near: 0.1, far: 70 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#f4efe4"]} />
        <ambientLight intensity={0.46} />
        <hemisphereLight intensity={0.7} color="#ffffff" groundColor="#d8d3c6" />
        <directionalLight
          position={[4.5, 6.5, 5.5]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-3.5, 2.2, 3.2]} intensity={0.45} color="#e0f2fe" />
        <Environment preset="studio" intensity={0.62} />
        
        <Suspense fallback={null}>
          {viewMode === 'full' ? (
            <HumanDentitionModel />
          ) : (
            <group position={[0, -0.05, 0]}>
              <Tooth3DModel toothId={toothId} tooth={tooth} />
            </group>
          )}
        </Suspense>

        <OrbitControls 
          enableDamping
          enablePan={false} 
          minDistance={3.2}
          maxDistance={8.6}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={(Math.PI * 4.5) / 5}
          makeDefault 
        />
        <ContactShadows position={[0, -1.95, 0]} opacity={0.38} scale={8.6} blur={2.4} far={5} />
      </Canvas>
      <div className={styles.viewerCaption} style={{ background: '#0f172a', color: '#f8fafc' }}>
        <div className={styles.viewerBadge}>CALIDAD ANATÓMICA</div>
        <strong>{viewMode === 'full' ? 'Arcada completa' : `Pieza ${toothId}`}</strong>
        <span>
          {viewMode === 'full'
            ? 'Modelo humano real'
            : `Modelo con ${parseInt(toothId) % 10 >= 6 ? '3 raíces' : (parseInt(toothId) % 10 >= 4 ? '2 raíces' : '1 raíz')}`}
        </span>
        <div style={{ display: 'inline-flex', gap: '0.35rem', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setViewMode('full')}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.5)',
              background: viewMode === 'full' ? '#f8fafc' : 'transparent',
              color: viewMode === 'full' ? '#0f172a' : '#f8fafc',
              borderRadius: '999px',
              padding: '0.2rem 0.6rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Arcada
          </button>
          <button
            type="button"
            onClick={() => setViewMode('single')}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.5)',
              background: viewMode === 'single' ? '#f8fafc' : 'transparent',
              color: viewMode === 'single' ? '#0f172a' : '#f8fafc',
              borderRadius: '999px',
              padding: '0.2rem 0.6rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Pieza
          </button>
        </div>
      </div>
    </div>
  );
};

const OdontogramPage: React.FC = () => {
  const [records, setRecords] = useState<ClinicalModuleRecord[]>([]);
  const [patientOptions, setPatientOptions] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [selectedToothId, setSelectedToothId] = useState<string>('11');
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>('caries');
  const [applyMode, setApplyMode] = useState<'surface' | 'tooth'>('surface');
  const [patientName, setPatientName] = useState('');
  const [recordDate, setRecordDate] = useState(getToday());
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [chart, setChart] = useState<OdontogramChart>(createEmptyChart);

  const deferredSearch = useDeferredValue(searchTerm);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await clinicalModuleService.getAll(odontogramDefinition.key);
      if (response.success) {
        setRecords(response.data || []);
      } else {
        showError(response.message || 'No se pudo cargar el historial del odontograma.');
      }
    } catch (error) {
      console.error(error);
      showError('No se pudo cargar el historial del odontograma.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await clinicalModuleService.getReferences(odontogramDefinition.key);
        setPatientOptions(response.data?.patients || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadPatients();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return records;
    }

    return records.filter(record => {
      const detail = parseOdontogramPayload(record.data?.detalleOdontograma);
      const haystack = [
        record.data?.paciente,
        record.data?.fechaRegistro,
        detail.clinicalNotes
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [deferredSearch, records]);

  const currentTooth = chart[selectedToothId] || createEmptyToothState();
  const summary = useMemo(() => summarizeChart(chart), [chart]);

  const resetEditor = useCallback(() => {
    setCurrentRecordId(null);
    setPatientName('');
    setRecordDate(getToday());
    setClinicalNotes('');
    setChart(createEmptyChart());
    setSelectedToothId('11');
  }, []);

  const loadRecord = useCallback((record: ClinicalModuleRecord) => {
    const detail = parseOdontogramPayload(record.data?.detalleOdontograma);
    setCurrentRecordId(record.id);
    setPatientName(record.data?.paciente || '');
    setRecordDate(record.data?.fechaRegistro || getToday());
    setClinicalNotes(detail.clinicalNotes);
    setChart(detail.chart);
    setSelectedToothId('11');
  }, []);

  const applyStatusToTooth = (toothId: string, surface: ToothSurfaceKey) => {
    setSelectedToothId(toothId);
    setChart(previous => {
      const current = previous[toothId] || createEmptyToothState();
      const nextTooth: ToothState = applyMode === 'tooth'
        ? {
            ...current,
            surfaces: {
              top: selectedStatus,
              right: selectedStatus,
              bottom: selectedStatus,
              left: selectedStatus,
              center: selectedStatus
            }
          }
        : {
            ...current,
            surfaces: {
              ...current.surfaces,
              [surface]: selectedStatus
            }
          };

      return {
        ...previous,
        [toothId]: nextTooth
      };
    });
  };

  const updateSelectedToothNotes = (notes: string) => {
    setChart(previous => ({
      ...previous,
      [selectedToothId]: {
        ...(previous[selectedToothId] || createEmptyToothState()),
        notes
      }
    }));
  };

  const handleSave = async () => {
    if (!patientName.trim()) {
      showError('Selecciona o captura un paciente antes de guardar.');
      return;
    }

    const payload = {
      is_active: true,
      data: {
        paciente: patientName.trim(),
        fechaRegistro: recordDate,
        detalleOdontograma: serializeOdontogram(chart, clinicalNotes, selectedToothId)
      }
    };

    try {
      setSaving(true);
      if (currentRecordId) {
        await clinicalModuleService.update(odontogramDefinition.key, currentRecordId, payload);
        showSuccess('Odontograma actualizado correctamente.');
      } else {
        await clinicalModuleService.create(odontogramDefinition.key, payload);
        showSuccess('Odontograma creado correctamente.');
      }

      await fetchRecords();
    } catch (error) {
      console.error(error);
      showError('No se pudo guardar el odontograma.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId?: string) => {
    const targetId = recordId || currentRecordId;
    if (!targetId) {
      resetEditor();
      return;
    }

    const confirmed = await showConfirm('¿Eliminar odontograma?', 'Esta acción eliminará el registro guardado.');
    if (!confirmed) {
      return;
    }

    try {
      await clinicalModuleService.delete(odontogramDefinition.key, targetId);
      showSuccess('Odontograma eliminado correctamente.');
      if (targetId === currentRecordId) {
        resetEditor();
      }
      await fetchRecords();
    } catch (error) {
      console.error(error);
      showError('No se pudo eliminar el odontograma.');
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => window.history.back()} type="button">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className={styles.eyebrow}>Clínica Dental</p>
            <h1>{odontogramDefinition.label}</h1>
            <p className={styles.subtitle}>
              Editor clínico con mapa dental interactivo, superficies por pieza y visor 3D para revisión rápida.
            </p>
          </div>
        </header>

        <section className={styles.topBar}>
          <div className={styles.topBarGrid}>
            <label className={styles.field}>
              <span><UserRound size={16} /> Paciente</span>
              <input
                value={patientName}
                onChange={event => setPatientName(event.target.value)}
                list="odontogram-patients"
                placeholder="Selecciona o escribe el paciente"
              />
            </label>

            <label className={styles.field}>
              <span><CalendarDays size={16} /> Fecha</span>
              <input type="date" value={recordDate} onChange={event => setRecordDate(event.target.value)} />
            </label>

            <label className={styles.searchField}>
              <span><Search size={16} /> Buscar historial</span>
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Paciente, fecha o nota clínica"
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.ghostButton} onClick={resetEditor}>
              <Plus size={16} /> Nuevo
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar odontograma'}
            </button>
            <button type="button" className={styles.dangerButton} onClick={() => handleDelete()}>
              <Trash2 size={16} /> Eliminar
            </button>
          </div>

          <datalist id="odontogram-patients">
            {patientOptions.map(patient => (
              <option key={patient.id} value={patient.fullName} />
            ))}
          </datalist>
        </section>

        <section className={styles.layoutGrid}>
          <div className={styles.editorColumn}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Leyenda clínica</h2>
                  <p>Selecciona un estado y después haz clic sobre la superficie o toda la pieza.</p>
                </div>
                <div className={styles.modeSwitch}>
                  <button
                    type="button"
                    className={applyMode === 'surface' ? styles.modeButtonActive : styles.modeButton}
                    onClick={() => setApplyMode('surface')}
                  >
                    Superficie
                  </button>
                  <button
                    type="button"
                    className={applyMode === 'tooth' ? styles.modeButtonActive : styles.modeButton}
                    onClick={() => setApplyMode('tooth')}
                  >
                    Pieza completa
                  </button>
                </div>
              </div>

              <div className={styles.statusPalette}>
                {statusOptions.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    className={selectedStatus === option.key ? styles.statusButtonActive : styles.statusButton}
                    onClick={() => setSelectedStatus(option.key)}
                    style={{ ['--status-color' as string]: option.color }}
                  >
                    <span className={styles.statusSwatch} />
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Mapa dental</h2>
                  <p>FDI adulto. La pieza seleccionada se refleja de inmediato en la vista 3D.</p>
                </div>
              </div>

              <div className={styles.arches}>
                {dentalArches.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className={styles.archRow}>
                    <div className={styles.archHalf}>
                      {row.slice(0, 4).map(toothId => (
                        <ToothCell
                          key={toothId}
                          toothId={toothId}
                          tooth={chart[toothId]}
                          selected={selectedToothId === toothId}
                          onSelect={applyStatusToTooth}
                        />
                      ))}
                    </div>
                    <div className={styles.archDivider} />
                    <div className={styles.archHalf}>
                      {row.slice(4).map(toothId => (
                        <ToothCell
                          key={toothId}
                          toothId={toothId}
                          tooth={chart[toothId]}
                          selected={selectedToothId === toothId}
                          onSelect={applyStatusToTooth}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Detalle de la pieza {selectedToothId}</h2>
                  <p>Notas rápidas y resumen por superficies.</p>
                </div>
              </div>

              <div className={styles.surfaceList}>
                {surfaceKeys.map(surface => (
                  <div key={surface} className={styles.surfaceItem}>
                    <span>{surfaceLabels[surface]}</span>
                    <strong style={{ color: statusMap[currentTooth.surfaces[surface]].key === 'endodontics' ? '#111827' : '#0f172a' }}>
                      {statusMap[currentTooth.surfaces[surface]].label}
                    </strong>
                  </div>
                ))}
              </div>

              <label className={styles.textareaField}>
                <span>Notas de la pieza</span>
                <textarea
                  rows={4}
                  value={currentTooth.notes}
                  onChange={event => updateSelectedToothNotes(event.target.value)}
                  placeholder="Ejemplo: sensibilidad en frío, fractura incisal, control en 30 días."
                />
              </label>

              <label className={styles.textareaField}>
                <span>Notas clínicas generales</span>
                <textarea
                  rows={5}
                  value={clinicalNotes}
                  onChange={event => setClinicalNotes(event.target.value)}
                  placeholder="Plan de tratamiento, hallazgos periodontales, evolución o recomendaciones."
                />
              </label>
            </article>
          </div>

          <aside className={styles.sidebarColumn}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Vista 3D</h2>
                  <p>Representación volumétrica de la pieza seleccionada.</p>
                </div>
              </div>
              <Tooth3DPreview toothId={selectedToothId} tooth={currentTooth} />
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Resumen actual</h2>
                  <p>Conteo dominante por pieza.</p>
                </div>
              </div>
              <div className={styles.summaryGrid}>
                {statusOptions.map(option => (
                  <div key={option.key} className={styles.summaryCard} style={{ borderColor: `${option.color}66` }}>
                    <span className={styles.summaryLabel}>{option.label}</span>
                    <strong>{summary[option.key]}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Historial guardado</h2>
                  <p>{loading ? 'Cargando registros...' : `${filteredRecords.length} registro(s) disponible(s)`}</p>
                </div>
              </div>

              <div className={styles.historyList}>
                {filteredRecords.map(record => {
                  const detail = parseOdontogramPayload(record.data?.detalleOdontograma);
                  const recordSummary = summarizeChart(detail.chart);
                  const highlightedStatus = statusOptions.find(option => recordSummary[option.key] > 0 && option.key !== 'healthy') || statusOptions[0];

                  return (
                    <button
                      key={record.id}
                      type="button"
                      className={currentRecordId === record.id ? styles.historyCardActive : styles.historyCard}
                      onClick={() => loadRecord(record)}
                    >
                      <div className={styles.historyHeader}>
                        <strong>{record.data?.paciente || 'Sin paciente'}</strong>
                        <span>{record.data?.fechaRegistro || 'Sin fecha'}</span>
                      </div>
                      <p>{detail.clinicalNotes || 'Sin nota clínica registrada.'}</p>
                      <div className={styles.historyMeta}>
                        <span style={{ backgroundColor: `${highlightedStatus.color}22` }}>{highlightedStatus.label}</span>
                        <button
                          type="button"
                          className={styles.inlineDelete}
                          onClick={event => {
                            event.stopPropagation();
                            handleDelete(record.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                  );
                })}

                {!loading && filteredRecords.length === 0 && (
                  <div className={styles.emptyState}>
                    No hay odontogramas guardados todavía.
                  </div>
                )}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </Layout>
  );
};

export default OdontogramPage;

useGLTF.preload('/models/odontograma.glb');