-- This code block will be written to the main_query.sql file within the anchor "subquery"
-- !<:WRITE (FILE "<%= CURRENT_DIR %>/main_query_1.sql") (ANCHOR "subquery") (LINE_PREFIX "    ")
SELECT
  CustomerID
FROM
  Sales.Customer
WHERE
  TerritoryID = 5
-- !>