import csv
import json
from collections import defaultdict
import sys
import os

def generate_pairs(sentences_file, links_file, base_lang, target_lang, limit=500):
    # Загружаем предложения с правильной обработкой кодировки
    sentences = {}
    with open(sentences_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) >= 3:
                sent_id, lang, text = row[0], row[1], row[2]
                if lang in (base_lang, target_lang):
                    text = text.strip()
                    if text:
                        sentences[sent_id] = {'lang': lang, 'text': text}
    
    print(f"Loaded {len([s for s in sentences.values() if s['lang'] == base_lang])} {base_lang} sentences")
    print(f"Loaded {len([s for s in sentences.values() if s['lang'] == target_lang])} {target_lang} sentences")
    
    # Загружаем связи
    links = defaultdict(list)
    with open(links_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) >= 2:
                sent_id, trans_id = row[0], row[1]
                links[sent_id].append(trans_id)
    
    print(f"Loaded {len(links)} links")
    
    # Генерируем пары (базовый → целевой)
    pairs = []
    for sent_id, trans_ids in links.items():
        if sent_id in sentences and sentences[sent_id]['lang'] == base_lang:
            for trans_id in trans_ids:
                if trans_id in sentences and sentences[trans_id]['lang'] == target_lang:
                    base_text = sentences[sent_id]['text']
                    target_text = sentences[trans_id]['text']
                    if 3 < len(base_text) < 200 and 3 < len(target_text) < 200:
                        pairs.append([base_text, target_text])
                        if len(pairs) >= limit:
                            break
            if len(pairs) >= limit:
                break
    
    print(f"Generated {len(pairs)} pairs")
    return pairs

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print("Usage: python generate_pairs_fixed.py sentences.csv links.csv base_lang target_lang [limit] [output_file]")
        print("Example: python generate_pairs_fixed.py sentences.csv links.csv rus spa 500 ru_spa.json")
        sys.exit(1)
    
    sentences_file = sys.argv[1]
    links_file = sys.argv[2]
    base_lang = sys.argv[3]
    target_lang = sys.argv[4]
    limit = int(sys.argv[5]) if len(sys.argv) > 5 else 500
    output_file = sys.argv[6] if len(sys.argv) > 6 else f"{base_lang}_{target_lang}.json"
    
    pairs = generate_pairs(sentences_file, links_file, base_lang, target_lang, limit)
    
    # Сохраняем напрямую в файл, а не в stdout
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(pairs, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {output_file}")