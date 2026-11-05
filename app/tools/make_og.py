"""Writes public/og.png, the 1200x630 card shown when a Barker link is shared (Facebook, Messenger, X).

Needs Pillow (pip install pillow) and the Impact and Segoe UI fonts that ship with Windows;
pass other font files as FONT_DISPLAY / FONT_BODY env vars elsewhere.
"""
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG, INK, RED, BOARD, MUTED = "#f4efe4", "#1b1813", "#c4122f", "#fff6d8", "#645d51"
FONTS = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
display = lambda size: ImageFont.truetype(os.environ.get("FONT_DISPLAY", str(FONTS / "impact.ttf")), size)
body = lambda size, bold=False: ImageFont.truetype(os.environ.get("FONT_BODY", str(FONTS / ("segoeuib.ttf" if bold else "segoeui.ttf"))), size)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# The signboard, like the plakard on the front of a jeep
bx0, by0, bx1, by1 = 90, 90, W - 90, 330
d.rounded_rectangle((bx0, by0 + 10, bx1, by1 + 10), 18, fill="#d9d1c0")  # shadow
d.rounded_rectangle((bx0, by0, bx1, by1), 18, fill=BOARD, outline=INK, width=10)
d.rounded_rectangle((bx0 + 16, by0 + 16, bx1 - 16, by1 - 16), 10, outline=INK, width=4)
d.text((W / 2, (by0 + by1) / 2 + 4), "BARKER", font=display(150), fill=RED, anchor="mm")

d.text((W / 2, 410), "Where to catch your jeep, bus or UV,", font=body(46, True), fill=INK, anchor="mm")
d.text((W / 2, 468), "and where it goes.", font=body(46, True), fill=INK, anchor="mm")
d.text((W / 2, 548), "Ask by voice · Scan the signboard · Get-off alerts", font=body(30), fill=MUTED, anchor="mm")

# Red strip with the area, like a route sticker
d.rectangle((0, H - 36, W, H), fill=RED)
d.text((W / 2, H - 18), "IMUS · BACOOR, CAVITE  ·  barker-ph.vercel.app", font=body(20, True), fill="#ffffff", anchor="mm")

out = Path(__file__).parent.parent / "public" / "og.png"
img.save(out, optimize=True)
print(out, out.stat().st_size, "bytes")
