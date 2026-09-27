# Gemfile — Swarnil CSS Jekyll theme
source "https://rubygems.org"

# Core Jekyll
gem "jekyll", "~> 4.3"

# Plugins (all GitHub Pages / Actions friendly)
group :jekyll_plugins do
  gem "jekyll-sitemap"
  gem "jekyll-mentions"
  gem "jekyll-paginate-v2"
  gem "jekyll-seo-tag"
  gem "jekyll-redirect-from"
  gem "jekyll-feed"
  gem "jekyll-commonmark"
  gem "jekyll-include-cache"
  gem "jemoji"
end

# Sass converter (Dart Sass) for compiling Swarnil CSS
gem "jekyll-sass-converter", "~> 3.0"

# Local dev web server (required on Ruby 3.0+)
gem "webrick", "~> 1.8"

# Timezone data — bundled on Windows/JRuby where the OS lacks a tz database
gem "tzinfo-data", platforms: [:windows, :jruby]

# Windows directory-watcher for `jekyll serve --watch`
gem "wdm", "~> 0.1", platforms: [:windows]
gem "ffi", "< 1.17.0"
