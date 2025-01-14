uniform float uOpacity;
uniform vec2 uMouse;
uniform mat4 modelViewMatrix;

varying vec3 vColor;
varying vec3 vPos;
varying vec2 vParticleScreenPos;

void main() {
    float distToMouse = length(vParticleScreenPos - uMouse) * 4.0;

    // Couleurs de base
    vec3 baseColor = vec3(0.2, 0.3, 1.0);    // Bleu
    vec3 hoverColor1 = vec3(0.8, 0.2, 1.0);  // Violet
    vec3 hoverColor2 = vec3(1.0, 0.2, 0.5);  // Rose
    
    // Créer un dégradé basé sur la distance à la souris
    float gradient = smoothstep(1.0, 0.0, distToMouse);
    
    // Mélanger les couleurs
    vec3 finalColor = mix(
        baseColor,
        mix(hoverColor1, hoverColor2, gradient),
        gradient
    );

    // if (uMouse.x > 0.1) {
    //     finalColor = vec3(1.0, 1.0, 1.0);
    // }
    
    gl_FragColor = vec4(finalColor, uOpacity);
}