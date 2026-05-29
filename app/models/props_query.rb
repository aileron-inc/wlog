class PropsQuery
  class QueryNotFoundError < StandardError; end

  attr_reader :name, :sql

  QUERIES_DIR = Rails.root.join("app/queries")

  def initialize(name, defaults: {}, permitted_params: {})
    @name = name
    path = QUERIES_DIR.join("#{name}.sql")
    raise QueryNotFoundError, "Query not found: #{name}" unless path.exist?
    @sql = path.read.strip
    @params = defaults.transform_keys(&:to_s).merge(permitted_params.transform_keys(&:to_s))
    @params = @params.slice(*sql_param_keys)
    validate_params!
  end

  def self.find(name, defaults: {}, permitted_params: {})
    new(name, defaults:, permitted_params:)
  rescue QueryNotFoundError
    NullQuery.new
  end

  class NullQuery
    def call = {}
  end

  def call = run_sql(@sql)

  private

  def sql_param_keys
    @sql_param_keys ||= @sql.gsub(/--.*$/, "").gsub(/\/\*.*?\*\//m, "").scan(/:(\w+)/).flatten.uniq
  end

  def validate_params!
    param_keys = @params.keys.map(&:to_s)
    missing = sql_param_keys.select { |k| !param_keys.include?(k) }
    raise ArgumentError, "Missing required params: #{missing.join(", ")} for query: #{@name}" if missing.present?

    unknown = param_keys.reject { |k| sql_param_keys.include?(k) }
    raise ArgumentError, "Unknown params: #{unknown.join(", ")} for query: #{@name}" if unknown.present?
  end

  def run_sql(sql)
    params = @params.transform_keys(&:to_s)
    conn = ActiveRecord::Base.connection

    payload = {
      sql: sql,
      name: "PropsQuery",
      connection_id: conn.object_id,
      binds: [],
      type_casted_binds: [],
      cached: false,
      prepared: false,
      statement_name: nil,
    }

    result = ActiveSupport::Notifications.instrument("sql.active_record", payload) do
      stmt = conn.raw_connection.prepare(sql)
      r = stmt.execute(params).to_a.first
      stmt.close
      r
    end

    json_value = result&.values&.first
    return {} unless json_value.is_a?(String)

    JSON.parse(json_value)
  end
end
