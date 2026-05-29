source "https://rubygems.org"

gem "rails", "~> 8.1.3", require: %w[
  active_record/railtie
  action_controller/railtie
]
gem "phlex-rails"
gem "libsql-activerecord2"
gem "falcon"

group :development, :test do
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
  gem "rubocop-rails-omakase", require: false
  gem "rspec-rails"
end

group :development do
  gem "web-console"
end

gem "weak_parameters"
gem "vite_ruby", "~> 3.9"
gem "vite_rails", "~> 3.0"
gem "inertia_rails", "~> 3.8"
