
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

	[Slug] varchar(64),

	[Content] text
);

GO


-- Check if check constraint exists in order to drop
IF (OBJECT_ID(N'[dbo].[CK_BlogPost_Slug]', N'C') IS NOT NULL)
BEGIN
    ALTER TABLE [dbo].[BlogPost]
       DROP CONSTRAINT [CK_BlogPost_Slug];
END

GO

-- Check constraint to disallow spaces in the Slug column
alter table [dbo].[BlogPost]
	add constraint [CK_BlogPost_Slug]
	check (
		[Slug] not like '% %'
	);

GO


-- Check if primary key constraint exists in order to drop
IF (OBJECT_ID(N'[dbo].[PK_BlogPost_Id]', N'PK') IS NOT NULL)
BEGIN
   ALTER TABLE [dbo].[BlogPost]
      DROP CONSTRAINT [PK_BlogPost_Id];
END

GO

-- Set primary key
alter table [dbo].[BlogPost]
	add constraint [PK_BlogPost_Id] 
	primary key ([Id]);

GO

