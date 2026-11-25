/**
 * SkSL for neiro's living wash + glass lens, drawn as one full-screen pass.
 *
 *  - wash: a slow domain-warped fbm flowing between three tones of the noise colour (deep → base → light).
 *    Tones are contrast-limited on the CPU (colours.ts), so legibility holds at every frame.
 *  - reveal: on colour change the new wash expands from the tapped dot over the old one (no crossfade).
 *  - lens: the dial's glass is *computed from the wash itself* — we know the background analytically, so the
 *    lens samples it with a radial refraction offset (magnified centre, bent rim) and a slight chromatic split,
 *    then adds a tilt-driven specular and a soft contact shadow. Real refraction, no backdrop snapshot needed.
 */
export const WASH_SKSL = `
uniform float2 uRes;
uniform float  uPhase;
uniform float  uBreath;
uniform float  uDim;

uniform float3 uBase;
uniform float3 uDeep;
uniform float3 uLight;
uniform float3 uPBase;
uniform float3 uPDeep;
uniform float3 uPLight;

uniform float2 uOrigin;
uniform float  uReveal;
uniform float  uMaxD;

uniform float2 uLens;
uniform float  uLensR;
uniform float  uLensOn;
uniform float2 uTilt;

float hash21(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + float2(1.0, 0.0));
  float c = hash21(i + float2(0.0, 1.0));
  float d = hash21(i + float2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + float2(17.3, 9.1);
    a *= 0.5;
  }
  return v;
}

float3 wash(float2 xy, float3 base, float3 deep, float3 light) {
  float2 uv = xy / uRes;
  float2 p = uv * float2(uRes.x / uRes.y, 1.0) * 1.5;
  float t = uPhase;
  float2 q = float2(fbm(p + float2(0.0, t * 0.09)), fbm(p + float2(5.2, 1.3) - t * 0.07));
  float n = fbm(p + 1.7 * q + float2(t * 0.06, -t * 0.04));
  // fbm clusters around 0.5; stretch it so the wash actually visits its deep and light tones
  n = clamp((n - 0.5) * 2.7 + 0.5, 0.0, 1.0);
  float k = smoothstep(0.06, 0.94, n);
  float3 c = mix(deep, base, smoothstep(0.0, 0.6, k));
  c = mix(c, light, smoothstep(0.5, 1.0, k) * (0.6 + 0.4 * uBreath));
  float2 g = uv - float2(0.12, 0.04);
  c = mix(c, light, 0.35 * exp(-dot(g, g) * 3.2));
  return c;
}

float3 washAt(float2 xy) {
  float3 cur = wash(xy, uBase, uDeep, uLight);
  if (uReveal < 1.0) {
    float rad = uReveal * uMaxD;
    float m = 1.0 - smoothstep(rad - 90.0, rad, length(xy - uOrigin));
    cur = mix(wash(xy, uPBase, uPDeep, uPLight), cur, m);
  }
  return cur;
}

half4 main(float2 xy) {
  float3 col = washAt(xy);

  if (uLensOn > 0.5) {
    float2 d = xy - uLens;
    float r = length(d);
    float R = uLensR;

    // contact shadow, offset away from the light
    float2 sd = xy - (uLens + float2(0.0, 0.07 * R));
    float shadow = exp(-pow(max(length(sd) - R * 0.85, 0.0) / (R * 0.22), 2.0)) * 0.16;
    col *= 1.0 - shadow * smoothstep(R - 2.0, R + 6.0, r);

    if (r < R) {
      float nr = r / R;
      float2 dir = d / max(r, 0.001);
      float bend = nr * nr * nr;
      // magnify the centre a little, pull the rim inward: a convex lens
      float2 off = dir * (-bend * R * 0.20 + (1.0 - nr) * R * 0.03);
      float3 refr;
      refr.r = washAt(xy + off * 0.94).r;
      refr.g = washAt(xy + off * 1.00).g;
      refr.b = washAt(xy + off * 1.07).b;

      // lens body: a touch lighter and clearer than the wash behind it
      float3 body = mix(refr, uLight, 0.10 + 0.10 * (1.0 - nr));

      // fresnel rim + tilt-driven specular
      float rim = smoothstep(0.80, 1.0, nr);
      float3 nrm = normalize(float3(d / R, sqrt(max(1.0 - nr * nr, 0.0)) + 0.35));
      float3 ld = normalize(float3(-0.45 - uTilt.x * 0.6, -0.55 - uTilt.y * 0.6, 0.7));
      float spec = pow(max(dot(nrm, ld), 0.0), 26.0);
      float sheen = pow(max(dot(nrm, ld), 0.0), 4.0);
      body += float3(1.0) * (spec * 0.45 + sheen * 0.07 + rim * 0.16);
      body = mix(body, body * 0.88, smoothstep(0.55, 1.0, nr) * 0.35); // inner edge falloff

      float edge = 1.0 - smoothstep(R - 1.5, R, r);
      col = mix(col, body, edge);
    }
  }

  col *= 1.0 - 0.9 * uDim;
  return half4(half3(col), 1.0);
}
`;
