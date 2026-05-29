SELECT json_object(
  'village_id', :village_id
, 'day', :day
, 'source', :source
, 'spoiler', :spoiler
, 'page', CAST(:page AS INTEGER)
, 'per_page', CAST(:per_page AS INTEGER)
, 'total_count', (
    SELECT COUNT(*) FROM posts
    WHERE village_id = :village_id AND day = :day
      AND (
        :spoiler = 'true'
        OR (
          source = 'villager'
          AND post_type NOT IN ('fortune', 'attack', 'whisper', 'monologue')
        )
      )
  )
, 'total_pages', (
    SELECT CASE
      WHEN COUNT(*) = 0 THEN 1
      ELSE (COUNT(*) + CAST(:per_page AS INTEGER) - 1) / CAST(:per_page AS INTEGER)
    END FROM posts
    WHERE village_id = :village_id AND day = :day
      AND (
        :spoiler = 'true'
        OR (
          source = 'villager'
          AND post_type NOT IN ('fortune', 'attack', 'whisper', 'monologue')
        )
      )
  )
, 'available_days', (
    SELECT json_group_array(DISTINCT day) FROM (
      SELECT day FROM posts
      WHERE village_id = :village_id AND source = 'villager'
      ORDER BY CASE day
        WHEN 'prologue' THEN 0
        WHEN 'epilogue' THEN 999
        ELSE CAST(day AS INTEGER)
      END
    )
  )
, 'posts', (
    SELECT json_group_array(json_object(
      'sequence', sequence
    , 'character', "character"
    , 'avatar_url', avatar_url
    , 'body', body
    , 'timestamp', timestamp
    , 'post_type', post_type
    , 'source', source
    )) FROM (
      SELECT posts.*, avatars.avatar_url
      FROM posts
      LEFT JOIN villages v ON posts.village_id = v.id
      LEFT JOIN avatars ON posts.character = avatars.name AND avatars.set_id = v.character_set_id
      WHERE posts.village_id = :village_id AND posts.day = :day
        AND (
          :spoiler = 'true'
          OR (
            posts.source = 'villager'
            AND posts.post_type NOT IN ('fortune', 'attack', 'whisper', 'monologue')
          )
        )
      ORDER BY posts.sequence
      LIMIT CAST(:per_page AS INTEGER)
      OFFSET (CAST(:page AS INTEGER) - 1) * CAST(:per_page AS INTEGER)
    )
  )
)
