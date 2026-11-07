/* eslint-disable */
// Velour Bolster - RoadGuardian Edition
// Adapted from Originkit with road-safety themed colors

"use client"
import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

const DEFAULTS = {
    link: "",
    text: "Get Started",
    background: "#0A0A00",
    textColor: "#FFD700",
    buttonWidth: 500,
    buttonHeight: 172,
    radius: 86,
    fabric: "#FF6B00",
    drift: 5,
}

const DEFAULT_FONT = { fontFamily: "Arial, sans-serif", fontWeight: 800 }
const DEFAULT_PLACEMENT = { x: 0, y: 0, angle: 0, tilt: 0 }
const DEFAULT_RESPONSE = { reach: 0, puff: 5, bulge: 5, press: 5, wobble: 5, drag: 5, ripple: 5, release: 0.7 }
const DEFAULT_ADVANCED = {
    nap: 100,
    pile: 100,
    wrinkles: 100,
    sheen: 100,
    fuzz: 0.45,
    hem: 5,
    lightAngle: 35,
    lightHeight: 41,
    shadow: 45,
    glow: 40,
}

const SANS = '"Arial", "Helvetica", sans-serif'

function clamp(x, a, b) {
    return x < a ? a : x > b ? b : x
}

function num(v, d) {
    const n = typeof v === "number" ? v : parseFloat(String(v))
    return Number.isFinite(n) ? n : d
}

function mulberry(seed) {
    let s = seed >>> 0
    return () => {
        s = (s + 0x6d2b79f5) >>> 0
        let t = s
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function srgbToLin(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function resolveRGB(el, c) {
    const prev = el.style.color
    el.style.color = ""
    el.style.color = c
    const out = getComputedStyle(el).color
    el.style.color = prev
    const m = out.match(/[\d.]+/g)
    if (!m || m.length < 3) return [0, 0, 0]
    return [+m[0] / 255, +m[1] / 255, +m[2] / 255]
}

function fontSizeRef(font) {
    const v = font?.fontSize
    if (v === undefined || v === null || v === "") return null
    const n = typeof v === "number" ? v : parseFloat(String(v))
    if (!Number.isFinite(n) || n <= 0) return null
    if (typeof v === "string" && /em$/i.test(v.trim())) return n * 16
    return n
}

function fontCss(font, px) {
    const f = { ...DEFAULT_FONT, ...font }
    const fam = String(f.fontFamily || "").trim()
    const family = !fam ? SANS : /[,"']/.test(fam) ? fam : `"${fam}", ${SANS}`
    const weight = num(f.fontWeight, 800)
    const style = f.fontStyle === "italic" ? "italic" : "normal"
    return `${style} ${weight} ${px.toFixed(2)}px ${family}`
}

const requestedFonts = new Set()
function ensureFont(font, onReady) {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    const f = { ...DEFAULT_FONT, ...font }
    const fam = String(f.fontFamily || "").trim()
    const css = fontCss(font, 40)
    if (!fonts) return
    if (!fam || /[,"']/.test(fam) || /^(serif|sans-serif|monospace|system-ui)$/i.test(fam)) {
        fonts.load(css, "E").then(onReady, onReady)
        return
    }
    let registered = false
    fonts.forEach((face) => {
        if (face.family.replace(/^["']|["']$/g, "") === fam) registered = true
    })
    const weight = clamp(Math.round(num(f.fontWeight, 800) / 100) * 100, 100, 900)
    const italic = f.fontStyle === "italic" ? 1 : 0
    const key = `${fam}|${weight}|${italic}`
    if (registered || requestedFonts.has(key)) {
        fonts.load(css, "E").then(onReady, onReady)
        return
    }
    requestedFonts.add(key)
    fonts.load(css, "E").then(onReady, onReady)
}

function isExternal(href) {
    if (typeof window === "undefined") return /^https?:\/\//i.test(href)
    try {
        return new URL(href, window.location.href).origin !== window.location.origin
    } catch {
        return false
    }
}

let clothCache = null

function bakeCloth() {
    if (clothCache) return clothCache
    const W = 256
    const H = 128
    const rnd = mulberry(20261026)
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd())
    const nap = new Float32Array(W * H)
    const fold = new Float32Array(W * H)
    const fx = new Float32Array(W * H)
    const fy = new Float32Array(W * H)
    const cu = new Float32Array(W)
    const su = new Float32Array(W)
    const cv = new Float32Array(H)
    const sv = new Float32Array(H)
    const addModes = (count, fyMean, fySpread, fxSpread, target, grads) => {
        for (let k = 0; k < count; k++) {
            const n = Math.max(1, Math.round(Math.abs(fyMean + fySpread * gauss()) * 1.6))
            const m = Math.round(fxSpread * gauss() * 3.2)
            const ph = rnd() * Math.PI * 2
            const a = 0.5 + rnd()
            for (let i = 0; i < W; i++) {
                const t = (2 * Math.PI * m * i) / W + ph
                cu[i] = Math.cos(t)
                su[i] = Math.sin(t)
            }
            for (let j = 0; j < H; j++) {
                const t = (2 * Math.PI * n * j) / H
                cv[j] = Math.cos(t)
                sv[j] = Math.sin(t)
            }
            const gx = (a * 2 * Math.PI * m) / 3.2
            const gy = (a * 2 * Math.PI * n) / 1.6
            for (let j = 0; j < H; j++) {
                const row = j * W
                const c2 = cv[j]
                const s2 = sv[j]
                for (let i = 0; i < W; i++) {
                    const c = cu[i] * c2 - su[i] * s2
                    target[row + i] += a * c
                    if (grads) {
                        const s = su[i] * c2 + cu[i] * s2
                        fx[row + i] -= gx * s
                        fy[row + i] -= gy * s
                    }
                }
            }
        }
    }
    addModes(96, 3.0, 1.1, 0.8, nap, false)
    addModes(36, 3.6, 1.2, 0.25, fold, true)
    const norm = (a) => {
        let s = 0
        for (let i = 0; i < a.length; i++) s += a[i] * a[i]
        return 1 / Math.sqrt(s / a.length || 1)
    }
    const kn = norm(nap)
    const kf = norm(fold)
    const out = new Float32Array(W * H * 4)
    for (let i = 0; i < W * H; i++) {
        out[i * 4] = clamp(nap[i] * kn, -2.5, 2.5)
        out[i * 4 + 1] = fold[i] * kf
        out[i * 4 + 2] = fx[i] * kf
        out[i * 4 + 3] = fy[i] * kf
    }
    clothCache = out
    return out
}

function bakeNoise() {
    const N = 256
    const rnd = mulberry(77)
    const w = new Float32Array(N * N)
    for (let i = 0; i < w.length; i++) w[i] = rnd()
    const out = new Uint8Array(N * N * 4)
    for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
            const k = j * N + i
            const r = (w[k] + w[j * N + ((i + 1) % N)]) * 0.5
            out[k * 4] = Math.round(clamp((r - 0.5) * 1.6 + 0.5, 0, 1) * 255)
            out[k * 4 + 1] = Math.floor(rnd() * 256)
            out[k * 4 + 2] = Math.floor(rnd() * 256)
            out[k * 4 + 3] = Math.floor(rnd() * 256)
        }
    }
    return out
}

const VERT = `#version 300 es
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const REF_W = 1200
const REF_H = 800
const REF_ASPECT = REF_W / REF_H
const MAX_DPR = 2
const PIXEL_CAP = 2.6e6
const PERSPECTIVE = 1000
const STEP = 1 / 120
const MARGIN = 0.8
const GRID_PITCH = 0.05
const QUALITY_FLOOR = 0.6
const TEXT_SIZE = 0.3
const TEXT_LIFT = 0
const TEXT_MAX_W = 0.92
const TEXT_MAX_H = 0.95
const LINE_H = 1.12
const RIM_H = 0.045
const RIM_W = 0.075
const DOME_H = 0.2
const DOME_W0 = 0.34
const DOME_W1 = 0.3
const HOVER_GROW = 0.065
const REST_PUFF = 0.35
const LIGHT_FALLOFF = 0.3
const SHOULDER = 0.3
const HOVER_HYST = 0.02
const SWELL_SIGMA = 0.45
const SWELL_XY = 0.34
const SWELL_Z = 0.3
const FAR_SHRINK = 0.03
const RIM_ZONE = 0.3
const PRESS_SIGMA = 0.3
const PRESS_Z = 0.36
const PRESS_SQUASH = 0.03
const MEM_W = 13
const INF_W = 12
const DWELL_SHARE = 0.22
const DWELL_TAU = 0.6
const WAKE_GAIN = 0.08
const WAKE_MAX = 0.4
const MEM_T = 3
const CRAWL_REST = 1.0
const CRAWL_ACTIVE = 1.0
const CRAWL_CYCLE = 1024
const IDLE_DIVISOR = 2
const IDLE_DIVISOR_MAX = 4
const RIPPLE_SPEED = 1.6
const RIPPLE_DAMP = 9
const RIPPLE_SIGMA = 0.12
const RIPPLE_GAIN = 1.4
const FOLD_DRIFT = 0.45
const CLOTH_W = 256
const CLOTH_H = 128
const CLOTH_TX = 3.2
const CLOTH_TY = 1.6

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform vec2 uCanvas;
uniform vec2 uOrigin;
uniform float uUpp;
uniform float uUcss;
uniform vec2 uHalf;
uniform float uRad;
uniform vec4 uGrid;
uniform float uDeform;
uniform float uInflate;
uniform float uScale;
uniform float uPhase;
uniform float uActive;
uniform vec3 uFabric;
uniform vec3 uSheenCol;
uniform vec3 uInk;
uniform float uInkOn;
uniform vec3 uLight;
uniform vec4 uLook;
uniform vec4 uEdge;
uniform sampler2D uGridTex;
uniform sampler2D uGridGrad;
uniform sampler2D uCloth;
uniform sampler2D uNoise;
uniform sampler2D uLabel;
out vec4 outColor;

float sdRR(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec2 nRR(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
    if (q.x > 0.0 && q.y > 0.0) return normalize(q) * s;
    return q.x > q.y ? vec2(s.x, 0.0) : vec2(0.0, s.y);
}

vec2 crawlOffset(float k) {
    k = mod(k, 1024.0);
    return fract(vec2(sin(k * 12.9898), sin(k * 78.233)) * 43758.5453);
}

vec4 cubicW(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    return vec4(x, y, z, 6.0 - x - y - z) * (1.0 / 6.0);
}

vec4 lattice(sampler2D tex, vec2 q) {
    vec2 size = vec2(textureSize(tex, 0));
    vec2 t = (q - uGrid.xy) / uGrid.zw * (size - 1.0);
    vec2 f = fract(t);
    t -= f;
    vec4 xc = cubicW(f.x);
    vec4 yc = cubicW(f.y);
    vec4 c = t.xxyy + vec2(-0.5, 1.5).xyxy + 0.5;
    vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
    vec4 o = (c + vec4(xc.yw, yc.yw) / s) / size.xxyy;
    vec4 s0 = texture(tex, o.xz);
    vec4 s1 = texture(tex, o.yz);
    vec4 s2 = texture(tex, o.xw);
    vec4 s3 = texture(tex, o.yw);
    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);
    return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}

float pillow(float e) {
    float t0 = clamp(e / 0.075, 0.0, 1.0);
    float z = 0.045 * sqrt(1.0 - (1.0 - t0) * (1.0 - t0));
    float w1 = max(0.05, 0.34 + 0.3 * uInflate);
    float t1 = clamp(e / w1, 0.0, 1.0);
    float u = 1.0 - t1;
    z += 0.2 * uInflate * sqrt(1.0 - u * u * u);
    return z;
}

vec3 toSrgb(vec3 c) {
    c = max(c, 0.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 velour(vec3 N, vec3 albedo, float nap, float grain, float illum) {
    float NoL = dot(N, uLight);
    float NoV = clamp(N.z, 0.0, 1.0);
    float diff = clamp((NoL + 0.4) / 1.4, 0.0, 1.0);
    vec3 col = albedo * (0.12 + 1.137 * diff * diff) * illum;
    float napL = nap > 0.0 ? nap * 1.35 : nap * 0.55;
    col *= (1.0 + 0.3 * uLook.x * napL) * (1.0 + 0.75 * uLook.y * grain);
    float rim = pow(1.0 - NoV, 2.4);
    float lit = 0.1 + 1.05 * clamp(NoL + 0.3, 0.0, 1.3);
    col += uSheenCol * uLook.w * rim * lit * illum * (1.0 + 0.4 * uLook.x * napL) * (1.0 + 0.75 * uLook.y * grain);
    float toward = max(NoL - uLight.z * 0.97, 0.0);
    col += uSheenCol * uLook.w * 0.3 * toward * illum * (1.0 + 0.75 * uLook.y * grain);
    return col;
}

void main() {
    vec2 fc = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y);
    vec2 p = uOrigin + fc * uUpp;
    vec2 q = p / uScale;
    vec4 D = vec4(0.0);
    if (uDeform > 0.0) {
        D = lattice(uGridTex, q);
        q = (p - D.xy) / uScale;
    }
    float hem = uEdge.y;
    float aa = uUpp;
    vec3 dither = texelFetch(uNoise, ivec2(gl_FragCoord.xy) & 255, 0).rgb - 0.5;
    float lift = 0.035 + 0.05 * uInflate;
    float dSh = max(sdRR(q - vec2(0.012, lift), uHalf + vec2(0.0, 0.01), uRad), 0.0);
    float shadow = uEdge.z * (0.55 * exp(-dSh / 0.03) + 0.45 * exp(-dSh / (0.14 + 0.06 * uInflate)));
    float sdOut = min(sdRR(q, uHalf, uRad), sdRR(q - vec2(0.0, hem * 0.5), uHalf + vec2(0.0, hem * 0.5), uRad));
    float dg = max(sdOut, 0.0) / 0.25;
    vec3 glow = toSrgb(uSheenCol * uEdge.w * 0.022 * exp(-dg * dg));
    vec2 toEdge = min(p - uOrigin, uOrigin + uCanvas * uUpp - p);
    float win = smoothstep(0.0, 0.22, min(toEdge.x, toEdge.y));
    glow *= win;
    shadow *= win;
    float far = 4.0 * uEdge.x * uUcss + 2.0 * aa;
    if (sdOut - uDeform / uScale > far) {
        outColor = vec4(glow + dither / 255.0, shadow);
        return;
    }
    if (uDeform > 0.0) {
        for (int i = 0; i < 2; i++) {
            D = lattice(uGridTex, q);
            q = (p - D.xy) / uScale;
        }
    }
    float sd = sdRR(q, uHalf, uRad);
    float sdHem = sdRR(q - vec2(0.0, hem * 0.5), uHalf + vec2(0.0, hem * 0.5), uRad);
    sdOut = min(sd, sdHem);
    if (sdOut > far) {
        outColor = vec4(glow + dither / 255.0, shadow);
        return;
    }
    vec4 nz = texture(uNoise, q / uUcss / 256.0);
    float grain = nz.r - 0.5;
    float fz = (texture(uNoise, q / (uUcss * 0.9) / 256.0 + 0.37).b - 0.35) * uEdge.x * uUcss;
    float cover = clamp(0.5 - (sdOut + fz) / aa, 0.0, 1.0);
    vec2 cuv = (q + vec2(0.0, 0.45 * D.z)) / vec2(3.2, 1.6);
    vec4 cA = texture(uCloth, cuv);
    float th = uPhase + 0.35 * sin(1.3 * q.x + 0.7) + 0.25 * sin(2.1 * q.y - 0.9 * q.x);
    float k0 = floor(th);
    float sw = (th - k0) * 1.5707963;
    vec4 cB = texture(uCloth, cuv + crawlOffset(k0)) * cos(sw) + texture(uCloth, cuv + crawlOffset(k0 + 1.0)) * sin(sw);
    float napFix = mix(0.8, 0.3, uActive);
    float nap = napFix * cA.r + sqrt(1.0 - napFix * napFix) * cB.r;
    vec4 cl = vec4(nap, cB.gba);
    float e = max(-sd, 0.0);
    float eps = max(uUpp * 1.5, 0.002);
    float z0 = pillow(e);
    float zx = pillow(max(-sdRR(q + vec2(eps, 0.0), uHalf, uRad), 0.0));
    float zy = pillow(max(-sdRR(q + vec2(0.0, eps), uHalf, uRad), 0.0));
    vec2 g = vec2(zx - z0, zy - z0) / eps;
    if (uDeform > 0.0) g += lattice(uGridGrad, q).xy;
    float wr = uLook.z * (0.006 + 0.018 * max(uInflate - 0.35, 0.0) + 0.035 * D.w) * smoothstep(0.0, 0.08, e);
    wr *= clamp(0.65 + 0.45 * nap, 0.15, 1.5);
    g += wr * cl.ba;
    vec3 N = normalize(vec3(-g, 1.0));
    vec2 lxy = normalize(uLight.xy + 1e-5);
    float illum = clamp(1.0 + 0.3 * dot(q, lxy), 0.4, 1.6);
    vec3 face = velour(N, uFabric, nap, grain, illum);
    face *= 1.0 - clamp(-cl.g * wr * (7.0 + 5.0 * D.w), 0.0, 0.5);
    if (uInkOn > 0.5) {
        vec2 luv = q / (uHalf * 2.0) + 0.5;
        float ink = texture(uLabel, luv).a;
        if (ink > 0.002) {
            float pin = smoothstep(0.04, 0.3, nz.g);
            ink *= mix(1.0, pin, min(1.0, 0.75 * uLook.y));
            float NoL = dot(N, uLight);
            float diff = clamp((NoL + 0.5) / 1.5, 0.0, 1.0);
            vec3 inkCol = uInk * (0.55 + 0.6 * diff) * (1.0 + 0.3 * uLook.y * grain);
            face = mix(face, inkCol, ink * smoothstep(0.0, 0.03, e));
        }
    }
    vec3 col = face;
    if (sd > -aa) {
        vec2 n2 = nRR(q, uHalf, uRad);
        float s = clamp(sd / max(hem, 1e-4), 0.0, 1.0);
        float th = mix(1.0, 1.38, s);
        vec3 Nh = normalize(vec3(n2 * sin(th), cos(th)));
        vec3 hc = velour(Nh, uFabric * 0.8, nap, grain, illum);
        hc *= mix(0.45, 1.0, smoothstep(0.0, 0.45, s));
        col = mix(hc, face, clamp(0.5 - sd / aa, 0.0, 1.0));
    }
    vec3 rgb = toSrgb(col);
    float a = cover + (1.0 - cover) * shadow;
    outColor = vec4(rgb * cover + glow * (1.0 - cover) + dither / 255.0, a);
}`

function makeLattice(hw, r) {
    const spanX = 2 * (hw + MARGIN)
    const spanY = 2 * (0.5 + MARGIN)
    const nx = clamp(Math.round(spanX / GRID_PITCH) + 1, 8, 160)
    const ny = clamp(Math.round(spanY / GRID_PITCH) + 1, 8, 96)
    const n = nx * ny
    const L = {
        nx, ny,
        ox: -spanX / 2,
        oy: -spanY / 2,
        spanX, spanY,
        px: new Float32Array(n),
        py: new Float32Array(n),
        dirX: new Float32Array(n),
        dirY: new Float32Array(n),
        d: new Float32Array(n * 3),
        v: new Float32Array(n * 3),
        r: new Float32Array(n),
        rv: new Float32Array(n),
        gx: new Float32Array(nx * 3),
        gy: new Float32Array(ny * 3),
        tex: new Float32Array(n * 4),
        grad: new Float32Array(n * 2),
        key: "",
    }
    const ix = Math.max(0, hw - r)
    const iy = Math.max(0, 0.5 - r)
    for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
            const k = j * nx + i
            const x = L.ox + (spanX * i) / (nx - 1)
            const y = L.oy + (spanY * j) / (ny - 1)
            L.px[k] = x
            L.py[k] = y
            const dx = x - clamp(x, -ix, ix)
            const dy = y - clamp(y, -iy, iy)
            const len = Math.hypot(dx, dy)
            const reachIn = clamp((len - (0.5 - RIM_ZONE)) / RIM_ZONE, 0, 1)
            const k2 = (reachIn * reachIn * (3 - 2 * reachIn)) / Math.max(len, 1e-3)
            L.dirX[k] = dx * k2
            L.dirY[k] = dy * k2
        }
    }
    return L
}

export default function VelourButton({
    link = DEFAULTS.link,
    background = DEFAULTS.background,
    text = DEFAULTS.text,
    font,
    textColor = DEFAULTS.textColor,
    buttonWidth = DEFAULTS.buttonWidth,
    buttonHeight = DEFAULTS.buttonHeight,
    radius = DEFAULTS.radius,
    fabric = DEFAULTS.fabric,
    drift = DEFAULTS.drift,
    placement,
    response,
    advanced,
    onClick,
    style,
}) {
    const pl = { ...DEFAULT_PLACEMENT, ...placement }
    const rs = { ...DEFAULT_RESPONSE, ...response }
    const adv = { ...DEFAULT_ADVANCED, ...advanced }
    const label0 = String(text ?? "").trim()
    const lines = label0 ? [label0] : []

    const rootRef = useRef(null)
    const stageRef = useRef(null)
    const canvasRef = useRef(null)
    const wakeRef = useRef(() => {})
    const pressRef = useRef(() => {})
    const [size, setSize] = useState({ w: REF_W, h: REF_H })
    const [fallback, setFallback] = useState(false)

    const S = Math.min(size.h, size.w / REF_ASPECT)
    const u = S / REF_H
    const bwRef = Math.max(60, buttonWidth)
    const bhRef = Math.max(24, buttonHeight)
    const rRef = clamp(radius, 0, Math.min(bwRef, bhRef) / 2)
    const bw = bwRef * u
    const bh = bhRef * u
    const m = MARGIN * bh
    const cw = bw + 2 * m
    const ch = bh + 2 * m

    const cfg = { bwRef, bhRef, rRef, fabric, textColor, lines, font, pl, rs, adv, drift }
    const live = useRef({ cfg, key: "", w: size.w, h: size.h })
    const key = JSON.stringify(cfg)
    live.current.cfg = cfg
    live.current.w = size.w
    live.current.h = size.h

    useEffect(() => {
        if (live.current.key !== key) {
            live.current.key = key
            wakeRef.current()
        }
    })

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return

        const state = {
            hov: 0, relT: -1, relFrom: 0, dwell: 0, hovTarget: 0, cx: 0, cy: 0, pvx: 0, pvy: 0,
            press: 0, pressV: 0, pressTarget: 0, inf: 0, infV: 0, acc: 0, shown: 1, shownDirty: true,
            labelKey: "", colorKey: "", fabric: [0, 0, 0], sheen: [0, 0, 0], ink: [0, 0, 0],
            quality: 1, phase: 0, act: 0, idle: false, idleDiv: IDLE_DIVISOR, expectMs: 16.7,
            raiseLocked: false, lastRaiseAt: -1, lost: false,
        }
        const pt = { has: false, x: 0, y: 0, dirty: false, down: false, focus: false, bx: 0, by: 0, lastBx: 0, lastBy: 0 }
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            if (r.width > 0 && r.height > 0) {
                setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }))
                state.shownDirty = true
                wakeRef.current()
            }
        })
        ro.observe(root)

        const glOpts = {
            alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
            powerPreference: "low-power", preserveDrawingBuffer: false,
        }
        let gl = canvas.getContext("webgl2", glOpts)
        if (!gl) {
            setFallback(true)
            return () => ro.disconnect()
        }

        let lattice = null
        let reduced = false
        const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        reduced = !!mq?.matches
        const onMq = () => {
            reduced = !!mq?.matches
            wake()
        }
        mq?.addEventListener?.("change", onMq)

        let prog = null
        let texGrid = null
        let texGrad = null
        let texCloth = null
        let texNoise = null
        let texLabel = null
        let gridDims = ""
        const loc = {}
        const ucache = {}
        let compiled = false
        let parallel = null
        let vs = null
        let fs = null

        const labelCanvas = document.createElement("canvas")

        const build = () => {
            const g = gl
            compiled = false
            parallel = g.getExtension("KHR_parallel_shader_compile")
            vs = g.createShader(g.VERTEX_SHADER)
            fs = g.createShader(g.FRAGMENT_SHADER)
            prog = g.createProgram()
            if (!vs || !fs || !prog) return
            g.shaderSource(vs, VERT)
            g.shaderSource(fs, FRAG)
            g.compileShader(vs)
            g.compileShader(fs)
            g.attachShader(prog, vs)
            g.attachShader(prog, fs)
            g.linkProgram(prog)
            gridDims = ""
            for (const k in ucache) delete ucache[k]

            const mk = (filter, wrap) => {
                const t = g.createTexture()
                g.bindTexture(g.TEXTURE_2D, t)
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, filter)
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, wrap)
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, wrap)
                return t
            }
            texGrid = mk(g.LINEAR, g.CLAMP_TO_EDGE)
            texGrad = mk(g.LINEAR, g.CLAMP_TO_EDGE)
            texCloth = mk(g.LINEAR, g.REPEAT)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, CLOTH_W, CLOTH_H, 0, g.RGBA, g.FLOAT, bakeCloth())
            texNoise = mk(g.LINEAR, g.REPEAT)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, 256, 256, 0, g.RGBA, g.UNSIGNED_BYTE, bakeNoise())
            texLabel = mk(g.LINEAR_MIPMAP_LINEAR, g.CLAMP_TO_EDGE)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4))
            state.labelKey = ""
        }

        const finishCompile = () => {
            const g = gl
            if (compiled) return true
            if (!prog || !vs || !fs) return false
            if (parallel && !g.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) return false
            if (!g.getProgramParameter(prog, g.LINK_STATUS)) {
                console.warn("VelourButton:", g.getShaderInfoLog(fs) || g.getProgramInfoLog(prog))
                return false
            }
            g.useProgram(prog)
            const names = [
                "uCanvas", "uOrigin", "uUpp", "uUcss", "uHalf", "uRad", "uGrid", "uDeform", "uInflate", "uScale", "uPhase", "uActive",
                "uFabric", "uSheenCol", "uInk", "uInkOn", "uLight", "uLook", "uEdge",
                "uGridTex", "uCloth", "uNoise", "uLabel", "uGridGrad",
            ]
            for (const n of names) loc[n] = g.getUniformLocation(prog, n)
            g.uniform1i(loc.uGridTex, 0)
            g.uniform1i(loc.uCloth, 1)
            g.uniform1i(loc.uNoise, 2)
            g.uniform1i(loc.uLabel, 3)
            g.uniform1i(loc.uGridGrad, 4)
            g.disable(g.BLEND)
            compiled = true
            return true
        }

        const setU = (name, a, b, c, d) => {
            const g = gl
            let v = ucache[name]
            if (!v) v = ucache[name] = new Float32Array([NaN, NaN, NaN, NaN])
            const n = d !== undefined ? 4 : c !== undefined ? 3 : b !== undefined ? 2 : 1
            if (v[0] === a && (n < 2 || v[1] === b) && (n < 3 || v[2] === c) && (n < 4 || v[3] === d)) return
            v[0] = a
            if (b !== undefined) v[1] = b
            if (c !== undefined) v[2] = c
            if (d !== undefined) v[3] = d
            const l = loc[name]
            if (n === 1) g.uniform1f(l, a)
            else if (n === 2) g.uniform2f(l, a, b)
            else if (n === 3) g.uniform3f(l, a, b, c)
            else g.uniform4f(l, a, b, c, d)
        }

        build()

        let fontTick = 0
        const onFontReady = () => {
            fontTick++
            wake()
        }
        const onFontsDone = () => onFontReady()
        document.fonts?.addEventListener?.("loadingdone", onFontsDone)

        const drawLabel = (bwPx, bhPx, scale) => {
            const g = gl
            const c = live.current.cfg
            const lk = JSON.stringify([c.lines, c.font, Math.round(bwPx * scale), Math.round(bhPx * scale), fontTick])
            if (lk === state.labelKey) return
            if (!state.labelKey || !state.labelKey.includes(JSON.stringify(c.font ?? null))) ensureFont(c.font, onFontReady)
            state.labelKey = lk
            const W = Math.max(1, Math.min(2048, Math.round(bwPx * scale)))
            const H = Math.max(1, Math.min(1024, Math.round(bhPx * scale)))
            labelCanvas.width = W
            labelCanvas.height = H
            const ctx = labelCanvas.getContext("2d")
            if (!ctx) return
            ctx.clearRect(0, 0, W, H)
            const n = c.lines.length
            if (n) {
                const sizeRef = fontSizeRef(c.font)
                const want = sizeRef !== null ? sizeRef * (H / c.bhRef) : H * TEXT_SIZE
                let fs = Math.min(want, (H * TEXT_MAX_H) / (n * LINE_H))
                ctx.font = fontCss(c.font, fs)
                const ls = c.font?.letterSpacing
                const ctxLs = ctx
                const lsEm = typeof ls === "string" && ls.endsWith("em") ? parseFloat(ls) : typeof ls === "number" ? ls / 16 : 0
                const applyLs = () => {
                    if ("letterSpacing" in ctxLs) ctxLs.letterSpacing = `${(num(lsEm, 0) * fs).toFixed(2)}px`
                }
                applyLs()
                const inkW = (l) => {
                    const mt = ctx.measureText(l)
                    const lft = mt.actualBoundingBoxLeft
                    const rgt = mt.actualBoundingBoxRight
                    return Number.isFinite(lft) && Number.isFinite(rgt) && lft + rgt > 0 ? lft + rgt : mt.width
                }
                let widest = 0
                for (const l of c.lines) widest = Math.max(widest, inkW(l))
                if (widest > W * TEXT_MAX_W) {
                    fs *= (W * TEXT_MAX_W) / widest
                    ctx.font = fontCss(c.font, fs)
                    applyLs()
                }
                const capH = ctx.measureText("H").actualBoundingBoxAscent || fs * 0.72
                const block = capH + (n - 1) * fs * LINE_H
                let y = H / 2 - block / 2 + capH - TEXT_LIFT * H
                ctx.fillStyle = "#fff"
                ctx.textAlign = "left"
                ctx.textBaseline = "alphabetic"
                for (const l of c.lines) {
                    const mt = ctx.measureText(l)
                    const lft = mt.actualBoundingBoxLeft
                    const rgt = mt.actualBoundingBoxRight
                    const x = Number.isFinite(lft) && Number.isFinite(rgt) && lft + rgt > 0 ? W / 2 - (rgt - lft) / 2 : W / 2 - mt.width / 2
                    ctx.fillText(l, x, y)
                    y += fs * LINE_H
                }
            }
            g.activeTexture(g.TEXTURE3)
            g.bindTexture(g.TEXTURE_2D, texLabel)
            g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, labelCanvas)
            g.generateMipmap(g.TEXTURE_2D)
        }

        const onMove = (e) => {
            pt.x = e.clientX
            pt.y = e.clientY
            pt.has = true
            pt.dirty = true
            wake()
        }
        const onLeave = () => {
            pt.has = false
            pt.down = false
            wake()
        }
        const onDown = (e) => {
            onMove(e)
            pt.down = true
        }
        const onUp = (e) => {
            pt.down = false
            if (e.pointerType === "touch") pt.has = false
            wake()
        }
        const onScroll = () => {
            if (pt.has) {
                pt.dirty = true
                wake()
            }
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onLeave)
        root.addEventListener("pointerleave", onLeave)
        window.addEventListener("scroll", onScroll, { passive: true, capture: true })
        const onRootClick = (e) => {
            const hit = root.querySelector("[data-vb-hit]")
            if (!hit || state.hovTarget === 0 || hit.contains(e.target)) return
            hit.click()
        }
        root.addEventListener("click", onRootClick)

        const btn = root.querySelector("[data-vb-hit]")
        const onFocus = () => {
            pt.focus = btn?.matches(":focus-visible") ?? false
            wake()
        }
        const onBlur = () => {
            pt.focus = false
            wake()
        }
        btn?.addEventListener("focus", onFocus)
        btn?.addEventListener("blur", onBlur)
        let pulseUntil = 0
        pressRef.current = () => {
            pulseUntil = performance.now() + 140
            wake()
        }

        let raf = 0
        let running = false
        let visible = true
        let pageVisible = !document.hidden
        let last = 0
        let tickCount = 0
        let drawnFrames = 0
        const gaps = new Float32Array(15)
        let gapN = 0
        const lates = new Float32Array(9)
        let lateN = 0
        let slowFrames = 0
        let fastFrames = 0
        let lastRaf = 0

        function wake() {
            if (running || !visible || !pageVisible || state.lost) return
            running = true
            last = 0
            raf = requestAnimationFrame(tick)
        }
        wakeRef.current = wake

        const io = new IntersectionObserver((es) => {
            visible = es[0].isIntersecting
            if (visible) wake()
        })
        io.observe(root)
        const onVis = () => {
            pageVisible = !document.hidden
            if (pageVisible) wake()
        }
        document.addEventListener("visibilitychange", onVis)

        const onLost = (e) => {
            e.preventDefault()
            state.lost = true
            running = false
            cancelAnimationFrame(raf)
        }
        const onRestored = () => {
            state.lost = false
            gl = canvas.getContext("webgl2", glOpts)
            if (!gl) return
            build()
            wake()
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        const medTmp = new Float32Array(16)

        const median = (a, n) => {
            const k = Math.min(n, a.length)
            const tmp = medTmp
            for (let i = 0; i < k; i++) tmp[i] = a[i]
            for (let i = 1; i < k; i++) {
                const v = tmp[i]
                let j = i - 1
                while (j >= 0 && tmp[j] > v) {
                    tmp[j + 1] = tmp[j]
                    j--
                }
                tmp[j + 1] = v
            }
            return tmp[k >> 1]
        }

        const dampScale = () => (reduced ? 1.4 : Math.exp(-0.13 * (clamp(live.current.cfg.rs.wobble, 0, 10) - 5)))

        const stepLattice = (L) => {
            const c = live.current.cfg
            const bulge = clamp(c.rs.bulge, 0, 10) / 5
            const pressK = clamp(c.rs.press, 0, 10) / 5
            const dragK = reduced ? 0 : (clamp(c.rs.drag, 0, 10) / 5) * 3.8
            const rippleK = reduced ? 0 : clamp(c.rs.ripple, 0, 10) / 5
            const wl = MEM_W
            const memK = wl * wl
            const damp = 2 * wl * dampScale()
            const h = L.spanX / (L.nx - 1)
            const hy = L.spanY / (L.ny - 1)
            const Tx = MEM_T / (h * h)
            const Ty = MEM_T / (hy * hy)
            const Wx = (RIPPLE_SPEED * RIPPLE_SPEED) / (h * h)
            const Wy = (RIPPLE_SPEED * RIPPLE_SPEED) / (hy * hy)
            const inv2s = 1 / (2 * SWELL_SIGMA * SWELL_SIGMA)
            const inv2p = 1 / (2 * PRESS_SIGMA * PRESS_SIGMA)
            const inv2r = 1 / (2 * RIPPLE_SIGMA * RIPPLE_SIGMA)
            const wake = 1 + Math.min(WAKE_MAX, WAKE_GAIN * Math.hypot(state.pvx, state.pvy)) * (clamp(c.rs.drag, 0, 10) / 5)
            const amp = ((1 - DWELL_SHARE) * state.hov * state.hov + DWELL_SHARE * state.dwell) * bulge * wake
            const pr = state.press * pressK
            const { nx, ny, d, v, r, rv, dirX, dirY, gx, gy } = L
            const pvx = clamp(state.pvx, -12, 12)
            const pvy = clamp(state.pvy, -12, 12)
            const dvx = pvx * dragK * state.hov
            const dvy = pvy * dragK * state.hov
            const stir = rippleK * state.hov * Math.min(Math.hypot(pvx, pvy), 8) * RIPPLE_GAIN
            const driven = amp > 1e-5 || pr > 1e-5
            const active = driven || stir > 0 || dvx !== 0 || dvy !== 0
            if (active) {
                for (let i = 0; i < nx; i++) {
                    const t = L.ox + (L.spanX * i) / (nx - 1) - state.cx
                    const t2 = t * t
                    gx[i * 3] = Math.exp(-t2 * inv2s)
                    gx[i * 3 + 1] = Math.exp(-t2 * inv2p)
                    gx[i * 3 + 2] = Math.exp(-t2 * inv2r)
                }
                for (let j = 0; j < ny; j++) {
                    const t = L.oy + (L.spanY * j) / (ny - 1) - state.cy
                    const t2 = t * t
                    gy[j * 3] = Math.exp(-t2 * inv2s)
                    gy[j * 3 + 1] = Math.exp(-t2 * inv2p)
                    gy[j * 3 + 2] = Math.exp(-t2 * inv2r)
                }
            }
            for (let j = 1; j < ny - 1; j++) {
                for (let i = 1; i < nx - 1; i++) {
                    const k = j * nx + i
                    let tx = 0, ty = 0, tz = 0, gs = 0, gr = 0
                    if (active) {
                        gs = gx[i * 3] * gy[j * 3]
                        gr = gx[i * 3 + 2] * gy[j * 3 + 2]
                        if (driven) {
                            const gp = gx[i * 3 + 1] * gy[j * 3 + 1]
                            const out = amp * (SWELL_XY * gs - FAR_SHRINK * (1 - gs)) + pr * gp * 0.04
                            tx = dirX[k] * out
                            ty = dirY[k] * out
                            tz = amp * gs * SWELL_Z - pr * gp * PRESS_Z
                        }
                    }
                    const k3 = k * 3
                    const kl = k3 - 3
                    const kr = k3 + 3
                    const ku = k3 - nx * 3
                    const kd = k3 + nx * 3
                    let di = d[k3]
                    v[k3] += (memK * (tx - di) + Tx * (d[kl] + d[kr] - 2 * di) + Ty * (d[ku] + d[kd] - 2 * di) - damp * v[k3] + dvx * gs) * STEP
                    di = d[k3 + 1]
                    v[k3 + 1] += (memK * (ty - di) + Tx * (d[kl + 1] + d[kr + 1] - 2 * di) + Ty * (d[ku + 1] + d[kd + 1] - 2 * di) - damp * v[k3 + 1] + dvy * gs) * STEP
                    di = d[k3 + 2]
                    v[k3 + 2] += (memK * (tz - di) + Tx * (d[kl + 2] + d[kr + 2] - 2 * di) + Ty * (d[ku + 2] + d[kd + 2] - 2 * di) - damp * v[k3 + 2]) * STEP
                    const ri = r[k]
                    rv[k] += (Wx * (r[k - 1] + r[k + 1] - 2 * ri) + Wy * (r[k - nx] + r[k + nx] - 2 * ri) - RIPPLE_DAMP * rv[k] - 40 * ri + stir * gr) * STEP
                }
            }
            for (let k = 0; k < nx * ny; k++) {
                const k3 = k * 3
                d[k3] += v[k3] * STEP
                d[k3 + 1] += v[k3 + 1] * STEP
                d[k3 + 2] += v[k3 + 2] * STEP
                r[k] += rv[k] * STEP
            }
        }

        const tick = (now) => {
            raf = 0
            if (!running) return
            if (lastRaf) {
                gaps[gapN % gaps.length] = now - lastRaf
                gapN++
            }
            lastRaf = now
            tickCount++
            const period = gapN >= 5 ? median(gaps, gapN) : 16.7
            const every = Math.max(1, Math.floor(16.7 / Math.max(period, 1) + 0.1)) * (state.idle ? state.idleDiv : 1)
            state.expectMs = 16.7 * (state.idle ? state.idleDiv : 1)
            if (tickCount % every !== 0) {
                raf = requestAnimationFrame(tick)
                return
            }
            const mode = frame(now)
            state.idle = mode === 2
            if (mode) raf = requestAnimationFrame(tick)
            else {
                running = false
                lastRaf = 0
                gapN = 0
            }
        }

        const frame = (now) => {
            const g = gl
            if (!g || g.isContextLost()) return 0
            if (!finishCompile()) return 1
            const L0 = live.current
            const c = L0.cfg
            const W = L0.w
            const H = L0.h
            const Su = Math.min(H, W / REF_ASPECT)
            const uu = Su / REF_H
            const bhPx = c.bhRef * uu
            const bwPx = c.bwRef * uu
            const hw = c.bwRef / c.bhRef / 2
            const rr = c.rRef / c.bhRef
            const mPx = MARGIN * bhPx
            const cssW = bwPx + 2 * mPx
            const cssH = bhPx + 2 * mPx

            const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60
            last = now

            if (state.shownDirty || drawnFrames % 30 === 0) {
                state.shownDirty = false
                const r = root.getBoundingClientRect()
                state.shown = W > 0 ? r.width / W : 1
            }

            const pl0 = c.pl
            const P = PERSPECTIVE * uu
            if (pt.has && pt.dirty) {
                pt.dirty = false
                const r = root.getBoundingClientRect()
                if (r.width > 0 && r.height > 0) {
                    const lx = ((pt.x - r.left) / r.width) * W
                    const ly = ((pt.y - r.top) / r.height) * H
                    const X = lx - (W / 2 + (pl0.x / 100) * W)
                    const Y = ly - (H / 2 + (pl0.y / 100) * H)
                    const t = (clamp(pl0.tilt, -89, 89) * Math.PI) / 180
                    const ct = Math.cos(t)
                    const st = Math.sin(t)
                    const yr = Y / Math.max(1e-3, ct + (Y * st) / P)
                    const xr = X * (1 - (yr * st) / P)
                    const a = (pl0.angle * Math.PI) / 180
                    const ca = Math.cos(a)
                    const sa = Math.sin(a)
                    pt.bx = (xr * ca + yr * sa) / bhPx
                    pt.by = (-xr * sa + yr * ca) / bhPx
                }
            }
            const inside = (x, y) => {
                const qx = Math.abs(x) - hw + rr
                const qy = Math.abs(y) - 0.5 + rr
                return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - rr
            }
            const reach = clamp(c.rs.reach, 0, 10) * 0.03
            let target = 0
            let tx = state.cx, ty = state.cy
            if (pt.has) {
                const sdp = inside(...clothPoint(pt.bx, pt.by))
                target = sdp <= reach + (state.hovTarget > 0 ? HOVER_HYST : 0) ? 1 : 0
                tx = pt.bx
                ty = pt.by
            } else if (pt.focus) {
                target = 1
                tx = 0
                ty = 0
            }
            state.hovTarget = target
            const pressing = (pt.down && pt.has && target > 0) || now < pulseUntil
            const wantCursor = target > 0 && pt.has ? "pointer" : ""
            if (root.style.cursor !== wantCursor) root.style.cursor = wantCursor
            state.pressTarget = pressing ? 1 : 0

            state.acc = Math.min(state.acc + dt, 0.1)
            while (state.acc >= STEP) {
                state.acc -= STEP
                if (state.hovTarget > state.hov) {
                    state.hov += (state.hovTarget - state.hov) * (1 - Math.exp(-STEP / 0.05))
                    state.relT = -1
                } else if (state.hov > 0) {
                    if (state.relT < 0) {
                        state.relT = 0
                        state.relFrom = state.hov
                    }
                    state.relT += STEP
                    const u = Math.min(1, state.relT / Math.max(0.05, c.rs.release))
                    state.hov = state.relFrom * (1 - u * u * (3 - 2 * u))
                }
                if (state.hovTarget > 0) state.dwell += (state.hov - state.dwell) * (1 - Math.exp(-STEP / DWELL_TAU))
                state.dwell = Math.min(state.dwell, state.hov)
                const kc = 1 - Math.exp(-STEP / 0.05)
                const ncx = state.cx + (tx - state.cx) * kc
                const ncy = state.cy + (ty - state.cy) * kc
                const kv = 1 - Math.exp(-STEP / 0.06)
                state.pvx += ((ncx - state.cx) / STEP - state.pvx) * kv
                state.pvy += ((ncy - state.cy) / STEP - state.pvy) * kv
                state.cx = ncx
                state.cy = ncy
                const wp = 2 * Math.PI * (state.pressTarget > state.press ? 6 : 3.2)
                const zp = Math.min(1, 0.55 * dampScale())
                state.pressV += (wp * wp * (state.pressTarget - state.press) - 2 * zp * wp * state.pressV) * STEP
                state.press += state.pressV * STEP
                const puff = clamp(c.rs.puff, 0, 10) / 5
                const it = ((1 - DWELL_SHARE) * state.hov + DWELL_SHARE * state.dwell) * puff - state.press * 0.35 * (clamp(c.rs.press, 0, 10) / 5)
                const wi = INF_W
                state.infV += (wi * wi * (it - state.inf) - 2 * wi * dampScale() * state.infV) * STEP
                state.inf += state.infV * STEP
                const act = Math.min(1, Math.max(state.hov, Math.abs(state.inf)))
                state.act = act
                const crawl = reduced ? 0 : (clamp(c.drift, 0, 10) / 5) * (CRAWL_REST + CRAWL_ACTIVE * act)
                state.phase = (state.phase + crawl * STEP) % CRAWL_CYCLE
                if (lattice) stepLattice(lattice)
            }

            const lk = `${hw.toFixed(4)}|${rr.toFixed(4)}`
            if (!lattice || lattice.key !== lk) {
                lattice = makeLattice(hw, rr)
                lattice.key = lk
            }
            const L = lattice

            const tolD = 0.25 / Math.max(bhPx, 1)
            const tolV = 0.5 / Math.max(bhPx, 1)
            let maxV = 0, maxD = 0, maxXY = 0
            const n = L.nx * L.ny
            for (let k = 0; k < n * 3; k++) {
                const a = Math.abs(L.v[k])
                if (a > maxV) maxV = a
                const b = Math.abs(L.d[k])
                if (b > maxD) maxD = b
                if (k % 3 !== 2 && b > maxXY) maxXY = b
            }
            let maxR = 0
            for (let k = 0; k < n; k++) {
                const a = Math.abs(L.rv[k]) * 0.05
                if (a > maxV) maxV = a
                const b = Math.abs(L.r[k])
                if (b > maxR) maxR = b
            }
            const springsQuiet =
                Math.abs(state.hov - state.hovTarget) < 1e-3 &&
                Math.abs(state.press - state.pressTarget) < 2e-3 &&
                Math.abs(state.pressV) < 0.01 &&
                Math.abs(state.infV) < 0.01 &&
                Math.abs(state.pvx) + Math.abs(state.pvy) < 0.01
            const latticeQuiet = maxV < tolV
            let settled = springsQuiet && latticeQuiet
            if (settled && state.hovTarget === 0 && state.pressTarget === 0) {
                if (maxD < tolD * 4 && maxR < tolD && Math.abs(state.inf) < 0.004) {
                    L.d.fill(0)
                    L.v.fill(0)
                    L.r.fill(0)
                    L.rv.fill(0)
                    maxR = 0
                    maxD = 0
                    maxXY = 0
                    state.inf = 0
                    state.infV = 0
                    state.press = 0
                    state.pressV = 0
                    state.hov = 0
                } else settled = false
            }
            const deformed = maxD > 1e-6 || maxR > 1e-6

            const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
            const shown = clamp(state.shown, 1, 2)
            let scale = Math.min(MAX_DPR, dpr * shown) * state.quality
            const cap = Math.sqrt(PIXEL_CAP / Math.max(1, cssW * cssH))
            scale = Math.max(1, Math.min(scale, cap))
            const pw = Math.max(1, Math.round(cssW * scale))
            const ph = Math.max(1, Math.round(cssH * scale))
            if (canvas.width !== pw || canvas.height !== ph) {
                canvas.width = pw
                canvas.height = ph
            }
            g.viewport(0, 0, pw, ph)

            const ck = `${c.fabric}|${c.textColor}`
            if (ck !== state.colorKey) {
                state.colorKey = ck
                const f = resolveRGB(root, c.fabric).map(srgbToLin)
                const t = resolveRGB(root, c.textColor).map(srgbToLin)
                state.fabric = f
                state.ink = t
                const mx = Math.max(f[0], f[1], f[2], 1e-4)
                state.sheen = f.map((v) => (v / mx) * 0.95 + 0.008)
            }

            drawLabel(bwPx, bhPx, Math.min(3, scale * 1.25))

            const Lt = L.tex
            const Lg = L.grad
            const hx = L.spanX / (L.nx - 1)
            const hy = L.spanY / (L.ny - 1)
            const D3 = L.d
            const R1 = L.r
            for (let j = 0; j < L.ny; j++) {
                for (let i = 0; i < L.nx; i++) {
                    const k = j * L.nx + i
                    const il = i > 0 ? k - 1 : k
                    const ir = i < L.nx - 1 ? k + 1 : k
                    const ju = j > 0 ? k - L.nx : k
                    const jd = j < L.ny - 1 ? k + L.nx : k
                    const sx = 1 / (hx * (ir - il || 1))
                    const sy = 1 / (hy * ((jd - ju) / L.nx || 1))
                    const exx = (D3[ir * 3] - D3[il * 3]) * sx
                    const eyy = (D3[jd * 3 + 1] - D3[ju * 3 + 1]) * sy
                    const exy = 0.5 * ((D3[jd * 3] - D3[ju * 3]) * sy + (D3[ir * 3 + 1] - D3[jl * 3 + 1]) * sx)
                    const dz = D3[k * 3 + 2]
                    Lt[k * 4] = D3[k * 3]
                    Lt[k * 4 + 1] = D3[k * 3 + 1]
                    Lt[k * 4 + 2] = dz
                    Lt[k * 4 + 3] = Math.min(1, 2.6 * Math.sqrt(exx * exx + eyy * eyy + 2 * exy * exy) + 2.2 * Math.abs(dz))
                    Lg[k * 2] = (D3[ir * 3 + 2] - D3[il * 3 + 2] + R1[ir] - R1[il]) * sx
                    Lg[k * 2 + 1] = (D3[jd * 3 + 2] - D3[ju * 3 + 2] + R1[jd] - R1[ju]) * sy
                }
            }
            g.activeTexture(g.TEXTURE0)
            g.bindTexture(g.TEXTURE_2D, texGrid)
            const gd = `${L.nx}x${L.ny}`
            if (gd !== gridDims) {
                gridDims = gd
                g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, L.nx, L.ny, 0, g.RGBA, g.FLOAT, Lt)
                g.activeTexture(g.TEXTURE4)
                g.bindTexture(g.TEXTURE_2D, texGrad)
                g.texImage2D(g.TEXTURE_2D, 0, g.RG16F, L.nx, L.ny, 0, g.RG, g.FLOAT, Lg)
            } else if (deformed || !settled) {
                g.texSubImage2D(g.TEXTURE_2D, 0, 0, L.nx, L.ny, g.RGBA, g.FLOAT, Lt)
                g.activeTexture(g.TEXTURE4)
                g.bindTexture(g.TEXTURE_2D, texGrad)
                g.texSubImage2D(g.TEXTURE_2D, 0, 0, L.nx, L.ny, g.RG, g.FLOAT, Lg)
            }
            g.activeTexture(g.TEXTURE4)
            g.bindTexture(g.TEXTURE_2D, texGrad)
            g.activeTexture(g.TEXTURE1)
            g.bindTexture(g.TEXTURE_2D, texCloth)
            g.activeTexture(g.TEXTURE2)
            g.bindTexture(g.TEXTURE_2D, texNoise)
            g.activeTexture(g.TEXTURE3)
            g.bindTexture(g.TEXTURE_2D, texLabel)

            const a = c.adv
            const upp = 1 / (bhPx * scale)
            setU("uCanvas", pw, ph)
            setU("uOrigin", -cssW / 2 / bhPx, -cssH / 2 / bhPx)
            setU("uUpp", upp)
            setU("uUcss", 1 / bhPx)
            setU("uHalf", hw, 0.5)
            setU("uRad", rr)
            setU("uGrid", L.ox, L.oy, L.spanX, L.spanY)
            setU("uDeform", deformed ? Math.max(maxXY * 1.42, 1e-5) : 0)
            setU("uInflate", REST_PUFF + Math.max(-0.5, state.inf))
            setU("uPhase", state.phase)
            setU("uActive", state.act)
            setU("uScale", 1 + HOVER_GROW * state.inf - PRESS_SQUASH * Math.max(0, state.press) * (clamp(c.rs.press, 0, 10) / 5))
            setU("uFabric", state.fabric[0], state.fabric[1], state.fabric[2])
            setU("uSheenCol", state.sheen[0], state.sheen[1], state.sheen[2])
            setU("uInk", state.ink[0], state.ink[1], state.ink[2])
            setU("uInkOn", c.lines.length ? 1 : 0)
            const la = ((a.lightAngle - pl0.angle) * Math.PI) / 180
            const le = (clamp(a.lightHeight, 1, 89) * Math.PI) / 180
            setU("uLight", Math.sin(la) * Math.cos(le), -Math.cos(la) * Math.cos(le), Math.sin(le))
            setU("uLook", a.nap / 100, a.pile / 100, a.wrinkles / 100, a.sheen / 100)
            setU("uEdge", Math.max(0, a.fuzz), (Math.max(0, a.hem) / 100) * (1 + 0.15 * Math.max(0, state.inf)), a.shadow / 100, a.glow / 100)

            g.drawArrays(g.TRIANGLES, 0, 3)
            drawnFrames++

            const creeping = settled && !reduced && c.drift > 0 && state.act <= 0.05
            lates[lateN % lates.length] = (dt * 1000) / Math.max(8, state.expectMs)
            lateN++
            if (lateN > 30 && (!settled || creeping)) {
                const med = median(lates, lateN)
                if (creeping && med > 1.4 && state.idleDiv < IDLE_DIVISOR_MAX) {
                    state.idleDiv++
                    lateN = 0
                } else if (med > (creeping ? 1.1 : 1.55)) {
                    slowFrames++
                    fastFrames = 0
                    if (slowFrames > 20 && state.quality > QUALITY_FLOOR) {
                        state.quality = Math.max(QUALITY_FLOOR, state.quality * 0.85)
                        slowFrames = 0
                        if (drawnFrames - state.lastRaiseAt < 120) state.raiseLocked = true
                    }
                } else if (med < 1.14) {
                    fastFrames++
                    slowFrames = 0
                    if (fastFrames > 120 && state.quality < 1 && !state.raiseLocked) {
                        state.quality = Math.min(1, state.quality / 0.85)
                        state.lastRaiseAt = drawnFrames
                        fastFrames = 0
                    }
                }
            }
            if (!settled) return 1
            if (reduced || c.drift <= 0) return 0
            return state.act > 0.05 ? 1 : 2
        }

        wake()

        return () => {
            running = false
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            mq?.removeEventListener?.("change", onMq)
            document.removeEventListener("visibilitychange", onVis)
            document.fonts?.removeEventListener?.("loadingdone", onFontsDone)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onLeave)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("click", onRootClick)
            window.removeEventListener("scroll, onScroll, { capture: true })
            btn?.removeEventListener("focus", onFocus)
            btn?.removeEventListener("blur", onBlur)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            wakeRef.current = () => {}
            const g = gl
            if (g && !g.isContextLost()) {
                g.deleteTexture(texGrid)
                g.deleteTexture(texGrad)
                g.deleteTexture(texCloth)
                g.deleteTexture(texNoise)
                g.deleteTexture(texLabel)
                g.deleteProgram(prog)
                g.deleteShader(vs)
                g.deleteShader(fs)
            }
        }
    }, [])

    const W = size.w
    const H = size.h
    const p = pl
    const stageTransform = `translate(${((p.x / 100) * W).toFixed(2)}px, ${((p.y / 100) * H).toFixed(2)}px) perspective(${(PERSPECTIVE * u).toFixed(1)}px) rotateX(${clamp(p.tilt, -89, 89)}deg) rotate(${p.angle}deg)`
    const label = lines.join(" ") || "Button"
    const hitStyle = {
        position: "absolute",
        left: m,
        top: m,
        width: bw,
        height: bh,
        borderRadius: rRef * u,
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        outlineOffset: 4,
        WebkitTapHighlightColor: "transparent",
        display: "block",
        ...(fallback ? {
            background: fabric,
            color: textColor,
            font: fontCss(font, fontSizeRef(font) !== null ? fontSizeRef(font)! * u : bh * TEXT_SIZE),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
        } : null),
    }
    const press = () => {
        pressRef.current()
        onClick?.()
    }
    const href = link.trim()
    const ext = href ? isExternal(href) : false

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                aspectRatio: `${REF_W} / ${REF_H}`,
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                ...style,
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: cw,
                    height: ch,
                    marginLeft: -cw / 2,
                    marginTop: -ch / 2,
                    transform: stageTransform,
                    pointerEvents: "none",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: fallback ? "none" : "block" }}
                />
                {href ? (
                    <a
                        data-vb-hit=""
                        href={href}
                        target={ext ? "_blank" : undefined}
                        rel={ext ? "noopener noreferrer" : undefined}
                        aria-label={label}
                        onClick={press}
                        style={{ ...hitStyle, pointerEvents: "auto" }}
                    >
                        {fallback ? label : null}
                    </a>
                ) : (
                    <button data-vb-hit="" type="button" aria-label={label} onClick={press} style={{ ...hitStyle, pointerEvents: "auto" }}>
                        {fallback ? label : null}
                    </button>
                )}
            </div>
        </div>
    )
}
