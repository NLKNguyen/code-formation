
-- Check if user-defined table exists in order to drop
IF (OBJECT_ID(N'[dbo].[BlogPost]', N'U') IS NOT NULL)
BEGIN
   DROP TABLE [dbo].[BlogPost];
END   

GO

CREATE TABLE [dbo].[BlogPost]
(
	[Id] int identity,

	[Title] varchar(256),

	[Content] text
);

GO

-- Check if check constraint exists in order to drop
IF (OBJECT_ID('[C_BlogPost_Slug]', 'C') IS NOT NULL)
BEGIN
    ALTER TABLE [dbo].[BlogPost]
    DROP CONSTRAINT [C_BlogPost_Slug];
END

GO

-- Check constraint to disallow spaces in the Slug column
alter table [dbo].[BlogPost]
	add constraint [C_BlogPost_Slug]
	check (
		[Slug] not like '% %'
	);

GO

-- Set primary key
alter table [dbo].[BlogPost]
	add constraint [PK_BlogPost_Id] 
	primary key ([Id]);
