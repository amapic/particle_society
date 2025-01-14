uniform sampler2D positions; // Data Texture containing original positions
uniform float uTime;
uniform float uSpeed;
uniform float uCurlFreq;
uniform vec2 uMouse;
uniform float uNumBranches;
uniform float uBranchDepth;
uniform float uSharpness;
uniform float uBlobRadius;
uniform float uBlobNoiseScale;
uniform float uBlobNoiseAmount;
uniform vec2 uRotation;
varying vec2 vUv;

#define PI 3.1415926538

#pragma glslify: curl = require(glsl-curl-noise)
#pragma glslify: noise = require(glsl-noise/classic/3d)

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
		oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
		0.0,                                0.0,                                0.0,                                1.0
	);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
}

vec3 slideOnSurface(vec3 pos, float time) {
    // On garde la même distance au centre (reste sur la surface)
    float radius = length(pos);
    vec3 normalizedPos = normalize(pos);
    
    // Créer un déplacement linéaire
    vec2 direction = vec2(1.0, 0.5); // Direction du déplacement
    float speed = 1.0;
    
    // Déplacer le point dans l'espace tangent à la surface
    vec3 tangent = normalize(cross(normalizedPos, vec3(0.0, 1.0, 0.0)));
    vec3 bitangent = normalize(cross(normalizedPos, tangent));
    
    // Appliquer le déplacement
    vec2 offset = direction * time * speed;
    vec3 displaced = normalizedPos + 
                    tangent * offset.x + 
                    bitangent * offset.y;
    
    // Renormaliser pour rester sur la surface
    return normalize(displaced) * radius;
}

vec3 sphereToStar(vec3 pos, float numBranches, float branchDepth, float sharpness) {
    pos = normalize(pos);
    float radius = length(pos);
    float theta = atan(pos.y, pos.x);
    float phi = acos(pos.z / radius);
    
    float horModulation = pow(abs(sin(numBranches * 0.5 * theta)), 0.5);
    float vertModulation = pow(abs(sin(numBranches * phi)), 0.5);
    
    horModulation = pow(horModulation, sharpness);
    vertModulation = pow(vertModulation, sharpness);
    
    float starRadius = radius * (1.0 - branchDepth + branchDepth * (horModulation * vertModulation));
    
    return pos * starRadius;
}

vec3 sphereToCube(vec3 pos) {
    vec3 p = normalize(pos);
    vec3 absp = abs(p);
    float max = max(max(absp.x, absp.y), absp.z);
    return p * (1.0/max);
}

vec3 twist(vec3 pos, float amount) {
    float c = cos(amount * pos.y);
    float s = sin(amount * pos.y);
    mat2 m = mat2(c, -s, s, c);
    vec3 twisted = vec3(m * pos.xz, pos.y);
    return twisted;
}



float smoothSquareWave(float t, float smoothness) {
    // Créer une onde en dents de scie basique
    float sawWave = fract(t * 0.5);  // fract donne la partie fractionnaire (0 à 1)
    
    // Utiliser smoothstep pour créer les transitions douces
    // smoothstep(edge0, edge1, x) fait une interpolation douce entre 0 et 1
    float transition = 0.5 * smoothness;  // Largeur de la zone de transition
    return smoothstep(0.5 - transition, 0.5 + transition, sawWave);
}

// Fonction pour créer une sphère
vec3 createSphere(vec3 pos, float radius) {
    return normalize(pos) * radius;
}

// Fonction pour créer un cube
vec3 createCube(vec3 pos, float size) {
    vec3 p = normalize(pos);
    vec3 absp = abs(p);
    float max = max(max(absp.x, absp.y), absp.z);
    return p * (size/max);
}

vec3 createCone(vec3 pos, float height, float radius, vec3 offset) {
    pos -= offset; // Déplacer le centre du cône
    float r = length(pos.xz);
    float h = pos.y;
    float angle = atan(radius, height);
    vec3 normalized = normalize(pos);
    return normalized * length(pos) * smoothstep(angle, angle - 0.1, acos(normalized.y)) + offset;
}

// Fonction helper pour le bruit 3D
float random3D2(vec3 pos) {
    return fract(sin(dot(pos.xyz, vec3(12.9898, 78.233, 45.5432))) * 43758.5453123);
}

vec3 createDesertRose(vec3 pos, float numPetals, float roughness, float scale, vec3 offset) {
    pos -= offset;
    
    // Convertir en coordonnées sphériques
    float radius = length(pos);
    float theta = atan(pos.y, pos.x);
    float phi = acos(pos.z / radius);
    
    // Créer la forme de base (pétales)
    float petalPattern = abs(sin(numPetals * 0.5 * theta) * sin(numPetals * phi));
    
    // Ajouter de la variation aléatoire pour l'aspect cristallin
    float noise = random3D2(pos * roughness);
    petalPattern = pow(petalPattern, 1.0 + noise);
    
    // Moduler le rayon
    float newRadius = radius * (0.5 + 0.5 * petalPattern) * scale;
    
    // Reconvertir en coordonnées cartésiennes
    pos = normalize(pos) * newRadius;
    
    return pos + offset;
}



vec3 createCylinder(vec3 pos, float height, float radius, vec3 offset) {
    pos -= offset; // Déplacer le centre du cylindre
    vec2 xz = pos.xz;
    float r = length(xz);
    pos.xz *= radius / max(r, radius);
    pos.y = clamp(pos.y, -height/2.0, height/2.0);
    return pos + offset;
}

vec3 combineShapes(vec3 pos) {
    // Positions des formes dans l'espace
    vec3 coneOffset = vec3(2.0, 0.0, 0.0);    // Cône à droite
    vec3 cylinderOffset = vec3(-2.0, 0.0, 0.0); // Cylindre à gauche
    
    // Créer les formes
    vec3 cone = createCone(pos, 1.5, 0.8, coneOffset);
    vec3 cylinder = createCylinder(pos, 2.0, 0.6, cylinderOffset);
    
    // Déterminer quelle forme est la plus proche du point
    float distToCone = length(pos - coneOffset);
    float distToCylinder = length(pos - cylinderOffset);
    
    // Retourner la forme la plus proche
    return distToCone < distToCylinder ? cone : cylinder;
}

float map(float value, float a, float b, float c, float d) {
    return c + (value - a) * (d - c) / (b - a);
  }

  float random(float n) {
    return fract(sin(n) * 43758.5453123);
}

float random3D(vec3 pos) {
    return fract(sin(dot(pos.xyz, vec3(12.9898, 78.233, 45.5432))) * 43758.5453123);
}

vec3 createFlatDisk(vec3 pos, float radius, float thickness) {
    // Distance au plan XZ (hauteur)
    float distToPlane = abs(pos.y);
    
    // Masque du disque (basé sur la distance au centre dans le plan XZ)
    float diskMask = step(length(pos.xz), radius) * smoothstep(thickness, 0.0, distToPlane);
    
    // Appliquer la forme
    return pos * (diskMask );
}

vec3 createBlobby(vec3 pos, float radius, float noiseScale, float noiseAmount) {
    // Normaliser la position pour la forme de base
    float dist = length(pos);
    vec3 normalized = normalize(pos);
    
    // Créer plusieurs couches de bruit pour la déformation
    float noise1 = noise(normalized * noiseScale);
    float noise2 = noise(normalized * noiseScale * 2.0) * 0.5;
    float noise3 = noise(normalized * noiseScale * 4.0) * 0.25;
    
    // Combiner les bruits pour créer une déformation organique
    float totalNoise = (noise1 + noise2 + noise3) * noiseAmount;
    
    // Appliquer la déformation à la sphère de base
    float newRadius = radius * (1.0 + totalNoise);
    
    return normalized * newRadius;
}

void main() {
  float t = uTime * 0.15 * uSpeed;
  vec2 uv = vUv;

  vec3 pos = texture2D(positions, uv).rgb;
  vec3 curlPos = texture2D(positions, uv).rgb;
  vec3 cubepos = texture2D(positions, uv).rgb;
  vec3 finalPos = vec3(0.0);

  // Mouse position and repulsion setup
  vec3 mousePos = vec3(uMouse.x, uMouse.y, 0.0) * 2.0;
  vec3 toMouse = pos - mousePos;  // Changed direction for repulsion
  float distToMouse = length(toMouse);
  
  // Repulsion parameters
  float repulsionRadius = 0.5;    // Radius of influence
  float repulsionStrength = 0.4;  // Strength of repulsion
  
  // Calculate repulsion force
  float repulsionFactor = smoothstep(repulsionRadius, 0.0, distToMouse);
  vec3 repulsion = normalize(toMouse) * repulsionFactor * repulsionStrength;

  // Apply base curl noise
  // pos = curl(pos * 2.0 * uCurlFreq + t);
  cubepos = curl(cubepos * 2.0 * uCurlFreq + t);
  
  // Add repulsion to both states
  pos += repulsion;
  cubepos += repulsion;

  // Apply blob effect to cubepos
  cubepos = createBlobby(cubepos, 1.0, 3.0, 0.5);

  // Time-based animations
  if (uTime < 1.0) {
    pos = mix(pos*0.5, pos*(4.0 +3.0 *random3D(pos)), 1.0 - uTime);
  }

  if (uTime > 1.0 && uTime < 3.0) {
    pos = mix(pos*0.5, pos*1.0, map(uTime, 1.0, 3.0, 0.0, 1.0));
  }

  // Mix between states with added repulsion influence
  finalPos = mix(pos, cubepos, abs(sin((t+4.0)*4.0)));
  
  // Add subtle swirl around mouse (optional)
  // vec3 tangent = normalize(vec3(-toMouse.y, toMouse.x, 0.0));
  // float swirlFactor = repulsionFactor * 0.2; // Adjust swirl strength
  // finalPos += tangent * swirlFactor;

  gl_FragColor = vec4(finalPos, 1.0);
}