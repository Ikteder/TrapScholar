"""Offline Chromium smoke-test of ES modules, with browser navigation policy bypass.
Uses page.set_content on about:blank and loads local modules from data: URLs;
no network requests, external websites, or changes to production imports.
Requires pip install playwright and a Chromium executable.
"""
import base64
import mimetypes
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]

def module_uri(path,cache):
    path=path.resolve()
    if path in cache:return cache[path]
    js=path.read_text(encoding='utf-8')
    def patch(m):
        target=(path.parent/m.group(2)).resolve()
        return m.group(1)+module_uri(target,cache)+m.group(3)
    js=re.sub(r'(from\s+[\x27\"])(\.[^\x27\"]+)([\x27\"])',patch,js)
    url='data:text/javascript;base64,'+base64.b64encode(js.encode('utf-8')).decode('ascii')
    cache[path]=url
    return url

def inline_html():
    s=(root/'index.html').read_text()
    s=re.sub(r'<script type="module" src="src/game.js"></script>', '',s)
    style=(root/'style.css').read_text()
    s=re.sub(r'<link[^>]+href="style.css"[^>]*>',lambda m:f'<style>{style}</style>',s)
    def img(m):
        path=(root/m.group(2)).resolve()
        if not path.is_file() or not path.is_relative_to(root):return m.group(0)
        mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        return m.group(1)+f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode()+m.group(3)
    s=re.sub(r'(src=[\x27\"])(assets/[^\x27\"]+)([\x27\"])',img,s)
    return s

if __name__=='__main__':
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':1460,'height':1050},device_scale_factor=1,accept_downloads=True)
        page=context.new_page();errors=[]
        page.on('pageerror',lambda err: errors.append(str(err)))
        page.set_content(inline_html(),wait_until='load')
        page.evaluate('async uri => { await import(uri); }',module_uri(root/'src/game.js',{}))
        page.wait_for_timeout(800)
        canvas=page.locator('#world')
        canvas.screenshot(path=str(root/'assets/isometric-gameplay-prototype.png'))
        box=canvas.bounding_box()
        # Click logical map tile (9,6) and verify a trap was purchased.
        x=426+(9-6)*23; y=65+(9+6)*11.5
        canvas.click(position={'x':(x/960)*box['width'],'y':(y/540)*box['height']})
        page.wait_for_timeout(100)
        assert page.locator('#souls').inner_text()=='16','Trap placement must spend 2 souls'
        canvas.screenshot(path=str(root/'assets/isometric-trap-placement.png'))
        page.locator('#start-btn').click()
        page.wait_for_timeout(1800)
        canvas.screenshot(path=str(root/'assets/isometric-raid.png'))
        assert page.locator('#phase-chip').inner_text() in ('INVASION','BUILD PHASE','RELIC LOST')
        if page.locator('#phase-chip').inner_text()=='INVASION':
            page.locator('#pause-btn').click()
            assert page.locator('#pause-btn').get_attribute('aria-pressed')=='true'
            page.locator('#pause-btn').click()
        page.locator('#lab-run').click()
        page.locator('.lab-stat').first.wait_for(timeout=12000)
        assert page.locator('#lab-csv').is_enabled(), 'CSV export must be enabled after a completed experiment'
        page.set_viewport_size({'width':390,'height':840})
        page.wait_for_timeout(200)
        scroll=page.evaluate('({scrollWidth:document.documentElement.scrollWidth, viewport:innerWidth})')
        assert scroll['scrollWidth']<=scroll['viewport']+1, f'Mobile horizontal overflow: {scroll}'
        assert not errors,errors
        print('Browser smoke: PASS — traps placed, raid started, no page errors')
        print('Canvas dimensions:',box,'screenshot files: gameplay, placement, raid')
        browser.close()
