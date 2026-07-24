# process_transparent_logo.py
from PIL import Image
import os

source_path = r'C:\Users\Sharoz\.gemini\antigravity\brain\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f\.user_uploaded\media__1784886504263.jpg'
out_transparent_dark_text = r'C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\public\logo_transparent_dark.png'
out_transparent_white_text = r'C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\public\logo_transparent_white.png'

if os.path.exists(source_path):
    img = Image.open(source_path).convert("RGBA")
    datas = img.getdata()

    # 1. Dark Text Version (for White paper PDF & White Invoice Modal)
    newDataDark = []
    for item in datas:
        r, g, b, a = item
        # If near black background (r,g,b < 35) -> Make 100% transparent
        if r < 35 and g < 35 and b < 35:
            newDataDark.append((255, 255, 255, 0))
        # If white text (r,g,b > 180) -> Turn into crisp dark navy/black (#031d37 -> 3, 29, 55)
        elif r > 180 and g > 180 and b > 180:
            newDataDark.append((3, 29, 55, 255))
        else:
            # Keep blue globe colors intact
            newDataDark.append((r, g, b, a))

    imgDark = Image.new("RGBA", img.size)
    imgDark.putdata(newDataDark)
    imgDark.save(out_transparent_dark_text, "PNG")
    print("Saved logo_transparent_dark.png")

    # 2. White Text Version (for Dark Navbar & Login)
    newDataWhite = []
    for item in datas:
        r, g, b, a = item
        if r < 35 and g < 35 and b < 35:
            newDataWhite.append((255, 255, 255, 0))
        else:
            newDataWhite.append((r, g, b, a))

    imgWhite = Image.new("RGBA", img.size)
    imgWhite.putdata(newDataWhite)
    imgWhite.save(out_transparent_white_text, "PNG")
    print("Saved logo_transparent_white.png")

else:
    print("Source image not found:", source_path)
