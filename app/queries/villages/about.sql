SELECT json_object(
  'village', (
    SELECT json_object(
      'id', id
    , 'village_number', village_number
    , 'name', name
    , 'characters', characters
    , 'status', status
    , 'winner', winner
    ) FROM villages
    WHERE id = :village_id
  ),
  'available_days', (
    SELECT json_group_array(DISTINCT day) FROM (
      SELECT day FROM posts
      WHERE village_id = :village_id AND source = 'villager'
      ORDER BY CASE day
        WHEN 'prologue' THEN 0
        WHEN 'epilogue' THEN 999
        ELSE CAST(day AS INTEGER)
      END
    )
  ),
  'post_counts', (
    SELECT json_object(
      'villager', (
        SELECT COUNT(*) FROM posts WHERE village_id = :village_id AND source = 'villager'
      ),
      'player', (
        SELECT COUNT(*) FROM posts WHERE village_id = :village_id AND source = 'player'
      )
    )
  ),
  'players', (
    SELECT json_group_array(json_object(
      'name', json_each.value
    , 'avatar_url', (
        SELECT avatar_url FROM avatars
        WHERE avatars.name = json_each.value
          AND avatars.set_id = villages.character_set_id
        LIMIT 1
      )
    , 'post_count', (
        SELECT COUNT(*) FROM posts
        WHERE village_id = :village_id AND source = 'villager' AND "character" = json_each.value
      )
    , 'role', (
        SELECT role FROM village_characters
        WHERE village_characters.village_id = villages.id
          AND village_characters.name = json_each.value
      )
    , 'is_alive', (
        SELECT is_alive FROM village_characters
        WHERE village_characters.village_id = villages.id
          AND village_characters.name = json_each.value
      )
    , 'team', (
        SELECT team FROM village_characters
        WHERE village_characters.village_id = villages.id
          AND village_characters.name = json_each.value
      )
    )) FROM villages, json_each(villages.characters)
    WHERE villages.id = :village_id AND json_each.value NOT LIKE '%以下の通り%'
  )
)
