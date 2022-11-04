SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- The content of subquery_2.sql will be loaded into the anchor below
    -- !subquery<:EMBED (FILE "<%= CURRENT_DIR %>/subquery_2.sql") (LINE_PREFIX "    ")
    -- !subquery>
  );