#!/usr/bin/env python3
"""
Reviewer: meet de gecodeerde .ogg-bestanden (na decoderen) tegen de eisen en schrijf REVIEW.md + ASSETS.md.

    python audio/review_audio.py

Afsluitcode 1 als iets niet voldoet; de uitvoer zegt wat teruggestuurd moet worden (bv. --trim-db hit=-1).
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_audio import EFFECT_IDS, SPEC, SR, find_ffmpeg, lufs  # noqa: E402

HERE = Path(__file__).resolve().parent
LUFS_TOL = 2.0  # LU rond het doel (piek-limiet gaat voor)
FX_MAX_KB, FX_TOTAL_KB, MUSIC_MAX_KB = 50, 400, 2048
ONSET_MAX_MS = 5.0


def probe(ffmpeg: str, path: Path) -> tuple[str, int, int]:
    err = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    m = re.search(r"Audio: (\w+).*?(\d+) Hz, (mono|stereo)", err)
    if not m:
        return "?", 0, 0
    return m.group(1), int(m.group(2)), 1 if m.group(3) == "mono" else 2


def decode(ffmpeg: str, path: Path, ch: int) -> np.ndarray:
    raw = subprocess.run([ffmpeg, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").astype(np.float64).reshape(-1, ch).T


def true_peak_db(x: np.ndarray) -> float:
    peak = 0.0
    for c in x:
        n = len(c)
        up = np.fft.irfft(np.fft.rfft(c) , n * 4) * 4  # 4x oversampling via spectrale nul-uitbreiding
        peak = max(peak, float(np.max(np.abs(up))), float(np.max(np.abs(c))))
    return 20 * np.log10(peak + 1e-12)


def ebur128(ffmpeg: str, path: Path) -> float | None:
    err = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?\d+\.\d) LUFS", err)
    return float(m[-1]) if m else None


def main() -> int:
    ffmpeg = find_ffmpeg()
    rows, fails = [], []
    fx_total = 0.0
    for name in list(SPEC):
        path = HERE / f"{name}.ogg"
        music = name == "music_tavern"
        lo, hi, target = SPEC[name]
        if not path.exists():
            fails.append(f"{name}: bestand ontbreekt")
            continue
        codec, rate, ch = probe(ffmpeg, path)
        x = decode(ffmpeg, path, ch)
        dur = x.shape[1] / SR
        kb = path.stat().st_size / 1024
        peak = true_peak_db(x)
        sp = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        loud = lufs(x if ch > 1 else x[0])
        mono = x.mean(axis=0)
        pk = np.max(np.abs(mono))
        onset_ms = float(np.argmax(np.abs(mono) >= 0.05 * pk) / SR * 1000)
        first = float(np.max(np.abs(x[:, 0])) / np.max(np.abs(x)))
        last = float(np.max(np.abs(x[:, -1])) / np.max(np.abs(x)))
        probs = []
        if codec != "vorbis" or rate != SR:
            probs.append(f"formaat {codec} {rate} Hz")
        if ch != (2 if music else 1):
            probs.append("kanalen")
        if not lo <= dur <= hi:
            probs.append(f"lengte {dur:.2f}s buiten {lo}-{hi}s")
        if peak > -1.0:
            probs.append(f"piek {peak:.2f} dBTP > -1")
        if abs(loud - target) > LUFS_TOL:
            probs.append(f"luidheid {loud:.1f} vs doel {target:.0f} (±{LUFS_TOL:.0f})")
        if kb > (MUSIC_MAX_KB if music else FX_MAX_KB):
            probs.append(f"grootte {kb:.0f} KB")
        if not music:
            fx_total += kb
            if onset_ms > ONSET_MAX_MS:
                probs.append(f"start pas na {onset_ms:.1f} ms")
            if first > 0.02:
                probs.append(f"klik aan begin ({first:.0%})")
            if last > 0.02:
                probs.append(f"geen uitfade ({last:.0%})")
        else:
            # loop: sprong tussen laatste en eerste sample vs. de normale sample-sprong
            jump = np.max(np.abs(x[:, 0] - x[:, -1]))
            typical = np.percentile(np.abs(np.diff(x, axis=1)), 99.9)
            if jump > 1.5 * typical:
                probs.append(f"sprong op loop-punt {jump:.4f} > {typical:.4f}")
        if probs:
            fails.append(f"{name}: " + "; ".join(probs))
        rows.append((name, dur, kb, sp, peak, loud, ebur128(ffmpeg, path) if music else None, onset_ms, not probs))

    if fx_total > FX_TOTAL_KB:
        fails.append(f"alle effecten samen {fx_total:.0f} KB > {FX_TOTAL_KB} KB")

    md = ["# Reviewrapport audio", "",
          "Gemeten op de gedecodeerde `.ogg`-bestanden. Luidheid = ongepoorte K-gewogen LUFS over het hele bestand "
          "(effecten zijn korter dan 400 ms, dus de standaard EBU-poort kan daar niet); voor de muziek staat ook "
          "ffmpeg `ebur128` (geïntegreerd) ter controle. Piek = true peak (4× oversampling).", "",
          "Eisen: lengte per geluid volgens tabel; piek ≤ -1 dBTP; luidheid doel ±2 LU (effecten -16, `coin` -19, muziek -20); "
          "effect < 50 KB, samen < 400 KB, muziek < 2 MB; effecten starten binnen 5 ms zonder klik en eindigen op stilte; "
          "de loop heeft geen sprong op het loop-punt.", "",
          "| bestand | lengte (s) | grootte (KB) | sample-piek (dBFS) | true peak (dBTP) | luidheid (LUFS) | ebur128 (LUFS) | start (ms) | voldoet |",
          "|---|---|---|---|---|---|---|---|---|"]
    for n, d, kb, sp, tp, ld, eb, on, ok in rows:
        md.append(f"| {n}.ogg | {d:.3f} | {kb:.1f} | {sp:.1f} | {tp:.1f} | {ld:.1f} | {'' if eb is None else f'{eb:.1f}'} | "
                  f"{'' if n == 'music_tavern' else f'{on:.1f}'} | {'ja' if ok else 'NEE'} |")
    md += ["", f"Alle effecten samen: {fx_total:.1f} KB (grens {FX_TOTAL_KB} KB).", "",
           "**Uitslag:** " + ("alles voldoet." if not fails else "niet alles voldoet:"), *[f"- {f}" for f in fails], "",
           "Niet gemeten: hoe het klinkt (de maker kan niet luisteren); luister de bestanden na voor gebruik."]
    (HERE / "REVIEW.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    asset = ["# Audio-assets (fragment voor docs/ASSETS.md)", "",
             "| bestand | duur | grootte | herkomst en licentie |", "|---|---|---|---|"]
    for n, d, kb, *_ in rows:
        asset.append(f"| `{n}.ogg` | {d:.2f} s | {kb:.1f} KB | zelf gegenereerd met code (`audio/make_audio.py` meegeleverd), vrij te gebruiken |")
    (HERE / "ASSETS.md").write_text("\n".join(asset) + "\n", encoding="utf-8")

    print("\n".join(md[8:]))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
