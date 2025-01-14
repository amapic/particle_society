uniform sampler2D positions; // Data Texture containing original positions
uniform float uTime;
uniform float uSpeed;
uniform float uCurlFreq;
uniform vec2 uMouse;
uniform float uNumBranches;
uniform float uBranchDepth;
uniform float uSharpness;
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

void main() {
  float t = uTime * 0.15 * uSpeed;

  vec2 uv = vUv;

  vec3 pos = texture2D(positions, uv).rgb; // basic simulation: displays the particles in place.
  vec3 curlPos = texture2D(positions, uv).rgb;
  vec3 cubepos = texture2D(positions, uv).rgb;
  vec3 finalPos = vec3(0.0);

  // Calculer la direction vers la souris
  vec3 mousePos = vec3(uMouse.x, uMouse.y, 0.0) * 2.0; // Ajuster l'échelle si nécessaire
  vec3 toMouse = mousePos - pos;
  float distToMouse = length(toMouse);
  
  // Force d'attraction vers la souris
  float mouseInfluence = smoothstep(2.0, 0.0, distToMouse) * 0.5; // Ajuster ces valeurs
  pos += normalize(toMouse) * mouseInfluence * uSpeed;

  pos = normalize(pos);

//   pos = slideOnSurface(pos, t);
  
  // Utiliser la fonction de combinaison
  // pos = combineShapes(pos);
//   cubepos = curl(cubepos * uCurlFreq + t);
  // cubepos = normalize(cubepos) * length(pos);
//   float repulsionRadius = 0.1;
//   float repulsionStrength = 0.05;
//   vec3 repulsion = normalize(cubepos) * repulsionStrength * 
//                    (1.0 - smoothstep(0.0, repulsionRadius, length(cubepos)));
//   cubepos += repulsion;
  // curlPos = pos;
  // cubepos = curl(cubepos * uCurlFreq + t);
  // cubepos += curl(cubepos * uCurlFreq * 2.0) * 0.5;    // Plus haute fréquence
  // cubepos += curl(cubepos * uCurlFreq * 4.0) * 0.25;   // Encore plus haute fréquence

  cubepos = sphereToStar(cubepos, uNumBranches, uBranchDepth, uSharpness);
  
  // Move the particles here
  // pos = rotate(pos, vec3(0.0, 0.0, 1.0), t + sin(length(pos.xy) * 2.0 + PI * 0.5) * 10.0);
  // pos = rotate(pos, vec3(1.0, 0.0, 0.0), -t);
  // pos.z += tan(length(length(pos.xy) * 10.0) - t) * 1.0;
  // pos = curl(pos * uCurlFreq + t);

  // curlPos = curl(curlPos * uCurlFreq + t);
  // if you uncomment the next noise additions
  // you'll get very pleasing flocking particles
  // inside the bounds of a sphere
  // curlPos += curl(curlPos * uCurlFreq * 2.0) * 0.5;
  // curlPos += curl(curlPos * uCurlFreq * 4.0) * 0.25;
  // curlPos += curl(curlPos * uCurlFreq * 8.0) * 0.125;
  // curlPos += curl(pos * uCurlFreq * 16.0) * 0.0625;

  float smoothness = 0.3;  // Plus petit = transitions plus abruptes
//   float wave = smoothSquareWave(3.0*t, smoothness);
  
  finalPos = mix(pos, cubepos, abs(sin(t*4.0)));
  finalPos = finalPos + normalize(toMouse) * mouseInfluence;
  // abs(sin(t*2.0))*noise(pos + t)
  // Add speed clamping
  // vec3 displacement = finalPos - pos;
  // float maxSpeed = uSpeed/3.; // Adjust this value to control max speed
  // if(length(displacement) > maxSpeed) {
  //     displacement = normalize(displacement) * maxSpeed;
  // }
  // finalPos = pos + displacement/ 3.;

  // Solution 1: Ajouter plusieurs fréquences de curl
  
  
  
  // Solution 2: Ajouter une force de répulsion entre les points proches
  // float repulsionRadius = 0.1;
  // float repulsionStrength = 0.05;
  // vec3 repulsion = normalize(pos) * repulsionStrength * 
  //                  (1.0 - smoothstep(0.0, repulsionRadius, length(pos)));
  // curlPos += repulsion;
  
  // Solution 3: Renormaliser périodiquement pour redistribuer sur la surface
  // curlPos = normalize(curlPos) * length(pos);

  gl_FragColor = vec4(finalPos, 1.0);
}