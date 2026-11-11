"""
Tạo data.json: danh mục, sản phẩm và banner mẫu kèm ảnh thật.

Ảnh lấy từ Wikimedia Commons theo danh sách trong photos.json (giấy phép CC0, CC BY, CC BY-SA hoặc phạm vi công cộng).
Tên người chụp, giấy phép và đường dẫn nguồn của từng ảnh được ghi ở docs/ANH_NGUON.md và trong data.json.
Tên mẫu và giá là dữ liệu trình diễn tham khảo theo thị trường, không phải bảng giá chính thức của hãng.
Ảnh minh họa đúng loại kính nhưng không nhất thiết là đúng màu hoặc đúng cỡ của sản phẩm trong mô tả.

Chạy: python make_data.py   (cần Pillow và kết nối mạng)
Chỉ cần chạy lại khi muốn đổi nội dung mẫu; seed.js đọc data.json đã có sẵn.
"""
import base64
import io
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "EyewearShopSchoolProject/1.0 (student web project)"
PHOTOS = json.load(open(os.path.join(HERE, "photos.json"), encoding="utf-8"))


CACHE = os.path.join(HERE, ".cache")
os.makedirs(CACHE, exist_ok=True)


def get(url, retries=8):
    """Tải về, thử lại khi mạng chập chờn hoặc bị giới hạn tốc độ (HTTP 429)."""
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if i == retries - 1:
                raise
            time.sleep(60 if e.code == 429 else 5 * (i + 1))
        except Exception:  # noqa: BLE001
            if i == retries - 1:
                raise
            time.sleep(5 * (i + 1))


def fetch(title, width):
    """Lấy ảnh thu nhỏ từ Commons; lưu vào thư mục .cache để lần chạy sau không tải lại."""
    path = os.path.join(CACHE, re.sub(r"[^A-Za-z0-9._-]", "_", title) + f"_{width}.jpg")
    if os.path.exists(path):
        return Image.open(path).convert("RGB")
    qs = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": width, "format": "json"})
    info = list(json.loads(get("https://commons.wikimedia.org/w/api.php?" + qs))["query"]["pages"].values())[0]["imageinfo"][0]
    time.sleep(1.5)
    data = get(info.get("thumburl") or info["url"])
    img = Image.open(io.BytesIO(data)).convert("RGB")
    img.save(path, "JPEG", quality=90)
    time.sleep(1.5)
    return img


def crop_to(img, ratio, fx=0.5, fy=0.5):
    """Cắt ảnh về tỉ lệ ratio (rộng/cao); fx, fy là vị trí tâm khung cắt theo tỉ lệ 0..1."""
    w, h = img.size
    if w / h > ratio:
        cw, ch = int(h * ratio), h
    else:
        cw, ch = w, int(w / ratio)
    x0 = int((w - cw) * fx)
    y0 = int((h - ch) * fy)
    return img.crop((x0, y0, x0 + cw, y0 + ch))


def fit_43(img, width=800, height=600):
    """Đưa ảnh về khung 4:3. Ảnh gần 4:3 thì cắt nhẹ hai bên; ảnh quá dài hoặc quá cao thì giữ nguyên toàn bộ,
    phần thừa là nền cùng ảnh được làm mờ, để không bao giờ cắt mất kính."""
    w, h = img.size
    ratio = w / h
    if 4 / 3 <= ratio <= 1.55:
        return crop_to(img, width / height).resize((width, height), Image.LANCZOS)
    bg = crop_to(img, width / height).resize((width, height), Image.LANCZOS).filter(ImageFilter.GaussianBlur(width / 16))
    scale = min(width / w, height / h)
    fg = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    bg.paste(fg, ((width - fg.size[0]) // 2, (height - fg.size[1]) // 2))
    return bg


def b64(img, quality):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    return base64.b64encode(buf.getvalue()).decode()


def clean_artist(a):
    return re.sub(r"\s+", " ", a or "").strip(" -") or "Auckland War Memorial Museum"


CATS = ["Kính cận", "Kính râm", "Kính chống ánh sáng xanh", "Phụ kiện"]
HOUSE = "Eyewear Shop"

# (danh mục, tên, thương hiệu, giá VNĐ, tồn kho, loại gọng, chất liệu, mô tả, khóa ảnh, (fx, fy) vị trí khung cắt vuông)
P = [
    ("Kính râm", "Ray-Ban Aviator Shooter RB3139", "Ray-Ban", 4890000, 14, "Phi công", "Kim loại", "Kiểu phi công có cầu mày da, cỡ 62 mm, tròng kính khoáng G-15 xanh lục chống chói và ngăn tia UV. Mẫu kinh điển cho người thích phong cách cổ điển.", "shooterG15", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Aviator Shooter Bạc", "Ray-Ban", 4990000, 9, "Phi công", "Kim loại", "Gọng kim loại mạ bạc, cầu mày giả đồi mồi, tròng xám trung tính cho màu sắc không bị lệch. Nên chọn khi lái xe đường dài.", "shooterGray", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Outdoorsman B-20 Chromax", "Ray-Ban", 4590000, 6, "Phi công", "Kim loại", "Dòng Outdoorsman với thanh chắn mày và tròng B-20 Chromax tăng độ tương phản khi đi ngoài trời, hợp đi leo núi và dã ngoại.", "outdoorsman", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban New Wayfarer RB2132", "Ray-Ban", 3790000, 21, "Wayfarer", "Nhựa Acetate", "Phiên bản Wayfarer nhỏ gọn hơn bản gốc, tròng chuyển màu xám, gọng đen ôm mặt. Hợp khuôn mặt trái xoan và tròn.", "newWayfarer", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Original Wayfarer RB2140", "Ray-Ban", 3990000, 30, "Wayfarer", "Nhựa Acetate", "Mẫu Wayfarer gốc ra đời từ năm 1952, gọng đen bóng, tròng G-15 xanh lục. Có hai cỡ 50 mm và 54 mm.", "wayfarer", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Wayfarer 5022 Đồi mồi", "Ray-Ban", 3990000, 17, "Wayfarer", "Nhựa Acetate", "Gọng Wayfarer vân đồi mồi nâu, tròng xanh lục đậm. Màu gọng ấm, dễ phối với trang phục thường ngày.", "wayfarer5022", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Wayfarer Đồi mồi cổ điển", "Ray-Ban", 4290000, 3, "Wayfarer", "Nhựa Acetate", "Kiểu Wayfarer dày bản màu đồi mồi theo phong cách thập niên 80. Số lượng ít nên có thể hết nhanh.", "nomad", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Clubmaster Metal RB3716", "Ray-Ban", 4590000, 11, "Browline", "Nhựa và kim loại", "Viền mày đen kết hợp gọng kim loại vàng, tròng xanh lục G-15. Phong cách retro lịch sự, hợp mặc đồ công sở.", "clubMetal", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Clubmaster RB3016 Tròng gương", "Ray-Ban", 3890000, 16, "Browline", "Nhựa và kim loại", "Clubmaster bản gốc gọng đồi mồi, tròng tráng gương phản chiếu giúp giảm chói khi trời nắng gắt.", "club3016", (0.5, 0.5)),
    ("Kính râm", "Ray-Ban Round Fleck RB2447", "Ray-Ban", 3690000, 8, "Tròn", "Nhựa Acetate", "Gọng tròn vân đồi mồi, tròng nâu, đường kính tròng 49 mm. Hợp khuôn mặt vuông hoặc dài.", "roundIcons", (0.5, 0.5)),
    ("Kính râm", "Oakley Juliet", "Oakley", 7490000, 2, "Thể thao", "Hợp kim X-Metal", "Gọng hợp kim X-Metal nổi tiếng của Oakley, tròng Ruby Iridium tráng gương hồng. Hàng sưu tầm, còn rất ít.", "juliet", (0.5, 0.5)),
    ("Kính râm", "Oakley Half Wire", "Oakley", 3290000, 0, "Nửa gọng", "Hợp kim", "Gọng nửa viền siêu nhẹ, tròng nâu đồng tăng độ tương phản. Hiện đang hết hàng, dự kiến nhập thêm.", "halfWire", (0.5, 0.5)),
    ("Kính râm", "Oakley Mars", "Oakley", 5990000, 5, "Thể thao", "Hợp kim", "Kiểu thể thao một khối tròng phản quang cam, ôm sát mặt để chắn gió và bụi khi đạp xe hoặc chạy bộ.", "mars", (0.5, 0.5)),
    ("Kính râm", "Alt-Ego Celestial Argent", "Alt-Ego", 2690000, 12, "Thể thao", "Nhựa TR90", "Kính thể thao tròng liền che rộng, tròng xám khói, thái dương có lỗ thoáng khí chống đọng hơi nước.", "celestial", (0.5, 0.5)),
    ("Kính râm", "Kính râm Retro đỏ", HOUSE, 690000, 40, "Vuông", "Nhựa", "Gọng đỏ phong cách retro, tròng nâu chống UV400, giá dễ mua cho người mới thử kính râm.", "retro", (0.5, 0.5)),
    ("Kính cận", "Ray-Ban Optics Gọng kim loại tròn", "Ray-Ban", 3490000, 12, "Tròn", "Kim loại", "Gọng cận kim loại đen mảnh, kiểu tròn hơi oval, đệm mũi silicon thay được. Lắp được tròng cận, viễn và loạn.", "rbOptics", (0.5, 0.5)),
    ("Kính cận", "JINS Titanium MTF-16S", "JINS", 1990000, 25, "Chữ nhật", "Titan", "Gọng titan đen siêu nhẹ chỉ khoảng 10 g, không gây dị ứng da. Kiểu chữ nhật mảnh hợp môi trường công sở.", "jins", (0.5, 0.5)),
    ("Kính cận", "ALOOK AKALK-223", "ALOOK", 1290000, 34, "Chữ nhật", "Nhựa TR90", "Gọng nhựa dẻo TR90 màu đen, chịu uốn tốt, giá hợp lý cho học sinh sinh viên.", "alook", (0.5, 0.5)),
    ("Kính cận", "l.a.Eyeworks Gọng nhựa xanh tím", "l.a.Eyeworks", 2490000, 18, "Chữ nhật", "Nhựa Acetate", "Gọng chữ nhật bản mỏng phối hai màu tím và xanh, càng cong tạo điểm nhấn. Dành cho người thích gọng cá tính.", "folding", (0.5, 0.5)),
    ("Kính cận", "Gọng kim loại đa tròng", HOUSE, 1590000, 10, "Chữ nhật", "Kim loại", "Gọng kim loại bản rộng phù hợp lắp tròng đa tròng cho người trên 40 tuổi, thấy rõ cả gần lẫn xa.", "progressive", (0.5, 0.5)),
    ("Kính cận", "Gọng tròn mạ vàng cổ điển 01", HOUSE, 890000, 22, "Tròn", "Kim loại mạ vàng", "Gọng tròn mảnh mạ vàng theo phong cách cổ điển, càng cong ôm tai. Hợp khuôn mặt vuông.", "gold1", (0.5, 0.5)),
    ("Kính cận", "Gọng tròn mạ vàng cổ điển 02", HOUSE, 950000, 15, "Tròn", "Kim loại mạ vàng", "Gọng tròn mạ vàng có đầu càng bọc đồi mồi, nhẹ và thanh mảnh.", "gold2", (0.5, 0.5)),
    ("Kính cận", "Gọng tròn mạ vàng cổ điển 03", HOUSE, 920000, 13, "Tròn", "Kim loại mạ vàng", "Gọng tròn nhỏ mạ vàng, cầu kính cao, hợp người có sống mũi cao.", "gold3", (0.5, 0.5)),
    ("Kính cận", "Gọng tròn viền đồi mồi", HOUSE, 1090000, 9, "Tròn", "Kim loại và nhựa", "Viền tròn bằng nhựa vân đồi mồi, càng kim loại vàng, tạo cảm giác cổ điển ấm áp.", "tortoise", (0.5, 0.5)),
    ("Kính chống ánh sáng xanh", "Kính lọc ánh sáng xanh gọng đen", HOUSE, 590000, 45, "Chữ nhật", "Nhựa TR90", "Tròng lọc một phần ánh sáng xanh từ màn hình, giảm mỏi mắt khi làm việc máy tính nhiều giờ. Có thể lắp tròng không độ.", "office", (0.5, 0.5)),
    ("Kính chống ánh sáng xanh", "Kính chơi game gọng đen", HOUSE, 690000, 4, "Chữ nhật", "Nhựa", "Gọng đen mảnh nhẹ, tròng phủ lớp lọc ánh sáng xanh và chống chói đèn màn hình khi chơi game hoặc code ban đêm.", "keyboard", (0.5, 0.5)),
    ("Phụ kiện", "Hộp kính cứng Ray-Ban", "Ray-Ban", 450000, 60, "Hộp", "Vỏ cứng bọc da", "Hộp đựng kính vỏ cứng chống va đập, lót nhung mềm, có logo Ray-Ban. Vừa hầu hết kính cận và kính râm cỡ trung.", "caseRB", (0.5, 0.5)),
    ("Phụ kiện", "Hộp kính cứng đỏ Hans Anders", "Hans Anders", 120000, 80, "Hộp", "Vỏ cứng", "Hộp cứng màu đỏ in logo chuỗi cửa hàng kính Hans Anders, đóng mở bằng khóa bấm, bảo vệ kính khi bỏ vào túi xách hoặc balo.", "caseRed", (0.5, 0.5)),
    ("Phụ kiện", "Hộp kính da màu nâu", HOUSE, 160000, 35, "Hộp", "Da tổng hợp", "Hộp kính vỏ cứng bọc da màu nâu, phong cách cổ điển, hợp với gọng kim loại và gọng tròn.", "caseBrown", (0.5, 0.5)),
    ("Phụ kiện", "Hộp kính màu đen", HOUSE, 99000, 90, "Hộp", "Vỏ cứng", "Hộp kính đen gọn nhẹ, bề mặt nhám chống trượt, là lựa chọn tiết kiệm cho kính cận hằng ngày.", "caseBlack", (0.5, 0.5)),
]

B = [
    dict(title="Ray-Ban Wayfarer mới về", subtitle="Wayfarer, Clubmaster và Aviator, giá từ 3.290.000 ₫.", cta="Xem kính râm", linkCategory="Kính râm", sortOrder=1, photo="banVenice", focus=(0.5, 0.95), flip=False),
    dict(title="Kính râm cho mùa nắng", subtitle="Tròng chống UV400, gọng kim loại và nhựa nhiều kiểu.", cta="Chọn kính râm", linkCategory="Kính râm", sortOrder=2, photo="banTable", focus=(0.5, 0.55), flip=False),
    dict(title="Làm việc dài giờ, bớt mỏi mắt", subtitle="Kính lọc ánh sáng xanh cho dân văn phòng và game thủ, từ 590.000 ₫.", cta="Xem kính lọc xanh", linkCategory="Kính chống ánh sáng xanh", sortOrder=3, photo="keyboard", focus=(0.5, 0.75), flip=False),
]


def main():
    cache = {}

    def photo(key, width):
        if (key, width) not in cache:
            cache[(key, width)] = fetch(PHOTOS[key]["title"], width)
            print("  tai", key)
        return cache[(key, width)]

    products = []
    for cat, name, brand, price, stock, ftype, material, desc, key, (fx, fy) in P:
        img = fit_43(photo(key, 960))
        products.append(dict(category=cat, name=name, brand=brand, price=price, stock=stock, frameType=ftype, material=material, description=desc, image=b64(img, 78), photo=key))

    banners = []
    for b in B:
        img = crop_to(photo(b["photo"], 1920), 1600 / 600, 0.5, b["focus"][1]).resize((1600, 600), Image.LANCZOS)
        if b["flip"]:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        banners.append(dict(title=b["title"], subtitle=b["subtitle"], cta=b["cta"], linkCategory=b["linkCategory"], sortOrder=b["sortOrder"], image=b64(img, 74), photo=b["photo"]))

    used = sorted({p["photo"] for p in products} | {b["photo"] for b in banners})
    credits = [dict(photo=k, file=PHOTOS[k]["title"].replace("File:", ""), page=PHOTOS[k]["page"], license=PHOTOS[k]["license"], author=clean_artist(PHOTOS[k]["artist"])) for k in used]

    out = os.path.join(HERE, "data.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(dict(categories=CATS, products=products, banners=banners, credits=credits), f, ensure_ascii=False)
    print("ghi xong", os.path.basename(out), round(os.path.getsize(out) / 1024), "KB,", len(products), "san pham,", len(banners), "banner")

    # file ghi nguồn ảnh để đưa vào tài liệu
    lines = ["# Nguồn ảnh dữ liệu mẫu", "",
             "Ảnh sản phẩm và banner trong dữ liệu mẫu lấy từ Wikimedia Commons. Mỗi ảnh được cắt khung và thu nhỏ, không chỉnh sửa nội dung. "
             "Giấy phép CC BY và CC BY-SA yêu cầu ghi tên tác giả và nguồn, thông tin đó nằm trong bảng dưới đây.", "",
             "| Ảnh | Tác giả | Giấy phép | Nguồn |", "|---|---|---|---|"]
    for c in credits:
        lines.append(f"| {c['file']} | {c['author']} | {c['license']} | {c['page']} |")
    docs = os.path.join(HERE, "..", "..", "docs", "ANH_NGUON.md")
    open(docs, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("ghi", os.path.normpath(docs))


if __name__ == "__main__":
    main()
