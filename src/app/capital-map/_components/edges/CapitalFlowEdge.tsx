"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { CapitalFlowEdgeData } from "../types";

function CapitalFlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as CapitalFlowEdgeData | undefined;

  // Calculate stroke width based on capital ratio (1-8px)
  const capitalRatio =
    edgeData?.maxCapitalCents && edgeData.maxCapitalCents > 0
      ? edgeData.capitalCents / edgeData.maxCapitalCents
      : 0.5;
  const strokeWidth = Math.max(1, Math.min(8, capitalRatio * 8));

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  // Unique animation ID for this edge
  const animationId = `capital-flow-${id}`;

  return (
    <>
      {/* Background edge for better visibility */}
      <BaseEdge
        id={`${id}-bg`}
        path={edgePath}
        style={{
          stroke: "#e2e8f0",
          strokeWidth: strokeWidth + 2,
          opacity: 0.5,
        }}
      />

      {/* Main capital flow edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#a5b4fc",
          strokeWidth: strokeWidth,
          opacity: 0.7,
        }}
      />

      {/* Animated dot moving along the path */}
      <svg className="react-flow__edge-path" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient
            id={`gradient-${id}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Animated circle */}
        <circle r={Math.max(3, strokeWidth / 2)} fill={`url(#gradient-${id})`}>
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path={edgePath}
            rotate="auto"
          />
        </circle>

        {/* Secondary smaller circle with offset */}
        {strokeWidth > 3 && (
          <circle r={2} fill="#818cf8" opacity={0.6}>
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path={edgePath}
              rotate="auto"
              begin="1.5s"
            />
          </circle>
        )}
      </svg>
    </>
  );
}

export const CapitalFlowEdge = memo(CapitalFlowEdgeComponent);
