from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path("/home/neil/fragmented-game")
ASSET_DIR = ROOT / "public/assets/generated"
ASSET_DIR.mkdir(parents=True, exist_ok=True)


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def crop_alpha(img: Image.Image, padding: int = 0) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(img.width, x1 + padding)
    y1 = min(img.height, y1 + padding)
    return img.crop((x0, y0, x1, y1))


def whiten_to_alpha(img: Image.Image, cutoff: int = 245) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if r >= cutoff and g >= cutoff and b >= cutoff:
                px[x, y] = (255, 255, 255, 0)
            else:
                px[x, y] = (r, g, b, 255)
    return img


def tint(img: Image.Image, color: tuple[int, int, int], amount: float) -> Image.Image:
    base = img.convert("RGBA")
    overlay = Image.new("RGBA", base.size, (*color, 0))
    alpha = base.getchannel("A").point(lambda a: int(a * amount))
    overlay.putalpha(alpha)
    return Image.alpha_composite(base, overlay)


def scale_frame(img: Image.Image, x_scale: float = 1.0, y_scale: float = 1.0) -> Image.Image:
    w = max(1, round(img.width * x_scale))
    h = max(1, round(img.height * y_scale))
    scaled = img.resize((w, h), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", img.size, (0, 0, 0, 0))
    offset_x = (img.width - w) // 2
    offset_y = img.height - h
    canvas.paste(scaled, (offset_x, offset_y), scaled)
    return canvas


def shift_frame(img: Image.Image, dx: int = 0, dy: int = 0) -> Image.Image:
    canvas = Image.new("RGBA", img.size, (0, 0, 0, 0))
    canvas.paste(img, (dx, dy), img)
    return canvas


def smear_frame(img: Image.Image, length: int, color: tuple[int, int, int], alpha: int = 120, dx: int = -8, dy: int = 2) -> Image.Image:
    canvas = Image.new("RGBA", img.size, (0, 0, 0, 0))
    for idx in range(length):
        ghost = tint(img, color, 0.16)
        ghost.putalpha(ghost.getchannel("A").point(lambda a: min(alpha, a)))
        canvas.alpha_composite(ghost, dest=(idx * dx, idx * dy))
    canvas.alpha_composite(img)
    return canvas


def fade_frame(img: Image.Image, alpha_scale: float) -> Image.Image:
    out = img.copy()
    out.putalpha(out.getchannel("A").point(lambda a: int(a * alpha_scale)))
    return out


def pad_sheet(frames: Iterable[Image.Image], cell_w: int | None = None, cell_h: int | None = None) -> tuple[list[Image.Image], int, int]:
    frames = list(frames)
    target_w = cell_w or max(frame.width for frame in frames)
    target_h = cell_h or max(frame.height for frame in frames)
    padded: list[Image.Image] = []
    for frame in frames:
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        x = (target_w - frame.width) // 2
        y = target_h - frame.height
        canvas.paste(frame, (x, y), frame)
        padded.append(canvas)
    return padded, target_w, target_h


def save_sheet(path: Path, frames: Iterable[Image.Image], cell_w: int | None = None, cell_h: int | None = None) -> tuple[int, int, int]:
    padded, frame_w, frame_h = pad_sheet(list(frames), cell_w, cell_h)
    sheet = Image.new("RGBA", (frame_w * len(padded), frame_h), (0, 0, 0, 0))
    for index, frame in enumerate(padded):
        sheet.paste(frame, (index * frame_w, 0), frame)
    sheet.save(path)
    return len(padded), frame_w, frame_h


def save_single(path: Path, img: Image.Image, width: int | None = None, height: int | None = None) -> None:
    if width and height:
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        x = (width - img.width) // 2
        y = height - img.height
        canvas.paste(img, (x, y), img)
        canvas.save(path)
        return
    img.save(path)


def extract_charlie_frames() -> list[Image.Image]:
    src = whiten_to_alpha(
        load_rgba(
            Path(
                "/home/neil/.codex/generated_images/019da6f1-952a-7c72-a36f-0e4521a7fc8a/ig_0d98541be22f3d910169e54db7059c819b929ea3df768f296a.png"
            )
        )
    )
    boxes = [
        (90, 310, 225, 760),
        (260, 300, 430, 760),
        (435, 285, 635, 760),
        (915, 320, 1055, 760),
        (1115, 320, 1245, 760),
        (1288, 320, 1440, 760),
    ]
    return [crop_alpha(src.crop(box), 6) for box in boxes]


def generate_charlie_sheet() -> None:
    idle, run_a, run_b, dash_src, slash_src, charge_src = extract_charlie_frames()
    run_c = shift_frame(scale_frame(run_a, 1.02, 0.99), 6, 0)
    run_d = shift_frame(scale_frame(run_b, 0.98, 1.0), -5, -1)
    jump = shift_frame(scale_frame(run_b, 0.98, 1.0), 0, -20)
    fall = shift_frame(scale_frame(run_b, 1.01, 0.98), 0, -4)
    slash_a = shift_frame(scale_frame(slash_src, 0.96, 1.0), -8, 0)
    slash_b = smear_frame(scale_frame(slash_src, 1.05, 0.98), 2, (255, 144, 82), 100)
    slash_c = shift_frame(scale_frame(slash_src, 1.03, 0.96), 8, 0)
    pulse_a = tint(scale_frame(run_a, 0.99, 1.0), (110, 214, 255), 0.14)
    pulse_b = tint(smear_frame(scale_frame(run_a, 1.02, 0.98), 2, (120, 214, 255), 90, dx=-4, dy=0), (230, 250, 255), 0.08)
    dash_a = smear_frame(scale_frame(dash_src, 1.05, 0.98), 3, (124, 194, 255), 90)
    dash_b = smear_frame(scale_frame(dash_src, 1.08, 0.95), 4, (124, 194, 255), 75)
    parry_a = tint(scale_frame(dash_src, 0.98, 1.0), (255, 235, 170), 0.12)
    parry_b = tint(scale_frame(dash_src, 1.02, 0.98), (255, 248, 214), 0.18)
    charge_a = tint(scale_frame(charge_src, 0.98, 1.0), (255, 184, 108), 0.08)
    charge_b = tint(scale_frame(charge_src, 1.0, 1.02), (255, 208, 146), 0.16)
    charge_c = smear_frame(tint(scale_frame(charge_src, 1.03, 0.98), (255, 184, 108), 0.14), 2, (255, 184, 108), 90, dx=-5, dy=0)
    hit = tint(scale_frame(idle, 1.02, 0.95), (255, 210, 210), 0.18)
    death_a = fade_frame(scale_frame(charge_src, 1.04, 0.9), 0.72)
    death_b = fade_frame(scale_frame(charge_src, 1.06, 0.82), 0.4)
    frames = [
        idle,
        shift_frame(idle, 0, -2),
        run_a,
        run_b,
        run_c,
        run_d,
        jump,
        fall,
        slash_a,
        slash_b,
        slash_c,
        pulse_a,
        pulse_b,
        dash_a,
        dash_b,
        parry_a,
        parry_b,
        charge_a,
        charge_b,
        charge_c,
        hit,
        death_a,
        death_b,
    ]
    save_sheet(ASSET_DIR / "charlie_sheet_final.png", frames, 220, 320)


def generate_enemy_sheet(src_name: str, out_name: str, color: tuple[int, int, int], mode: str, cell_w: int, cell_h: int) -> None:
    src = crop_alpha(load_rgba(ASSET_DIR / src_name), 4)
    idle = src
    idle_b = shift_frame(src, 0, -4)
    move_a = shift_frame(scale_frame(src, 0.97, 1.0), -4, -2)
    move_b = shift_frame(scale_frame(src, 1.03, 0.98), 5, 0)
    move_c = shift_frame(scale_frame(src, 0.99, 1.0), 2, -1)
    tele_a = tint(scale_frame(src, 0.95, 1.03), color, 0.14)
    tele_b = tint(scale_frame(src, 0.93, 1.04), color, 0.2)
    if mode == "hound":
        attack_a = shift_frame(scale_frame(src, 1.02, 1.0), 10, -2)
        attack_b = shift_frame(scale_frame(src, 1.1, 0.95), 18, -8)
    elif mode == "brute":
        attack_a = shift_frame(scale_frame(src, 1.03, 0.98), 6, 0)
        attack_b = smear_frame(scale_frame(src, 1.08, 0.96), 2, color, 100, dx=-6, dy=0)
    else:
        attack_a = shift_frame(scale_frame(src, 1.02, 0.98), 8, -1)
        attack_b = smear_frame(scale_frame(src, 1.06, 0.97), 2, color, 90, dx=-4, dy=1)
    hit = tint(scale_frame(src, 1.02, 0.94), (255, 240, 210), 0.18)
    death_a = fade_frame(scale_frame(src, 1.02, 0.92), 0.7)
    death_b = fade_frame(scale_frame(src, 1.05, 0.82), 0.38)
    frames = [idle, idle_b, move_a, move_b, move_c, tele_a, tele_b, attack_a, attack_b, hit, death_a, death_b]
    save_sheet(ASSET_DIR / out_name, frames, cell_w, cell_h)


def generate_warden_sheet() -> None:
    src = crop_alpha(load_rgba(ASSET_DIR / "warden_generated.png"), 8)
    idle = src
    idle_b = shift_frame(src, 0, -6)
    move_a = shift_frame(scale_frame(src, 0.99, 1.0), -5, -2)
    move_b = shift_frame(scale_frame(src, 1.03, 0.98), 5, 0)
    move_c = shift_frame(scale_frame(src, 1.01, 0.99), 2, -1)
    cast_a = tint(scale_frame(src, 0.98, 1.02), (255, 176, 102), 0.16)
    cast_b = smear_frame(scale_frame(src, 1.04, 0.98), 3, (255, 186, 90), 100)
    cast_c = tint(smear_frame(scale_frame(src, 1.06, 0.97), 2, (255, 196, 118), 100, dx=-5, dy=1), (255, 224, 188), 0.08)
    dash_a = shift_frame(scale_frame(src, 1.08, 0.94), 10, -4)
    dash_b = smear_frame(scale_frame(src, 1.1, 0.92), 4, (255, 168, 88), 90, dx=-8, dy=0)
    phase_a = tint(scale_frame(src, 1.02, 1.02), (110, 180, 255), 0.18)
    phase_b = tint(scale_frame(src, 1.05, 1.0), (176, 216, 255), 0.22)
    hit = tint(scale_frame(src, 1.03, 0.94), (255, 235, 210), 0.16)
    death_a = fade_frame(scale_frame(src, 1.04, 0.9), 0.72)
    death_b = fade_frame(scale_frame(src, 1.08, 0.8), 0.42)
    frames = [idle, idle_b, move_a, move_b, move_c, cast_a, cast_b, cast_c, dash_a, dash_b, phase_a, phase_b, hit, death_a, death_b]
    save_sheet(ASSET_DIR / "warden_sheet_final.png", frames, 286, 360)


def generate_fx_sheets() -> None:
    fx_dir = ASSET_DIR

    slash_frames: list[Image.Image] = []
    for idx, size in enumerate((132, 154, 176, 150, 120)):
        frame = Image.new("RGBA", (220, 160), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        bbox = (20, 30 + idx * 2, 20 + size, 120)
        draw.arc(bbox, 212, 330, fill=(255, 113, 64, 220), width=18)
        draw.arc((bbox[0] + 8, bbox[1] + 4, bbox[2] - 14, bbox[3] - 10), 214, 326, fill=(255, 222, 168, 210), width=8)
        slash_frames.append(frame)
    save_sheet(fx_dir / "fx_slash_sheet.png", slash_frames, 220, 160)

    pulse_frames: list[Image.Image] = []
    for idx, radius in enumerate((26, 44, 70, 92, 110)):
        frame = Image.new("RGBA", (260, 220), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        alpha = max(70, 220 - idx * 28)
        draw.ellipse((130 - radius, 110 - radius, 130 + radius, 110 + radius), outline=(110, 210, 255, alpha), width=10)
        draw.ellipse((130 - radius // 2, 110 - radius // 2, 130 + radius // 2, 110 + radius // 2), outline=(218, 246, 255, alpha), width=5)
        pulse_frames.append(frame.filter(ImageFilter.GaussianBlur(radius=0.4)))
    save_sheet(fx_dir / "fx_pulse_sheet.png", pulse_frames, 260, 220)

    dash_frames: list[Image.Image] = []
    for idx, width in enumerate((90, 130, 165, 190, 118)):
        frame = Image.new("RGBA", (240, 120), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        draw.rounded_rectangle((20, 48, 20 + width, 72), 10, fill=(119, 188, 255, 110 + idx * 18))
        draw.rounded_rectangle((20, 54, 20 + max(28, width - 28), 66), 10, fill=(220, 244, 255, 170))
        dash_frames.append(frame.filter(ImageFilter.GaussianBlur(radius=1.0)))
    save_sheet(fx_dir / "fx_dash_sheet.png", dash_frames, 240, 120)

    parry_frames: list[Image.Image] = []
    for idx, radius in enumerate((16, 28, 40, 30, 18)):
        frame = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        draw.ellipse((80 - radius, 80 - radius, 80 + radius, 80 + radius), outline=(255, 234, 160, 220), width=6)
        draw.line((42, 80, 118, 80), fill=(255, 246, 210, 220), width=4)
        draw.line((80, 42, 80, 118), fill=(255, 246, 210, 220), width=4)
        parry_frames.append(frame)
    save_sheet(fx_dir / "fx_parry_sheet.png", parry_frames, 160, 160)

    hit_frames: list[Image.Image] = []
    for idx, radius in enumerate((18, 32, 24, 16, 10)):
        frame = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        color = (255, 206, 128, max(80, 220 - idx * 40))
        draw.ellipse((80 - radius, 80 - radius, 80 + radius, 80 + radius), fill=color)
        draw.line((80, 24, 80, 136), fill=(255, 240, 220, 220), width=4)
        draw.line((24, 80, 136, 80), fill=(255, 240, 220, 220), width=4)
        draw.line((36, 36, 124, 124), fill=(255, 240, 220, 180), width=3)
        draw.line((36, 124, 124, 36), fill=(255, 240, 220, 180), width=3)
        hit_frames.append(frame.filter(ImageFilter.GaussianBlur(radius=0.6)))
    save_sheet(fx_dir / "fx_hit_sheet.png", hit_frames, 160, 160)

    charge_frames: list[Image.Image] = []
    for idx, radius in enumerate((28, 52, 78, 96, 88, 72, 44)):
        frame = Image.new("RGBA", (260, 260), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        draw.ellipse((130 - radius, 130 - radius, 130 + radius, 130 + radius), outline=(255, 170, 98, max(70, 200 - idx * 18)), width=10)
        draw.ellipse((130 - radius // 2, 130 - radius // 2, 130 + radius // 2, 130 + radius // 2), outline=(255, 232, 186, max(60, 180 - idx * 20)), width=6)
        charge_frames.append(frame)
    save_sheet(fx_dir / "fx_charge_sheet.png", charge_frames, 260, 260)


def make_stage_tile(base: tuple[int, int, int], accent: tuple[int, int, int], crack: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (128, 64), (*base, 255))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, 127, 63), 8, fill=(*base, 255), outline=(240, 226, 198, 45), width=2)
    for offset in range(0, 128, 24):
        draw.line((offset, 0, offset - 8, 64), fill=(*crack, 120), width=3)
    for y in (16, 34, 48):
        draw.line((0, y, 128, y - 6), fill=(*accent, 60), width=2)
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.rectangle((0, 0, 128, 10), fill=(*accent, 38))
    return Image.alpha_composite(img, glow)


def make_stage_prop(theme: str) -> Image.Image:
    img = Image.new("RGBA", (160, 180), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if theme == "pixor":
        draw.rounded_rectangle((58, 44, 98, 170), 8, fill=(45, 51, 58, 220))
        draw.rounded_rectangle((34, 128, 126, 170), 10, fill=(38, 46, 52, 235))
        draw.rectangle((74, 18, 82, 54), fill=(224, 240, 222, 130))
        draw.ellipse((62, 10, 94, 42), fill=(114, 214, 198, 80))
    elif theme == "route":
        draw.polygon([(80, 12), (126, 44), (110, 84), (50, 84), (34, 44)], fill=(60, 72, 84, 225))
        draw.rounded_rectangle((64, 84, 96, 172), 10, fill=(43, 48, 56, 235))
        draw.line((80, 18, 80, 150), fill=(210, 238, 255, 70), width=4)
        draw.ellipse((56, 30, 104, 78), outline=(188, 225, 255, 80), width=4)
    else:
        draw.rounded_rectangle((54, 54, 106, 168), 10, fill=(66, 42, 30, 230))
        draw.rounded_rectangle((28, 132, 132, 168), 10, fill=(48, 30, 24, 240))
        draw.ellipse((58, 20, 102, 72), fill=(255, 166, 82, 70))
        draw.rectangle((72, 28, 88, 88), fill=(255, 202, 124, 110))
    return img.filter(ImageFilter.GaussianBlur(radius=0.3))


def generate_stage_art() -> None:
    save_single(ASSET_DIR / "stage_pixor_tile.png", make_stage_tile((72, 84, 92), (114, 214, 198), (28, 34, 38)))
    save_single(ASSET_DIR / "stage_route_tile.png", make_stage_tile((88, 92, 102), (196, 218, 240), (36, 40, 48)))
    save_single(ASSET_DIR / "stage_causeway_tile.png", make_stage_tile((96, 64, 52), (255, 176, 104), (52, 20, 18)))
    save_single(ASSET_DIR / "stage_pixor_prop.png", make_stage_prop("pixor"))
    save_single(ASSET_DIR / "stage_route_prop.png", make_stage_prop("route"))
    save_single(ASSET_DIR / "stage_causeway_prop.png", make_stage_prop("causeway"))


def main() -> None:
    generate_charlie_sheet()
    generate_enemy_sheet("shade_generated.png", "shade_sheet_final.png", (163, 135, 255), "shade", 180, 264)
    generate_enemy_sheet("cultist_generated.png", "cultist_sheet_final.png", (214, 171, 255), "caster", 176, 252)
    generate_enemy_sheet("brute_generated.png", "brute_sheet_final.png", (255, 164, 104), "brute", 224, 320)
    generate_enemy_sheet("embermage_generated.png", "embermage_sheet_final.png", (255, 186, 110), "caster", 164, 252)
    generate_enemy_sheet("ashhound_generated.png", "ashhound_sheet_final.png", (255, 150, 90), "hound", 240, 164)
    generate_warden_sheet()
    generate_fx_sheets()
    generate_stage_art()


if __name__ == "__main__":
    main()
