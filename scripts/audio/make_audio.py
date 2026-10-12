#!/usr/bin/env python3
"""
Brewmaster's Tavern - geluidseffecten en muziekloop, volledig met code gesynthetiseerd (numpy + ffmpeg).

    python audio/make_audio.py            # maakt audio/*.ogg
    python audio/review_audio.py          # meet alles en schrijft REVIEW.md + ASSETS.md

Opbouw (de "agents" zijn secties in dit bestand):
  Coordinator : SPEC (ids, lengtes, doelluidheid), DSP-hulpfuncties, mastering, WAV -> OGG, main().
  Agent A     : taverne  - plop, bubble, coin, buzz, buy
  Agent B     : feest    - eureka, fanfare
  Agent C     : helden   - horn, hit, miss
  Agent D     : muziek   - music_tavern (naadloze loop)
Alle geluiden zijn zelf gemaakt (geen samples). Seeds liggen vast, dus twee runs geven dezelfde bestanden.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100

# ----------------------------------------------------------------------------------------------------------------
# Coordinator: specificatie
# ----------------------------------------------------------------------------------------------------------------
# id -> (min lengte s, max lengte s, doel-luidheid LUFS). Muziek: lengte 60-120 s, rustiger dan de effecten.
SPEC: dict[str, tuple[float, float, float]] = {
    "plop": (0.10, 0.20, -16.0),
    "bubble": (0.20, 0.40, -16.0),
    "coin": (0.15, 0.30, -19.0),  # komt honderden keren voorbij: 3 LU zachter
    "buzz": (0.20, 0.30, -16.0),
    "buy": (0.20, 0.40, -16.0),
    "eureka": (0.50, 0.80, -16.0),
    "fanfare": (0.80, 1.20, -16.0),
    "horn": (0.40, 0.70, -16.0),
    "hit": (0.15, 0.30, -16.0),
    "miss": (0.20, 0.30, -16.0),
    "music_tavern": (60.0, 120.0, -20.0),
}
EFFECT_IDS = [k for k in SPEC if k != "music_tavern"]
PEAK_CEIL_DB = -2.0  # voor het coderen; Vorbis kan ~0,5 dB overschieten, de eis is -1 dBFS na decoderen
MUSIC_KBPS = 96


# ----------------------------------------------------------------------------------------------------------------
# Coordinator: DSP-hulpfuncties
# ----------------------------------------------------------------------------------------------------------------
def nsamp(sec: float) -> int:
    return int(round(sec * SR))


def tt(n: int) -> np.ndarray:
    return np.arange(n) / SR


def rng_for(name: str) -> np.random.Generator:
    return np.random.default_rng(sum(ord(c) * (i + 1) for i, c in enumerate(name)))


def fft_band(x: np.ndarray, lo: float | None = None, hi: float | None = None, order: int = 4) -> np.ndarray:
    """Zero-phase band-pass/high-pass/low-pass met een Butterworth-achtig magnitude-masker."""
    n = len(x)
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1e-3
    mask = np.ones_like(f)
    if lo:
        mask *= 1 / np.sqrt(1 + (lo / f) ** (2 * order))
    if hi:
        mask *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(spec * mask, n)


def band_noise(n: int, lo: float | None, hi: float | None, rng: np.random.Generator) -> np.ndarray:
    y = fft_band(rng.standard_normal(n), lo, hi)
    return y / (np.max(np.abs(y)) + 1e-12)


def phase_of(freq: np.ndarray) -> np.ndarray:
    return 2 * np.pi * np.cumsum(freq) / SR


def attack(t: np.ndarray, sec: float) -> np.ndarray:
    return 1 - np.exp(-t / (sec / 3))


def put(buf: np.ndarray, sig: np.ndarray, t0: float, gain: float = 1.0) -> None:
    """Tel sig bij buf op vanaf tijd t0; buiten het einde wordt afgekapt."""
    i = max(0, nsamp(t0))
    m = min(len(sig), len(buf) - i)
    if m > 0:
        buf[i : i + m] += sig[:m] * gain


def bell(freq: float, dur: float, ratios, amps, decays, att: float = 0.0015) -> np.ndarray:
    """Metaalachtige klank: som van (on)harmonische deeltonen met elk een eigen uitsterftijd."""
    n = nsamp(dur)
    t = tt(n)
    x = np.zeros(n)
    for r, a, d in zip(ratios, amps, decays):
        if freq * r < 14000:
            x += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / d)
    return x * attack(t, att)


BELL_R = (1.0, 2.756, 5.404, 8.93)  # klokachtige deeltonen
SPARK_R = (1.0, 2.0, 3.0)  # zachte, glockenspiel-achtige deeltonen


def brass(freq, dur, rel=0.06, att=0.010, bright_tau=0.045, rolloff=1.0, nh=14,
          vib=0.0, scoop=0.0, detune=(1.0,)) -> np.ndarray:
    """Koper/hoorn: zaagtand-achtig, hogere deeltonen komen er na het begin bij (de 'blaas')."""
    n = nsamp(dur + rel)
    t = tt(n)
    out = np.zeros(n)
    vib_env = np.clip((t - 0.12) / 0.2, 0, 1)
    bright = 1 - np.exp(-t / bright_tau)
    for dt in detune:
        f = freq * dt * (1 + vib * vib_env * np.sin(2 * np.pi * 5.6 * t)) * 2 ** (-scoop * np.exp(-t / 0.035) / 12)
        ph = phase_of(f)
        for h in range(1, nh + 1):
            if freq * h > 9000:
                break
            amp = h ** -rolloff * (0.25 + 0.75 * bright) ** (0.6 * (h - 1))
            out += amp * np.sin(h * ph)
    env = attack(t, att)
    r0 = nsamp(dur)
    env[r0:] *= 0.5 * (1 + np.cos(np.pi * np.linspace(0, 1, n - r0)))
    return out / len(detune) * env


def finish_fx(x: np.ndarray, fade_out: float = 0.015, fade_in: float = 0.0006) -> np.ndarray:
    """Geen klik aan het begin, korte uitfade aan het einde."""
    x = x.copy()
    a, b = nsamp(fade_in), nsamp(fade_out)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= 0.5 * (1 + np.cos(np.pi * np.linspace(0, 1, b)))
    return x


# --- luidheid (ITU-R BS.1770 K-weighting, ongepoort: gemiddelde over het hele bestand) -------------------------
def _k_response(n_fft: int) -> np.ndarray:
    w = 2 * np.pi * np.fft.rfftfreq(n_fft, 1 / SR) / SR
    z1, z2 = np.exp(-1j * w), np.exp(-2j * w)

    k = np.tan(np.pi * 1681.974450955533 / SR)
    q, vh = 0.7071752369554196, 10 ** (3.999843853973347 / 20)
    vb = vh ** 0.4996667741545416
    a0 = 1 + k / q + k * k
    b = ((vh + vb * k / q + k * k) / a0, 2 * (k * k - vh) / a0, (vh - vb * k / q + k * k) / a0)
    a = (1, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0)
    h1 = (b[0] + b[1] * z1 + b[2] * z2) / (a[0] + a[1] * z1 + a[2] * z2)

    k = np.tan(np.pi * 38.13547087602444 / SR)
    q = 0.5003270373238773
    d = 1 + k / q + k * k
    a = (1, 2 * (k * k - 1) / d, (1 - k / q + k * k) / d)
    h2 = (1 - 2 * z1 + z2) / (a[0] + a[1] * z1 + a[2] * z2)
    return h1 * h2


def lufs(x: np.ndarray) -> float:
    """Ongepoorte K-gewogen luidheid (LUFS) van mono (n,) of meerkanaals (ch, n) audio."""
    chans = x[None, :] if x.ndim == 1 else x
    total = 0.0
    for c in chans:
        n = len(c) + SR  # ruimte voor de staart van het filter
        y = np.fft.irfft(np.fft.rfft(c, n) * _k_response(n), n)[: len(c)]
        total += float(np.mean(y * y))
    return -0.691 + 10 * np.log10(total + 1e-20)


def softclip(y: np.ndarray, ceil: float) -> np.ndarray:
    th = 0.7 * ceil
    a = np.abs(y)
    over = a > th
    out = y.copy()
    out[over] = np.sign(y[over]) * (th + (ceil - th) * np.tanh((a[over] - th) / (ceil - th)))
    return out


def master(x: np.ndarray, target_lufs: float, ceil_db: float = PEAK_CEIL_DB) -> np.ndarray:
    """Breng naar de doel-luidheid; raakt de piek-limiet eerder, dan wordt zacht begrensd (max. +3 dB boven de piek-limiet)."""
    ceil = 10 ** (ceil_db / 20)
    g_target = 10 ** ((target_lufs - lufs(x)) / 20)
    g_peak = ceil / np.max(np.abs(x))
    if g_target <= g_peak:
        return x * g_target
    return softclip(x * min(g_target, g_peak * 1.41), ceil)


# ----------------------------------------------------------------------------------------------------------------
# Agent A: taverne - plop, bubble, coin, buzz, buy
# ----------------------------------------------------------------------------------------------------------------
def bubble_voice(n, f0, f1, rise, decay):
    """Een luchtbel in vloeistof: toon die snel omhoog glijdt en uitsterft."""
    t = tt(n)
    ph = phase_of(f0 + (f1 - f0) * (1 - np.exp(-t / rise)))
    env = attack(t, 0.0025) * np.exp(-t / decay)
    return (np.sin(ph) + 0.22 * np.sin(2 * ph) * env) * env


def make_plop():
    rng = rng_for("plop")
    n = nsamp(0.16)
    t = tt(n)
    splash = band_noise(n, 600, 3500, rng) * np.exp(-t / 0.004) * 0.22
    return finish_fx(bubble_voice(n, 330, 850, 0.022, 0.033) + splash, 0.02)


def make_bubble():
    rng = rng_for("bubble")
    n = nsamp(0.36)
    x = np.zeros(n)
    put(x, bubble_voice(nsamp(0.2), 300, 760, 0.025, 0.05), 0.0, 1.0)
    put(x, bubble_voice(nsamp(0.2), 400, 1000, 0.025, 0.06), 0.13, 0.85)
    t = tt(n)
    burble = band_noise(n, 150, 900, rng) * (0.5 + 0.5 * np.sin(2 * np.pi * 34 * t)) * np.sin(np.pi * t / t[-1]) ** 2
    return finish_fx(x + burble * 0.16, 0.05)


def make_coin():
    x = np.zeros(nsamp(0.26))
    amps, dec = (1.0, 0.30, 0.10), (0.11, 0.05, 0.025)
    put(x, bell(1319, 0.2, BELL_R[:3], amps, dec), 0.0, 0.85)
    put(x, bell(1760, 0.2, BELL_R[:3], amps, dec), 0.065, 1.0)
    return finish_fx(x, 0.03)


def make_buzz():
    """Grappig 'uh-oh'-gezoem: twee dalende, zachte zaagtand-tonen (deeltonen tot ~1,8 kHz)."""
    x = np.zeros(nsamp(0.26))

    def seg(f_a, f_b, dur):
        n = nsamp(dur)
        t = tt(n)
        f = f_a + (f_b - f_a) * (t / dur) ** 0.8
        f = f * (1 + 0.012 * np.sin(2 * np.pi * 30 * t))  # klein gegrom
        ph = phase_of(f)
        y = sum(np.sin(h * ph) / h ** 1.25 for h in range(1, 12) if h * f_a < 1800)
        env = attack(t, 0.003) * np.clip((dur - t) / 0.03, 0, 1)
        return y * env

    put(x, seg(215, 190, 0.1), 0.0)
    put(x, seg(165, 105, 0.13), 0.115, 0.95)
    return finish_fx(x, 0.02)


def make_buy():
    rng = rng_for("buy")
    n = nsamp(0.36)
    x = np.zeros(n)
    t = tt(n)
    kick = band_noise(n, 300, 2500, rng) * np.exp(-t / 0.006) * 0.35  # 'ka'
    thunk = np.sin(phase_of(180 - 90 * np.minimum(t / 0.03, 1))) * np.exp(-t / 0.025) * 0.5
    amps, dec = (1.0, 0.35, 0.12, 0.05), (0.16, 0.08, 0.04, 0.02)
    put(x, bell(2093, 0.3, BELL_R, amps, dec), 0.004, 0.75)  # 'tsjing'
    put(x, bell(2637, 0.28, BELL_R, amps, dec), 0.06, 0.6)
    return finish_fx(x + kick + thunk, 0.04)


# ----------------------------------------------------------------------------------------------------------------
# Agent B: feest - eureka, fanfare
# ----------------------------------------------------------------------------------------------------------------
def make_eureka():
    rng = rng_for("eureka")
    n = nsamp(0.78)
    x = np.zeros(n)
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0]
    for i, f in enumerate(notes):
        last = i == len(notes) - 1
        amp = 0.7 + 0.06 * i
        put(x, bell(f, 0.45 if last else 0.22, SPARK_R + (4.0,), (1, 0.35, 0.12, 0.05),
                    (0.30 if last else 0.14, 0.12, 0.06, 0.03)), 0.07 * i, amp)
    # sprankel: kleine hoge glinsteringen
    for k in range(9):
        f = rng.uniform(3000, 6200)
        put(x, bell(f, 0.06, (1.0,), (1.0,), (0.018,)), 0.12 + 0.055 * k + rng.uniform(0, 0.02), 0.12)
    echo = np.zeros(n)
    put(echo, x, 0.085, 0.28)
    return finish_fx(x + echo, 0.09)


def make_fanfare():
    rng = rng_for("fanfare")
    n = nsamp(1.06)
    x = np.zeros(n)
    det = (0.9985, 1.0015)  # twee stemmen = 'ensemble'
    # ta - ta - ta - TAAA  (G4 C5 E5, dan C-majeurakkoord)
    for i, (f, d) in enumerate([(392.0, 0.12), (523.25, 0.12), (659.25, 0.12)]):
        put(x, brass(f, d, rel=0.04, detune=det), 0.14 * i, 0.8)
    for f, g in [(523.25, 0.7), (659.25, 0.55), (784.0, 0.65), (1046.5, 0.4), (261.63, 0.5)]:
        put(x, brass(f, 0.5, rel=0.12, vib=0.004, detune=det), 0.43, g)
    t = tt(n)
    cymbal = band_noise(n, 5000, 12000, rng) * np.exp(-t / 0.25)
    cym = np.zeros(n)
    put(cym, cymbal[: nsamp(0.7)], 0.43, 0.09)
    return finish_fx(x + cym, 0.12)


# ----------------------------------------------------------------------------------------------------------------
# Agent C: helden - horn, hit, miss
# ----------------------------------------------------------------------------------------------------------------
def make_horn():
    n = nsamp(0.62)
    x = np.zeros(n)
    kw = dict(att=0.014, bright_tau=0.06, rolloff=1.35, nh=10, scoop=1.6, detune=(0.998, 1.002))
    put(x, brass(392.0, 0.15, rel=0.03, **kw), 0.0, 0.85)  # 'tu-'
    put(x, brass(587.33, 0.3, rel=0.12, vib=0.003, **kw), 0.18, 1.0)  # '-TUUU' (kwint omhoog)
    return finish_fx(x, 0.08)


def make_hit():
    rng = rng_for("hit")
    n = nsamp(0.22)
    t = tt(n)
    thump = np.sin(phase_of(55 + 150 * np.exp(-t / 0.03))) * attack(t, 0.002) * np.exp(-t / 0.075)
    bf = 210 + 300 * np.exp(-t / 0.02)  # cartoon-'bonk'
    ph = phase_of(bf)
    bonk = (np.sin(ph) + 0.4 * np.sin(2.4 * ph)) * attack(t, 0.002) * np.exp(-t / 0.055)
    slap = band_noise(n, 900, 5000, rng) * np.exp(-t / 0.013)
    return finish_fx(softclip(thump * 1.0 + bonk * 0.55 + slap * 0.7, 1.0), 0.04)


def make_miss():
    rng = rng_for("miss")
    n = nsamp(0.26)
    t = tt(n)
    centers = np.geomspace(350, 5200, 12)  # 12 banden, de zwaartepunt schuift omhoog
    sweep = 450 * (5200 / 450) ** (np.clip(t / 0.22, 0, 1) ** 0.8)
    x = np.zeros(n)
    for c in centers:
        w = np.exp(-0.5 * (np.log2(c / sweep) / 0.45) ** 2)
        x += band_noise(n, c / 1.35, c * 1.35, rng) * w
    env = attack(t, 0.003) * (0.45 + 0.55 * np.sin(np.pi * np.clip(t / 0.22, 0, 1)) ** 1.5)
    return finish_fx(x * env, 0.07)


# ----------------------------------------------------------------------------------------------------------------
# Agent D: muziek - music_tavern (naadloze loop)
# ----------------------------------------------------------------------------------------------------------------
BPM = 96
BEAT = 60 / BPM  # 0,625 s
BAR_N = nsamp(4 * BEAT)  # 110250 samples: exact geheel getal
BARS = 36  # 36 maten x 2,5 s = 90 s
LOOP_N = BARS * BAR_N

# maat-akkoorden: bas (midi), arpeggio-noten (4, oplopend)
CHORDS = {
    "G": (43, [55, 59, 62, 67]),
    "Em": (40, [52, 55, 59, 64]),
    "C": (36, [48, 55, 60, 64]),
    "D": (38, [50, 57, 62, 66]),
}
PROG_A = ["G", "Em", "C", "D"]
PROG_B = ["C", "G", "D", "Em"]

# melodieen in (midi, aantal tellen); 16 tellen = 4 maten
M1 = [(71, 1), (74, 1), (79, 1.5), (78, .5), (76, 1.5), (74, .5), (71, 1), (67, 1),
      (72, 1), (76, 1), (79, 1.5), (76, .5), (78, 1), (76, .5), (74, .5), (74, 2)]
M2 = [(79, 1), (78, .5), (76, .5), (74, 1), (71, 1), (76, 1), (71, 1), (67, 1), (71, 1),
      (72, .5), (74, .5), (76, 1), (72, 1), (67, 1), (69, 1), (71, .5), (72, .5), (74, 2)]
M3 = [(76, 1), (79, 1), (76, 1), (72, 1), (71, 1), (74, 1), (79, 2),
      (78, 1.5), (76, .5), (74, 1), (69, 1), (71, 1), (74, 1), (76, 2)]
M4 = [(79, 1.5), (76, .5), (72, 1), (76, 1), (74, 1), (71, 1), (67, 1), (71, 1),
      (69, 1), (74, 1), (78, 1), (81, 1), (79, 1.5), (76, .5), (71, 2)]
M5 = M1[:-4] + [(69, 1), (74, 1), (78, 1), (74, 1)]  # slot: eindigt op de dominant, de loop valt terug op G

# 9 stukken van 4 maten
SECTIONS = [
    dict(prog=PROG_A, mel=None, bass=False, drum=False, shaker=False, pat=1, vel=0.8),
    dict(prog=PROG_A, mel=None, bass=True, drum=False, shaker=True, pat=1, vel=0.9),
    dict(prog=PROG_A, mel=M1, bass=True, drum=True, shaker=True, pat=1, vel=0.9),
    dict(prog=PROG_B, mel=M3, bass=True, drum=True, shaker=True, pat=2, vel=1.0),
    dict(prog=PROG_A, mel=M2, bass=True, drum=True, shaker=True, pat=1, vel=0.95),
    dict(prog=PROG_B, mel=None, bass=True, drum=True, shaker=True, pat=2, vel=0.9),
    dict(prog=PROG_A, mel=M1, bass=True, drum=True, shaker=True, pat=2, vel=1.0),
    dict(prog=PROG_B, mel=M4, bass=True, drum=True, shaker=True, pat=1, vel=1.0),
    dict(prog=PROG_A, mel=M5, bass=True, drum=True, shaker=True, pat=1, vel=0.9),
]
assert len(SECTIONS) * 4 == BARS


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


_pluck_cache: dict[tuple[int, float], np.ndarray] = {}


def lute(m: int, dur: float) -> np.ndarray:
    key = (m, dur)
    if key in _pluck_cache:
        return _pluck_cache[key]
    f = hz(m)
    n = nsamp(dur)
    t = tt(n)
    x = np.zeros(n)
    ring = 1.5 if m < 55 else 1.0  # lage snaren klinken langer
    for h in range(1, 9):
        fh = f * h * (1 + 0.0004 * h * h)
        if fh > 8000:
            break
        x += h ** -1.15 * np.sin(2 * np.pi * fh * t + 0.7 * h) * np.exp(-t * (1 + 0.9 * (h - 1)) / (1.1 * ring))
    x *= attack(t, 0.0015)
    rng = np.random.default_rng(m * 7 + 1)
    x += band_noise(n, 400, 3200, rng) * np.exp(-t / 0.007) * 0.18  # tokkel van de snaar
    _pluck_cache[key] = x * 0.5
    return _pluck_cache[key]


def flute(m: int, beats: float, rng: np.random.Generator) -> np.ndarray:
    f = hz(m)
    dur = beats * BEAT * 0.96
    rel = 0.09
    n = nsamp(dur + rel)
    t = tt(n)
    vib = 0.0042 * np.clip((t - 0.14) / 0.2, 0, 1) * np.sin(2 * np.pi * 5.1 * t + rng.uniform(0, 6))
    ph = phase_of(f * (1 + vib))
    x = np.sin(ph) + 0.16 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    breath = band_noise(n, f * 1.5, f * 5, rng) * 0.05
    env = (1 - np.exp(-t / 0.018)) * (0.8 + 0.2 * np.exp(-t / 0.12))
    r0 = nsamp(dur)
    env[r0:] *= 0.5 * (1 + np.cos(np.pi * np.linspace(0, 1, n - r0)))
    return (x + breath) * env * 0.5


def bass_note(m: int) -> np.ndarray:
    f = hz(m)
    n = nsamp(0.7)
    t = tt(n)
    x = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.18 * np.sin(6 * np.pi * f * t)) * np.exp(-t / 0.28)
    return x * attack(t, 0.004) * 0.6


def frame_drum(rng: np.random.Generator) -> np.ndarray:
    n = nsamp(0.4)
    t = tt(n)
    body = np.sin(phase_of(62 + 55 * np.exp(-t / 0.035))) * attack(t, 0.002) * np.exp(-t / 0.13)
    skin = band_noise(n, 200, 1800, rng) * np.exp(-t / 0.012) * 0.3
    return body + skin


def shaker(rng: np.random.Generator, dur: float = 0.07) -> np.ndarray:
    n = nsamp(dur)
    t = tt(n)
    return band_noise(n, 5000, 11000, rng) * (1 - np.exp(-t / 0.006)) * np.exp(-t / 0.022)


def jingle(rng: np.random.Generator) -> np.ndarray:
    n = nsamp(0.16)
    t = tt(n)
    x = band_noise(n, 6500, 12000, rng) * np.exp(-t / 0.05)
    for f in (4300, 5700, 7100):
        x += 0.4 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.04) * (1 + 0.3 * np.sin(2 * np.pi * 70 * t))
    return x * (1 - np.exp(-t / 0.004))


def pan(x: np.ndarray, p: float) -> np.ndarray:
    th = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def reverb_circular(stereo: np.ndarray, wet: float) -> np.ndarray:
    """Hal via circulaire FFT-convolutie met de lengte van de loop: de staart loopt dus rond het loop-punt."""
    out = stereo.copy()
    for ch in range(2):
        rng = np.random.default_rng(900 + ch)
        n_ir = nsamp(1.6)
        t = tt(n_ir)
        ir = fft_band(rng.standard_normal(n_ir), None, 4800) * np.exp(-t / 0.42)
        ir *= np.clip(t / 0.012, 0, 1)  # korte pre-delay
        ir /= np.sqrt(np.sum(ir * ir))
        h = np.zeros(LOOP_N)
        h[:n_ir] = ir
        wet_sig = np.fft.irfft(np.fft.rfft(stereo[ch]) * np.fft.rfft(h), LOOP_N)
        out[ch] += wet * wet_sig
    return out


def make_music() -> np.ndarray:
    rng = np.random.default_rng(2026)
    pad = nsamp(4.0)  # staart voorbij het einde; wordt hieronder naar het begin gevouwen
    tracks = {k: np.zeros(LOOP_N + pad) for k in ("lute", "bass", "flute", "drum", "shaker")}
    jit = lambda: rng.normal(0, 0.005)  # kleine menselijke timing-afwijking (s)

    for si, sec in enumerate(SECTIONS):
        for bi in range(4):
            bar = si * 4 + bi
            t0 = bar * 4 * BEAT
            bass_m, arp = CHORDS[sec["prog"][bi]]
            v = sec["vel"]
            # luit
            if sec["pat"] == 1:
                order = [0, 2, 1, 3, 2, 1, 3, 2]
                for e, idx in enumerate(order):
                    acc = 1.0 if e % 2 == 0 else 0.72
                    if e == 0:
                        acc = 1.15
                    put(tracks["lute"], lute(arp[idx], 2.0 if idx == 0 else 1.5), t0 + e * BEAT / 2 + jit(), v * acc * rng.uniform(0.92, 1.05))
            else:  # boem-tsjak
                for e in (0, 4):
                    put(tracks["lute"], lute(arp[0], 2.0), t0 + e * BEAT / 2 + jit(), v * 1.1)
                for e in (2, 6):
                    for k, idx in enumerate((1, 2, 3)):
                        put(tracks["lute"], lute(arp[idx], 1.2), t0 + e * BEAT / 2 + 0.014 * k + jit(), v * 0.8 * rng.uniform(0.92, 1.05))
                put(tracks["lute"], lute(arp[3], 1.0), t0 + 7 * BEAT / 2 + jit(), v * 0.5)
            # bas: tel 1 grondtoon, tel 3 kwint
            if sec["bass"]:
                put(tracks["bass"], bass_note(bass_m), t0 + jit() * 0.4, 0.95 * v)
                put(tracks["bass"], bass_note(bass_m + (7 if bass_m < 44 else 0)), t0 + 2 * BEAT + jit() * 0.4, 0.7 * v)
            # slagwerk
            if sec["drum"]:
                put(tracks["drum"], frame_drum(rng), t0 + jit() * 0.4, 0.95)
                put(tracks["drum"], frame_drum(rng), t0 + 2 * BEAT, 0.6)
                if sec["pat"] == 2:
                    put(tracks["drum"], frame_drum(rng), t0 + 3.5 * BEAT, 0.3)
            if sec["shaker"]:
                for e in range(8):
                    put(tracks["shaker"], shaker(rng), t0 + e * BEAT / 2 + jit() * 0.5, (0.8 if e % 2 else 0.4))
                if sec["pat"] == 2:
                    for beat in (1, 3):
                        put(tracks["shaker"], jingle(rng), t0 + beat * BEAT, 0.5)

        # fluit (melodie over 4 maten)
        if sec["mel"]:
            tb = si * 4 * 4 * BEAT
            for m, beats in sec["mel"]:
                put(tracks["flute"], flute(m, beats, rng), tb + 0.008 + jit() * 0.5, 0.95)
                tb += beats * BEAT

    # naadloos: de staart voorbij het einde terugvouwen op het begin
    for k, tr in tracks.items():
        tr[:pad] += tr[LOOP_N : LOOP_N + pad]
        tracks[k] = tr[:LOOP_N]

    mix = (pan(tracks["lute"], -0.25) * 1.0 + pan(tracks["bass"], 0.0) * 0.55 + pan(tracks["flute"], 0.2) * 0.62
           + pan(tracks["drum"], -0.05) * 0.55 + pan(tracks["shaker"], 0.3) * 0.11)
    return reverb_circular(mix, 0.22)


# ----------------------------------------------------------------------------------------------------------------
# Coordinator: bestanden schrijven en coderen
# ----------------------------------------------------------------------------------------------------------------
BUILDERS = {
    "plop": make_plop, "bubble": make_bubble, "coin": make_coin, "buzz": make_buzz, "buy": make_buy,
    "eureka": make_eureka, "fanfare": make_fanfare, "horn": make_horn, "hit": make_hit, "miss": make_miss,
}


def find_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg niet gevonden (installeer ffmpeg of `pip install imageio-ffmpeg`).")


def write_wav(path: Path, x: np.ndarray) -> None:
    data = x.T if x.ndim == 2 else x
    pcm = np.round(np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1 if x.ndim == 1 else x.shape[0])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def encode_ogg(ffmpeg: str, wav: Path, ogg: Path, music: bool) -> None:
    q = ["-b:a", f"{MUSIC_KBPS}k"] if music else ["-q:a", "5"]
    cmd = [ffmpeg, "-y", "-v", "error", "-i", str(wav), "-ar", str(SR), "-ac", "2" if music else "1",
           "-map_metadata", "-1", "-c:a", "libvorbis", *q, str(ogg)]
    subprocess.run(cmd, check=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent, help="uitvoermap voor de .ogg-bestanden")
    ap.add_argument("--only", nargs="*", help="alleen deze ids maken")
    ap.add_argument("--trim-db", nargs="*", default=[], metavar="ID=DB",
                    help="extra winst per id in dB (door de reviewer terug te sturen), bv. hit=-0.5")
    args = ap.parse_args()
    trim = {k: float(v) for k, v in (s.split("=") for s in args.trim_db)}
    ffmpeg = find_ffmpeg()
    args.out.mkdir(parents=True, exist_ok=True)
    ids = args.only or list(SPEC)
    with tempfile.TemporaryDirectory() as tmp:
        for name in ids:
            raw = make_music() if name == "music_tavern" else BUILDERS[name]()
            x = master(raw, SPEC[name][2] + trim.get(name, 0.0))
            wav = Path(tmp) / f"{name}.wav"
            write_wav(wav, x)
            encode_ogg(ffmpeg, wav, args.out / f"{name}.ogg", name == "music_tavern")
            print(f"{name:13s} {x.shape[-1] / SR:6.3f} s  {lufs(x):6.1f} LUFS  -> {name}.ogg")


if __name__ == "__main__":
    main()
