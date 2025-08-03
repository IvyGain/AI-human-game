#!/usr/bin/env python3
"""
Project JIN PWA用のアイコンを生成するスクリプト
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """指定されたサイズでProject JINのアイコンを作成"""
    
    # 背景色（Project JINのテーマカラー）
    background_color = '#111827'  # ダークグレー
    accent_color = '#3B82F6'      # ブルー
    text_color = '#FFFFFF'        # ホワイト
    
    # 画像を作成
    img = Image.new('RGBA', (size, size), background_color)
    draw = ImageDraw.Draw(img)
    
    # 円形の背景を描画
    margin = size // 8
    circle_bbox = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_bbox, fill=accent_color)
    
    # 「JIN」テキストを描画
    try:
        # フォントサイズを調整
        font_size = size // 4
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttc", font_size)
    except:
        # フォントが見つからない場合はデフォルトフォント
        font = ImageFont.load_default()
    
    text = "JIN"
    
    # テキストのサイズを取得
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # テキストを中央に配置
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2
    
    draw.text((text_x, text_y), text, fill=text_color, font=font)
    
    # 小さなAIアイコンを右下に追加
    if size >= 128:
        ai_size = size // 8
        ai_x = size - ai_size - margin // 2
        ai_y = size - ai_size - margin // 2
        draw.ellipse([ai_x, ai_y, ai_x + ai_size, ai_y + ai_size], fill='#10B981')
    
    # 保存
    img.save(output_path, 'PNG')
    print(f"Generated {output_path} ({size}x{size})")

def main():
    """メイン処理"""
    
    # アイコンサイズのリスト
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # 出力ディレクトリ
    output_dir = "/Users/mashimaro/AI-human-game/client/public/icons"
    
    # ディレクトリが存在しない場合は作成
    os.makedirs(output_dir, exist_ok=True)
    
    # 各サイズのアイコンを生成
    for size in sizes:
        output_path = os.path.join(output_dir, f"icon-{size}x{size}.png")
        create_icon(size, output_path)
    
    # ショートカット用アイコンも生成
    shortcut_icons = [
        ("quickmatch", "⚡"),
        ("create", "➕")
    ]
    
    for name, emoji in shortcut_icons:
        img = Image.new('RGBA', (96, 96), '#111827')
        draw = ImageDraw.Draw(img)
        
        # 絵文字の代わりにシンプルな図形
        if name == "quickmatch":
            # 雷のような図形
            points = [(30, 20), (50, 20), (40, 45), (60, 45), (35, 76), (45, 50), (25, 50)]
            draw.polygon(points, fill='#F59E0B')
        else:
            # プラス記号
            draw.rectangle([35, 25, 60, 35], fill='#10B981')
            draw.rectangle([45, 15, 50, 80], fill='#10B981')
        
        shortcut_path = os.path.join(output_dir, f"shortcut-{name}.png")
        img.save(shortcut_path, 'PNG')
        print(f"Generated {shortcut_path}")
    
    print("All icons generated successfully!")

if __name__ == "__main__":
    main()