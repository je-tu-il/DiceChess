/**
 * Determines which face of the die is pointing upward.
 *
 * Three.js BoxGeometry material indices:
 *   0: +X (right)    1: -X (left)
 *   2: +Y (top)      3: -Y (bottom)
 *   4: +Z (front)    5: -Z (back)
 */

const FACE_NORMALS = [
  [1, 0, 0],   // face 0: +X
  [-1, 0, 0],  // face 1: -X
  [0, 1, 0],   // face 2: +Y
  [0, -1, 0],  // face 3: -Y
  [0, 0, 1],   // face 4: +Z
  [0, 0, -1],  // face 5: -Z
];

/**
 * Apply a quaternion [x, y, z, w] to a vector [vx, vy, vz]
 */
function applyQuaternion(quat, vec) {
  const [qx, qy, qz, qw] = quat;
  const [vx, vy, vz] = vec;

  // t = 2 * cross(q.xyz, v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);

  // result = v + qw * t + cross(q.xyz, t)
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
}

/**
 * Given a quaternion [x, y, z, w], returns the index (0-5) of the face pointing up.
 */
export function getTopFace(quaternion) {
  let maxDot = -Infinity;
  let topFace = 0;

  for (let i = 0; i < 6; i++) {
    const worldNormal = applyQuaternion(quaternion, FACE_NORMALS[i]);
    // Dot product with world up (0, 1, 0)
    const dot = worldNormal[1];
    if (dot > maxDot) {
      maxDot = dot;
      topFace = i;
    }
  }

  return topFace;
}
