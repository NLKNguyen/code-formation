**Scenario:**
- You have a SQL query that is used as a subquery of a bigger query. 
- You often update the content of the subquery and like to maintain it separately for clarity and easy testing. 
- You need the bigger query to be updated with the subquery changes without having to manually copy & paste every time
    - especially when there could be multiple queries using that subquery.

Here are 2 options to achieve the same result, in which option 2 is more optimal for this particular scenario.

**Option 1: write the content of this file to a specific section (anchor) of another file**

The below command will bring content from `subquery_1.sql` into `main_query_1.sql` at a specific section (indicated by the anchor guard syntax `!ANCHOR_NAME<` and `!ANCHOR_NAME>`)

```
code-formation --scan ./examples/02_sql_subquery_from_separate_scripts/subquery_1.sql
```

<details><summary>subquery_1.sql</summary>

```sql
-- This code block will be written to the main_query.sql file within the anchor "subquery"
-- !<:WRITE (FILE "<%= CURRENT_DIR %>/main_query_1.sql") (ANCHOR "subquery") (LINE_PREFIX "    ")
SELECT
  CustomerID
FROM
  Sales.Customer
WHERE
  TerritoryID = 5
-- !>
```
</details>

<details><summary>main_query_1.sql (before)</summary>

```sql
SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- !subquery<
    -- !subquery>
  );
```
</details>

<details><summary>main_query_1.sql (after)</summary>

```sql
SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- !subquery<
    SELECT
      CustomerID
    FROM
      Sales.Customer
    WHERE
      TerritoryID = 5
    -- !subquery>
  );
```
</details>

**Option 2: Load into a specific section (anchor) of this file the content of another file**

The below command will bring content from `subquery_2.sql` into `main_query_2.sql` at a specific section (indicated by the anchor guard syntax `!ANCHOR_NAME<` and `!ANCHOR_NAME>`)

```
code-formation --scan ./examples/02_sql_subquery_from_separate_scripts/main_query_2.sql
```

<details><summary>subquery_2.sql</summary>

```sql
SELECT
  CustomerID
FROM
  Sales.Customer
WHERE
  TerritoryID = 5
```
</details>

<details><summary>main_query_2.sql (before)</summary>

```sql
SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- The content of subquery_2.sql will be loaded into the anchor below
    -- !subquery<:INSERT (FILE "<%= CURRENT_DIR %>/subquery_2.sql") (LINE_PREFIX "    ")
    -- !subquery>
  );
```
</details>

<details><summary>main_query_2.sql (after)</summary>

```sql
SELECT
  [Name]
FROM
  Sales.Store
WHERE
  BusinessEntityID NOT IN (
    -- The content of subquery_2.sql will be loaded into the anchor below
    -- !subquery<:INSERT (FILE "<%= CURRENT_DIR %>/subquery_2.sql") (LINE_PREFIX "    ")
    SELECT
      CustomerID
    FROM
      Sales.Customer
    WHERE
      TerritoryID = 5
    -- !subquery>
  );
```
</details>
