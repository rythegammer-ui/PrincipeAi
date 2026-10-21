#!/usr/bin/env bash
# Builds the launch Reel / Short / TikTok video from the launch Story frames (ST-01 to ST-06):
# a 23-second 1080x1920 slideshow with half-second fades and a silent audio track (some apps
# reject a video with no audio stream). Add music inside the app if you like.
# Run from anywhere after render.mjs: bash deliverables/social-launch/stories/source/make-reel.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p video
# Seconds on screen per frame; the text-heavy frames stay up longer.
d=(3.0 3.5 4.5 5.0 4.5 5.0)
frames=(launch/01-its-live.png launch/02-learn-implement-grow.png launch/03-how-it-works.png
  launch/04-courses.png launch/05-free-starter-kit.png launch/06-ai-readiness-assessment.png)
fade=0.5
inputs=() filters="" offset=0 total=0 last="v0"
for i in "${!frames[@]}"; do
  inputs+=(-loop 1 -t "${d[$i]}" -i "${frames[$i]}")
  filters+="[$i:v]format=yuv420p,fps=30,settb=AVTB[v$i];"
  total=$(echo "$total + ${d[$i]}" | bc)
done
for ((i = 1; i < ${#frames[@]}; i++)); do
  offset=$(echo "$offset + ${d[$((i - 1))]} - $fade" | bc)
  filters+="[$last][v$i]xfade=transition=fade:duration=$fade:offset=$offset[x$i];"
  last="x$i"
done
length=$(echo "$total - $fade * (${#frames[@]} - 1)" | bc)
ffmpeg -y -loglevel error "${inputs[@]}" -f lavfi -t "$length" -i anullsrc=r=44100:cl=stereo \
  -filter_complex "${filters%;}" -map "[$last]" -map "${#frames[@]}:a" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 128k -shortest -movflags +faststart video/launch-reel-1080x1920.mp4
echo "Wrote video/launch-reel-1080x1920.mp4 (${length}s)"
