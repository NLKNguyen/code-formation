-- !<:WRITE (FILE "<%= OUT_DIR %>/010_migration.sql") (ORDER "200")

-- $!:delete_object_if_exists (primary_key "PK_BlogPost_Id") (from_table "BlogPost") (in_schema "dbo")

-- Set primary key
alter table [dbo].[BlogPost]
	add constraint [PK_BlogPost_Id] 
	primary key ([Id]);

-- $!:go

-- !>