#!/usr/bin/env python3
"""Genereer het Wavy app-icoon: donker afgerond vierkant met neon roze/cyaan golf."""
import math
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
BG = (10, 10, 15, 255)
PINK = (255, 95, 210)
CYAN = (34, 230, 255)


def rounded_bg(size, radius):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    return img


def wave_points(size, phase, a1, f1, a2, f2):
    pts = []
    for x in range(0, size + 1, 4):
        nx = x / size
        env = math.sin(math.pi * nx) ** 1.2
        y = size * 0.52 + (math.sin(nx * f1 + phase) * a1 + math.sin(nx * f2 + phase * 1.6) * a2) * env
        pts.append((x, y))
    return pts


def neon_stroke(base, pts, color, width):
    """Teken glow + kern + witte kern op transparante laag en composite."""
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.line(pts, fill=color + (255,), width=width * 3, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(width * 1.6))
    base.alpha_composite(glow)
    d = ImageDraw.Draw(base)
    d.line(pts, fill=color + (255,), width=width, joint="curve")
    d.line(pts, fill=(255, 255, 255, 230), width=max(2, width // 4), joint="curve")


def main():
    img = rounded_bg(SIZE, radius=230)

    # Subtiele paarse gloed in het midden
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([SIZE * 0.2, SIZE * 0.25, SIZE * 0.8, SIZE * 0.75], fill=(60, 40, 120, 70))
    halo = halo.filter(ImageFilter.GaussianBlur(90))

    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=230, fill=255)
    img.alpha_composite(halo)

    # Sterretjes
    import random
    random.seed(7)
    sd = ImageDraw.Draw(img)
    for _ in range(40):
        x = random.randint(60, SIZE - 60)
        y = random.randint(60, SIZE - 60)
        r = random.choice([2, 2, 3, 4])
        sd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 120))

    neon_stroke(img, wave_points(SIZE, 0.6, 130, 10.5, 45, 19.0), PINK, 34)
    neon_stroke(img, wave_points(SIZE, 2.1, 150, 10.5, 55, 19.0), CYAN, 34)

    img.putalpha(mask)
    img.save("assets/icon.png")
    print("assets/icon.png geschreven")


if __name__ == "__main__":
    main()
