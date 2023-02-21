SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- The content of subquery_2.sql will be loaded into the anchor below
    -- !subquery<:INSERT (FILE "subquery_2.sql") (LINE_PREFIX "    ")
    -- !subquery>
  );