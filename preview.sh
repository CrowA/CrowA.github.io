#!/bin/sh
# Local preview WITH the blog rendered (Jekyll build + serve on :8001).
# Requires Homebrew Ruby + Jekyll:  brew install ruby
#   /opt/homebrew/opt/ruby/bin/gem install jekyll jekyll-feed --no-document
# Without this, `python3 -m http.server 8000` previews everything except /blog/.
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
cd "$(dirname "$0")"
exec jekyll serve --port "${PORT:-8000}"
