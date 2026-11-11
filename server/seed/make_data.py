"""
Tạo file data.json chứa danh mục, sản phẩm và banner mẫu cùng ảnh minh họa.
Ảnh được vẽ bằng Pillow (không phải ảnh chụp thật), chỉ dùng để trình diễn và kiểm thử giao diện.

Chạy: python make_data.py   (cần Pillow: pip install pillow)
Chỉ cần chạy lại khi muốn đổi nội dung mẫu; seed.js đọc data.json đã có sẵn.
"""
import base64
import io
import json
import math
import os

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SS = 3  # siêu lấy mẫu để nét vẽ mịn


def b64(img, quality=80):
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=quality, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------- kính
def stroke(draw, pts, color, width):
    """Vẽ nét dày bằng cách đóng dấu hình tròn dọc theo đường, cho mép mịn không bị răng cưa."""
    r = width / 2
    step = max(1.0, width / 5)
    for a, b in zip(pts, pts[1:]):
        dist = math.hypot(b[0] - a[0], b[1] - a[1])
        n = max(1, int(dist / step))
        for i in range(n + 1):
            x = a[0] + (b[0] - a[0]) * i / n
            y = a[1] + (b[1] - a[1]) * i / n
            draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def lens_outline(shape, cx, cy, w, h, side):
    """Trả về danh sách điểm (đa giác) của một tròng kính; side = -1 trái, 1 phải."""
    pts = []
    if shape in ("round", "rimless"):
        for i in range(90):
            t = 2 * math.pi * i / 90
            pts.append((cx + w / 2 * math.cos(t), cy + h / 2 * math.sin(t)))
    elif shape == "aviator":
        for i in range(90):
            t = 2 * math.pi * i / 90
            y = math.sin(t)
            y = y * (0.85 if y < 0 else 1.2)
            x = math.cos(t) * (1 - 0.12 * max(y, 0))
            pts.append((cx + w / 2 * x, cy + h / 2 * y))
    elif shape in ("square", "browline", "kids"):
        r = 0.2 if shape != "browline" else 0.12
        n = 24
        corners = [(1, -1), (1, 1), (-1, 1), (-1, -1)]
        for k, (sx, sy) in enumerate(corners):
            ox, oy = cx + sx * (w / 2 - r * w), cy + sy * (h / 2 - r * h)
            for i in range(n + 1):
                t = (k * 90 + 90 * i / n) * math.pi / 180 - math.pi / 2 + (0 if k == 0 else 0)
                a = -math.pi / 2 + (k * math.pi / 2) + (math.pi / 2) * i / n
                pts.append((ox + r * w * math.cos(a), oy + r * h * math.sin(a)))
    elif shape == "cat":
        # mắt mèo: góc trên phía ngoài nhọn và nhô lên
        up = -side  # hướng ra ngoài là -side của tròng
        outer = cx - side * 0  # chỉ để rõ nghĩa
        base = [(-0.5, -0.1), (-0.35, -0.5), (0.3, -0.55), (0.55, -0.85), (0.5, -0.1), (0.4, 0.45), (0.0, 0.55), (-0.4, 0.4)]
        for bx, by in base:
            pts.append((cx + (bx * w) * side, cy + by * h))
    elif shape == "hex":
        for i in range(6):
            t = math.pi / 6 + 2 * math.pi * i / 6
            pts.append((cx + w / 2 * math.cos(t) * 1.05, cy + h / 2 * math.sin(t) * 1.05))
    return pts


def smooth(pts, passes=2):
    for _ in range(passes):
        out = []
        n = len(pts)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            out.append((0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]))
            out.append((0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]))
        pts = out
    return pts


def lens_fill(size, box, top, bottom, alpha):
    """Tròng có chuyển màu dọc từ top sang bottom (RGB), trả về ảnh RGBA cùng kích thước canvas."""
    w, h = size
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    y0, y1 = int(box[1]), int(box[3])
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, y1 - y0)
        c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (alpha,)
        gd.line([(0, y), (w, y)], fill=c)
    return grad


def draw_glasses(canvas, cx, cy, scale, shape, frame, lens=("clear",), width=1.0, shadow=True):
    """Vẽ một chiếc kính nhìn thẳng lên canvas RGBA (đã nhân SS). cx, cy, scale theo toạ độ canvas."""
    W, H = canvas.size
    lw, lh = 300 * scale, 235 * scale
    gap = 96 * scale
    centers = [(cx - gap / 2 - lw / 2, cy), (cx + gap / 2 + lw / 2, cy)]
    if shape == "round":
        lw = lh = 262 * scale
        centers = [(cx - gap / 2 - lw / 2, cy), (cx + gap / 2 + lw / 2, cy)]
    if shape == "kids":
        lw, lh = 270 * scale, 230 * scale
    thick = max(2, int((22 if shape != "rimless" else 5) * scale * width))

    if shadow:
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.ellipse((cx - 330 * scale, cy + 215 * scale, cx + 330 * scale, cy + 260 * scale), fill=(0, 0, 0, 60))
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14 * scale)))

    draw = ImageDraw.Draw(canvas)

    if shape == "shield":
        pts = []
        sw, sh_ = 700 * scale, 250 * scale
        n = 40
        for i in range(n + 1):
            t = math.pi * i / n
            pts.append((cx - sw / 2 * math.cos(t), cy - sh_ / 2 * 0.9 * math.sin(t) - 10 * scale))
        for i in range(n + 1):
            t = math.pi * i / n
            pts.append((cx + sw / 2 * math.cos(t), cy + sh_ / 2 * 0.55 * math.sin(t) - 10 * scale))
        # tròng liền một mảnh, có khuyết ở sống mũi
        poly = [(cx - sw / 2, cy - 40 * scale), (cx - sw / 2 + 60 * scale, cy - sh_ / 2), (cx - 60 * scale, cy - sh_ / 2 + 10 * scale),
                (cx, cy - 20 * scale), (cx + 60 * scale, cy - sh_ / 2 + 10 * scale), (cx + sw / 2 - 60 * scale, cy - sh_ / 2),
                (cx + sw / 2, cy - 40 * scale), (cx + sw / 2 - 40 * scale, cy + sh_ / 2 - 20 * scale), (cx + 140 * scale, cy + sh_ / 2),
                (cx + 30 * scale, cy + 40 * scale), (cx - 30 * scale, cy + 40 * scale), (cx - 140 * scale, cy + sh_ / 2), (cx - sw / 2 + 40 * scale, cy + sh_ / 2 - 20 * scale)]
        poly = smooth(poly, 3)
        box = (min(p[0] for p in poly), min(p[1] for p in poly), max(p[0] for p in poly), max(p[1] for p in poly))
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        fill = lens_fill((W, H), box, lens[1], lens[2], 235)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        layer.paste(fill, (0, 0), mask)
        canvas.alpha_composite(layer)
        stroke(draw, poly + [poly[0]], frame, thick)
        # đường phản chiếu
        draw.line([(cx - sw / 3, cy - 70 * scale), (cx - sw / 6, cy - 100 * scale)], fill=(255, 255, 255, 120), width=max(2, int(10 * scale)))
        return

    for k, (lx, ly) in enumerate(centers):
        side = -1 if k == 0 else 1
        pts = smooth(lens_outline(shape, lx, ly, lw, lh, side), 2)
        box = (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon(pts, fill=255)
        if lens[0] == "clear":
            fill = lens_fill((W, H), box, (205, 225, 240), (235, 243, 250), 95)
        else:
            fill = lens_fill((W, H), box, lens[1], lens[2], 238 if lens[0] == "dark" else 215)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        layer.paste(fill, (0, 0), mask)
        canvas.alpha_composite(layer)
        draw = ImageDraw.Draw(canvas)
        if shape == "browline":
            top = [p for p in pts if p[1] < ly - lh * 0.05]
            bottom = [p for p in pts if p[1] >= ly - lh * 0.05]
            draw.line(sorted(top, key=lambda p: p[0]), fill=frame, width=int(thick * 1.7), joint="curve")
            if len(bottom) > 1:
                draw.line(sorted(bottom, key=lambda p: p[0]), fill=frame, width=max(2, int(thick * 0.28)), joint="curve")
        elif shape == "rimless":
            draw.line(pts + [pts[0]], fill=(150, 155, 160, 255), width=max(2, int(thick * 0.5)), joint="curve")
        else:
            stroke(draw, pts + [pts[0]], frame, thick)
        # phản chiếu
        hx0, hy0 = lx - lw * 0.28, ly - lh * 0.22
        draw.line([(hx0, hy0 + lh * 0.12), (hx0 + lw * 0.16, hy0 - lh * 0.02)], fill=(255, 255, 255, 150), width=max(2, int(9 * scale)))
        draw.line([(hx0 + lw * 0.07, hy0 + lh * 0.2), (hx0 + lw * 0.2, hy0 + lh * 0.1)], fill=(255, 255, 255, 90), width=max(2, int(5 * scale)))

    # sống mũi và gọng bên
    bx0, bx1 = centers[0][0] + lw / 2, centers[1][0] - lw / 2
    by = cy - lh * (0.14 if shape in ("aviator", "browline") else 0.08)
    draw.arc((bx0 - 4 * scale, by - 40 * scale, bx1 + 4 * scale, by + 40 * scale), 200, 340, fill=frame, width=max(3, int(thick * 0.8)))
    if shape == "aviator":
        draw.line((bx0 - 6 * scale, by - 8 * scale, bx1 + 6 * scale, by - 8 * scale), fill=frame, width=max(3, int(thick * 0.4)))
    for side, (lx, ly) in zip((-1, 1), centers):
        ex = lx + side * lw / 2
        draw.line([(ex, ly - lh * 0.3), (ex + side * 60 * scale, ly - lh * 0.42)], fill=frame, width=thick, joint="curve")


def glasses_image(shape, frame, lens, size=600, width=1.0):
    S = size * SS
    canvas = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    draw_glasses(canvas, S / 2, S / 2 + 10 * SS, S / 1000 * 0.95, shape, frame, lens, width)
    return canvas.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------- phụ kiện
def case_image(color, size=600, folding=False):
    S = size * SS
    img = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((S * 0.14, S * 0.66, S * 0.86, S * 0.74), fill=(0, 0, 0, 55))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.018)))
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = S * 0.12, S * 0.34, S * 0.88, S * 0.66
    if folding:
        y0, y1 = S * 0.4, S * 0.62
    d.rounded_rectangle((x0, y0, x1, y1), radius=S * 0.12, fill=color)
    dark = tuple(max(0, c - 40) for c in color)
    d.rounded_rectangle((x0, y0, x1, y1), radius=S * 0.12, outline=dark, width=int(S * 0.008))
    d.line((x0 + S * 0.03, (y0 + y1) / 2, x1 - S * 0.03, (y0 + y1) / 2), fill=dark, width=int(S * 0.006))
    for i in range(14):
        xx = x0 + S * 0.04 + i * (x1 - x0 - S * 0.08) / 13
        d.line((xx, y0 + S * 0.02, xx, y0 + S * 0.05), fill=dark, width=int(S * 0.004))
    d.rounded_rectangle((S * 0.46, (y0 + y1) / 2 - S * 0.02, S * 0.54, (y0 + y1) / 2 + S * 0.03), radius=S * 0.01, fill=(235, 235, 235), outline=dark, width=int(S * 0.004))
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(hl).rounded_rectangle((x0 + S * 0.04, y0 + S * 0.03, x1 - S * 0.2, y0 + S * 0.06), radius=S * 0.01, fill=(255, 255, 255, 90))
    img.alpha_composite(hl)
    return img.resize((size, size), Image.LANCZOS)


def cloth_image(color, size=600):
    S = size * SS
    img = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon([(S * 0.2, S * 0.78), (S * 0.82, S * 0.74), (S * 0.86, S * 0.82), (S * 0.24, S * 0.86)], fill=(0, 0, 0, 55))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.02)))
    d = ImageDraw.Draw(img)
    tl, tr, br, bl = (S * 0.2, S * 0.28), (S * 0.8, S * 0.24), (S * 0.84, S * 0.74), (S * 0.24, S * 0.78)
    d.polygon([tl, tr, br, bl], fill=color)
    dark = tuple(max(0, c - 30) for c in color)
    d.polygon([tl, tr, br, bl], outline=dark, width=int(S * 0.006))
    d.line((S * 0.2, S * 0.53, S * 0.84, S * 0.5), fill=dark, width=int(S * 0.004))
    d.line((S * 0.5, S * 0.26, S * 0.54, S * 0.76), fill=dark, width=int(S * 0.004))
    for i in range(10):
        d.line((S * (0.24 + i * 0.06), S * 0.31, S * (0.25 + i * 0.06), S * 0.36), fill=tuple(min(255, c + 25) for c in color), width=int(S * 0.005))
    return img.resize((size, size), Image.LANCZOS)


def spray_image(color, size=600):
    S = size * SS
    img = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((S * 0.34, S * 0.8, S * 0.66, S * 0.86), fill=(0, 0, 0, 60))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.015)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((S * 0.36, S * 0.32, S * 0.64, S * 0.83), radius=S * 0.06, fill=(236, 242, 246), outline=(190, 200, 208), width=int(S * 0.006))
    d.rounded_rectangle((S * 0.38, S * 0.5, S * 0.62, S * 0.75), radius=S * 0.02, fill=color)
    d.line((S * 0.41, S * 0.58, S * 0.59, S * 0.58), fill=(255, 255, 255), width=int(S * 0.012))
    d.line((S * 0.41, S * 0.63, S * 0.55, S * 0.63), fill=(255, 255, 255), width=int(S * 0.008))
    d.rectangle((S * 0.44, S * 0.2, S * 0.56, S * 0.32), fill=(40, 40, 44))
    d.rectangle((S * 0.5, S * 0.14, S * 0.66, S * 0.2), fill=(40, 40, 44))
    d.rectangle((S * 0.64, S * 0.15, S * 0.68, S * 0.19), fill=(90, 90, 96))
    return img.resize((size, size), Image.LANCZOS)


def strap_image(color, size=600):
    S = size * SS
    img = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((S * 0.2, S * 0.74, S * 0.8, S * 0.8), fill=(0, 0, 0, 50))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.015)))
    d = ImageDraw.Draw(img)
    pts = []
    for i in range(61):
        t = math.pi * i / 60
        pts.append((S * 0.5 - S * 0.3 * math.cos(t), S * 0.3 + S * 0.38 * math.sin(t)))
    d.line(pts, fill=color, width=int(S * 0.03), joint="curve")
    for x in (S * 0.2, S * 0.8):
        d.rounded_rectangle((x - S * 0.03, S * 0.24, x + S * 0.03, S * 0.36), radius=S * 0.012, fill=(40, 40, 44))
    for i in range(5, 56, 5):
        d.ellipse((pts[i][0] - S * 0.008, pts[i][1] - S * 0.008, pts[i][0] + S * 0.008, pts[i][1] + S * 0.008), fill=tuple(min(255, c + 60) for c in color))
    return img.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------- banner
def banner_image(bg_top, bg_bottom, shape, frame, lens, accent, flip=False):
    W, H = 1600, 600
    S = SS
    base = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 255))
    g = ImageDraw.Draw(base)
    for y in range(H * S):
        t = y / (H * S)
        g.line([(0, y), (W * S, y)], fill=tuple(int(bg_top[i] * (1 - t) + bg_bottom[i] * t) for i in range(3)) + (255,))
    deco = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    dd = ImageDraw.Draw(deco)
    dd.ellipse((1050 * S, -160 * S, 1750 * S, 540 * S), fill=accent + (255,))
    dd.ellipse((1180 * S, 330 * S, 1480 * S, 630 * S), fill=tuple(min(255, c + 25) for c in bg_bottom) + (255,))
    base.alpha_composite(deco)
    draw_glasses(base, 1150 * S, 300 * S, 1.05 * S, shape, frame, lens, width=1.1, shadow=False)
    out = base.resize((W, H), Image.LANCZOS)
    if flip:
        out = out.transpose(Image.FLIP_LEFT_RIGHT)
    return out


# ---------------------------------------------------------------- dữ liệu
CLEAR = ("clear",)
def dark(top=(35, 36, 40), bottom=(90, 82, 74)):
    return ("dark", top, bottom)
def mirror(top, bottom):
    return ("tint", top, bottom)

BLACK, TORT, GOLD, SILVER, NAVY, RED, GREEN, GRAY, WHITE_F = (24, 24, 26), (120, 70, 38), (186, 150, 70), (176, 182, 190), (28, 46, 90), (184, 36, 40), (36, 84, 64), (94, 98, 104), (236, 236, 236)

CATS = ["Kính cận", "Kính râm", "Kính chống ánh sáng xanh", "Kính trẻ em", "Phụ kiện"]

# (danh mục, tên, thương hiệu, giá, kiểu, màu gọng, tròng, loại gọng, chất liệu, mô tả)
GLASSES = [
    ("Kính cận", "Aster Round 01", "Aster", 59, "round", BLACK, CLEAR, "Tròn", "Acetate", "Gọng tròn cổ điển, nhẹ và ôm mặt. Phù hợp khuôn mặt vuông hoặc dài. Chiều rộng tròng 48 mm, cầu kính 20 mm."),
    ("Kính cận", "Aster Square 02", "Aster", 62, "square", TORT, CLEAR, "Vuông", "Acetate", "Gọng vuông bo góc màu đồi mồi, dễ phối đồ công sở. Chiều rộng tròng 52 mm, cầu kính 18 mm."),
    ("Kính cận", "Nobu Titan Slim", "Nobu", 119, "round", SILVER, CLEAR, "Tròn", "Titan", "Gọng titan siêu mảnh, trọng lượng chỉ 11 g, không gây dị ứng da. Có đệm mũi silicon điều chỉnh được."),
    ("Kính cận", "Halden Browline", "Halden", 89, "browline", BLACK, CLEAR, "Browline", "Kim loại và nhựa", "Viền mày dày kiểu retro, phần dưới tròng để trống cho cảm giác nhẹ. Hợp khuôn mặt tròn."),
    ("Kính cận", "Mira Cat-eye", "Mira", 74, "cat", RED, CLEAR, "Mắt mèo", "Acetate", "Gọng mắt mèo đỏ gạch, đuôi mắt nâng nhẹ giúp gương mặt thanh thoát. Phù hợp khuôn mặt trái xoan."),
    ("Kính cận", "Orbis Hex", "Orbis", 79, "hex", GOLD, CLEAR, "Lục giác", "Kim loại", "Gọng lục giác mạ vàng nhạt, phong cách hiện đại và nổi bật nhưng không rườm rà."),
    ("Kính cận", "Vela Rimless", "Vela", 109, "rimless", SILVER, CLEAR, "Không viền", "Titan", "Kiểu không viền gần như vô hình, trọng lượng 9 g. Tròng cắt theo yêu cầu, nên chọn tròng mỏng cho độ cận cao."),
    ("Kính cận", "Kobe Classic", "Kobe", 54, "square", NAVY, CLEAR, "Vuông", "Nhựa TR90", "Gọng nhựa TR90 dẻo, khó gãy, hợp học sinh sinh viên và người hay di chuyển."),
    ("Kính râm", "Solis Aviator", "Solis", 79, "aviator", GOLD, dark((40, 44, 38), (110, 100, 80)), "Phi công", "Kim loại", "Kính phi công gọng vàng, tròng xám khói chống tia UV400. Hợp khuôn mặt vuông và trái tim."),
    ("Kính râm", "Solis Wayfarer", "Solis", 69, "square", BLACK, dark(), "Vuông", "Acetate", "Dáng wayfarer kinh điển, tròng đen đậm chống chói tốt khi lái xe ban ngày."),
    ("Kính râm", "Reef Polarized", "Reef", 99, "square", TORT, mirror((60, 110, 130), (20, 60, 80)), "Vuông", "Nhựa TR90", "Tròng phân cực giảm chói mặt nước và mặt đường, phù hợp đi biển và câu cá."),
    ("Kính râm", "Dune Oversize", "Dune", 84, "round", BLACK, dark((50, 40, 34), (120, 96, 70)), "Tròn lớn", "Acetate", "Gọng tròn cỡ lớn che nắng rộng, tròng nâu trà dễ nhìn màu sắc tự nhiên."),
    ("Kính râm", "Noir Round", "Noir", 64, "round", GOLD, dark((30, 30, 34), (70, 70, 78)), "Tròn", "Kim loại", "Gọng tròn mảnh phong cách nghệ sĩ, tròng đen nhẹ, trọng lượng 18 g."),
    ("Kính râm", "Cabo Sport", "Cabo", 94, "shield", BLACK, mirror((190, 70, 40), (60, 24, 24)), "Ôm sát", "Nhựa TR90", "Kính thể thao tròng liền ôm sát, có đệm cao su chống trượt, dùng khi chạy bộ và đạp xe."),
    ("Kính râm", "Lido Cat-eye", "Lido", 72, "cat", WHITE_F, dark((70, 40, 44), (150, 100, 96)), "Mắt mèo", "Acetate", "Gọng mắt mèo trắng ngà, tròng nâu hồng, tạo cảm giác nhẹ nhàng cho trang phục mùa hè."),
    ("Kính râm", "Pico Shield", "Pico", 89, "shield", GRAY, mirror((70, 110, 170), (20, 30, 70)), "Ôm sát", "Nhựa TR90", "Tròng liền phản quang xanh, ôm cung mày giúp chắn gió và bụi khi đi xe máy."),
    ("Kính chống ánh sáng xanh", "Lumi Office 01", "Lumi", 39, "square", BLACK, ("tint", (205, 225, 245), (232, 242, 252)), "Vuông", "Nhựa TR90", "Tròng lọc ánh sáng xanh từ màn hình, giảm mỏi mắt khi làm việc máy tính nhiều giờ. Không độ."),
    ("Kính chống ánh sáng xanh", "Lumi Office 02", "Lumi", 42, "round", GRAY, ("tint", (205, 225, 245), (232, 242, 252)), "Tròn", "Nhựa TR90", "Kiểu tròn nhẹ 14 g, tròng phủ lớp lọc xanh tím, có thể đặt thêm độ cận."),
    ("Kính chống ánh sáng xanh", "Lumi Gamer", "Lumi", 49, "hex", BLACK, ("tint", (190, 215, 245), (225, 236, 250)), "Lục giác", "Nhựa", "Gọng cứng cáp cho buổi chơi game dài, tròng lọc xanh và chống chói."),
    ("Kính chống ánh sáng xanh", "Clarity Slim", "Clarity", 59, "browline", SILVER, ("tint", (205, 225, 245), (232, 242, 252)), "Browline", "Kim loại", "Gọng kim loại mảnh, lớp phủ chống xước và chống bám vân tay, phù hợp dân văn phòng."),
    ("Kính chống ánh sáng xanh", "Clarity Cat", "Clarity", 56, "cat", NAVY, ("tint", (205, 225, 245), (232, 242, 252)), "Mắt mèo", "Acetate", "Mắt mèo xanh navy, lọc ánh sáng xanh và có lớp phủ giảm lóa đèn LED."),
    ("Kính trẻ em", "Kiddo Round", "Kiddo", 34, "kids", RED, CLEAR, "Tròn", "Silicone", "Gọng silicone mềm dẻo, bẻ cong không gãy, phù hợp bé từ 4 đến 8 tuổi. Có dây giữ sau đầu."),
    ("Kính trẻ em", "Kiddo Square", "Kiddo", 36, "kids", NAVY, CLEAR, "Vuông", "Silicone", "Gọng vuông xanh navy, nhẹ 12 g, bản lề đàn hồi chịu được va chạm khi chơi."),
    ("Kính trẻ em", "Kiddo Sun", "Kiddo", 29, "kids", GREEN, dark((50, 60, 54), (120, 130, 110)), "Vuông", "Silicone", "Kính râm cho trẻ, tròng chống UV400, gọng xanh lá mềm không làm đau tai."),
    ("Kính trẻ em", "Kiddo Cat", "Kiddo", 38, "cat", RED, CLEAR, "Mắt mèo", "Silicone", "Kiểu mắt mèo đỏ vui mắt cho bé gái, có đệm mũi mềm chống trượt."),
]
ACCESSORIES = [
    ("Phụ kiện", "Hộp kính cứng", "Eyewear Shop", 12, "case", (40, 44, 52), "Hộp", "Vải bọc EVA", "Hộp cứng chống va đập, lót nhung mềm, vừa hầu hết gọng kính cận và kính râm."),
    ("Phụ kiện", "Hộp kính gấp gọn", "Eyewear Shop", 9, "case2", (132, 52, 48), "Hộp", "Da PU", "Hộp mỏng bỏ vừa túi áo, đóng mở bằng khóa kéo, phù hợp mang theo hằng ngày."),
    ("Phụ kiện", "Khăn lau microfiber", "Eyewear Shop", 4, "cloth", (206, 216, 224), "Khăn", "Microfiber", "Khăn sợi siêu mịn lau sạch dầu và vân tay mà không làm xước tròng."),
    ("Phụ kiện", "Dung dịch vệ sinh 60 ml", "Eyewear Shop", 6, "spray", (217, 43, 38), "Chai xịt", "Dung dịch", "Chai xịt làm sạch tròng kính, bay hơi nhanh, không để lại vết, dùng được cho lớp phủ chống chói."),
    ("Phụ kiện", "Dây đeo kính", "Eyewear Shop", 7, "strap", (60, 64, 70), "Dây", "Cotton và kim loại", "Dây đeo cổ giữ kính khi vận động, có đầu cao su ôm gọng chắc chắn."),
]

STOCK = {  # tồn kho đã chọn để trang tổng quan có cả hàng sắp hết và hết hàng
    "Aster Round 01": 24, "Aster Square 02": 18, "Nobu Titan Slim": 9, "Halden Browline": 14, "Mira Cat-eye": 4, "Orbis Hex": 11,
    "Vela Rimless": 7, "Kobe Classic": 30, "Solis Aviator": 16, "Solis Wayfarer": 22, "Reef Polarized": 3, "Dune Oversize": 12,
    "Noir Round": 0, "Cabo Sport": 10, "Lido Cat-eye": 13, "Pico Shield": 8, "Lumi Office 01": 40, "Lumi Office 02": 35,
    "Lumi Gamer": 5, "Clarity Slim": 19, "Clarity Cat": 15, "Kiddo Round": 20, "Kiddo Square": 17, "Kiddo Sun": 6, "Kiddo Cat": 12,
    "Hộp kính cứng": 80, "Hộp kính gấp gọn": 60, "Khăn lau microfiber": 150, "Dung dịch vệ sinh 60 ml": 70, "Dây đeo kính": 45,
}


def main():
    products = []
    for cat, name, brand, price, shape, frame, lens, ftype, material, desc in GLASSES:
        img = glasses_image(shape, frame, lens, width=0.85 if shape == "kids" else 1.0)
        products.append(dict(category=cat, name=name, brand=brand, price=price, stock=STOCK[name], frameType=ftype, material=material, description=desc, image=b64(img, 78)))
    for cat, name, brand, price, kind, color, ftype, material, desc in ACCESSORIES:
        img = {"case": lambda: case_image(color), "case2": lambda: case_image(color, folding=True), "cloth": lambda: cloth_image(color),
               "spray": lambda: spray_image(color), "strap": lambda: strap_image(color)}[kind]()
        products.append(dict(category=cat, name=name, brand=brand, price=price, stock=STOCK[name], frameType=ftype, material=material, description=desc, image=b64(img, 78)))

    banners = [
        dict(title="Bộ sưu tập kính cận mới", subtitle="Gọng acetate và titan nhiều kiểu dáng, giá từ $54.", cta="Xem kính cận", linkCategory="Kính cận", sortOrder=1,
             image=b64(banner_image((18, 18, 20), (44, 44, 50), "round", (244, 244, 244), CLEAR, (217, 43, 38)), 80)),
        dict(title="Kính râm chống UV400", subtitle="Tròng phân cực và phản quang cho ngày nắng gắt.", cta="Xem kính râm", linkCategory="Kính râm", sortOrder=2,
             image=b64(banner_image((120, 22, 24), (186, 36, 40), "aviator", (24, 24, 26), dark(), (24, 24, 26)), 80)),
        dict(title="Làm việc dài giờ, bớt mỏi mắt", subtitle="Kính lọc ánh sáng xanh cho dân văn phòng, từ $39.", cta="Xem kính lọc xanh", linkCategory="Kính chống ánh sáng xanh", sortOrder=3,
             image=b64(banner_image((16, 24, 34), (34, 52, 70), "square", (244, 244, 244), ("tint", (150, 190, 235), (90, 130, 200)), (217, 43, 38)), 80)),
    ]
    out = os.path.join(HERE, "data.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(dict(categories=CATS, products=products, banners=banners), f, ensure_ascii=False)
    print("ghi xong", os.path.basename(out), round(os.path.getsize(out) / 1024), "KB,", len(products), "san pham,", len(banners), "banner")


if __name__ == "__main__":
    main()
