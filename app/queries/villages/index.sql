SELECT json_object(
  'tags', (
    SELECT json_group_array(json_object(
      'id', id
    , 'name', name
    )) FROM tags
  ),
  'villages', (
    SELECT json_group_array(json_object(
      'id', v.id
    , 'village_number', v.village_number
    , 'name', v.name
    , 'tags', (
      SELECT json_group_array(json_object(
        'id', tags.id
      , 'name', tags.name
      )) FROM village_tags
      JOIN tags ON tags.id = village_tags.tag_id
      WHERE village_tags.village_id = v.id
    )
    )) FROM (
      SELECT * FROM villages
      WHERE :tag = '' OR villages.id IN (
        SELECT village_id FROM village_tags WHERE tag_id = :tag
      )
      ORDER BY villages.village_number DESC
      LIMIT CAST(:per_page AS INTEGER)
      OFFSET (CAST(:page AS INTEGER) - 1) * CAST(:per_page AS INTEGER)
    ) AS v
  ),
  'total_count', (
    SELECT COUNT(*) FROM villages
    WHERE :tag = '' OR villages.id IN (
      SELECT village_id FROM village_tags WHERE tag_id = :tag
    )
  ),
  'page', CAST(:page AS INTEGER),
  'per_page', CAST(:per_page AS INTEGER)
)
