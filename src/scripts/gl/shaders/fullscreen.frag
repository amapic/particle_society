varying vec2 vUv;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uZoom;

// Fonction pour créer un motif en damier
vec3 checkPattern(vec2 uv) {
    float size = 20.0;
    vec2 grid = floor(uv * size);
    float checker = mod(grid.x + grid.y, 2.0);
    return vec3(checker);
}

void main() {
    vec2 center = uMouse;
    float dist = distance(vUv, center);
    
    // Calculer l'effet de loupe
    vec2 dir = vUv - center;
    float factor = smoothstep(uRadius, uRadius - 0.1, dist);
    vec2 uvOffset = dir * (1.0 - 1.0/uZoom) * factor;
    vec2 uv = vUv - uvOffset;
    
    // Créer le motif
    vec3 pattern = checkPattern(uv);
    
    // Ajouter un contour à la loupe
    float edge = smoothstep(uRadius, uRadius - 0.01, dist);
    vec3 color = mix(pattern, vec3(1.0), edge * 0.2);
    
    gl_FragColor = vec4(vec3(16.0/255.0,16.0/255.0,16.0/255.0), 1.0);
}