-- !<: OUT="010_migration.sql" ORDER="100"

-- $!:delete_object_if_exists table="[dbo].[BlogPost]"

CREATE TABLE [dbo].[BlogPost]
(
	[Id] int identity,

	[Title] varchar(256),

	[Slug] varchar(64),

	[Content] text
);

-- $!:go

-- !>