-- !<: OUT="010_migration.sql" ORDER=200 SECTION_SEPARATOR="\nGO\n"

-- $!:delete_object_if_exists check_constraint="[CK_BlogPost_Slug]" from_table="[dbo].[BlogPost]"

-- Check constraint to disallow spaces in the Slug column
alter table [dbo].[BlogPost] 
	add constraint [CK_BlogPost_Slug]
	check (
		[Slug] not like '% %' -- no space		
	);

-- !>