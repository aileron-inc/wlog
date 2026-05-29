require "inertia_rails"

InertiaRails.configure do |config|
  config.version = ViteRuby.digest
end

Rails.application.reloader.to_prepare do
  module InertiaRails
    class Renderer
      alias_method :original_render, :render

      def render
        @response.headers["Vary"] = if @response.headers["Vary"].blank?
                                      "X-Inertia"
        else
                                      "#{@response.headers['Vary']}, X-Inertia"
        end
        if @request.headers["X-Inertia"]
          @response.set_header("X-Inertia", "true")
          @render_method.call json: page.to_json, status: @response.status, content_type: Mime[:json]
        else
          controller = @request.env["action_controller.instance"]
          component = Views::Layouts::ApplicationLayout.new(page:, controller:)
          html = component.call
          safe = html.html_safe
          # rubocop:disable Rails/OutputSafety
          @render_method.call html: safe, layout: false, status: @response.status
          # rubocop:enable Rails/OutputSafety
        end
      end
    end
  end
end
