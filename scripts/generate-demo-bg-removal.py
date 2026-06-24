#!/usr/bin/env python3
"""Regenerate landing demo after image: same photo, white background."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / 'public/demo/bg-removal-before.jpg'
OUTPUT = ROOT / 'public/demo/bg-removal-after.jpg'
OUTPUT_PNG = ROOT / 'public/demo/bg-removal-after.png'


def is_dark(r: int, g: int, b: int) -> bool:
    return max(r, g, b) < 54


def is_strict_yellow(r: int, g: int, b: int) -> bool:
    if is_dark(r, g, b):
        return False
    ya = min(r, g) - b
    return ya > 26 and r > 112 and g > 88 and b < 118


def is_warm_spill(r: int, g: int, b: int) -> bool:
    if is_dark(r, g, b):
        return False
    ya = min(r, g) - b
    return ya > 8 and b < 105


def build_subject_mask(src: np.ndarray) -> np.ndarray:
    h, w = src.shape[:2]
    subject = np.zeros((h, w), dtype=bool)
    stack: list[tuple[int, int]] = []

    def push(y: int, x: int) -> None:
        if y < 0 or x < 0 or y >= h or x >= w:
            return
        if subject[y, x]:
            return
        r, g, b = map(int, src[y, x])
        if is_strict_yellow(r, g, b):
            return
        subject[y, x] = True
        stack.append((y, x))

    dark = np.max(src, axis=2) < 54
    subject[dark] = True
    ys, xs = np.where(dark)
    stack.extend(zip(ys.tolist(), xs.tolist()))

    while stack:
        y, x = stack.pop()
        push(y - 1, x)
        push(y + 1, x)
        push(y, x - 1)
        push(y, x + 1)

    return subject


def build_edge_background(src: np.ndarray) -> np.ndarray:
    h, w = src.shape[:2]
    bg = np.zeros((h, w), dtype=bool)
    stack: list[tuple[int, int]] = []

    def is_edge_bg(r: int, g: int, b: int) -> bool:
        if is_dark(r, g, b):
            return False
        ya = min(r, g) - b
        if ya > 26 and r > 112 and g > 88 and b < 118:
            return True
        return ya > 8 and b < 105

    def push(y: int, x: int) -> None:
        if y < 0 or x < 0 or y >= h or x >= w:
            return
        if bg[y, x]:
            return
        r, g, b = map(int, src[y, x])
        if not is_edge_bg(r, g, b):
            return
        bg[y, x] = True
        stack.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while stack:
        y, x = stack.pop()
        push(y - 1, x)
        push(y + 1, x)
        push(y, x - 1)
        push(y, x + 1)

    return bg


def main() -> None:
    before = Image.open(INPUT).convert('RGB')
    src = np.array(before)
    h, w = src.shape[:2]

    rembg_alpha = np.array(remove(before).convert('RGBA'))[:, :, 3].astype(np.float32)
    subject = build_subject_mask(src)
    edge_bg = build_edge_background(src)

    cy, cx, ry, rx = 198, 548, 60, 76
    yy, xx = np.ogrid[:h, :w]
    arch = ((xx - cx) ** 2 / rx**2 + (yy - cy) ** 2 / ry**2) <= 1

    warm = np.zeros((h, w), dtype=bool)
    arch_clear = np.zeros((h, w), dtype=bool)
    for y in range(h):
        for x in range(w):
            r, g, b = map(int, src[y, x])
            warm[y, x] = is_warm_spill(r, g, b)
            if arch[y, x] and not is_dark(r, g, b):
                ya = min(r, g) - b
                if ya > 4 and b < 132:
                    arch_clear[y, x] = True

    fg = (rembg_alpha >= 128) | subject
    fg = ndimage.binary_dilation(fg, iterations=1)
    alpha = np.where(fg, 255.0, 0.0)

    force_white = arch_clear | (edge_bg & ~subject) | (warm & ~subject)
    alpha[force_white] = 0.0
    alpha[subject & ~force_white] = 255.0

    alpha_u8 = alpha.astype(np.uint8)
    Image.fromarray(np.dstack([src, alpha_u8])).save(OUTPUT_PNG, optimize=True)

    a = alpha / 255.0
    result = np.empty_like(src, dtype=np.float32)
    for c in range(3):
        result[:, :, c] = src[:, :, c] * a + 255.0 * (1.0 - a)

    Image.fromarray(result.astype(np.uint8)).save(OUTPUT, quality=95, optimize=True)
    print(f'Wrote {OUTPUT}')
    print(f'Wrote {OUTPUT_PNG}')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
