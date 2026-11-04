"""Writes public/icon-192.png and icon-512.png (a plakard on red) with only the standard library."""
import struct
import zlib
from pathlib import Path

RED, BOARD, INK = (0xC4, 0x12, 0x2F), (0xFF, 0xF6, 0xD8), (0x1B, 0x18, 0x13)


def pixel(x, y):
    # Unit coords; board sits inside the maskable safe zone (central 80%).
    if 0.18 <= x <= 0.82 and 0.33 <= y <= 0.67:
        inner = 0.205 <= x <= 0.795 and 0.355 <= y <= 0.645
        if not inner:
            return INK
        if 0.40 <= x <= 0.60 and 0.47 <= y <= 0.53:
            return INK  # the dash between two place names
        return BOARD
    return RED


def png(size, path):
    rows = b"".join(b"\0" + bytes(c for x in range(size) for c in pixel((x + .5) / size, (y + .5) / size)) for y in range(size))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d))
    Path(path).write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
                           + chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b""))


here = Path(__file__).parent.parent / "public"
for s in (192, 512):
    png(s, here / f"icon-{s}.png")
