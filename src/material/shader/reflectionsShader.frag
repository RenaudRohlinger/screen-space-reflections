﻿varying vec2 vUv;

uniform sampler2D inputTexture;
uniform sampler2D accumulatedTexture;
uniform sampler2D normalTexture;
uniform sampler2D depthTexture;

uniform mat4 _projectionMatrix;
uniform mat4 _inverseProjectionMatrix;
uniform mat4 cameraMatrixWorld;
uniform float cameraNear;
uniform float cameraFar;

uniform float rayDistance;
uniform float intensity;
uniform float maxDepthDifference;
uniform float roughnessFadeOut;
uniform float maxRoughness;
uniform float rayFadeOut;
uniform float thickness;
uniform float ior;

uniform float samples;

uniform float jitter;
uniform float jitterRough;
uniform float jitterSpread;

#define FLOAT_EPSILON 0.00001
#define EARLY_OUT_COLOR vec4(0., 0., 0., 1.)

const vec2 INVALID_RAY_COORDS = vec2(-1.);
float _maxDepthDifference;  // maxDepthDifference * 0.01
float nearMinusFar;
float nearMulFar;
float farMinusNear;

#include <packing>

// helper functions
#include <helperFunctions>

vec2 BinarySearch(inout vec3 dir, inout vec3 hitPos, inout float rayHitDepthDifference);
vec2 RayMarch(vec3 dir, inout vec3 hitPos, inout float rayHitDepthDifference);
float fastGetViewZ(const in float depth);

void main() {
    vec4 depthTexel = textureLod(depthTexture, vUv, 0.);

    // filter out sky
    if (dot(depthTexel.rgb, depthTexel.rgb) < FLOAT_EPSILON) {
        gl_FragColor = EARLY_OUT_COLOR;
        return;
    }

    float unpackedDepth = unpackRGBAToDepth(depthTexel);

    vec4 normalTexel = textureLod(normalTexture, vUv, 0.);

    float roughness = normalTexel.a;
    // gl_FragColor = EARLY_OUT_COLOR;
    // return;
    if (roughness > maxRoughness || (roughness > 1. - FLOAT_EPSILON && roughnessFadeOut > 1. - FLOAT_EPSILON)) {
        gl_FragColor = EARLY_OUT_COLOR;
        return;
    }

    float specular = 1. - roughness;

    _maxDepthDifference = maxDepthDifference * 0.01;

    // pre-calculated variables for the "fastGetViewZ" function
    nearMinusFar = cameraNear - cameraFar;
    nearMulFar = cameraNear * cameraFar;
    farMinusNear = cameraFar - cameraNear;

    normalTexel.rgb = unpackRGBToNormal(normalTexel.rgb);

    // view-space depth
    float depth = fastGetViewZ(unpackedDepth);

    // view-space normal of the current texel
    vec3 viewNormal = normalTexel.xyz;

    // view-space position of the current texel
    vec3 viewPos = getViewPosition(depth);

    // world-space position of the current texel
    vec3 worldPos = screenSpaceToWorldSpace(vUv, unpackedDepth);

    // jitteriing
    vec3 jitt = vec3(0.);

    if (jitterSpread != 0. && (jitterRough != 0. || jitter == 0.)) {
        vec3 randomJitter = hash(5. * (samples * worldPos)) - 0.5;
        float spread = ((2. - specular) + roughness * jitterRough) * jitterSpread;
        float jitterMix = jitter + jitterRough * roughness;
        if (jitterMix > 1.) jitterMix = 1.;
        jitt = mix(vec3(0.), randomJitter * spread, jitterMix);
    }

    viewNormal += jitt;

    // view-space reflected ray
    vec3 reflected = reflect(normalize(viewPos), normalize(viewNormal));

    vec3 rayDir = reflected * -viewPos.z;

    vec3 hitPos = viewPos;
    float rayHitDepthDifference;

    vec2 coords = RayMarch(rayDir, hitPos, rayHitDepthDifference);

    if (coords.x == -1.) {
        gl_FragColor = EARLY_OUT_COLOR;
        return;
    }

    // from: https://github.com/kode80/kode80SSR
    // source: https://github.com/kode80/kode80SSR/blob/master/Assets/Resources/Shaders/SSR.shader#L256
    vec2 coordsNDC = (coords * 2.0 - 1.0);
    float screenFade = 0.1;
    float maxDimension = min(1.0, max(abs(coordsNDC.x), abs(coordsNDC.y)));
    float screenEdgefactor = 1.0 - (max(0.0, maxDimension - screenFade) / (1.0 - screenFade));
    screenEdgefactor = max(0., screenEdgefactor);

    vec4 SSRTexel = textureLod(inputTexture, coords.xy, 0.);
    vec4 SSRTexelReflected = textureLod(accumulatedTexture, coords.xy, 0.);

    vec3 SSR = SSRTexel.rgb + SSRTexelReflected.rgb;

    float roughnessFactor = mix(specular, 1., max(0., 1. - roughnessFadeOut));

    vec3 finalSSR = SSR * screenEdgefactor * roughnessFactor;

    if (rayFadeOut != 0.) {
        vec3 hitWorldPos = screenSpaceToWorldSpace(coords, rayHitDepthDifference);

        // distance from the reflection point to what it's reflecting
        float reflectionDistance = distance(hitWorldPos, worldPos);
        reflectionDistance += 1.;

        float opacity = 1. / (reflectionDistance * rayFadeOut * 0.1);
        if (opacity > 1.) opacity = 1.;
        finalSSR *= opacity;
    }

    float fresnelFactor = fresnel_dielectric(normalize(viewPos), viewNormal, ior);

    finalSSR = finalSSR * fresnelFactor * intensity;
    finalSSR = min(vec3(1.), finalSSR);

    float alpha = hitPos.z == 1. ? SSRTexel.a : SSRTexelReflected.a;

    gl_FragColor = vec4(finalSSR, alpha);
}

vec2 RayMarch(vec3 dir, inout vec3 hitPos, inout float rayHitDepthDifference) {
    dir = normalize(dir);
    dir *= rayDistance / float(MAX_STEPS);

    float depth;
    vec4 projectedCoord;
    vec4 lastProjectedCoord;
    float unpackedDepth;
    float stepMultiplier = 1.;
    vec4 depthTexel;

    for (int i = 0; i < MAX_STEPS; i++) {
        hitPos += dir * stepMultiplier;

        projectedCoord = _projectionMatrix * vec4(hitPos, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        // [-1, 1] --> [0, 1] (NDC to screen position)
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;

        // the ray is outside the screen so we know there won't be anything it will hit
        // undo the last step and halve the step multiplier
        if (projectedCoord.x > 1. || projectedCoord.y > 1.) {
            hitPos -= dir * stepMultiplier;
            stepMultiplier *= 0.5;
        } else {
            depthTexel = textureLod(depthTexture, projectedCoord.xy, 0.);

            unpackedDepth = unpackRGBAToDepth(depthTexel);

            // if (unpackedDepth > maxDepth) return INVALID_RAY_COORDS;

            depth = fastGetViewZ(unpackedDepth);

            rayHitDepthDifference = depth - hitPos.z;

            if (rayHitDepthDifference >= 0. && rayHitDepthDifference < thickness) {
#if NUM_BINARY_SEARCH_STEPS == 0
                // filter out sky
                if (dot(depthTexel.rgb, depthTexel.rgb) < FLOAT_EPSILON) return INVALID_RAY_COORDS;
#else
                return BinarySearch(dir, hitPos, rayHitDepthDifference);
#endif
            }

            lastProjectedCoord = projectedCoord;
        }
    }

#ifndef ALLOW_MISSED_RAYS
    return INVALID_RAY_COORDS;
#endif

    rayHitDepthDifference = unpackedDepth;

    // since hitPos isn't used anywhere we can use it to mark that this reflection would have been invalid
    hitPos.z = 1.;

    return projectedCoord.xy;
}

vec2 BinarySearch(inout vec3 dir, inout vec3 hitPos, inout float rayHitDepthDifference) {
    float depth;
    vec4 projectedCoord;
    vec2 lastMinProjectedCoordXY;
    float unpackedDepth;
    vec4 depthTexel;

    for (int i = 0; i < NUM_BINARY_SEARCH_STEPS; i++) {
        projectedCoord = _projectionMatrix * vec4(hitPos, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;

        if ((lastMinProjectedCoordXY.x > 1. || lastMinProjectedCoordXY.y > 1.) && (projectedCoord.x > 1. || projectedCoord.y > 1.)) return INVALID_RAY_COORDS;

        depthTexel = textureLod(depthTexture, projectedCoord.xy, 0.);

        unpackedDepth = unpackRGBAToDepth(depthTexel);
        depth = fastGetViewZ(unpackedDepth);

        rayHitDepthDifference = depth - hitPos.z;

        dir *= 0.5;

        if (rayHitDepthDifference > 0.0) {
            hitPos -= dir;
        } else {
            hitPos += dir;
            lastMinProjectedCoordXY = projectedCoord.xy;
        }
    }

    // filter out sky
    if (dot(depthTexel.rgb, depthTexel.rgb) < FLOAT_EPSILON) return INVALID_RAY_COORDS;

    if (abs(rayHitDepthDifference) > _maxDepthDifference) return INVALID_RAY_COORDS;

    projectedCoord = _projectionMatrix * vec4(hitPos, 1.0);
    projectedCoord.xy /= projectedCoord.w;
    projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;

    rayHitDepthDifference = unpackedDepth;

    return projectedCoord.xy;
}

// source: https://github.com/mrdoob/three.js/blob/342946c8392639028da439b6dc0597e58209c696/examples/js/shaders/SAOShader.js#L123
float fastGetViewZ(const in float depth) {
#ifdef PERSPECTIVE_CAMERA
    return nearMulFar / (farMinusNear * depth - cameraFar);
#else
    return depth * nearMinusFar - cameraNear;
#endif
}