#!/usr/bin/env python3
"""
Generate a demo GIF for Adam Sin & Saint Protocol README.
Requires: playwright, pillow
  pip install playwright pillow
  playwright install chromium
"""

import subprocess
import sys
import time
import signal
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GIF_PATH = REPO_ROOT / "docs" / "demo.gif"
DEV_URL = "http://localhost:5173/AdamSinAndSaintProtocol/"

FRAMES_DIR = REPO_ROOT / "scripts" / "_gif_frames"
FRAMES_DIR.mkdir(parents=True, exist_ok=True)


def cleanup():
    import shutil
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Install playwright: pip install playwright && playwright install chromium")
        sys.exit(1)

    try:
        from PIL import Image
    except ImportError:
        print("Install pillow: pip install pillow")
        sys.exit(1)

    print("Starting Vite dev server...")
    server = subprocess.Popen(
        ["npx.cmd", "vite", "--host", "127.0.0.1"],
        cwd=str(REPO_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=False,
    )

    time.sleep(4)

    frames = []
    viewport = {"width": 960, "height": 780}

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport=viewport)

            # Frame 1: Empty state - the input form
            page.goto(DEV_URL, wait_until="networkidle")
            time.sleep(1)
            page.screenshot(path=str(FRAMES_DIR / "01-empty.png"))
            frames.append(FRAMES_DIR / "01-empty.png")
            print("Frame 1: empty input")

            # Frame 2: Enter a BTC address
            btc_input = page.locator('input[placeholder="bc1q..."]')
            btc_input.fill("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh")
            time.sleep(0.5)
            page.screenshot(path=str(FRAMES_DIR / "02-address-filled.png"))
            frames.append(FRAMES_DIR / "02-address-filled.png")
            print("Frame 2: address filled")

            # Frame 3: Loading state (click Run)
            page.locator("button", has_text="Run Forensic Analysis").click()
            time.sleep(1)
            page.screenshot(path=str(FRAMES_DIR / "03-loading.png"))
            frames.append(FRAMES_DIR / "03-loading.png")
            print("Frame 3: loading")

            # Frame 4: Results loaded - overview tab
            try:
                page.wait_for_selector("text=Overview", timeout=15000)
            except:
                pass
            time.sleep(1)
            page.screenshot(path=str(FRAMES_DIR / "04-overview.png"))
            frames.append(FRAMES_DIR / "04-overview.png")
            print("Frame 4: overview results")

            # Frame 5: Ruptures tab
            page.locator("button", has_text="Ruptures").first.click()
            time.sleep(0.5)
            page.screenshot(path=str(FRAMES_DIR / "05-ruptures.png"))
            frames.append(FRAMES_DIR / "05-ruptures.png")
            print("Frame 5: ruptures tab")

            # Frame 6: Signed Report tab
            page.locator("button", has_text="Signed Report").first.click()
            time.sleep(0.5)
            page.screenshot(path=str(FRAMES_DIR / "06-report.png"))
            frames.append(FRAMES_DIR / "06-report.png")
            print("Frame 6: signed report")

            browser.close()

    finally:
        server.terminate()
        server.wait()

    # Build GIF
    print("Building GIF...")
    images = []
    for fp in frames:
        img = Image.open(fp).convert("P", palette=Image.Palette.ADAPTIVE)
        images.append(img)

    GIF_PATH.parent.mkdir(parents=True, exist_ok=True)
    if images:
        images[0].save(
            GIF_PATH,
            save_all=True,
            append_images=images[1:],
            duration=2000,
            loop=0,
            optimize=True,
        )
        print(f"GIF saved to {GIF_PATH} ({os.path.getsize(GIF_PATH) / 1024:.1f} KB)")
    else:
        print("No frames captured")

    cleanup()


if __name__ == "__main__":
    main()
