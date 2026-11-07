/* eslint-disable */
// Glimmer Vale - RoadGuardian Edition
// Adapted from Originkit with road-safety themed colors

"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"

const DEFAULT_ADVANCED = {
    loopSec: 8,
    waveHeight: 25,
    waveLength: 70,
    crestBright: 100,
    slopeBright: 100,
    pointSize: 100,
    twinkleSharp: 8,
    prismShare: 60,
    crestColor: "#FF6B00",
    slopeColor: "#CC5500",
    slopeDeep: "#883300",
    hillShadow: "#2A1500",
    glowColor: "#FFD700",
    glowStrength: 60,
    hotspotX: 65,
    hotspotStrength: 70,
    skyMid: "#1A0A00",
    horizonGlow: "#FF4500",
    horizonGlowStrength: 30,
    petalColor: "#FFCC00",
    petalTip: "#FF8800",
    flowerCore: "#FF0000",
    flowerSize: 100,
    flowerBlur: 100,
    fringe: 100,
    sway: 50,
    midCount: 110,
    bokehCount: 90,
    grassCount: 320,
    glintCount: 20,
    glintSize: 100,
    bob: 6,
    seed: 7,
    grain: 12,
    vignette: 15,
    hover: 50,
}

const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function parseColor(input, fallback = [0, 0, 0]) {
    if (typeof input !== "string") return fallback
    let s = input.trim()
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (h.length >= 6 && !isNaN(n)) return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
        return fallback
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat)
        if (p.length >= 3 && !isNaN(p[0]) && !isNaN(p[1]) && !isNaN(p[2])) return [p[0] / 255, p[1] / 255, p[2] / 255]
    }
    return fallback
}
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function mulberry32(a) {
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const CAM_H = 2.2
const PITCH = 0.25
const TAN_V = 0.33
const TAN_H = 0.5
const NEAR = 0.3
const FAR = 220
const RIDGE_PTS = 72000
const FIELD_PTS = 50000
const MAX_PTS = RIDGE_PTS + FIELD_PTS
const ROW_DT = 0.05
const ROWS_FRONT = 34
const ROWS_BACK = 6
const MESH_C = 240
const MESH_R = 200
const MESH_S = 1.3
const BLOOM_LEVELS = 6
const MAX_SPRITES = 4200
const SPR_STRIDE = 13
const TAU = Math.PI * 2

const BIG_DAISIES = [
    [0.04, 0.6, 0.08, 0, 0.95], [0.155, 0.585, 0.06, 0, 1], [0.21, 0.625, 0.075, 0, 0.9],
    [0.05, 0.77, 0.09, 0, 0.6], [0.24, 0.78, 0.15, 0, 1], [0.36, 0.835, 0.11, 0, 0.9],
    [0.49, 0.905, 0.13, 0, 0.85], [0.645, 0.94, 0.14, 0, 0.5], [0.45, 0.735, 0.05, 0, 0.8],
    [0.66, 0.755, 0.06, 0, 0.8], [0.8, 0.69, 0.07, 0, 0.8], [0.915, 0.595, 0.09, 1, 1],
    [0.96, 0.84, 0.1, 0, 0.5], [0.975, 0.965, 0.1, 0, 0.45],
]
const BOKEH_COLORS = ["#FF0000", "#00FF00", "#FFD700", "#FF6B00", "#FF4500"]
const SPECK_WARM = ["#FFCC00", "#FF8800", "#FFB080", "#FFD890"]
const SPECK_COOL = ["#00FF7F", "#7DFFB0"]
const GLINT_COLORS = ["#7DFFB0", "#7FE8FF", "#FFFFFF", "#FF5A5A", "#FFC060", "#C9A8FF"]
const MID_PETAL = "#FFCC00"
const MID_RIM = "#FF8800"
const MID_CORE = "#FF0000"
const GRASS_A = [0x0f / 255, 0x2a / 255, 0x14 / 255]
const GRASS_B = [0x3a / 255, 0x7c / 255, 0x3e / 255]
const CORNERS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]

const RIDGE_A = [
    [-0.35, 0.272, 7], [0, 0.339, 7], [0.0625, 0.361, 7], [0.125, 0.387, 7], [0.1875, 0.417, 7],
    [0.25, 0.444, 7], [0.3125, 0.462, 7], [0.375, 0.476, 6.8], [0.44, 0.49, 6.6], [0.5, 0.497, 6.5],
    [0.56, 0.49, 6.6], [0.62, 0.468, 7], [0.68, 0.432, 7.6], [0.75, 0.39, 8.2], [0.8125, 0.368, 8.5],
    [0.875, 0.364, 8.5], [0.9375, 0.371, 8.5], [1.0, 0.38, 8.5], [1.35, 0.4, 8.5],
]
const RIDGE_B = [
    [-0.35, 0.5, 10.5], [0, 0.492, 10.5], [0.2, 0.482, 11], [0.3, 0.466, 12], [0.375, 0.452, 13],
    [0.4375, 0.437, 13.6], [0.5, 0.416, 14], [0.5625, 0.401, 14], [0.625, 0.398, 13.8],
    [0.6875, 0.394, 13.4], [0.75, 0.4, 13], [0.85, 0.41, 12.5], [1.0, 0.42, 12], [1.35, 0.44, 12],
]
const FALL_A = [6.5, 3.0]
const FALL_B = [6.5, 3.0]
const FLOOR = -1.6
const SHOULDER = [1.1, 1.2]
const SHOULDER_SWELL = 0.6
const RN = 32
const RU0 = -0.35
const RU1 = 1.35

function catmull(pts, col, u) {
    const n = pts.length
    const x = clamp(u, pts[0][0], pts[n - 1][0])
    let i = 0
    while (i < n - 2 && x > pts[i + 1][0]) i++
    const p0 = pts[Math.max(i - 1, 0)][col], p1 = pts[i][col], p2 = pts[i + 1][col], p3 = pts[Math.min(i + 2, n - 1)][col]
    const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
}

function buildRidges() {
    const c = Math.cos(PITCH), s = Math.sin(PITCH)
    const out = new Float32Array(RN * 4)
    for (let i = 0; i < RN; i++) {
        const u = RU0 + ((RU1 - RU0) * i) / (RN - 1)
        ;[RIDGE_A, RIDGE_B].forEach((r, j) => {
            const y = catmull(r, 1, u)
            const z = catmull(r, 2, u)
            const k = (1 - 2 * y) * TAN_V
            out[i * 4 + j * 2] = CAM_H + (z * (k * c - s)) / (c + k * s)
            out[i * 4 + j * 2 + 1] = z
        })
    }
    return out
}
const RIDGES = buildRidges()

const dome = (t, wf, wb) => {
    if (t < 0) {
        const f = clamp(-t / wf, 0, 1)
        const g = 1 - f * f
        return g * g
    }
    const f = clamp(t / wb, 0, 1)
    return 1 - f * f * (3 - 2 * f)
}
const smax = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k
    return Math.max(a, b) + h * h * k * 0.25
}
const R4 = [0, 0, 0, 0]

function baseH(x, d, w) {
    const u = 0.5 + (x / (TAN_H * Math.max(d, 0.5))) * 0.5
    const a = (RIDGE_A[0] - FLOOR) * dome(d - RIDGE_A[1], FALL_A[0], FALL_A[1])
    const b = (RIDGE_B[0] - FLOOR) * dome(d - RIDGE_B[1], FALL_B[0], FALL_B[1])
    const cliff = smooth(RIDGE_B[1] + FALL_B[1], RIDGE_B[1] + FALL_B[1] + 4, d)
    return FLOOR + smax(a, b, 0.35) - cliff * 40
}

function smooth(a, b, x) {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}

function buildPoints(seed) {
    const rnd = mulberry32(seed * 9973 + 1)
    const d = new Float32Array(MAX_PTS * 4)
    let i = 0
    const put = (a, b, c, e) => {
        const o = i++ * 4
        d[o] = a
        d[o + 1] = b
        d[o + 2] = c
        d[o + 3] = e
    }
    const rows = ROWS_FRONT + ROWS_BACK + 1
    const share = [0.4, 0.6]
    for (let ridge = 0; ridge < 2; ridge++) {
        const per = Math.floor((RIDGE_PTS * share[ridge]) / rows)
        for (let k = -ROWS_FRONT; k <= ROWS_BACK; k++) {
            const off = rnd()
            for (let n = 0; n < per; n++) {
                put(-0.32 + (1.64 * (n + off + (rnd() - 0.5) * 0.5)) / per, (k + (rnd() - 0.5) * 0.22) * ROW_DT, rnd(), ridge)
            }
        }
    }
    while (i < MAX_PTS) {
        const z = 3.0 + (24 - 3.0) * Math.sqrt(rnd())
        put((rnd() * 2 - 1) * z * TAN_H * 1.25, z, rnd(), 2)
    }
    for (let a = MAX_PTS - 1; a > 0; a--) {
        const b = Math.floor(rnd() * (a + 1))
        for (let q = 0; q < 4; q++) {
            const t = d[a * 4 + q]
            d[a * 4 + q] = d[b * 4 + q]
            d[b * 4 + q] = t
        }
    }
    return d
}

function buildMesh() {
    const v = new Float32Array((MESH_C + 1) * (MESH_R + 1) * 2)
    let o = 0
    for (let j = 0; j <= MESH_R; j++) {
        const d = 1.6 * Math.pow(90 / 1.6, j / MESH_R)
        for (let i = 0; i <= MESH_C; i++) {
            v[o++] = (i / MESH_C) * 2 - 1
            v[o++] = d
        }
    }
    const idx = new Uint32Array(MESH_C * MESH_R * 6)
    o = 0
    for (let j = 0; j < MESH_R; j++) {
        for (let i = 0; i < MESH_C; i++) {
            const a = j * (MESH_C + 1) + i
            const b = a + 1
            const c = a + MESH_C + 1
            const e = c + 1
            idx[o++] = a; idx[o++] = c; idx[o++] = b
            idx[o++] = b; idx[o++] = c; idx[o++] = e
        }
    }
    return { v, idx }
}

const FS_VS = `#version 300 es
in vec2 a_p;
out vec2 v_uv;
void main(){ v_uv = a_p * 0.5 + 0.5; gl_Position = vec4(a_p * 2.0 - 1.0, 0.0, 1.0); }`

const SKY_FS = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform vec3 u_top, u_mid, u_hor, u_gc;
uniform vec4 u_g;
out vec4 o;
void main(){
  vec2 f = gl_FragCoord.xy / max(u_res, vec2(1.0));
  float y = 1.0 - f.y;
  vec3 c = mix(u_top, u_mid, smoothstep(0.0, 0.22, y));
  c = mix(c, u_hor, smoothstep(0.14, 0.36, y));
  float side = clamp(0.65 + (f.x - u_g.x), 0.0, 1.3) * (1.0 - 0.4 * smoothstep(0.1, 0.36, y));
  c *= mix(vec3(1.0), vec3(1.55, 1.6, 1.22), side);
  vec2 d = vec2((f.x - u_g.x) * u_g.w, (y - u_g.y) * 1.8);
  c += u_gc * u_g.z * exp(-dot(d, d) / 0.05) * 0.35;
  o = vec4(c, 1.0);
}`

const TERRAIN_VS = `#version 300 es
precision highp float;
in vec2 a_m;
uniform vec4 u_cam;
uniform vec4 u_proj;
uniform vec4 u_wave;
uniform vec4 u_r[32];
uniform vec4 u_fog;
uniform vec3 u_shadow, u_ground, u_rim, u_sky, u_sheen;
out vec3 v_col;
vec4 cr(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t){
  return 0.5 * (2.0 * p1 + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t);
}
vec4 ridgeAt(float u){
  float f = clamp((u - -0.35) / 1.7, 0.0, 1.0) * 31.0;
  int i = int(min(floor(f), 30.0));
  float t = f - float(i);
  return cr(u_r[max(i - 1, 0)], u_r[i], u_r[i + 1], u_r[min(i + 2, 31)], t);
}
float dome(float t, float wf, float wb){
  if (t < 0.0) { float f = clamp(-t / wf, 0.0, 1.0); float g = 1.0 - f * f; return g * g; }
  float f = clamp(t / wb, 0.0, 1.0);
  return 1.0 - f * f * (3.0 - 2.0 * f);
}
float smax(float a, float b, float k){
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}
float shoulderA(float u){
  float k = (u - 0.47) / 0.17;
  return 1.1 + 0.6 * (exp(-k * k) + smoothstep(0.65, 0.85, u));
}
float ridgeLit(vec4 r, float which){
  return which < 0.5 ? smoothstep(1.35, 2.05, r.x + 1.6) : smoothstep(0.4, 1.2, r.z + 1.6);
}
float baseH(float x, float d, out float crest, out float owner){
  float u = 0.5 + (x / (0.5 * max(d, 0.5))) * 0.5;
  vec4 r = ridgeAt(0.5 + (u - 0.5) * u_wave.x);
  float ca = dome(d - r.y, 6.5, 3.0);
  float cb = dome(d - r.w, 6.5, 3.0);
  float a = (r.x + 1.6) * ca;
  float b = (r.z + 1.6) * cb;
  float ta = d - r.y, tb = d - r.w;
  float sa = 1.0 - smoothstep(0.0, ta < 0.0 ? shoulderA(0.5 + (u - 0.5) * u_wave.x) : 3.0, abs(ta));
  float sb = 1.0 - smoothstep(0.0, tb < 0.0 ? 1.2 : 3.0, abs(tb));
  owner = a > b ? 0.0 : 1.0;
  crest = a > b ? sa * ridgeLit(r, 0.0) : sb * ridgeLit(r, 1.0);
  float cliff = smoothstep(r.w + 3.0, r.w + 7.0, d);
  return -1.6 + smax(a, b, 0.35) - cliff * 40.0;
}
float sheetEnd(float x, float d){
  float u = 0.5 + (x / (0.5 * max(d, 0.5))) * 0.5;
  vec4 r = ridgeAt(0.5 + (u - 0.5) * u_wave.x);
  return step(r.w + 3.0, d);
}
float terrH(float x, float d, out float crest, out float owner){
  float e = smoothstep(3.0, 8.0, d);
  float a = u_wave.z * (x + 0.35 * d);
  float w = sin(a - u_wave.w) - sin(a) + 0.6 * (sin(1.86 * a + 2.0 * u_wave.w + 1.3) - sin(1.86 * a + 1.3));
  return baseH(x, d, crest, owner) + u_wave.y * e * w;
}
vec3 viewOf(vec3 P){
  vec3 r = P - vec3(u_cam.x, u_cam.y, 0.0);
  float depth = -r.y * u_cam.w - r.z * u_cam.z;
  float yv = r.y * u_cam.z - r.z * u_cam.w;
  return vec3(r.x, yv, depth);
}
vec4 clipOf(vec3 v){
  return vec4(v.x / u_proj.x, v.y / u_proj.y, u_proj.z * v.z + u_proj.w, v.z);
}
vec3 normalAt(float x, float d){
  float e = 0.05;
  float hx = (terrH(x + e, d, crest, owner) - terrH(x - e, d, crest, owner)) / (2.0 * e);
  float hd = (terrH(x, d + e, crest, owner) - terrH(x, d - e, crest, owner)) / (2.0 * e);
  return normalize(vec3(-hx, 1.0, hd));
}
void main(){
  float d = a_m.y;
  float x = u_cam.x + a_m.x * 1.3 * d * u_proj.x;
  float crest, owner;
  float H = terrH(x, d, crest, owner);
  vec3 P = vec3(x, H, -d);
  vec3 v = viewOf(P);
  gl_Position = clipOf(v);
  vec3 N = normalAt(x, d);
  vec3 V = normalize(vec3(u_cam.x, u_cam.y, 0.0) - P);
  float facing = clamp(dot(N, V), 0.0, 1.0);
  vec3 c = mix(u_shadow * 1.15 + u_rim * 0.06, u_shadow * 0.72, smoothstep(0.02, 0.3, facing));
  c = mix(u_ground, c, smoothstep(3.0, 6.5, d));
  c += u_sheen * pow(crest, 1.6);
  float sy = 0.5 - 0.5 * gl_Position.y / gl_Position.w;
  c = mix(c, u_ground, smoothstep(0.58, 0.8, sy) * 0.92;
  float fog = 1.0 - exp(-max(d - 8.0, 0.0) / u_fog.w);
  c = mix(c, u_fog.rgb, fog);
  v_col = mix(c, u_sky, smoothstep(18.0, 40.0, d));
}`
const TERRAIN_FS = `#version 300 es
precision highp float;
in vec3 v_col;
out vec4 o;
void main(){ o = vec4(v_col, 1.0); }`

const GLITTER_VS = `#version 300 es
precision highp float;
in vec4 a_d;
uniform vec4 u_cam;
uniform vec4 u_proj;
uniform vec4 u_wave;
uniform vec4 u_r[32];
uniform vec4 u_px;
uniform vec4 u_light;
uniform vec4 u_tw;
uniform vec4 u_hot;
uniform vec4 u_sun;
uniform vec4 u_fog;
uniform vec3 u_crest, u_slope, u_deep;
out vec3 v_col;
out float v_kind;
out float v_soft;
float h(float n){ return fract(sin(n) * 43758.5453123); }
vec3 film(float t){ return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67))); }
void main(){
  float x = a_d.x, d = a_d.y, s = a_d.z;
  bool row = a_d.w < 1.5;
  float prof = 0.0;
  float sh = a_d.w < 0.5 ? shoulderA(a_d.x) : 1.2;
  if (row) {
    vec4 r = ridgeAt(a_d.x);
    d = (a_d.w < 0.5 ? r.y : r.w) + a_d.y;
    x = (a_d.x - 0.5) / u_wave.x * 2.0 * 0.5 * d;
    float t = a_d.y;
    prof = t < 0.0 ? exp(-pow(-t / sh, 4.0)) : 0.55 * exp(-pow(t / 0.35, 2.0));
    prof *= 0.55 + 0.45 * h(floor(t / 0.05 + 0.5) * 7.31 + a_d.w * 3.7);
    prof *= clamp(d / 7.0, 1.0, 1.45) * ridgeLit(r, a_d.w);
  }
  float crest, owner;
  float H = terrH(x, d, crest, owner);
  vec3 P = vec3(x, H + 0.03, -d);
  vec3 v = viewOf(P);
  gl_Position = clipOf(v);
  vec3 N = normalAt(x, d);
  vec3 V = normalize(vec3(u_cam.x, u_cam.y, 0.0) - P);
  float facing = dot(N, V);
  float graze = 1.0 - clamp(facing, 0.0, 1.0);
  float h1 = h(s * 91.7 + 1.3), h2 = h(s * 47.3 + 7.1), h3 = h(s * 13.9 + 3.7);
  float h4 = h(s * 71.1 + 5.3), h5 = h(s * 29.3 + 9.9), h6 = h(s * 53.7 + 2.2);
  float rim = smoothstep(0.42, 0.03, facing);
  float back = clamp(dot(N, u_sun.xyz) * 0.5 + 0.6, 0.0, 1.0);
  float hills = smoothstep(2.5, 7.0, d);
  float top = row ? prof * prof * prof * 8.0 * (0.3 + 2.4 * h2 * h2 * h2) : crest * crest * 0.2;
  float I = u_light.x * (top + 0.06 * rim * rim) * back * (0.3 + 0.7 * hills) + u_light.y * (0.01 + 0.07 * pow(h2, 4.0)) * (0.35 + 0.65 * hills);
  rim = max(rim, top);
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 dh = (ndc - u_hot.xy) * vec2(3.4, 8.0);
  I *= 1.0 + u_hot.z * 1.6 * exp(-dot(dh, dh)) * (0.3 + rim);
  float ph = 6.2831853 * (u_tw.w / u_tw.x + h5);
  float fl = pow(0.5 + 0.5 * sin(ph), u_light.w);
  I *= 0.6 + u_light.z * fl;
  float bpos = row ? clamp(-a_d.y / sh, -0.4, 1.6) : 1.0 + h3;
  float hue = 0.8 + bpos * 0.2 + (h1 - 0.5) * 0.22 + (h5 < 0.22 ? 0.48 : 0.0);
  vec3 iri = mix(film(hue + 0.03 * sin(ph)), vec3(1.0), 0.16);
  vec3 col = mix(u_crest, mix(u_slope, u_deep, h3), smoothstep(0.25, 0.0, rim) * 0.85);
  col = h4 < u_tw.y ? iri : mix(col, iri, 0.55);
  if (h4 < u_tw.y) I = min(I, 1.6);
  float fog = 1.0 - exp(-max(d - 8.0, 0.0) / u_fog.w;
  col = mix(col, u_fog.rgb * 1.6, fog * 0.5);
  I *= 1.0 - 0.35 * fog;
  float px = u_px.y * u_px.x / (max(v.z, 0.1) * u_proj.y) * (0.7 + 0.6 * h1);
  float blur = smoothstep(4.5, 2.0, d);
  px *= 1.0 + 1.5 * blur;
  v_soft = blur;
  float sz = clamp(px, u_px.w, u_px.z);
  I *= min(1.0, (px * px) / (sz * sz)) / (1.0 + 3.0 * blur);
  I *= 1.0 - smoothstep(0.6, 0.8, 0.5 - 0.5 * ndc.y);
  v_kind = 0.0;
  if (h6 < u_tw.z) {
    float cyc = fract(u_tw.w / u_sun.w + h3);
    float a = pow(sin(3.14159265 * cyc), 3.0);
    float lit = smoothstep(0.25, 0.6, rim) * (1.0 - fog);
    v_kind = 1.0;
    I = a * lit * 2.2;
    sz = clamp(u_px.x * 0.05 * u_hot.w * (0.6 + 0.4 * h2) * a, 0.0, u_px.z);
    if (lit * a < 0.02) sz = 0.0;
    col = mix(u_crest, vec3(1.0), 0.5);
  }
  v_col = col * I;
  bool hide = sheetEnd(x, d) > 0.5 || d < 1.0 || (row && abs(owner - a_d.w) > 0.5);
  gl_PointSize = hide ? 0.0 : sz;
}`
const GLITTER_FS = `#version 300 es
precision highp float;
in vec3 v_col;
in float v_kind;
in float v_soft;
out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d = dot(q, q);
  if (v_kind > 0.5) {
    float r = sqrt(d);
    float rays = exp(-abs(q.y) * 28.0) * max(1.0 - abs(q.x), 0.0) + exp(-abs(q.x) * 28.0) * max(1.0 - abs(q.y), 0.0);
    float core = exp(-d * 30.0);
    o = vec4(v_col * (core * 1.5 + rays * 0.8 + exp(-r * 6.0) * 0.15), 0.0);
    return;
  }
  if (d > 1.0) discard;
  float core = exp(-d * 6.0);
  float disc = 1.0 - smoothstep(0.55, 1.0, d);
  float rimB = smoothstep(0.35, 0.9, d) * disc;
  float val = mix(core * 0.9 + disc * 0.3, disc * 0.55 + rimB * 0.45, v_soft);
  o = vec4(v_col * val, 0.0);
}`

const DOWN_FS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform vec2 u_texel;
uniform float u_pre;
out vec4 o;
vec3 pre(vec3 c){
  float b = max(c.r, max(c.g, c.b));
  float k = clamp(b - 0.45, 0.0, 0.8);
  float w = max(k * k / (4.0 * 0.8 + 0.0001), b - 1.25) / max(b, 0.0001);
  return c * max(w, 0.0);
}
void main(){
  vec2 h = u_texel * 0.5;
  vec3 s = texture(u_src, v_uv).rgb * 4.0;
  s += texture(u_src, v_uv - h).rgb;
  s += texture(u_src, v_uv + h).rgb;
  s += texture(u_src, v_uv + vec2(h.x, -h.y)).rgb;
  s += texture(u_src, v_uv - vec2(h.x, -h.y)).rgb;
  s /= 8.0;
  o = vec4(u_pre > 0.5 ? pre(min(s, vec3(6.0))) : s, 1.0);
}`
const UP_FS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform vec2 u_texel;
out vec4 o;
void main(){
  vec2 h = u_texel * 0.5;
  vec3 s = texture(u_src, v_uv + vec2(-h.x * 2.0, 0.0)).rgb;
  s += texture(u_src, v_uv + vec2(-h.x, h.y)).rgb * 2.0;
  s += texture(u_src, v_uv + vec2(0.0, h.y * 2.0)).rgb;
  s += texture(u_src, v_uv + vec2(h.x, h.y)).rgb * 2.0;
  s += texture(u_src, v_uv + vec2(h.x * 2.0, 0.0)).rgb;
  s += texture(u_src, v_uv + vec2(h.x, -h.y)).rgb * 2.0;
  s += texture(u_src, v_uv + vec2(0.0, -h.y * 2.0)).rgb;
  s += texture(u_src, v_uv + vec2(-h.x, -h.y)).rgb * 2.0;
  o = vec4(s / 12.0, 1.0);
}`
const COMPOSITE_FS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_scene, u_bloom;
uniform vec3 u_tint;
uniform vec2 u_bl;
out vec4 o;
vec3 shoulder(vec3 c){
  float m = max(c.r, max(c.g, c.b));
  if (m <= 0.75) return c;
  float t = 0.75 + 0.25 * (1.0 - exp(-(m - 0.75) / 0.25));
  vec3 h = c * (t / m);
  return mix(h, vec3(t), clamp((m - 1.1) / 2.2, 0.0, 0.7));
}
void main(){
  vec2 d = v_uv - 0.5;
  vec2 ca = d * dot(d, d) * 0.009 * u_bl.y;
  vec3 c;
  c.r = texture(u_scene, v_uv - ca).r;
  c.g = texture(u_scene, v_uv).g;
  c.b = texture(u_scene, v_uv + ca).b;
  vec3 b;
  b.r = texture(u_bloom, v_uv - ca * 2.0).r;
  b.g = texture(u_bloom, v_uv).g;
  b.b = texture(u_bloom, v_uv + ca * 2.0).b;
  c += b * u_bl.x * u_tint;
  o = vec4(shoulder(c), 1.0);
}`

function makeProgram(gl, vs, fs, names) {
    const sh = (type, src) => {
        const s = gl.createShader(type)
        if (!s) throw new Error("createShader failed")
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader compile failed")
        return s
    }
    const p = gl.createProgram()
    if (!p) throw new Error("createProgram failed")
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs))
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link failed")
    const u = {}
    for (const n of names) u[n] = gl.getUniformLocation(p, n)
    return { prog: p, u }
}
function vaoFor(gl, prog, buf, layout) {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const stride = layout.reduce((a, l) => a + l[1], 0) * 4
    let off = 0
    for (const [name, size] of layout) {
        const loc = gl.getAttribLocation(prog, name)
        if (loc >= 0) {
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4)
        }
        off += size
    }
    gl.bindVertexArray(null)
    return vao
}
function makeTarget(gl, w, h, hdr, withDepth) {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    if (hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    let depth = null
    if (withDepth) {
        depth = gl.createRenderbuffer()
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth)
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h)
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { tex, fb, depth, w, h }
}
function freeTarget(gl, t) {
    gl.deleteTexture(t.tex)
    gl.deleteFramebuffer(t.fb)
    if (t.depth) gl.deleteRenderbuffer(t.depth)
}

function setupGpu(gl) {
    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const fsProg = (fs, names) => {
        const p = makeProgram(gl, FS_VS, fs, names)
        return { ...p, vao: vaoFor(gl, p.prog, quad, [["a_p", 2]]) }
    }
    const terrain = makeProgram(gl, TERRAIN_VS, TERRAIN_FS, ["u_cam", "u_proj", "u_wave", "u_r", "u_fog", "u_shadow", "u_ground", "u_rim", "u_sky", "u_sheen"])
    const mesh = buildMesh()
    const meshBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.v, gl.STATIC_DRAW)
    const meshVao = vaoFor(gl, terrain.prog, meshBuf, [["a_m", 2]])
    gl.bindVertexArray(meshVao)
    const idxBuf = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW)
    gl.bindVertexArray(null)
    const glitter = makeProgram(gl, GLITTER_VS, GLITTER_FS, ["u_cam", "u_proj", "u_wave", "u_r", "u_px", "u_light", "u_tw", "u_hot", "u_sun", "u_fog", "u_crest", "u_slope", "u_deep"])
    const ptBuf = gl.createBuffer()
    return {
        sky: fsProg(SKY_FS, ["u_res", "u_top", "u_mid", "u_hor", "u_gc", "u_g"]),
        down: fsProg(DOWN_FS, ["u_src", "u_texel", "u_pre"]),
        up: fsProg(UP_FS, ["u_src", "u_texel"]),
        comp: fsProg(COMPOSITE_FS, ["u_scene", "u_bloom", "u_tint", "u_bl"]),
        terrain: { ...terrain, vao: meshVao, count: mesh.idx.length },
        glitter: { ...glitter, buf: ptBuf, vao: vaoFor(gl, glitter.prog, ptBuf, [["a_d", 4]]) },
        maxPt: 64,
    }
}

export default function LandingPage({ onEnter }) {
    const rootRef = useRef(null)
    const canvasRef = useRef(null)
    const sizeRef = useRef({ w: 1200, h: 800 })
    const pointerRef = useRef({ tx: 0, ty: 0, over: 0, down: 0, x: 0, y: 0, o: 0, d: 0 })
    const [grainUrl, setGrainUrl] = useState("")
    const speed = 50
    const scale = 100
    const density = 60
    const sparkle = 50
    const background = "#0A0A00"
    const skyTop = "#1A0A00"
    const skyHorizon = "#331A00"
    const adv = DEFAULT_ADVANCED

    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return
        const measure = () => {
            const w = root.offsetWidth || 1200
            const h = root.offsetHeight || 800
            sizeRef.current = { w, h }
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: true })
        if (!gl) {
            console.warn("LandingPage: WebGL2 is not available")
            return () => ro.disconnect()
        }
        let gpu
        try {
            gpu = setupGpu(gl)
        } catch (err) {
            console.error("LandingPage:", err)
            return () => ro.disconnect()
        }
        let hdr = !!gl.getExtension("EXT_color_buffer_float")
        const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        let scene = null
        let bloom = []
        let pointSeed = NaN
        let last = -1
        let tw = 0
        let raf = 0
        const allocate = (cw, ch) => {
            if (scene) freeTarget(gl, scene)
            bloom.forEach((t) => freeTarget(gl, t))
            scene = makeTarget(gl, cw, ch, hdr, true)
            if (hdr && !targetOk(gl, scene)) {
                freeTarget(gl, scene)
                hdr = false
                scene = makeTarget(gl, cw, ch, false, true)
            }
            bloom = []
            let w = cw, h = ch
            for (let i = 0; i < BLOOM_LEVELS; i++) {
                w = Math.max(1, w >> 1)
                h = Math.max(1, h >> 1)
                bloom.push(makeTarget(gl, w, h, hdr, false))
            }
        }
        const frame = (now) => {
            raf = requestAnimationFrame(frame)
            const rdt = last < 0 ? 0 : Math.min(Math.max(0, (now - last) / 1000), 1 / 20)
            last = now
            const loop = Math.max(2, num(adv.loopSec, 8))
            const spd = mq && mq.matches ? 0 : Math.max(0, num(speed, 50)) / 50
            tw = (tw + rdt * spd) % loop
            const { w: W, h: H } = sizeRef.current
            if (W < 2 || H < 2) return
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            const cw = Math.round(W * dpr), ch = Math.round(H * dpr)
            if (canvas.width !== cw || canvas.height !== ch || !scene || scene.w !== cw || scene.h !== ch) {
                canvas.width = cw
                canvas.height = ch
                allocate(cw, ch)
            }
            const P = pointerRef.current
            const kp = 1 - Math.exp(-rdt / 0.4)
            P.x += (P.tx - P.x) * kp
            P.y += (P.ty - P.y) * kp
            P.o += (P.over - P.o) * kp
            P.d += (P.down - P.d) * (1 - Math.exp(-rdt / 0.25))
            const hk = Math.max(0, num(adv.hover, 50)) / 50
            const scaleF = clamp(num(scale, 100), 30, 200) / 100
            const spark = clamp(num(sparkle, 50), 0, 100) / 50
            const dens = clamp(num(density, 60), 10, 100) / 100
            const unit = Math.min(W, H * 0.75)
            const sx = -P.x * 0.02 * hk
            const bob = (num(adv.bob, 6) / 1000) * Math.sin((TAU * tw) / loop)
            const camX = P.x * 0.35 * hk
            const camY = CAM_H + bob * 6 - P.y * 0.06 * hk
            const pitch = PITCH + P.y * 0.008 * hk
            const cosP = Math.cos(pitch), sinP = Math.sin(pitch)
            const worldW = 2 * TAN_H * 12
            const wave = {
                si: 1 / scaleF,
                amp: (num(adv.waveHeight, 25) / 1000) * 3,
                k: TAU / Math.max(0.3, (num(adv.waveLength, 70) / 100) * worldW * scaleF),
                ph: (TAU * tw) / loop,
            }
            const hotX = num(adv.hotspotX, 65) / 100
            const hotS = num(adv.hotspotStrength, 70) / 100
            const glowS = (num(adv.glowStrength, 60) / 100) * (1 + 0.4 * P.d * hk)
            const bg = parseColor(background, [0.04, 0.04, 0])
            const crestC = parseColor(adv.crestColor, [1, 0.42, 0])
            const glowC = parseColor(adv.glowColor, [1, 0.84, 0])
            const shadow = parseColor(adv.hillShadow, [0.16, 0.08, 0])
            const slopeC = parseColor(adv.slopeColor, [0.8, 0.33, 0])
            const deep = parseColor(adv.slopeDeep, [0.53, 0.2, 0])
            const skyHor = parseColor(skyHorizon, [0.2, 0.1, 0])
            const fogC = mix3(skyHor, deep, 0.45)
            const fogDist = 22 * scaleF
            const seed = Math.round(num(adv.seed, 7))
            if (seed !== pointSeed) {
                gl.bindBuffer(gl.ARRAY_BUFFER, gpu.glitter.buf)
                gl.bufferData(gl.ARRAY_BUFFER, buildPoints(seed), gl.STATIC_DRAW)
                pointSeed = seed
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb)
            gl.viewport(0, 0, cw, ch)
            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.BLEND)
            gl.depthMask(true)
            gl.clearColor(bg[0], bg[1], bg[2], 1)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            const S = gpu.sky
            gl.useProgram(S.prog)
            gl.uniform2f(S.u.u_res, cw, ch)
            gl.uniform3fv(S.u.u_top, parseColor(skyTop, [0.1, 0.04, 0]))
            gl.uniform3fv(S.u.u_mid, parseColor(adv.skyMid, [0.1, 0.03, 0]))
            gl.uniform3fv(S.u.u_hor, skyHor)
            gl.uniform3fv(S.u.u_gc, parseColor(adv.horizonGlow, [1, 0.28, 0]))
            gl.uniform4f(S.u.u_g, hotX + sx * 0.3, 0.5, num(adv.horizonGlowStrength, 30) / 100, W / H)
            gl.bindVertexArray(S.vao)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            const A = (FAR + NEAR) / (FAR - NEAR), B = (-2 * FAR * NEAR) / (FAR - NEAR)
            const setWorld = (u) => {
                gl.uniform4f(u.u_cam, camX, camY, cosP, sinP)
                gl.uniform4f(u.u_proj, TAN_H, TAN_V, A, B)
                gl.uniform4f(u.u_wave, wave.si, wave.amp, wave.k, wave.ph)
                gl.uniform4f(u.u_fog, fogC[0], fogC[1], fogC[2], fogDist)
                gl.uniform4fv(u["u_r[0]"], RIDGES)
            }
            gl.enable(gl.DEPTH_TEST)
            gl.depthFunc(gl.LEQUAL)
            const T = gpu.terrain
            gl.useProgram(T.prog)
            setWorld(T.u)
            gl.uniform3fv(T.u.u_shadow, shadow)
            gl.uniform3fv(T.u.u_ground, bg)
            gl.uniform3fv(T.u.u_rim, slopeC)
            gl.uniform3fv(T.u.u_sky, skyHor)
            const sheen = mix3(slopeC, glowC, 0.25).map((c, i) => c * [0.42, 0.37, 0.52][i] * (num(adv.crestBright, 100) / 100))
            gl.uniform3fv(T.u.u_sheen, sheen)
            gl.bindVertexArray(T.vao)
            gl.drawElements(gl.TRIANGLES, T.count, gl.UNSIGNED_INT, 0)
            gl.depthMask(false)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            const G = gpu.glitter
            gl.useProgram(G.prog)
            setWorld(G.u)
            gl.uniform4f(G.u.u_px, ch / 2, 0.017 * scaleF * (num(adv.pointSize, 100) / 100), gpu.maxPt, 1.0 * dpr)
            const flash = 0.45 * spark * (1 + 0.3 * P.o * hk + 0.8 * P.d * hk)
            gl.uniform4f(G.u.u_light, num(adv.crestBright, 100) / 100, num(adv.slopeBright, 100) / 100, flash, Math.max(1, num(adv.twinkleSharp, 8)))
            const drawn = Math.floor(MAX_PTS * dens)
            const glintShare = (clamp(num(adv.glintCount, 20), 0, 60) * spark * 4) / Math.max(1, drawn)
            gl.uniform4f(G.u.u_tw, loop / 5, clamp((num(adv.prismShare, 60) / 100) * Math.min(1, 0.5 + spark * 0.5), 0, 1), glintShare, tw)
            gl.uniform4f(G.u.u_hot, hotX * 2 - 1 + sx, 1 - 0.5, hotS, num(adv.glintSize, 100) / 100)
            const sl = Math.hypot((hotX * 2 - 1) * TAN_H, 0.18, 1)
            gl.uniform4f(G.u.u_sun, ((hotX * 2 - 1) * TAN_H) / sl, 0.18 / sl, -1 / sl, loop / 10)
            gl.uniform3fv(G.u.u_crest, crestC)
            gl.uniform3fv(G.u.u_slope, slopeC)
            gl.uniform3fv(G.u.u_deep, deep)
            gl.bindVertexArray(G.vao)
            gl.drawArrays(gl.POINTS, 0, drawn)
            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.BLEND)
            const Dn = gpu.down
            gl.useProgram(Dn.prog)
            gl.bindVertexArray(Dn.vao)
            gl.activeTexture(gl.TEXTURE0)
            gl.uniform1i(Dn.u.u_src, 0)
            let src = scene
            for (let i = 0; i < bloom.length; i++) {
                const dst = bloom[i]
                gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb)
                gl.viewport(0, 0, dst.w, dst.h)
                gl.bindTexture(gl.TEXTURE_2D, src.tex)
                gl.uniform2f(Dn.u.u_texel, 1 / src.w, 1 / src.h)
                gl.uniform1f(Dn.u.u_pre, i === 0 ? 1 : 0)
                gl.drawArrays(gl.TRIANGLES, 0, 3)
                src = dst
            }
            const Up = gpu.up
            gl.useProgram(Up.prog)
            gl.bindVertexArray(Up.vao)
            gl.uniform1i(Up.u.u_src, 0)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE)
            for (let i = bloom.length - 1; i > 0; i--) {
                const from = bloom[i], dst = bloom[i - 1]
                gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb)
                gl.viewport(0, 0, dst.w, dst.h)
                gl.bindTexture(gl.TEXTURE_2D, from.tex)
                gl.uniform2f(Up.u.u_texel, 1 / from.w, 1 / from.h)
                gl.drawArrays(gl.TRIANGLES, 0, 3)
            }
            gl.disable(gl.BLEND)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, cw, ch)
            const C = gpu.comp
            gl.useProgram(C.prog)
            gl.bindVertexArray(C.vao)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, scene.tex)
            gl.uniform1i(C.u.u_scene, 0)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, bloom[0].tex)
            gl.uniform1i(C.u.u_bloom, 1)
            gl.activeTexture(gl.TEXTURE0)
            gl.uniform3fv(C.u.u_tint, mix3([1, 1, 1], glowC, 0.35))
            gl.uniform2f(C.u.u_bl, glowS * 0.75, num(adv.fringe, 100) / 100)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            gl.bindVertexArray(null)
        }
        raf = requestAnimationFrame(frame)
        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            if (scene) freeTarget(gl, scene)
            bloom.forEach((t) => freeTarget(gl, t))
        }
    }, [])

    useEffect(() => {
        const up = () => {
            pointerRef.current.down = 0
        }
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
        return () => {
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
        }
    }, [])

    useEffect(() => {
        const c = document.createElement("canvas")
        c.width = c.height = 128
        const ctx = c.getContext("2d")
        if (!ctx) return
        const im = ctx.createImageData(128, 128)
        for (let i = 0; i < 128 * 128; i++) {
            const v = Math.random() * 255
            im.data[i * 4] = v
            im.data[i * 4 + 1] = v
            im.data[i * 4 + 2] = v
            im.data[i * 4 + 3] = 255
        }
        ctx.putImageData(im, 0, 0)
        setGrainUrl(c.toDataURL())
    }, [])

    const onMove = (e) => {
        const t = e.target
        const w = t.offsetWidth || sizeRef.current.w
        const h = t.offsetHeight || sizeRef.current.h
        const P = pointerRef.current
        P.tx = clamp((e.nativeEvent.offsetX / w) * 2 - 1, -1, 1)
        P.ty = clamp((e.nativeEvent.offsetY / h) * 2 - 1, -1, 1)
        P.over = 1
    }
    const onLeave = () => {
        const P = pointerRef.current
        P.tx = 0
        P.ty = 0
        P.over = 0
    }
    const onDown = (e) => {
        onMove(e)
        pointerRef.current.down = 1
    }
    const onClick = () => {
        onEnter && onEnter()
    }

    return (
        <div
            ref={rootRef}
            onPointerMove={onMove}
            onPointerEnter={onMove}
            onPointerLeave={onLeave}
            onPointerDown={onDown}
            onClick={onClick}
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                minWidth: 1200,
                minHeight: 800,
                overflow: "hidden",
                background,
                isolation: "isolate",
                cursor: "pointer",
            }}
        >
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
            {grainUrl && num(adv.grain, 0) > 0 ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        backgroundImage: `url(${grainUrl})`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "128px 128px",
                        mixBlendMode: "overlay",
                        opacity: (clamp(num(adv.grain, 0), 0, 100) / 100) * 0.35,
                    }}
                />
            ) : null}
            {num(adv.vignette, 0) > 0 ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: "radial-gradient(ellipse 75% 75% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.9) 100%)",
                        opacity: clamp(num(adv.vignette, 0), 0, 100) / 100,
                    }}
                />
            ) : null}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    color: "#FFD700",
                    textShadow: "0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 107, 0, 0.6)",
                }}
            >
                <h1 style={{
                    fontSize: clamp(sizeRef.current.w / 20, 40, 80),
                    fontWeight: 800,
                    margin: 0,
                    textAlign: "center",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                }}>
                    RoadGuardian
                </h1>
                <p style={{
                    fontSize: clamp(sizeRef.current.w / 50, 18, 32),
                    margin: "1rem 0 0",
                    textAlign: "center",
                    opacity: 0.9,
                }}>
                    AI-Powered Road Safety
                </p>
                <div style={{
                    marginTop: "2rem",
                    padding: "1rem 2rem",
                    border: "2px solid rgba(255, 215, 0, 0.5)",
                    borderRadius: "50px",
                    background: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(10px)",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    animation: "pulse 2s infinite",
                }}>
                    Click to Enter
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
