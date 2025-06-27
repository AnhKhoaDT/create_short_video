import whisper
import json
import sys
import os

audio_file = sys.argv[1] if len(sys.argv) > 1 else "audio.mp3"

# Tải model (có thể dùng 'base', 'small', 'medium', 'large')
model = whisper.load_model("base")

# Nhận diện audio, trả về timestamp từng từ
result = model.transcribe(audio_file, word_timestamps=True, language="vi")

# In ra từng từ với timestamp
for segment in result['segments']:
    for word in segment['words']:
        print(f"{word['word']} - start: {word['start']}, end: {word['end']}")

keywords = ["Tiếp đến", "Sau đó", "Trong khi đó", "Lúc này"]
timestamps = []

words = []
for segment in result['segments']:
    words.extend(segment['words'])

for i in range(len(words)):
    for kw in keywords:
        kw_split = kw.split()
        if all(i + j < len(words) and words[i + j]['word'].strip().lower() == kw_split[j].lower() for j in range(len(kw_split))):
            timestamps.append(words[i]['start'])

json_path = os.path.join(os.path.dirname(audio_file), "scene_timestamps.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(timestamps, f, ensure_ascii=False, indent=2)
