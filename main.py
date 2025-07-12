import os
import sys
import re
import requests
from urllib.parse import urlparse, parse_qs
import yaml
from bs4 import BeautifulSoup

def extract_video_id(url):
    """Extrahuje video ID z YouTube URL"""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_video_info(video_id):
    """Získá informace o videu z YouTube"""
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Pokusit se najít title
        title = None
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().replace(' - YouTube', '').strip()
        
        # Pokusit se najít channel name
        channel = None
        channel_patterns = [
            {'name': 'link', 'attrs': {'itemprop': 'name'}},
            {'name': 'meta', 'attrs': {'name': 'author'}},
            {'name': 'span', 'attrs': {'itemprop': 'author'}}
        ]
        
        for pattern in channel_patterns:
            channel_tag = soup.find(pattern['name'], pattern['attrs'])
            if channel_tag:
                channel = channel_tag.get('content') or channel_tag.get_text()
                if channel:
                    break
        
        # Fallback - hledat v JSON-LD
        if not title or not channel:
            scripts = soup.find_all('script', type='application/ld+json')
            for script in scripts:
                try:
                    import json
                    data = json.loads(script.string)
                    if isinstance(data, list):
                        data = data[0]
                    
                    if not title and 'name' in data:
                        title = data['name']
                    
                    if not channel and 'author' in data:
                        if isinstance(data['author'], dict) and 'name' in data['author']:
                            channel = data['author']['name']
                except:
                    continue
        
        return {
            'title': title or f"Video {video_id}",
            'channel': channel or "Neznámý kanál",
            'url': url
        }
        
    except Exception as e:
        print(f"Chyba při získávání info pro {video_id}: {e}")
        return {
            'title': f"Video {video_id}",
            'channel': "Neznámý kanál",
            'url': f"https://www.youtube.com/watch?v={video_id}"
        }

def load_existing_playlist(filename):
    """Načte existující playlist ze souboru"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            return data.get('playlist', []) if data else []
    except FileNotFoundError:
        return []
    except Exception as e:
        print(f"Chyba při načítání {filename}: {e}")
        return []

def save_playlist(filename, playlist):
    """Uloží playlist do YAML souboru"""
    try:
        data = {'playlist': playlist}
        with open(filename, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        print(f"Playlist uložen do {filename}")
    except Exception as e:
        print(f"Chyba při ukládání {filename}: {e}")

def process_urls(urls, output_file='music.yaml'):
    """Zpracuje seznam URL a vytvoří/aktualizuje playlist"""
    # Načíst existující playlist
    existing_playlist = load_existing_playlist(output_file)
    existing_urls = {item['url'] for item in existing_playlist}
    
    new_tracks = []
    
    print(f"Zpracovávám {len(urls)} URL...")
    
    for i, url in enumerate(urls, 1):
        url = url.strip()
        if not url:
            continue
            
        print(f"[{i}/{len(urls)}] Zpracovávám: {url}")
        
        # Zkontrolovat jestli už není v playlistu
        if url in existing_urls:
            print(f"  → Již existuje v playlistu, přeskakujem")
            continue
        
        video_id = extract_video_id(url)
        if not video_id:
            print(f"  → Neplatné YouTube URL, přeskakujem")
            continue
        
        # Získat informace o videu
        video_info = get_video_info(video_id)
        new_tracks.append(video_info)
        
        print(f"  → Přidáno: {video_info['title']} ({video_info['channel']})")
    
    # Spojit existující a nové skladby
    final_playlist = existing_playlist + new_tracks
    
    if new_tracks:
        save_playlist(output_file, final_playlist)
        print(f"\nPřidáno {len(new_tracks)} nových skladeb")
        print(f"Celkem skladeb v playlistu: {len(final_playlist)}")
    else:
        print("\nŽádné nové skladby k přidání")

def main():
    if len(sys.argv) < 2:
        print("Použití:")
        print("  python script.py <soubor_s_linky>")
        print("  python script.py <URL>")
        print("  python script.py <URL1> <URL2> <URL3>...")
        print("\nPříklady:")
        print("  python script.py links.txt")
        print("  python script.py https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        print("  python script.py link1 link2 link3")
        return
    
    urls = []
    
    # Pokud je první argument soubor
    if len(sys.argv) == 2 and os.path.isfile(sys.argv[1]):
        filename = sys.argv[1]
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                urls = [line.strip() for line in f if line.strip()]
            print(f"Načteno {len(urls)} URL ze souboru {filename}")
        except Exception as e:
            print(f"Chyba při čtení souboru {filename}: {e}")
            return
    else:
        # Jinak jsou to URL argumenty
        urls = sys.argv[1:]
    
    if not urls:
        print("Žádné URL k zpracování")
        return
    
    # Zpracovat URL
    process_urls(urls)

if __name__ == "__main__":
    main()