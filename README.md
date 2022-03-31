<h1 align="center">Code ⚔️ Formation</h1> 

<!-- ⚙️🏗️🛡🐉🔮🐲 -->
<p align="center">
  <a href="https://github.com/NLKNguyen/code-formation/blob/master/LICENSE" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/NLKNguyen/code-formation.svg?color=blueviolet" />
  </a>

  <a href="https://github.com/NLKNguyen/code-formation/issues" target="_blank">
    <img alt="Closed issues" src="https://img.shields.io/github/issues-closed-raw/NLKNguyen/code-formation.svg?color=yellow" />
  </a>

  <a href="https://www.patreon.com/Nikyle" title="Donate to this project using Patreon">
    <img src="https://img.shields.io/badge/support%20me-patreon-red.svg" alt="Patreon donate button" />
  </a>

  <a href="https://paypal.me/NLKNguyen" title="Donate one time via PayPal">
    <img src="https://img.shields.io/badge/paypal-me-blue.svg" alt="PayPal donate button" />
  </a>
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/Nikyle" target="_blank">
    <img src="https://user-images.githubusercontent.com/4667129/161147702-43e0b4f9-9548-479f-a559-7bf3a59ccaff.jpg" alt="Buy Me A Coffee" height=45 />
  </a>
</p>
 

# 💡 Overview and thoughts

This is an experimental stage of a context-free code generator with a templalte meta-programming language that automates a set of common programming/writing tasks by using a template meta-programming langnuage embedded directly in your code (typically as source comments or out-of-source text files). 

The motivation behind this is to solve 5 categories of problems that I found myself often getting into in software engineering, and it stretches beyond the use cases of code writing. Only 1 category is  under  the focus of the current development.

This introduces a language called CFL (Code-Formation Language) that is used for configuring the text generation pipeline right in your codebase as a means for meta-programming. It sits on top of [EJS](https://ejs.co/) template engine which means you can program dynamic code generation for high reusability. This language should be embeddable safely in your code as comments without affecting anything, and there are options to further prevent it from being confused with your own code syntax while parsing.

If you have used a template engine to render code for whatever reason, this tool will speak to you. At a minimum, this can be a code scaffolding tool. To a larger extent, it is intended to be generalized enough to suit your typical code generation needs so that you don't need to write yet another one-off tool.

Eventually, it can interpolate with external tools easily as one of the main goals because there are many great string processing CLI tools out there (sed, awk, jq, miller, random transpilers/formatters, etc.), and that will be the easiest way to extend this tool's capabilities while taking advantage of the developers' existing skills and assets.

Once CFL has enough features, likely Turing complete, higher levels of meta-programming will be possible, and there are foreseeable use cases for that, but we will assess whether it's worth exploiting due to the trade-off of mental gymnastic required to do meta-meta-programming.

You can start using this tool today, just be aware that it can be unstable at the early stage.
# 🛠️ Installation

Required Node.js in your system in order to execute these commands in a terminal.

### Option 1: Install recent publication globally from NPM

```sh 
npm install -g code-formation
```

```sh 
code-formation --help
```

### Option 2: Use directly the latest code from GitHub

```sh
git clone https://github.com/NLKNguyen/code-formation

```

then go into the cloned directory to install depedencies

```sh
cd code-formation
npm install
```

and use it.

```sh
node index.js --help
```

If you want to install this globally, you can do so as well from the same directory:

```sh
npm link
```

Now you can use it anywhere in your terminal:

```sh 
code-formation --help
```

# 📝 Command Line Interface Usage

**code-formation** --scan *[file glob patterns]* --outdir *[base path for output files]*


`--scan`: list of file glob patterns separated by semicolon ";". It's possible to specify ignore and inverse ignore patterns just like .gitignore syntax.

`--outdir`: base output path for the output files, if any; some use cases only affect the input files and don't generate output files.

# ⭐ Understand through examples

It's probably best to explain at this early stage by walking through examples that are included in [this repository](https://github.com/NLKNguyen/code-formation/tree/main/examples). Below are examples on how this tool can help in 5 categories. Even though these are concrete examples derived from real-world usage of this tool, it is not limited to any referenced language or technology because the tool just deals with plain text, which can sometimes be of certain code language.

### Category 1: unify output from decentralized source files

Code Formation lets you define chunks of text in many files and unifies them in the destinations you choose with the order you specify.

#### Example 1: make SQL migration scripts from standalone DDL files

[`./examples/01_sql_migration_from_scripts/`](https://github.com/NLKNguyen/code-formation/tree/main/examples/01_sql_migration_from_scripts) shows a simplified example where developers work on the DDL scripts with an IDE, but in order to make migration scripts, they must manually combine those in a specific order into a single SQL script; plus, it might need additional supporting statements around or in-between those script content.

**Problem:**
1. Error prone and tedious by hand. Although some IDEs let you generate migration scripts from the local DB automatically, the DB support is usually very limited, and it usually rewrites your SQL code structure which makes it hard to later compare your DB server code with your original code in order to do schema diff reliably. 
2. Have to keep track of latest team convention for the supporting code around or in-between the statements. It's not uncommon for DBA teams to have policies for the object modifications, e.g.: updating a bookeeping table of object/schema versions, switching to appropriate roles for certain actions, etc.

**Solution:**

```
code-formation --scan ./examples/01_sql_migration_from_scripts/input/* --outdir ./examples/01_sql_migration_from_scripts/output/
```

The output file [`./examples/01_sql_migration_from_scripts/output/010_migration.sql`](https://github.com/NLKNguyen/code-formation/blob/main/examples/01_sql_migration_from_scripts/output/010_migration.sql) contains the result of the migration script generated in according to the rules specified in the [input scripts](https://github.com/NLKNguyen/code-formation/tree/main/examples/01_sql_migration_from_scripts/input). 

**Explanation:**

With code-formation language (CFL), we can put the instructions as comments in the SQL scripts themselves so that they don't affect the behavior of these individual scripts. This language is parsed by simply finding the markers to determine the applicable blocks and ignoring the rest.

For example, in [`BlogPost.sql`](https://github.com/NLKNguyen/code-formation/blob/main/examples/01_sql_migration_from_scripts/input/BlobPost.sql) we surround the CREATE TABLE statement with `!<` and `!>` block syntax to indicate a **blob block**; within it is EJS template code but we don't use any EJS specific feature here yet.



```tsql
-- !<: OUT="010_migration.sql" ORDER="100"

-- $!:delete_object_if_exists table="[dbo].[BlogPost]"

CREATE TABLE [dbo].[BlogPost]
(
	[Id] int identity,

	[Title] varchar(256),

	[Content] text
);

-- $!:go

-- !>
```

On the opening tag line, we specify the `OUT` parameter for the output destination of this blob's rendered result. The `ORDER` parameter specifies the order of the rendering in case of having multiple blobs outputing to the same file; it's simply a key string to be ordered by, even if it can look like a number.  

**Note:** It's possible to have optional label for any block, like `!`OPTIONAL_LABEL`<`, `!`OPTIONAL_LABEL`>`, which is useful when there is nested closing tag inside, therefore using the tag label will ensure the intended closing tag must match the label of the opening tag.

Another thing to notice is the **snippet injection** syntax `$!:` that is followed by the name of a snippet that is defined elsewhere. The snippets can have input variables, and in this case it can take the "table" parameter.

```sql
-- $!:delete_object_if_exists table="[dbo].[BlogPost]"
```

The above will be rendered using the snippet template defined in `snippets.txt` file. The snippets will be scanned first in the processing pipeline, so it will be available at this point. 

Here is a part of the **snippet definition block** that is injected above, enclosed by the block syntax `$<`, `$>`. The opening tag has the name of the snippet and optional default parameters, and the snippet content is EJS template in which the control block is enclosed by `<%` and `%>`, while the value reference is enclosed by `<%=` and `%>` (see [EJS](https://ejs.co/) for more features; also [lodash](https://lodash.com/docs/4.17.15) is available as `_` reference in the template control blocks; in the future, users can import any Node.js library to use here)

```
$<:delete_object_if_exists table="" trigger="" procedure="" check_constraint="" 

<% if (table) { %>
-- Check if user-defined table exists in order to drop
IF (OBJECT_ID(N'<%= table %>', N'U') IS NOT NULL)
BEGIN
   DROP TABLE <%= table %>;
END   
<% } %>

...other stuff, see snippets.txt

$>

```

**Note:**  we don't need `--` prefix comment on the tag lines like in the .sql scripts because this is just a standalone text file solely for the purpose of storing reusable code snippets. Also, there is nothing special about the file name `snippets.txt`. It's just a file in the scanned paths.

**Note:** on the snippet tag (definition or injection), you can override any of the default configurations: 
+ `LINE_FEED="\n"` for the new line character between the lines of the output
+ `LINE_PREFIX=""` for the prefix on every line of the output, which is useful for indentation.
+ `CONTINUOUS_EMPTY_LINES=1` for a post-process formatting to remove unwanted continuous empty lines above this threshold

**Note:** default parameters of the snippet definition can be overridden by the snippet injection parameters, including the configuration above.

The result of the code we have seen so far is in the first part of the output file [010_migration.sql](https://github.com/NLKNguyen/code-formation/blob/main/examples/01_sql_migration_from_scripts/output/010_migration.sql)

```tsql
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
```

[`C_BlogPost_Slug.sql`](https://github.com/NLKNguyen/code-formation/blob/main/examples/01_sql_migration_from_scripts/input/C_BlogPost_Slug.sql) and [`PK_BlogPost_Id.sql`](https://github.com/NLKNguyen/code-formation/blob/main/examples/01_sql_migration_from_scripts/input/PK_BlogPost_Id.sql)  have additional blobs to be rendered after the above due to the `ORDER` parameter. These 2 have the same value for `ORDER` because we didn't care about the relative order among themselves as long as they come after the blob for CREATE TABLE statement. In other words, the `ORDER` parameter value needs to be different only if you want a strict sequencial order; otherwise, it just goes by the order of which blob it scans first.

Final result: [010_migration.sql](https://github.com/NLKNguyen/code-formation/blob/main/examples/01_sql_migration_from_scripts/output/010_migration.sql)



### Category 2: TODO

### Category 3: TODO

### Category 4: TODO

### Category 5: TODO



# 👋 Author

<!-- ### 🏠🏗️ [Homepage](https://github.com/NLKNguyen/papercolor-theme) -->

👤 **Nikyle Nguyen**

  <a href="https://twitter.com/NLKNguyen" target="_blank">
    <img alt="Twitter: NLKNguyen" src="https://img.shields.io/twitter/follow/NLKNguyen.svg?style=social" />
  </a>

-   Twitter: [@NLKNguyen](https://twitter.com/NLKNguyen)
-   Github: [@NLKNguyen](https://github.com/NLKNguyen)
-   LinkedIn: [@NLKNguyen](https://linkedin.com/in/NLKNguyen)

# 🤝 Contributing

Give a ⭐️ if this project can help you in day-to-day engineering work!

Contributions, issues and feature requests are welcome! Feel free to check [issues page](https://github.com/NLKNguyen/code-formation/issues).

## 🙇 Your support is very much appreciated

I create open-source projects on GitHub and continue to develop/maintain as they are helping others. You can integrate and use these projects in your applications for free! You are free to modify and redistribute anyway you like, even in commercial products.

I try to respond to users' feedback and feature requests as much as possible. Obviously, this takes a lot of time and efforts (speaking of mental context-switching between different projects and daily work). Therefore, if these projects help you in your work, and you want to encourage me to continue create, here are a few ways you can support me:

-   💬 Following my blog and social profiles listed above to help me connect with your network
-   ⭐️ Starring this project and sharing with others as more users come, more great ideas arrive!
-   ☘️ Donating any amount is a great way to help me work on the projects more regularly!

<p>

  <a href="https://paypal.me/NLKNguyen" target="_blank">
      <img src="https://user-images.githubusercontent.com/4667129/101101433-71b7ff00-357d-11eb-8cf2-3c529960d422.png" height=44 />
  </a>

  <a href="https://www.patreon.com/Nikyle" target="_blank">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" height=44 style="border-radius: 5px;" />
  </a>

  <a href="https://www.buymeacoffee.com/Nikyle" target="_blank">
      <img src="https://user-images.githubusercontent.com/4667129/161147702-43e0b4f9-9548-479f-a559-7bf3a59ccaff.jpg" alt="Buy Me A Coffee" height=45 />
  </a>

</p>

# 📝 License

Copyright © 2022 [Nikyle Nguyen](https://github.com/NLKNguyen)

The project is [ISC License](https://github.com/NLKNguyen/code-formation/blob/master/LICENSE).

"The ISC license is a permissive free software license published by the Internet Software Consortium, now called Internet Systems Consortium. It is functionally equivalent to the simplified BSD and MIT licenses, but without language deemed unnecessary following the Berne Convention".

This simply means that the project is free to use in any capacity without any warranty while reserving the rights for others to also freely do anything with it.