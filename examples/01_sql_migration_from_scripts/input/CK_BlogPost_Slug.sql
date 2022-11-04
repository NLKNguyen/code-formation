-- !<:WRITE (FILE "<%= OUT_DIR %>/010_migration.sql") (ORDER "200")

-- $!:delete_object_if_exists (check_constraint "CK_BlogPost_Slug") (from_table "BlogPost") (in_schema "dbo")

-- Check constraint to disallow spaces in the Slug column
alter table [dbo].[BlogPost]
	add constraint [CK_BlogPost_Slug]
	check (
		[Slug] not like '% %'
	);

-- $!:go

-- !>