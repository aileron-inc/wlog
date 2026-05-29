require_relative "boot"
require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module Wlog
  class Application < Rails::Application
    config.load_defaults 8.1
    config.time_zone = "Asia/Tokyo"

    config.api_only = true

    config.session_store :cookie_store, key: "_wlog_session"
    config.middleware.use ActionDispatch::Flash
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use config.session_store, config.session_options
  end
end
