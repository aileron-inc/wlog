class PropsQuery
  class QueryNotFoundError < StandardError; end

  attr_reader :name, :sql

  QUERIES_DIR = Rails.root.join("app/queries")

  def initialize(name, defaults: {}, permitted_params: {})
    @name = name
    @sql = begin
      path = QUERIES_DIR.join("#{name}.sql")
      raise QueryNotFoundError, "Query not found: #{name}" unless path.exist?
      path.read.strip
    end
    @params = defaults.symbolize_keys.merge(permitted_params.to_h.symbolize_keys)
    @params = @params.slice(*sql_param_keys.map(&:to_sym))
    validate_params!
  end

  def self.all
    Dir.glob(QUERIES_DIR.join("**/*.sql")).map do |f|
      new(Pathname.new(f).relative_path_from(QUERIES_DIR).sub_ext("").to_s)
    end.sort_by(&:name)
  end

  def self.find(name, defaults: {}, permitted_params: {})
    new(name, defaults:, permitted_params:)
  rescue QueryNotFoundError
    NullQuery.new
  end

  class NullQuery
    def call
      {}
    end
  end

  def call = run_sql(@sql)

  private

  def sql_param_keys
    return @sql_param_keys if defined?(@sql_param_keys)

    sanitized_sql = @sql.gsub(
      %r{
        --[^\n]*      # --形式のコメント
        |
        /\*.*?\*/     # /* */形式のコメント
        |
        '[^']*'       # シングルクォート文字列
        |
        "[^"]*"       # ダブルクォート文字列
      }mx,
      ""
    )

    @sql_param_keys = sanitized_sql.scan(/(?<!:):(\w+)/).flatten.uniq
  end

  def validate_params!
    param_keys = @params.keys.map(&:to_s)
    missing = sql_param_keys.select { |k| !param_keys.include?(k) }
    raise ArgumentError, "Missing required params: #{missing.join(', ')} for query: #{@name}" if missing.present?

    unknown = param_keys.reject { |k| sql_param_keys.include?(k) }
    raise ArgumentError, "Unknown params: #{unknown.join(', ')} for query: #{@name}" if unknown.present?
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
      begin
        param_values = sql_param_keys.map { |k| params[k.to_s] }
        stmt.query(param_values).to_a.first
      ensure
        stmt.close
      end
    end

    json_value = result&.values&.first
    return {} unless json_value.is_a?(String)

    JSON.parse(json_value)
  end

  def title
    @name.gsub("_", " ").split.map(&:capitalize).join(" ")
  end
end
