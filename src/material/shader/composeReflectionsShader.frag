﻿#define EULER 2.718281828459045
#define FLOAT_EPSILON 0.00001

uniform sampler2D inputTexture;
uniform sampler2D lastFrameReflectionsTexture;
uniform sampler2D velocityTexture;

uniform float width;
uniform float height;

uniform float samples;
uniform float temporalResolveMix;

varying vec2 vUv;

#include <packing>

// source: https://github.com/blender/blender/blob/594f47ecd2d5367ca936cf6fc6ec8168c2b360d0/source/blender/draw/intern/shaders/common_math_lib.glsl#L42
#define min3(a, b, c) min(a, min(b, c))
#define min4(a, b, c, d) min(a, min3(b, c, d))
#define min5(a, b, c, d, e) min(a, min4(b, c, d, e))
#define min6(a, b, c, d, e, f) min(a, min5(b, c, d, e, f))
#define min7(a, b, c, d, e, f, g) min(a, min6(b, c, d, e, f, g))
#define min8(a, b, c, d, e, f, g, h) min(a, min7(b, c, d, e, f, g, h))
#define min9(a, b, c, d, e, f, g, h, i) min(a, min8(b, c, d, e, f, g, h, i))

#define max3(a, b, c) max(a, max(b, c))
#define max4(a, b, c, d) max(a, max3(b, c, d))
#define max5(a, b, c, d, e) max(a, max4(b, c, d, e))
#define max6(a, b, c, d, e, f) max(a, max5(b, c, d, e, f))
#define max7(a, b, c, d, e, f, g) max(a, max6(b, c, d, e, f, g))
#define max8(a, b, c, d, e, f, g, h) max(a, max7(b, c, d, e, f, g, h))
#define max9(a, b, c, d, e, f, g, h, i) max(a, max8(b, c, d, e, f, g, h, i))

void main() {
    vec4 inputTexel = texture2D(inputTexture, vUv);

    ivec2 size = textureSize(inputTexture, 0);
    vec2 pxSize = vec2(float(size.x), float(size.y));

    vec2 px = 1. / pxSize;

    // get neighbor pixels
    vec3 c02 = texture2D(inputTexture, vUv + vec2(-px.x, px.y)).rgb;
    vec3 c12 = texture2D(inputTexture, vUv + vec2(0., px.y)).rgb;
    vec3 c22 = texture2D(inputTexture, vUv + vec2(px.x, px.y)).rgb;
    vec3 c01 = texture2D(inputTexture, vUv + vec2(-px.x, 0.)).rgb;
    vec3 c11 = inputTexel.rgb;
    vec3 c21 = texture2D(inputTexture, vUv + vec2(px.x, 0.)).rgb;
    vec3 c00 = texture2D(inputTexture, vUv + vec2(-px.x, -px.y)).rgb;
    vec3 c10 = texture2D(inputTexture, vUv + vec2(0., -px.y)).rgb;
    vec3 c20 = texture2D(inputTexture, vUv + vec2(px.x, -px.y)).rgb;

    vec3 minNeighborColor = min9(c02, c12, c22, c01, c11, c21, c00, c10, c20);
    vec3 maxNeighborColor = max9(c02, c12, c22, c01, c11, c21, c00, c10, c20);

    // reduces noise when moving camera and not using temporal resolving
    // #ifndef TEMPORAL_RESOLVE
    // vec3 neighborColor = c02 + c12 + c22 + c01 + c11 + c21 + c00 + c10 + c20;
    // neighborColor /= 9.;
    // inputTexel.rgb = mix(inputTexel.rgb, neighborColor, 0.5);
    // #endif

    vec4 lastFrameReflectionsTexel;

#ifdef TEMPORAL_RESOLVE
    vec2 velUv = texture2D(velocityTexture, vUv).xy;
    vec2 reprojectedUv = vUv - velUv;

    float movement = length(velUv) * 100.;

    if (reprojectedUv.x >= 0. && reprojectedUv.x <= 1. && reprojectedUv.y >= 0. && reprojectedUv.y <= 1.) {
        lastFrameReflectionsTexel = texture2D(lastFrameReflectionsTexture, reprojectedUv);

        // neighborhood clamping
        if (samples < 2.) {
            vec3 clampedColor = clamp(lastFrameReflectionsTexel.rgb, minNeighborColor, maxNeighborColor);

            lastFrameReflectionsTexel.rgb = mix(lastFrameReflectionsTexel.rgb, clampedColor, 0.3875);
        }
    } else {
        lastFrameReflectionsTexel.rgb = inputTexel.rgb;
    }

    float alpha = min(inputTexel.a, lastFrameReflectionsTexel.a);

    alpha = samples < 2. || movement < FLOAT_EPSILON ? (0.05 + alpha) : 0.;

    float mixVal = (1. / samples) / EULER;
    if (alpha < FLOAT_EPSILON && samples < 15.) mixVal += 0.3;

    // calculate output color depending on the samples and lightness of the color
    vec3 newColor;

    if (alpha < 1.) {
        // the reflections aren't correct anymore (e.g. due to occlusion from moving object) so we need to have inputTexel influence the reflections more
        newColor = mix(lastFrameReflectionsTexel.rgb, inputTexel.rgb, (1. - alpha) * 0.25);
    } else if (samples > 4. && movement < FLOAT_EPSILON && length(lastFrameReflectionsTexel.rgb) < FLOAT_EPSILON) {
        // this will prevent the appearing of distracting colorful dots around the edge of a reflection once the camera has stopped moving
        newColor = lastFrameReflectionsTexel.rgb;
    } else if (1. / samples >= 1. - temporalResolveMix) {
        // the default way to sample the reflections evenly for the first "1 / temporalResolveMix" frames
        newColor = lastFrameReflectionsTexel.rgb * (temporalResolveMix) + inputTexel.rgb * (1. - temporalResolveMix);
    } else {
        // default method that samples quite subtly
        newColor = mix(lastFrameReflectionsTexel.rgb, inputTexel.rgb, mixVal);
    }

    gl_FragColor = vec4(newColor, alpha);
#else
    lastFrameReflectionsTexel = texture2D(lastFrameReflectionsTexture, vUv);

    float samplesMultiplier = pow(samples / 32., 4.) + 1.;
    if (samples > 1.) inputTexel.rgb = lastFrameReflectionsTexel.rgb * (1. - 1. / (samples * samplesMultiplier)) + inputTexel.rgb / (samples * samplesMultiplier);

    gl_FragColor = vec4(inputTexel.rgb, inputTexel.a);
#endif
}