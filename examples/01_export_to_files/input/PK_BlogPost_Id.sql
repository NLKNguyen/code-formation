-- !<: OUT="010_migration.sql" ORDER=200 SECTION_SEPARATOR="\nGO\n"

-- Set primary key
alter table [dbo].[BlogPost]
	add constraint [PK_BlogPost_Id] 
	primary key ([Id]);

-- !>