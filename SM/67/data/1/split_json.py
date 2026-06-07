import json
import sys
import os

def split_json(input_file, output_prefix, pairs_per_file=100):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_pairs = len(data)
    print(f"Total pairs: {total_pairs}")
    
    part_num = 1
    for i in range(0, total_pairs, pairs_per_file):
        chunk = data[i:i+pairs_per_file]
        output_file = f"{output_prefix}_{part_num}.json"
        with open(output_file, 'w', encoding='utf-8') as out:
            json.dump(chunk, out, ensure_ascii=False, indent=2)
        print(f"Created {output_file} ({len(chunk)} pairs)")
        part_num += 1

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python split_json.py input.json output_prefix [pairs_per_file]")
        print("Example: python split_json.py ru_spa.json ru_spa 100")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_prefix = sys.argv[2]
    pairs_per_file = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    
    split_json(input_file, output_prefix, pairs_per_file)