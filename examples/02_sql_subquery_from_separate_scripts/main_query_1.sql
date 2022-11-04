SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- !subquery<
    -- !subquery>
  );