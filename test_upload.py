
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.on("console", lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))
        
        print("Navigating to http://localhost:4173/engine ...")
        page.goto("http://localhost:4173/engine", wait_until="networkidle")
        time.sleep(2)
        
        print("Uploading file...")
        with open("dummy.pdf", "w") as f:
            f.write("dummy")
            
        page.locator("input[type='file']").first.set_input_files("dummy.pdf")
        time.sleep(3)
        print("Done.")
        browser.close()

if __name__ == "__main__":
    run()

